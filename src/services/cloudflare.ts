import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

import { ChainId } from '@/utils/chains';
import { ChainLabelMap } from '@/utils/labels';

class Service {
  client: S3Client;
  bucket: string;

  constructor(
    accountId: string,
    accessKeyId: string,
    secretAccessKey: string,
    bucket: string,
  ) {
    this.bucket = bucket;
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async getLabels(chain: ChainId): Promise<ChainLabelMap> {
    const key = `labels/${chain}.json`;
    const file = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    const fileBody = file.Body;
    if (!fileBody) {
      return {};
    }
    const fileString = await fileBody.transformToString();
    return JSON.parse(fileString);
  }
}

export default Service;
