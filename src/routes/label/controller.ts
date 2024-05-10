import MiniSearch from 'minisearch';
import { Address } from 'viem';

import MinioService from '@/services/minio';
import { CHAINS, ChainId } from '@/utils/chains';
import { Label } from '@/utils/labels';

const minioPublicEndpoint = process.env.MINIO_PUBLIC_ENDPOINT as string;
const minioAccessKey = process.env.MINIO_ACCESS_KEY as string;
const minioSecretKey = process.env.MINIO_SECRET_KEY as string;
const minioBucket = process.env.MINIO_BUCKET as string;

type LabelWithAddress = Label & {
  address: string;
};

const labels: Partial<Record<ChainId, Record<string, Label>>> = {};
const labelIndex: Partial<
  Record<ChainId, MiniSearch<LabelWithAddress> | null>
> = {};

function getLabelByAddress(chainId: ChainId, address: string): Label | null {
  const chainLabels = labels[chainId];
  if (!chainLabels) {
    return null;
  }
  if (address in chainLabels) {
    return chainLabels[address] || null;
  } else {
    return null;
  }
}

function getLabelsByAddressList(
  chainId: ChainId,
  addressList: Address[],
): Record<Address, Label> {
  const foundLabels: Record<Address, Label> = {};
  const chainLabels = labels[chainId];
  if (!chainLabels) {
    return {};
  }
  for (const address of addressList) {
    if (address in chainLabels) {
      const label = chainLabels[address];
      if (!label) {
        continue;
      }
      foundLabels[address] = label;
    }
  }
  return foundLabels;
}

async function searchLabels(
  chainId: ChainId,
  query: string,
): Promise<LabelWithAddress[]> {
  const LIMIT = 20;
  const chainIndex = labelIndex[chainId];
  if (!chainIndex) {
    return [];
  }
  const chainLabels = labels[chainId];
  if (!chainLabels) {
    return [];
  }
  if (query === '') {
    return Object.keys(chainLabels)
      .slice(0, LIMIT)
      .map((address) => {
        const label = chainLabels[address];
        if (!label) {
          return null;
        }
        return {
          address,
          ...label,
        };
      })
      .filter((label): label is LabelWithAddress => label !== null);
  }
  const results = chainIndex.search(query);
  return results
    .slice(0, LIMIT)
    .map((result) => {
      const address = result.id;
      const label = chainLabels[address];
      if (!label) {
        return null;
      }
      return {
        ...label,
        address,
      };
    })
    .filter((label): label is LabelWithAddress => label !== null);
}

async function fetchLabels(): Promise<void> {
  for (const chain of CHAINS) {
    fetchChainLabels(chain);
  }
}

async function fetchChainLabels(chain: ChainId): Promise<void> {
  const service = new MinioService(
    minioPublicEndpoint,
    minioAccessKey,
    minioSecretKey,
    minioBucket,
  );
  const chainLabels = await service.getLabels(chain);
  if (!chainLabels) {
    return;
  }
  labels[chain] = chainLabels;
  const labelList = Object.keys(chainLabels)
    .map((address) => {
      const label = chainLabels[address];
      if (!label) {
        return null;
      }
      return {
        ...label,
        address,
      };
    })
    .filter((label): label is LabelWithAddress => label !== null);
  labelIndex[chain] = new MiniSearch<LabelWithAddress>({
    fields: ['value', 'type', 'namespace'],
    extractField: (doc, fieldName): string => {
      if (fieldName === 'address') {
        return doc.address;
      }
      if (fieldName === 'value') {
        return doc.value;
      }
      if (fieldName === 'namespace' && doc.namespace) {
        return doc.namespace.value;
      }
      if (fieldName === 'type' && doc.type) {
        return doc.type.value;
      }
      return '';
    },
    idField: 'address',
    storeFields: ['address'],
    searchOptions: {
      boost: { keywords: 5 },
      fuzzy: 0.1,
    },
  });
  const chainIndex = labelIndex[chain];
  if (chainIndex) {
    for (const label of labelList) {
      chainIndex.add(label);
    }
  }
  console.log(`Fetched labels for chain ${chain}`);
}

export { getLabelByAddress, getLabelsByAddressList, searchLabels, fetchLabels };
