import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { Address } from 'viem';
import { z } from 'zod';

import { chainSchema, parseChainId } from '@/utils/chains';

import { getContractSource, getEventAbi, getFunctionAbi } from './controller';

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
      const contract = await getContractSource(
        chainId,
        address.toLowerCase() as Address,
      );
      return c.json(contract);
    },
  )
  .post(
    '/abi/events',
    zValidator(
      'query',
      z.object({
        chain: chainSchema,
      }),
    ),
    zValidator(
      'json',
      z.object({
        selectors: z.record(z.string(), z.array(z.string())),
      }),
    ),
    async (c) => {
      const { chain } = c.req.valid('query');
      const { selectors } = c.req.valid('json');
      const chainId = parseChainId(chain);
      const events = await getEventAbi(chainId, selectors);
      return c.json(events);
    },
  )
  .post(
    '/abi/functions',
    zValidator(
      'query',
      z.object({
        chain: chainSchema,
      }),
    ),
    zValidator(
      'json',
      z.object({
        selectors: z.record(z.string(), z.array(z.string())),
      }),
    ),
    async (c) => {
      const { chain } = c.req.valid('query');
      const { selectors } = c.req.valid('json');
      const chainId = parseChainId(chain);
      const functions = await getFunctionAbi(chainId, selectors);
      return c.json(functions);
    },
  );

export default router;
