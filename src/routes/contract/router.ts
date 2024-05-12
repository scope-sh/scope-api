import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { Address } from 'viem';
import { z } from 'zod';

import { chainSchema, parseChainId } from '@/utils/chains';

import { getContractSource } from './controller';

const router = new Hono().get(
  '/source',
  zValidator(
    'query',
    z.object({
      address: z.string(),
      chain: chainSchema,
    }),
  ),
  async (c) => {
    const { address, chain } = c.req.valid('query');
    const chainId = parseChainId(chain);
    const contract = await getContractSource(
      chainId,
      address.toLowerCase() as Address,
    );
    return c.json(contract);
  },
);

export default router;
