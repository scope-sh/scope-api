import MiniSearch from 'minisearch';

import CloudflareService from '@/services/cloudflare';
import { CHAINS, ChainId } from '@/utils/chains';
import { Label } from '@/utils/labels';

const cloudflareAccountId = process.env.CLOUDFLARE_ACCOUNT_ID as string;
const cloudflareAccessKeyId = process.env.CLOUDFLARE_ACCESS_KEY_ID as string;
const cloudflareSecretAccessKey = process.env
  .CLOUDFLARE_SECRET_ACCESS_KEY as string;
const cloudflareBucket = process.env.CLOUDFLARE_R2_BUCKET as string;

type LabelWithAddress = Label & {
  address: string;
};

const labels: Partial<Record<ChainId, Record<string, Label>>> = {};
const labelsWithAddress: Partial<Record<ChainId, LabelWithAddress[]>> = {};
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
  addressList: string[],
): LabelWithAddress[] {
  const foundLabels: LabelWithAddress[] = [];
  const chainLabels = labels[chainId];
  if (!chainLabels) {
    return [];
  }
  for (const address of addressList) {
    if (address in chainLabels) {
      const label = chainLabels[address];
      if (!label) {
        continue;
      }
      foundLabels.push({
        address,
        ...label,
      });
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
    console.log(`Fetching labels for chain ${chain}`);
    const service = new CloudflareService(
      cloudflareAccountId,
      cloudflareAccessKeyId,
      cloudflareSecretAccessKey,
      cloudflareBucket,
    );
    const chainLabels = await service.getLabels(chain);
    if (!chainLabels) {
      continue;
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
    labelsWithAddress[chain] = labelList;
    labelIndex[chain] = new MiniSearch<LabelWithAddress>({
      fields: ['value'],
      extractField: (doc, fieldName): string => {
        if (fieldName === 'address') {
          return doc.address;
        }
        if (fieldName === 'value') {
          return doc.value;
        }
        if (fieldName === 'type' && doc.type) {
          return doc.type;
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
  }
}

export { getLabelByAddress, getLabelsByAddressList, searchLabels, fetchLabels };
