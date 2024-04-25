import {
  HypersyncClient,
  Query,
  QueryResponse,
} from '@envio-dev/hypersync-client';
import { Address, Hex } from 'viem';

import {
  ChainId,
  BASE,
  BASE_SEPOLIA,
  ETHEREUM,
  OPTIMISM,
  OPTIMISM_SEPOLIA,
  POLYGON,
  POLYGON_AMOY,
  SEPOLIA,
  ARBITRUM,
  ARBITRUM_SEPOLIA,
} from '@/utils/chains';

interface Transaction {
  blockNumber: number;
  from: Address;
  gasPrice: Hex;
  hash: Hex;
  input: Hex;
  to: Address | undefined;
  transactionIndex: number;
  value: Hex;
  status: number;
}

interface Log {
  blockNumber: number;
  transactionHash: Hex;
  logIndex: number;
  address: Address;
  topics: Hex[];
  data: Hex;
}

async function getAddressTransactions(
  chain: ChainId,
  address: Address,
  fromBlock: number,
  limit: number,
): Promise<Transaction[]> {
  const transactions: Transaction[] = [];
  let nextBlock = fromBlock;
  let height: number | undefined = Infinity;
  while (transactions.length < limit && height && nextBlock < height) {
    const response = await getAddressTransactionsPartial(
      chain,
      address,
      nextBlock,
      limit,
    );
    const newTransactions = response.data.transactions as Transaction[];
    transactions.push(...newTransactions);
    nextBlock = response.nextBlock;
    height = response.archiveHeight;
  }
  return transactions;
}

async function getAddressTransactionsPartial(
  chain: ChainId,
  address: Address,
  fromBlock: number,
  limit: number,
): Promise<QueryResponse> {
  const query: Query = {
    fromBlock,
    transactions: [
      {
        from: [address],
      },
      {
        to: [address],
      },
    ],
    maxNumTransactions: limit,
    fieldSelection: {
      transaction: [
        'block_number',
        'transaction_index',
        'hash',
        'from',
        'to',
        'input',
        'value',
        'gas_price',
        'status',
      ],
    },
  };

  const client = getClient(chain);
  const response = await client.sendReq(query);
  return response;
}

async function getAddressLogs(
  chain: ChainId,
  address: Address,
  fromBlock: number,
  limit: number,
): Promise<Log[]> {
  const logs: Log[] = [];
  let nextBlock = fromBlock;
  let height: number | undefined = Infinity;
  while (logs.length < limit && height && nextBlock < height) {
    const response = await getAddressLogsPartial(
      chain,
      address,
      nextBlock,
      limit,
    );
    const newLogs = response.data.logs as Log[];
    logs.push(...newLogs);
    nextBlock = response.nextBlock;
    height = response.archiveHeight;
  }
  return logs;
}

async function getAddressLogsPartial(
  chain: ChainId,
  address: Address,
  fromBlock: number,
  limit: number,
): Promise<QueryResponse> {
  const query: Query = {
    fromBlock,
    logs: [
      {
        address: [address],
      },
    ],
    maxNumLogs: limit,
    fieldSelection: {
      log: [
        'log_index',
        'transaction_hash',
        'block_number',
        'address',
        'data',
        'topic0',
        'topic1',
        'topic2',
        'topic3',
      ],
    },
  };

  const client = getClient(chain);
  const response = await client.sendReq(query);
  return response;
}

function getClient(chain: ChainId): HypersyncClient {
  function getEndpoint(chain: ChainId): string {
    switch (chain) {
      case ETHEREUM:
        return 'https://eth.hypersync.xyz';
      case SEPOLIA:
        return 'https://sepolia.hypersync.xyz';
      case OPTIMISM:
        return 'https://optimism.hypersync.xyz';
      case OPTIMISM_SEPOLIA:
        return 'https://optimism-sepolia.hypersync.xyz';
      case BASE:
        return 'https://base.hypersync.xyz';
      case BASE_SEPOLIA:
        return 'https://base-sepolia.hypersync.xyz';
      case POLYGON:
        return 'https://polygon.hypersync.xyz';
      case POLYGON_AMOY:
        return 'https://amoy.hypersync.xyz';
      case ARBITRUM:
        return 'https://arbitrum.hypersync.xyz';
      case ARBITRUM_SEPOLIA:
        return 'https://arbitrum-sepolia.hypersync.xyz';
    }
  }

  const endpoint = getEndpoint(chain);
  return HypersyncClient.new({
    url: endpoint,
  });
}

export { getAddressTransactions, getAddressLogs };
