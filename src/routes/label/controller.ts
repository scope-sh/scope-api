import { Address } from 'viem';

import {
  type LabelWithAddress,
  getAddressLabels,
  searchLabels as getLabelsByQuery,
} from '@/services/db.js';
import { ChainId } from '@/utils/chains';
import { Label } from '@/utils/labels';

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
  return await getLabelsByQuery(chainId, query, LIMIT);
}

export { getAllAddressLabels, getPrimaryAddressLabels, searchLabels };
