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
  address: Address;
};

type LabelWithAddressAndId = LabelWithAddress & {
  id: string;
};

const labels: Partial<Record<ChainId, Record<string, Label[]>>> = {};
const labelIndex: Partial<
  Record<ChainId, MiniSearch<LabelWithAddress> | null>
> = {};

function getAllAddressLabels(chainId: ChainId, address: Address): Label[] {
  const chainLabels = labels[chainId];
  if (!chainLabels) {
    return [];
  }
  const addressLabels = chainLabels[address];
  if (!addressLabels) {
    return [];
  }
  return addressLabels;
}

function getPrimaryAddressLabels(
  chainId: ChainId,
  addresses: Address[],
): Record<Address, Label> {
  const foundLabels: Record<Address, Label> = {};
  const chainLabels = labels[chainId];
  if (!chainLabels) {
    return {};
  }
  for (const address of addresses) {
    if (address in chainLabels) {
      const label = chainLabels[address];
      if (!label) {
        continue;
      }
      const primaryLabel = label[0];
      if (!primaryLabel) {
        continue;
      }
      foundLabels[address] = primaryLabel;
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
    return [];
  }
  const results = chainIndex.search(query);
  return results
    .slice(0, LIMIT)
    .map((result) => {
      const id = result.id;
      const [address, indexString] = id.split('-');
      const index = parseInt(indexString);
      const labels = chainLabels[address];
      if (!labels) {
        return null;
      }
      const primaryLabel = labels[index];
      if (!primaryLabel) {
        return null;
      }
      return {
        ...primaryLabel,
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
      const labels = chainLabels[address as Address];
      if (!labels) {
        return [];
      }
      return labels.map((label, index) => {
        return {
          ...label,
          address: address as Address,
          id: `${address}-${index}`,
        };
      });
    })
    .flat()
    .filter((label): label is LabelWithAddressAndId => label !== null);
  labelIndex[chain] = new MiniSearch<LabelWithAddress>({
    fields: ['value', 'type', 'namespace'],
    extractField: (doc, fieldName): string => {
      if (fieldName === 'value') {
        return doc.value;
      }
      if (fieldName === 'namespace' && doc.namespace) {
        return doc.namespace.value;
      }
      return '';
    },
    idField: 'id',
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
  console.info(`Fetched labels for chain ${chain}`);
}

export {
  getAllAddressLabels,
  getPrimaryAddressLabels,
  searchLabels,
  fetchLabels,
};
