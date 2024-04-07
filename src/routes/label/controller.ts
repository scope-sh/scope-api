import CloudflareService from '@/services/cloudflare';
import { CHAINS, ChainId } from '@/utils/chains';
import { Label } from '@/utils/labels';

const cloudflareAccountId = process.env.CLOUDFLARE_ACCOUNT_ID as string;
const cloudflareAccessKeyId = process.env.CLOUDFLARE_ACCESS_KEY_ID as string;
const cloudflareSecretAccessKey = process.env
  .CLOUDFLARE_SECRET_ACCESS_KEY as string;
const cloudflareBucket = process.env.CLOUDFLARE_R2_BUCKET as string;

type LabelWithAddress = Label & {
  address: string;
};

const labels: Partial<Record<ChainId, Record<string, Label>>> = {};
const labelsWithAddress: Partial<Record<ChainId, LabelWithAddress[]>> = {};

for (const chain of CHAINS) {
  console.log(`Fetch labels for chain ${chain}`);
  const service = new CloudflareService(
    cloudflareAccountId,
    cloudflareAccessKeyId,
    cloudflareSecretAccessKey,
    cloudflareBucket,
  );
  const chainLabels = await service.getLabels(chain);
  if (!chainLabels) {
    continue;
  }
  labels[chain] = chainLabels;
  const labelList = Object.keys(chainLabels)
    .map((address) => {
      const label = chainLabels[address];
      if (!label) {
        return null;
      }
      return {
        ...label,
        address,
      };
    })
    .filter((label) => label !== null) as LabelWithAddress[];
  labelsWithAddress[chain] = labelList;
}

function getLabelByAddress(chainId: ChainId, address: string): Label | null {
  const chainLabels = labels[chainId];
  if (!chainLabels) {
    return null;
  }
  if (address in chainLabels) {
    return chainLabels[address] || null;
  } else {
    return null;
  }
}

function getLabelsByAddressList(
  chainId: ChainId,
  addressList: string[],
): LabelWithAddress[] {
  const foundLabels: LabelWithAddress[] = [];
  const chainLabels = labels[chainId];
  if (!chainLabels) {
    return [];
  }
  for (const address of addressList) {
    if (address in chainLabels) {
      const label = chainLabels[address];
      if (!label) {
        continue;
      }
      foundLabels.push({
        address,
        ...label,
      });
    }
  }
  return foundLabels;
}

export { getLabelByAddress, getLabelsByAddressList };
