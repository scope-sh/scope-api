import { and, eq, inArray } from 'drizzle-orm';
import { NodePgDatabase, drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import { Address } from 'viem';

import { type Label as LabelRow, labels } from '@/db/schema';
import {
  getErc20Icon,
  getLabelTypeById,
  getNamespaceById,
  getNamespaceIcon,
} from '@/routes/label/utils';
import { ChainId } from '@/utils/chains.js';
import { Label, LabelTypeId, LabelNamespaceId } from '@/utils/labels.js';

const databaseUrl = process.env.DATABASE_URL as string;

type LabelWithAddress = Label & {
  address: Address;
};

const client = new Client({
  connectionString: databaseUrl,
});
await client.connect();

async function getIndexedLabels(chain: ChainId): Promise<LabelWithAddress[]> {
  const db = getDb();
  const perPage = 10_000;
  let page = 0;
  let indexedLabels: LabelWithAddress[] = [];

  while (indexedLabels.length === page * perPage) {
    const rows = await db
      .select()
      .from(labels)
      .where(and(eq(labels.chain, chain), eq(labels.indexed, true)))
      .limit(perPage)
      .offset(page * perPage)
      .execute();

    const pageLabels = rows.map(rowToLabel);
    indexedLabels = indexedLabels.concat(pageLabels);
    page++;
  }

  return indexedLabels;
}

async function getAddressLabels(
  chain: ChainId,
  addresses: Address[],
): Promise<LabelWithAddress[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(labels)
    .where(and(eq(labels.chain, chain), inArray(labels.address, addresses)))
    .orderBy(labels.id)
    .execute();

  return rows.map(rowToLabel);
}

function rowToLabel(row: LabelRow): LabelWithAddress {
  return {
    address: row.address as Address,
    value: row.value,
    type: row.typeId ? getLabelTypeById(row.typeId as LabelTypeId) : undefined,
    namespace: row.namespaceId
      ? getNamespaceById(row.namespaceId as LabelNamespaceId)
      : undefined,
    iconUrl: getIconUrl(
      row.chain as ChainId,
      row.address as Address,
      row.iconUrl || null,
      (row.typeId as LabelTypeId) || null,
      (row.namespaceId as LabelNamespaceId) || null,
    ),
  };
}

function getIconUrl(
  chain: ChainId,
  address: Address,
  originalIconUrl: string | null,
  typeId: LabelTypeId | null,
  namespaceId: LabelNamespaceId | null,
): string | undefined {
  if (originalIconUrl) {
    return originalIconUrl;
  }
  if (typeId && typeId === 'erc20') {
    return getErc20Icon(chain, address);
  }
  if (namespaceId) {
    return getNamespaceIcon(namespaceId);
  }
  return undefined;
}

function getDb(): NodePgDatabase {
  return drizzle(client);
}

export { getIndexedLabels, getAddressLabels };
export type { LabelWithAddress };
