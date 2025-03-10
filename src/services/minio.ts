import { Readable } from 'node:stream';

import * as Minio from 'minio';
import { Abi, Address } from 'viem';

import { ChainId } from '@/utils/chains';
import { SourceCode, Deployment } from '@/utils/contracts';

interface ContractSource {
  source: SourceCode | null;
  abi: Abi | null;
  implementation: Address | null;
  delegation: Address | null;
}

interface ContractSourceCache {
  value: ContractSource;
  timestamp: number;
}

interface ContractDeploymentCache {
  value: Deployment | null;
  timestamp: number;
}

async function streamToString(stream: Readable): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';

    stream.on('data', (chunk) => {
      data += chunk;
    });

    stream.on('end', () => {
      resolve(data);
    });

    stream.on('error', (error) => {
      reject(error);
    });
  });
}

class Service {
  client: Minio.Client;
  bucket: string;

  constructor(
    endpoint: string,
    accessKey: string,
    secretKey: string,
    bucket: string,
  ) {
    this.bucket = bucket;
    this.client = new Minio.Client({
      endPoint: endpoint,
      port: 443,
      accessKey,
      secretKey,
    });
  }

  async getSource(
    chain: ChainId,
    address: Address,
  ): Promise<ContractSourceCache | null> {
    const key = `sources/${chain}/${address}.json`;
    try {
      const file = await this.client.getObject(this.bucket, key);
      const fileString = await streamToString(file);
      return JSON.parse(fileString);
    } catch {
      return null;
    }
  }

  async setSource(
    chain: ChainId,
    address: Address,
    source: ContractSource,
  ): Promise<void> {
    const key = `sources/${chain}/${address}.json`;
    const cache: ContractSourceCache = {
      value: source,
      timestamp: Date.now(),
    };
    await this.client.putObject(this.bucket, key, JSON.stringify(cache));
  }

  async getDeployment(
    chain: ChainId,
    address: Address,
  ): Promise<ContractDeploymentCache | null> {
    const key = `deployments/${chain}/${address}.json`;
    try {
      const file = await this.client.getObject(this.bucket, key);
      const fileString = await streamToString(file);
      return JSON.parse(fileString);
    } catch {
      return null;
    }
  }

  async setDeployment(
    chain: ChainId,
    address: Address,
    deployment: Deployment | null,
  ): Promise<void> {
    const key = `deployments/${chain}/${address}.json`;
    const cache: ContractDeploymentCache = {
      value: deployment,
      timestamp: Date.now(),
    };
    await this.client.putObject(this.bucket, key, JSON.stringify(cache));
  }
}

export default Service;
export type { ContractSource, ContractSourceCache, ContractDeploymentCache };
