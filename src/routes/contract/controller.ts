import { alchemy } from 'evm-providers';
import { Abi, Address, PublicClient, createPublicClient, http } from 'viem';

import EtherscanService from '@/services/etherscan';
import MinioService, { BaseContract as BaseCode } from '@/services/minio';
import { ChainId, getChainData } from '@/utils/chains';
import { getImplementation } from '@/utils/proxy';
import { SourceCode } from '@/utils/sources';

const alchemyKey = process.env.ALCHEMY_KEY as string;
const minioPublicEndpoint = process.env.MINIO_PUBLIC_ENDPOINT as string;
const minioAccessKey = process.env.MINIO_ACCESS_KEY as string;
const minioSecretKey = process.env.MINIO_SECRET_KEY as string;
const minioBucket = process.env.MINIO_BUCKET as string;

type ContractResponse = ProxyContractResponse | StaticContractResponse;
type BaseContractResponse = BaseCode;
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

interface ProxyContractCode extends BaseCode {
  isProxy: true;
  implementation: Address | null;
}
interface StaticContractCode extends BaseCode {
  isProxy: false;
}
type ContractCode = StaticContractCode | ProxyContractCode;

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
  if (!contract || !contract.code) {
    return null;
  }
  const contractCode = contract.code;
  if (contractCode.isProxy) {
    const implementation =
      contract.isCached || contractCode.implementation === null
        ? (await getImplementation(client, address)) ||
          contractCode.implementation
        : contractCode.implementation;
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
    if (!implementationContract || !implementationContract.code) {
      return {
        ...contractCode,
        implementation: null,
      };
    }
    return {
      isProxy: true,
      abi: contract.code.abi,
      source: contract.code.source,
      implementation: {
        address: implementation,
        abi: implementationContract.code.abi,
        source: implementationContract.code.source,
      },
    };
  }
  return {
    isProxy: false,
    abi: contract.code.abi,
    source: contract.code.source,
  };
}

async function fetchContract(
  minioService: MinioService,
  chain: ChainId,
  address: Address,
): Promise<{
  code: ContractCode | null;
  isCached: boolean;
}> {
  const etherscanService = new EtherscanService(chain);
  const cachedCode = await minioService.getContract(chain, address);
  if (cachedCode) {
    return {
      code: cachedCode,
      isCached: true,
    };
  }
  const contract = await etherscanService.getSourceCode(address);
  if (!contract) {
    return {
      code: null,
      isCached: false,
    };
  }
  // Cache the contract
  await minioService.setContract(chain, address, contract);
  if (contract.isProxy) {
    return {
      code: contract,
      isCached: false,
    };
  }
  return {
    code: contract,
    isCached: false,
  };
}

// eslint-disable-next-line import/prefer-default-export
export { getContractSource };
