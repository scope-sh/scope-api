import { Readable } from 'node:stream';

import * as Minio from 'minio';
import { Abi, Address } from 'viem';

import { ChainId } from '@/utils/chains';
import { ChainLabelMap } from '@/utils/labels';
import { SourceCode } from '@/utils/sources';

interface BaseContract {
  source: SourceCode;
  abi: Abi;
  isProxy: boolean;
}

interface StaticContract extends BaseContract {
  isProxy: false;
}

interface ProxyContract extends BaseContract {
  isProxy: true;
  implementation: Address | null;
}

type Contract = StaticContract | ProxyContract;

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

  async getLabels(chain: ChainId): Promise<ChainLabelMap> {
    const key = `labels/${chain}.json`;
    try {
      const file = await this.client.getObject(this.bucket, key);
      const fileString = await streamToString(file);
      return JSON.parse(fileString);
    } catch (e) {
      return {};
    }
  }

  async getContract(
    chain: ChainId,
    address: Address,
  ): Promise<Contract | null> {
    const key = `contracts/${chain}/${address}.json`;
    try {
      const file = await this.client.getObject(this.bucket, key);
      const fileString = await streamToString(file);
      return JSON.parse(fileString);
    } catch (e) {
      return null;
    }
  }

  async setContract(
    chain: ChainId,
    address: Address,
    code: Contract,
  ): Promise<void> {
    const key = `contracts/${chain}/${address}.json`;
    await this.client.putObject(this.bucket, key, JSON.stringify(code));
  }
}

export default Service;
export type { BaseContract };
