import { alchemy } from 'evm-providers';
import {
  Abi,
  AbiEvent,
  AbiFunction,
  Address,
  Hex,
  PublicClient,
  createPublicClient,
  http,
  toEventSelector,
  toFunctionSelector,
} from 'viem';

import EtherscanService from '@/services/etherscan';
import MinioService, { Contract } from '@/services/minio';
import { ChainId, getChainData } from '@/utils/chains';
import { SourceCode } from '@/utils/contracts';
import { getImplementation } from '@/utils/proxy';

const alchemyKey = process.env.ALCHEMY_KEY as string;
const minioPublicEndpoint = process.env.MINIO_PUBLIC_ENDPOINT as string;
const minioAccessKey = process.env.MINIO_ACCESS_KEY as string;
const minioSecretKey = process.env.MINIO_SECRET_KEY as string;
const minioBucket = process.env.MINIO_BUCKET as string;

const DAY = 1000 * 60 * 60 * 24;
const NO_SOURCE_CACHE_DURATION = 7 * DAY;
const IMPLEMENTATION_CACHE_DURATION = DAY;
const NO_IMPLEMENTATION_CACHE_DURATION = 30 * DAY;

interface SourceCodeResponse {
  abi: Abi | null;
  source: SourceCode | null;
  implementation: {
    address: Address;
    abi: Abi | null;
    source: SourceCode | null;
  } | null;
}

interface DeploymentResponse {
  deployer: Address | null;
  transactionHash: Hex | null;
}

interface OptionalContractCache {
  value: Contract | null;
  timestamp: number | null;
}

type Abis = Record<
  Address,
  {
    functions: Record<Hex, AbiFunction>;
    events: Record<Hex, AbiEvent>;
  }
>;

function getClient(chain: ChainId, alchemyKey: string): PublicClient {
  const endpointUrl = alchemy(chain, alchemyKey);
  return createPublicClient({
    chain: getChainData(chain),
    transport: http(endpointUrl),
  });
}

async function getSource(
  chain: ChainId,
  address: Address,
): Promise<SourceCodeResponse | null> {
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
  // Fetch impl address if there's no contract or if there is a contract but there is no implementation cached (unless we did that already recently)
  const useCachedImplementation =
    contract.timestamp === null
      ? contract.value.implementation !== null
      : contract.value.implementation === null
        ? contract.timestamp > Date.now() - NO_IMPLEMENTATION_CACHE_DURATION
        : contract.timestamp > Date.now() - IMPLEMENTATION_CACHE_DURATION;
  const implementation = useCachedImplementation
    ? contract.value.implementation
    : await getImplementation(client, address);
  // Store the implementation in the cache
  if (!useCachedImplementation) {
    await minioService.setContract(chain, address, {
      ...contract.value,
      implementation,
    });
  }
  const implementationContract = implementation
    ? await fetchContract(minioService, chain, implementation)
    : null;
  const implementationAbi =
    implementationContract && implementationContract.value
      ? implementationContract.value.abi
      : null;
  const implementationSource =
    implementationContract && implementationContract.value
      ? implementationContract.value.source
      : null;
  return {
    abi: contract.value.abi,
    source: contract.value.source,
    implementation: implementation
      ? {
          address: implementation,
          abi: implementationAbi,
          source: implementationSource,
        }
      : null,
  };
}

async function getAbi(
  chain: ChainId,
  contracts: Record<
    string,
    {
      functions: string[];
      events: string[];
    }
  >,
): Promise<Abis> {
  const abi: Abis = {};
  for (const address in contracts) {
    const contractAbi = await fetchContractAbi(chain, address as Address);
    if (!contractAbi) {
      continue;
    }
    const contractSelectors = contracts[address];
    if (!contractSelectors) {
      continue;
    }
    const contractEventAbi: Record<Hex, AbiEvent> = {};
    for (const selector of contractSelectors.events) {
      const topicEventAbi = contractAbi.find(
        (abi) => abi.type === 'event' && toEventSelector(abi) === selector,
      );
      if (topicEventAbi) {
        contractEventAbi[selector as Hex] = topicEventAbi as AbiEvent;
      }
    }
    const contractFunctionAbi: Record<Hex, AbiFunction> = {};
    for (const selector of contractSelectors.functions) {
      const topicFunctionAbi = contractAbi.find(
        (abi) =>
          abi.type === 'function' && toFunctionSelector(abi) === selector,
      );
      if (topicFunctionAbi) {
        contractFunctionAbi[selector as Hex] = topicFunctionAbi as AbiFunction;
      }
    }
    abi[address as Address] = {
      functions: contractFunctionAbi,
      events: contractEventAbi,
    };
  }
  return abi;
}

async function getDeployment(
  chain: ChainId,
  address: Address,
): Promise<DeploymentResponse | null> {
  const minioService = new MinioService(
    minioPublicEndpoint,
    minioAccessKey,
    minioSecretKey,
    minioBucket,
  );
  const contract = await fetchDeployment(minioService, chain, address);
  if (!contract.value) {
    return null;
  }
  return {
    deployer: contract.value.deployment?.deployer ?? null,
    transactionHash: contract.value.deployment?.transactionHash ?? null,
  };
}

async function fetchContractAbi(
  chain: ChainId,
  address: Address,
): Promise<Abi | null> {
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
  const implementation = contract.value.implementation;
  if (!implementation) {
    return contract.value.abi;
  }
  const implementationContract = await fetchContract(
    minioService,
    chain,
    implementation,
  );
  if (!implementationContract.value) {
    return null;
  }
  return implementationContract.value.abi;
}

async function fetchContract(
  minioService: MinioService,
  chain: ChainId,
  address: Address,
): Promise<OptionalContractCache> {
  const etherscanService = new EtherscanService(chain);
  const cachedCode = await minioService.getContract(chain, address);
  if (cachedCode) {
    if (
      !!cachedCode.value ||
      cachedCode.timestamp > Date.now() - NO_SOURCE_CACHE_DURATION
    ) {
      return {
        value: cachedCode.value,
        timestamp: cachedCode.timestamp,
      };
    }
  }
  // No cache or stale cache
  const code = await etherscanService.getSourceCode(address);
  if (code === undefined) {
    return {
      value: null,
      timestamp: null,
    };
  }
  const contract: Contract = {
    deployment: cachedCode?.value.deployment ?? null,
    abi: code?.abi ?? null,
    source: code?.source ?? null,
    implementation: code?.implementation ?? null,
  };
  await minioService.setContract(chain, address, contract);
  return {
    value: contract,
    timestamp: null,
  };
}

async function fetchDeployment(
  minioService: MinioService,
  chain: ChainId,
  address: Address,
): Promise<OptionalContractCache> {
  const etherscanService = new EtherscanService(chain);
  const cachedContract = await minioService.getContract(chain, address);
  if (cachedContract && cachedContract.value.deployment) {
    return {
      value: cachedContract.value,
      timestamp: cachedContract.timestamp,
    };
  }
  const creation = await etherscanService.getContractCreation(address);
  if (creation === undefined) {
    return {
      value: null,
      timestamp: null,
    };
  }
  const contract: Contract = {
    deployment: creation
      ? {
          deployer: creation.contractCreator,
          transactionHash: creation.txHash,
        }
      : null,
    abi: cachedContract?.value.abi ?? null,
    source: cachedContract?.value.source ?? null,
    implementation: cachedContract?.value.implementation ?? null,
  };
  await minioService.setContract(chain, address, contract);
  return {
    value: contract,
    timestamp: null,
  };
}

export { getSource, getAbi, getDeployment };
