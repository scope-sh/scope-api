import { whatsabi } from '@shazow/whatsabi';
// eslint-disable-next-line import-x/no-extraneous-dependencies
import { AbiConstructor, AbiError } from 'abitype';
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
import { mode, modeTestnet } from 'viem/chains';

import EtherscanService from '@/services/etherscan';
import MinioService, { type ContractSource } from '@/services/minio';
import { ChainId, getChainData, MODE, MODE_SEPOLIA } from '@/utils/chains';
import { Deployment, SourceCode } from '@/utils/contracts';
import { toErrorSelector } from '@/utils/evm';
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
const NO_DEPLOYMENT_CACHE_DURATION = 30 * DAY;

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
  deployer: Address;
  transactionHash: Hex;
}

interface OptionalContractSourceCache {
  value: ContractSource | null;
  timestamp: number | null;
}

interface OptionalContractDeploymentCache {
  value: Deployment | null;
  timestamp: number | null;
}

type Abis = Record<
  Address,
  {
    constructors: AbiConstructor[];
    functionNames: Record<Hex, string>;
    functions: Record<Hex, AbiFunction>;
    events: Record<Hex, AbiEvent>;
    errors: Record<Hex, AbiError>;
  }
>;

function getClient(chain: ChainId, alchemyKey: string): PublicClient {
  function getEndpointUrl(chain: ChainId): string {
    if (chain === MODE) {
      return mode.rpcUrls.default.http[0];
    }
    if (chain === MODE_SEPOLIA) {
      return modeTestnet.rpcUrls.default.http[0];
    }
    return alchemy(chain, alchemyKey);
  }

  const endpointUrl = getEndpointUrl(chain);
  return createPublicClient({
    chain: getChainData(chain),
    transport: http(endpointUrl),
  });
}

