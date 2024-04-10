import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { Address } from 'viem';
import { z } from 'zod';

import { chainSchema, parseChainId } from '@/utils/chains';

import { getAddressTransactions, getAddressLogs } from './controller';

const router = new Hono()
  .get(
    '/transactions',
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
      const transactions = await getAddressTransactions(
        chainId,
        address as Address,
      );
      return c.json(transactions);
    },
  )
  .get(
    '/logs',
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
      const logs = await getAddressLogs(chainId, address as Address);
      return c.json(logs);
    },
  );

export default router;
