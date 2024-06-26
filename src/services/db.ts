import { createClient } from '@libsql/client';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { LibSQLDatabase, drizzle } from 'drizzle-orm/libsql';
import { Address } from 'viem';

import { type Label as LabelRow, labels, labelSearch } from '@/db/schema';
import {
  getErc20Icon,
  getLabelTypeById,
  getNamespaceById,
  getNamespaceIcon,
} from '@/routes/label/utils';
import { ChainId } from '@/utils/chains.js';
import { Label, LabelId, NamespaceId } from '@/utils/labels.js';

const databaseUrl = process.env.DATABASE_URL as string;

type LabelWithAddress = Label & {
  address: Address;
};

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

async function searchLabels(
  chain: ChainId,
  query: string,
  limit: number,
): Promise<LabelWithAddress[]> {
  const db = getDb();
  const ids = await db
    .select({ id: labelSearch.rowid })
    .from(labelSearch)
    .where(and(eq(labelSearch.chain, chain), sql.raw(`value MATCH '${query}'`)))
    .orderBy(sql`rank`)
    .limit(limit)
    .execute();

  if (ids.length === 0) {
    return [];
  }

  const rows = await db
    .select()
    .from(labels)
    .where(
      and(
        eq(labels.chain, chain),
        inArray(
          labels.id,
          ids.map((id) => id.id),
        ),
      ),
    )
    .execute();

  return rows.map(rowToLabel);
}

function rowToLabel(row: LabelRow): LabelWithAddress {
  return {
    address: row.address as Address,
    value: row.value,
    type: row.typeId ? getLabelTypeById(row.typeId as LabelId) : undefined,
    namespace: row.namespaceId
      ? getNamespaceById(row.namespaceId as NamespaceId)
      : undefined,
    iconUrl: getIconUrl(
      row.chain as ChainId,
      row.address as Address,
      row.iconUrl || null,
      (row.typeId as LabelId) || null,
      (row.namespaceId as NamespaceId) || null,
    ),
  };
}

function getIconUrl(
  chain: ChainId,
  address: Address,
  originalIconUrl: string | null,
  typeId: LabelId | null,
  namespaceId: NamespaceId | null,
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

function getDb(): LibSQLDatabase {
  const client = createClient({
    url: databaseUrl,
  });
  return drizzle(client);
}

export { searchLabels, getAddressLabels };
export type { LabelWithAddress };
