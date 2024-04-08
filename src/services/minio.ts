import { Readable } from 'node:stream';

import * as Minio from 'minio';

import { ChainId } from '@/utils/chains';
import { ChainLabelMap } from '@/utils/labels';

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
}

export default Service;
