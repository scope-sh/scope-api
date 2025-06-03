import { and, desc, eq, inArray } from 'drizzle-orm';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { Abi, Address } from 'viem';

import {
  contractDeployments as tableContractDeployments,
  compiledContracts as tableCompiledContracts,
  verifiedContracts as tableVerifiedContracts,
  proxies as tableProxies,
  proxyTargets as tableProxyTargets,
  verifiedContracts,
} from '@/db/schema';

import { ChainId } from './chains';

interface Source {
  name: string;
  fullyQualifiedName: string;
  sources: Record<string, string>;
  compilationArtifacts: {
    abi: Abi;
    evm: Record<string, unknown>;
    storageLayout: Record<string, unknown>;
  };
}

const databaseUrl = process.env.DATABASE_URL as string;

const client = new pg.Client({
  connectionString: databaseUrl,
});
await client.connect();

async function getProxyTarget(
  chain: ChainId,
  address: Address,
): Promise<Address | null> {
  const db = getDb();
  const rows = await db
    .select({
      sourceAddress: tableProxies.address,
      targetAddress: tableProxyTargets.address,
    })
    .from(tableProxies)
    .fullJoin(tableProxyTargets, eq(tableProxies.id, tableProxyTargets.proxyId))
    .where(
      and(
        eq(tableProxies.chainId, chain.toString()),
        eq(tableProxies.address, Buffer.from(address.slice(2), 'hex')),
      ),
    )
    .orderBy(desc(tableProxyTargets.blockNumber))
    .limit(1);
  const row = rows[0];
  if (!row) {
    return null;
  }
  if (!row.targetAddress) {
    return null;
  }
  return `0x${row.targetAddress.toString('hex')}`;
}

async function getContractSources(
  chain: ChainId,
  addresses: Address[],
): Promise<Record<Address, Source>> {
  const db = getDb();
  const rows = await db
    .select({
      address: tableContractDeployments.address,
      name: tableCompiledContracts.name,
      fullyQualifiedName: tableCompiledContracts.fullyQualifiedName,
      sources: tableCompiledContracts.sources,
      compilationArtifacts: tableCompiledContracts.compilationArtifacts,
    })
    .from(tableContractDeployments)
    .fullJoin(
      tableVerifiedContracts,
      eq(tableContractDeployments.id, tableVerifiedContracts.deploymentId),
    )
    .fullJoin(
      tableCompiledContracts,
      eq(verifiedContracts.compilationId, tableCompiledContracts.id),
    )
    .where(
      and(
        eq(tableContractDeployments.chainId, chain.toString()),
        inArray(
          tableContractDeployments.address,
          addresses.map((address) => Buffer.from(address.slice(2), 'hex')),
        ),
      ),
    );
  const sourceMap: Record<Address, Source> = {};
  for (const row of rows) {
    const addressBuffer = row.address;
    if (!addressBuffer) {
      continue;
    }
    const address = `0x${addressBuffer.toString('hex')}` as Address;
    const name = row.name;
    const fullyQualifiedName = row.fullyQualifiedName;
    const sources = row.sources;
    const compilationArtifacts = row.compilationArtifacts;
    if (!name) {
      continue;
    }
    if (!fullyQualifiedName) {
      continue;
    }
    sourceMap[address] = {
      name,
      fullyQualifiedName,
      sources: sources as Record<string, string>,
      compilationArtifacts: compilationArtifacts as {
        abi: Abi;
        evm: Record<string, unknown>;
        storageLayout: Record<string, unknown>;
      },
    };
  }
  return sourceMap;
}

function getDb(): NodePgDatabase {
  return drizzle(client);
}

export { getProxyTarget, getContractSources };