async function getAll(
  chain: ChainId,
  address: Address,
): Promise<{
  source: SourceCodeResponse | null;
  deployment: DeploymentResponse | null;
} | null> {
  const source = await getSource(chain, address);
  if (!source) {
    return null;
  }
  const deployment = await getDeployment(chain, address);
  return {
    deployment,
    source,
  };
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
    await minioService.setSource(chain, address, {
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
      constructors?: boolean;
      functionNames?: string[];
      functions?: string[];
      events?: string[];
      errors?: string[];
    }
  >,
): Promise<Abis> {
  async function getContractAbis(
    chain: ChainId,
    address: Address,
    contractSelectors: {
      constructors?: boolean;
      functionNames?: string[];
      functions?: string[];
      events?: string[];
      errors?: string[];
    },
  ): Promise<Abis[Address] | null> {
    const contract = await getSource(chain, address);
    const contractAbi = await extractContractAbi(contract, chain, address);
    if (!contractAbi) {
      return null;
    }
    const contractConstructors: AbiConstructor[] = [];
    if (contractSelectors.constructors) {
      for (const abi of contractAbi) {
        if (abi.type === 'constructor') {
          contractConstructors.push(abi);
        }
      }
    }
    const contractEventAbi: Record<Hex, AbiEvent> = {};
    for (const selector of contractSelectors.events ?? []) {
      const topicEventAbi = contractAbi.find(
        (abi) => abi.type === 'event' && toEventSelector(abi) === selector,
      );
      if (topicEventAbi) {
        contractEventAbi[selector as Hex] = topicEventAbi as AbiEvent;
      }
    }
    const contractFunctionNames: Record<Hex, string> = {};
    for (const selector of contractSelectors.functionNames ?? []) {
      const topicFunctionAbi = contractAbi.find(
        (abi) =>
          abi.type === 'function' && toFunctionSelector(abi) === selector,
      );
      if (topicFunctionAbi) {
        contractFunctionNames[selector as Hex] = (
          topicFunctionAbi as AbiFunction
        ).name;
      }
    }
    const contractFunctionAbi: Record<Hex, AbiFunction> = {};
    for (const selector of contractSelectors.functions ?? []) {
      const topicFunctionAbi = contractAbi.find(
        (abi) =>
          abi.type === 'function' && toFunctionSelector(abi) === selector,
      );
      if (topicFunctionAbi) {
        contractFunctionAbi[selector as Hex] = topicFunctionAbi as AbiFunction;
      }
    }
    const contractErrorAbi: Record<Hex, AbiError> = {};
    for (const selector of contractSelectors.errors ?? []) {
      const topicErrorAbi = contractAbi.find(
        (abi) => abi.type === 'error' && toErrorSelector(abi) === selector,
      );
      if (topicErrorAbi) {
        contractErrorAbi[selector as Hex] = topicErrorAbi as AbiError;
      }
    }
    return {
      constructors: contractConstructors,
      functionNames: contractFunctionNames,
      functions: contractFunctionAbi,
      events: contractEventAbi,
      errors: contractErrorAbi,
    };
  }
  const abi: Abis = {};
  const abisEntries = await Promise.all(
    Object.entries(contracts).map(async ([address, contract]) => {
      const abi = await getContractAbis(chain, address as Address, contract);
      return [address, abi] as const;
    }),
  );

  for (const [address, abiEntry] of abisEntries) {
    if (abiEntry) {
      abi[address as Address] = abiEntry;
    }
  }
  return abi;
}

async function getImplementationAddress(
  chain: ChainId,
  address: Address,
): Promise<Address | null> {
  const contract = await getSource(chain, address);
  if (!contract) {
    return null;
  }
  return contract.implementation?.address ?? null;
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
  const deployment = await fetchDeployment(minioService, chain, address);
  if (!deployment.value) {
    return null;
  }
  return deployment.value;
}

async function guessAbi(chain: ChainId, address: Address): Promise<Abi | null> {
  const client = getClient(chain, alchemyKey);
  try {
    const abiResult = await whatsabi.autoload(address, {
      provider: client,
      abiLoader: false,
      followProxies: false,
      enableExperimentalMetadata: true,
    });
    const functions = abiResult.abi
      .filter((abi) => abi.type === 'function' && abi.name && abi.inputs)
      .map((abi) => ({
        ...abi,
        selector: undefined,
        sig: undefined,
        sigAlts: undefined,
        outputs: [],
      })) as AbiFunction[];
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const events = abiResult.abi
      .filter((abi) => abi.type === 'event' && abi.name)
      .map((abi) => ({
        ...abi,
        hash: undefined,
        sig: undefined,
        sigAlts: undefined,
      })) as AbiEvent[];
    return [...functions, ...events] as Abi;
  } catch {
    return null;
  }
}

async function extractContractAbi(
  contract: SourceCodeResponse | null,
  chain: ChainId,
  address: Address,
): Promise<Abi | null> {
  if (!contract) {
    return null;
  }
  const implementation = contract.implementation;
  if (!implementation) {
    if (contract.abi !== null) {
      return contract.abi;
    }
    return guessAbi(chain, address);
  }
  if (implementation.abi !== null) {
    return implementation.abi;
  }
  return guessAbi(chain, implementation.address);
}

async function fetchContract(
  minioService: MinioService,
  chain: ChainId,
  address: Address,
): Promise<OptionalContractSourceCache> {
  const etherscanService = new EtherscanService(chain);
  const cachedSource = await minioService.getSource(chain, address);
  if (cachedSource) {
    if (
      !!cachedSource.value.source ||
      cachedSource.timestamp > Date.now() - NO_SOURCE_CACHE_DURATION
    ) {
      return {
        value: cachedSource.value,
        timestamp: cachedSource.timestamp,
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
  const contract: ContractSource = {
    abi: code?.abi ?? null,
    source: code?.source ?? null,
    // Don't use the implementation address from etherscan
    // Too many false positives
    implementation: null,
  };
  await minioService.setSource(chain, address, contract);
  return {
    value: contract,
    timestamp: null,
  };
}

async function fetchDeployment(
  minioService: MinioService,
  chain: ChainId,
  address: Address,
): Promise<OptionalContractDeploymentCache> {
  const etherscanService = new EtherscanService(chain);
  const cachedDeployment = await minioService.getDeployment(chain, address);
  if (cachedDeployment) {
    if (
      !!cachedDeployment.value ||
      cachedDeployment.timestamp > Date.now() - NO_DEPLOYMENT_CACHE_DURATION
    ) {
      return {
        value: cachedDeployment.value,
        timestamp: cachedDeployment.timestamp,
      };
    }
  }

  const creation = await etherscanService.getContractCreation(address);
  if (creation === undefined) {
    return {
      value: null,
      timestamp: null,
    };
  }
  const deployment: Deployment | null = creation
    ? {
        deployer: creation.contractCreator,
        transactionHash: creation.txHash,
      }
    : null;
  await minioService.setDeployment(chain, address, deployment);
  return {
    value: deployment,
    timestamp: null,
  };
}

export { getAll, getSource, getAbi, getImplementationAddress, getDeployment };
