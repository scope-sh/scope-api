import { Agent } from 'http';

import axios, { AxiosInstance } from 'axios';
import { Abi, Address } from 'viem';

import {
  ETHEREUM,
  SEPOLIA,
  OPTIMISM,
  OPTIMISM_SEPOLIA,
  POLYGON,
  POLYGON_AMOY,
  BASE,
  BASE_SEPOLIA,
  ARBITRUM,
  ARBITRUM_SEPOLIA,
  ChainId,
} from '@/utils/chains';
import { COMPILER, EVM, LANGUAGE, SourceCode } from '@/utils/sources';

interface SourceResponse {
  status: '0' | '1';
  message: string;
  result:
    | {
        SourceCode: string;
        ABI: string;
        ContractName: string;
        CompilerVersion: string;
        OptimizationUsed: string;
        Runs: string;
        ConstructorArguments: string;
        EVMVersion: string;
        Library: string;
        LicenseType: string;
        Proxy: '0' | '1';
        Implementation: string;
        SwarmSource: string;
      }[]
    | string;
}

interface SourceCodeResponse {
  sources: Record<
    string,
    {
      content: string;
    }
  >;
}

// Bun doesn't support brotli yet
axios.defaults.headers.common['Accept-Encoding'] = 'gzip';

const DEFAULT_PATH = '';

class Service {
  chain: ChainId;
  client: AxiosInstance;

  constructor(chain: ChainId) {
    this.chain = chain;
    this.client = axios.create({
      baseURL: this.#getEndpointUrl(chain),
    });
  }

  #getEndpointUrl(chain: ChainId): string {
    switch (chain) {
      case ETHEREUM:
        return 'https://api.etherscan.io/api';
      case SEPOLIA:
        return 'https://api-sepolia.etherscan.io/api';
      case OPTIMISM:
        return 'https://api-optimistic.etherscan.io/api';
      case OPTIMISM_SEPOLIA:
        return 'https://api-sepolia-optimistic.etherscan.io/api';
      case POLYGON:
        return 'https://api.polygonscan.com/api';
      case POLYGON_AMOY:
        return 'https://api-amoy.polygonscan.com/api';
      case BASE:
        return 'https://api.basescan.org/api';
      case BASE_SEPOLIA:
        return 'https://api-sepolia.basescan.org/api';
      case ARBITRUM:
        return 'https://api.arbiscan.io/api';
      case ARBITRUM_SEPOLIA:
        return 'https://api-sepolia.arbiscan.io/api';
    }
  }

  /*
   * Fetches the source code for a given address
   * @param address The address of the contract
   * @returns The source code for the contract, or null if the contract is not verified, or undefined if an error occurred
   */
  async getSourceCode(address: string): Promise<
    | {
        source: SourceCode;
        abi: Abi;
        isProxy: boolean;
        implementation: Address | null;
      }
    | null
    | undefined
  > {
    const response = await fetch(
      `${this.client.defaults.baseURL}?module=contract&action=getsourcecode&address=${address}`,
    );
    const data = (await response.json()) as SourceResponse;
    if (data.status !== '1') {
      const error =
        typeof data.result === 'string' ? data.result : 'Unknown error';
      console.error(`Error fetching sources for ${address}: ${error}`);
      return undefined;
    }
    if (typeof data.result === 'string') {
      return undefined;
    }
    const result = data.result[0];
    if (!result) {
      return undefined;
    }
    const sourceCode = parseSource(result.SourceCode);
    if (!sourceCode) {
      return null;
    }
    const entry = getEntry(sourceCode.sources, result.ContractName);
    const files = Object.fromEntries(
      Object.entries(sourceCode.sources).map(([name, { content }]) => [
        name,
        content,
      ]),
    );
    const { language, compiler, compilerVersion } = parseCompiler(
      result.CompilerVersion,
    );
    return {
      source: {
        name: result.ContractName,
        entry,
        files,
        constructorArguments: `0x${result.ConstructorArguments}`,
        evm: result.EVMVersion.toLowerCase() as EVM,
        language,
        compiler: {
          type: compiler,
          version: compilerVersion,
        },
        compilation: {
          optimization: {
            runs: parseInt(result.Runs),
          },
        },
      },
      abi: JSON.parse(result.ABI) as Abi,
      isProxy: result.Proxy === '1',
      implementation: result.Implementation as Address,
    };
  }
}

function parseCompiler(compilerString: string): {
  language: LANGUAGE;
  compiler: COMPILER;
  compilerVersion: string;
} {
  const VYPER_PREFIX = 'vyper:';
  if (compilerString.startsWith(VYPER_PREFIX)) {
    return {
      language: 'Vyper',
      compiler: 'vyper',
      compilerVersion: compilerString.substring(VYPER_PREFIX.length),
    };
  }
  return {
    language: 'Solidity',
    compiler: 'solc',
    compilerVersion: compilerString,
  };
}

function parseSource(source: string): SourceCodeResponse | null {
  if (source.length === 0) {
    return null;
  }
  if (source[0] === '{' && source.at(-1) === '}') {
    try {
      const sourceCode = JSON.parse(
        source.substring(1, source.length - 1),
      ) as SourceCodeResponse;
      return sourceCode;
    } catch {
      return {
        sources: {
          [DEFAULT_PATH]: {
            content: source,
          },
        },
      };
    }
  }
  return {
    sources: {
      [DEFAULT_PATH]: {
        content: source,
      },
    },
  };
}

function getEntry(
  sources: Record<string, { content: string }>,
  name: string,
): string {
  function getFileNameNoExtension(path: string): string {
    const index = path.lastIndexOf('/');
    const fileName = index === -1 ? path : path.substring(index + 1);
    const extensionIndex = fileName.lastIndexOf('.');
    return extensionIndex === -1
      ? fileName
      : fileName.substring(0, extensionIndex);
  }

  const keys = Object.keys(sources);
  if (keys.length === 1) {
    return DEFAULT_PATH;
  }
  for (const key of keys) {
    const fileName = getFileNameNoExtension(key);
    if (fileName === name) {
      return key;
    }
  }
  return Object.keys(sources)[0] || DEFAULT_PATH;
}

export default Service;
