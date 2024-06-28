import MiniSearch from 'minisearch';
import { Address } from 'viem';

import {
  type LabelWithAddress,
  getAddressLabels,
  getIndexedLabels,
} from '@/services/db.js';
import { CHAINS, ChainId } from '@/utils/chains';
import { Label } from '@/utils/labels';

type IndexedLabel = LabelWithAddress & {
  id: string;
};

const labels: Partial<Record<ChainId, Record<string, Label[]>>> = {};
const labelIndex: Partial<Record<ChainId, MiniSearch<IndexedLabel> | null>> =
  {};

async function getAllAddressLabels(
  chainId: ChainId,
  address: Address,
): Promise<Label[]> {
  return await getAddressLabels(chainId, [address]);
}

async function getPrimaryAddressLabels(
  chainId: ChainId,
  addresses: Address[],
): Promise<Record<Address, Label>> {
  const foundLabels: Record<Address, Label> = {};
  const allLabels = await getAddressLabels(chainId, addresses);
  for (const address of addresses) {
    const addressLabels = allLabels.filter(
      (label) => label.address === address,
    );
    const primaryLabel = addressLabels[0];
    if (primaryLabel) {
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
  const searchIndex = labelIndex[chainId];
  if (!searchIndex) {
    return [];
  }
  const chainLabels = labels[chainId];
  if (!chainLabels) {
    return [];
  }
  if (query === '') {
    return [];
  }
  const results = searchIndex.search(query);
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
      const label = labels[index];
      if (!label) {
        return null;
      }
      return {
        ...label,
        address,
      };
    })
    .filter((label) => label !== null);
}

async function fetchLabels(): Promise<void> {
  for (const chain of CHAINS) {
    await fetchChainLabels(chain);
  }
}

async function fetchChainLabels(chain: ChainId): Promise<void> {
  const indexedLabels = await getIndexedLabels(chain);
  const chainLabels = labels[chain] || {};
  for (const label of indexedLabels) {
    const address = label.address;
    const addressLabels = chainLabels[address] || [];
    addressLabels.push(label);
    chainLabels[address] = addressLabels;
  }
  labels[chain] = chainLabels;
  const labelList = Object.keys(chainLabels)
    .map((addressString) => {
      const address = addressString as Address;
      const labels = chainLabels[address];
      if (!labels) {
        return [];
      }
      return labels.map((label, index) => {
        return {
          ...label,
          address,
          id: `${address}-${index}`,
        };
      });
    })
    .flat()
    .filter((label) => label !== null);
  labelIndex[chain] = new MiniSearch<IndexedLabel>({
    fields: ['value', 'type', 'namespace'],
    extractField: (doc, fieldName): string => {
      if (fieldName === 'id') {
        return doc.id;
      }
      if (fieldName === 'value') {
        return doc.value;
      }
      if (fieldName === 'namespace' && doc.namespace) {
        return doc.namespace.value;
      }
      return '';
    },
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
