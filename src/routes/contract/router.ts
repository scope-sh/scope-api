import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { Address } from 'viem';
import { z } from 'zod';

import { chainSchema, parseChainId } from '@/utils/chains';

import { getAbi, getSource } from './controller';

const router = new Hono()
  .get(
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
      const source = await getSource(chainId, address.toLowerCase() as Address);
      return c.json(source);
    },
  )
  .post(
    '/abi',
    zValidator(
      'query',
      z.object({
        chain: chainSchema,
      }),
    ),
    zValidator(
      'json',
      z.object({
        contracts: z.record(
          z.string(),
          z.object({
            functions: z.array(z.string()),
            events: z.array(z.string()),
          }),
        ),
      }),
    ),
    async (c) => {
      const { chain } = c.req.valid('query');
      const { contracts } = c.req.valid('json');
      const chainId = parseChainId(chain);
      const abi = await getAbi(chainId, contracts);
      return c.json(abi);
    },
  );

export default router;
