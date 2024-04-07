import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { Address } from 'viem';
import { z } from 'zod';

import { chainSchema, parseChainId } from '@/utils/chains';

import { getLabelByAddress, getLabelsByAddressList } from './controller';

const router = new Hono();

router.get(
  '/one',
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
    const label = getLabelByAddress(chainId, address as Address);
    return c.json(label);
  },
);

router.post(
  '/many',
  zValidator(
    'query',
    z.object({
      chain: chainSchema,
    }),
  ),
  zValidator(
    'json',
    z.object({
      addresses: z.array(z.string()),
    }),
  ),
  async (c) => {
    const { chain } = c.req.valid('query');
    const { addresses } = c.req.valid('json');
    const chainId = parseChainId(chain);
    const label = getLabelsByAddressList(chainId, addresses as Address[]);
    return c.json(label);
  },
);

export default router;
