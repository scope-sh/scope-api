import { alchemy } from 'evm-providers';
import { Abi, Address, PublicClient, createPublicClient, http } from 'viem';

import EtherscanService from '@/services/etherscan';
import MinioService, { Contract, ContractCache } from '@/services/minio';
import { ChainId, getChainData } from '@/utils/chains';
import { getImplementation } from '@/utils/proxy';
import { SourceCode } from '@/utils/sources';

const alchemyKey = process.env.ALCHEMY_KEY as string;
const minioPublicEndpoint = process.env.MINIO_PUBLIC_ENDPOINT as string;
const minioAccessKey = process.env.MINIO_ACCESS_KEY as string;
const minioSecretKey = process.env.MINIO_SECRET_KEY as string;
const minioBucket = process.env.MINIO_BUCKET as string;

const DAY = 1000 * 60 * 60 * 24;
const NO_SOURCE_CACHE_DURATION = 7 * DAY;
const IMPLEMENTATION_CACHE_DURATION = DAY;

type ContractResponse = ProxyContractResponse | StaticContractResponse;
interface BaseContractResponse {
  isProxy: boolean;
  abi: Abi;
  source: SourceCode;
}
interface ProxyContractResponse extends BaseContractResponse {
  isProxy: true;
  implementation: {
    address: Address;
    abi: Abi;
    source: SourceCode;
  } | null;
}
interface StaticContractResponse extends BaseContractResponse {
  isProxy: false;
}

function getClient(chain: ChainId, alchemyKey: string): PublicClient {
  const endpointUrl = alchemy(chain, alchemyKey);
  return createPublicClient({
    chain: getChainData(chain),
    transport: http(endpointUrl),
  });
}

async function getContractSource(
  chain: ChainId,
  address: Address,
): Promise<ContractResponse | null> {
  const client = getClient(chain, alchemyKey);
  const minioService = new MinioService(
    minioPublicEndpoint,
    minioAccessKey,
    minioSecretKey,
    minioBucket,
  );
  const contract = await fetchContract(minioService, chain, address);
  if (!contract.value) {
    return null;
  }
  const contractCode = contract.value;
  if (contractCode.isProxy) {
    // Use cached version if not stale
    const useCachedImplementation =
      contract.timestamp > Date.now() - IMPLEMENTATION_CACHE_DURATION;
    const implementation = useCachedImplementation
      ? contractCode.implementation
      : await getImplementation(client, address);
    // Store the implementation in the cache
    if (!useCachedImplementation) {
      await minioService.setContract(chain, address, {
        ...contractCode,
        implementation,
      });
    }
    if (!implementation) {
      return {
        ...contractCode,
        implementation: null,
      };
    }
    const implementationContract = await fetchContract(
      minioService,
      chain,
      implementation,
    );
    if (!implementationContract.value) {
      return {
        ...contractCode,
        implementation: null,
      };
    }
    return {
      isProxy: true,
      abi: contractCode.abi,
      source: contractCode.source,
      implementation: {
        address: implementation,
        abi: implementationContract.value.abi,
        source: implementationContract.value.source,
      },
    };
  }
  return {
    isProxy: false,
    abi: contractCode.abi,
    source: contractCode.source,
  };
}

async function fetchContract(
  minioService: MinioService,
  chain: ChainId,
  address: Address,
): Promise<ContractCache> {
  const etherscanService = new EtherscanService(chain);
  const cachedCode = await minioService.getContract(chain, address);
  if (cachedCode) {
    if (
      !cachedCode.value ||
      cachedCode.timestamp > Date.now() - NO_SOURCE_CACHE_DURATION
    ) {
      return {
        value: cachedCode.value,
        timestamp: cachedCode.timestamp,
      };
    }
  }
  // No cache or stale cache
  const contract = await etherscanService.getSourceCode(address);
  if (contract === undefined) {
    return {
      value: null,
      timestamp: Date.now(),
    };
  }
  if (contract === null) {
    await minioService.setContract(chain, address, null);
    return {
      value: null,
      timestamp: Date.now(),
    };
  }
  const code: Contract = contract.isProxy
    ? {
        abi: contract.abi,
        source: contract.source,
        isProxy: contract.isProxy,
        implementation: contract.implementation,
      }
    : {
        abi: contract.abi,
        source: contract.source,
        isProxy: contract.isProxy,
      };
  await minioService.setContract(chain, address, code);
  return {
    value: code,
    timestamp: Date.now(),
  };
}

// eslint-disable-next-line import/prefer-default-export
export { getContractSource };
