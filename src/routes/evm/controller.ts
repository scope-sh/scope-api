import { HypersyncClient, Query } from '@envio-dev/hypersync-client';
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
} from '@/utils/chains';

interface Transaction {
  blockNumber: number;
  from: Address;
  gasPrice: Hex;
  hash: Hex;
  input: Hex;
  to: Address;
  transactionIndex: number;
  value: Hex;
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
): Promise<Transaction[]> {
  const query: Query = {
    fromBlock: 0,
    transactions: [
      {
        from: [address],
      },
      {
        to: [address],
      },
    ],
    maxNumTransactions: 20,
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
      ],
    },
  };

  const client = getClient(chain);
  const response = await client.sendReq(query);
  return response.data.transactions as Transaction[];
}

async function getAddressLogs(
  chain: ChainId,
  address: Address,
): Promise<Log[]> {
  const query: Query = {
    fromBlock: 0,
    logs: [
      {
        address: [address],
      },
    ],
    maxNumLogs: 20,
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
  return response.data.logs as Log[];
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
    }
  }

  const endpoint = getEndpoint(chain);
  return HypersyncClient.new({
    url: endpoint,
  });
}

export { getAddressTransactions, getAddressLogs };
