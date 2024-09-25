import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { Address } from 'viem';
import { z } from 'zod';

import { chainSchema, parseChainId } from '@/utils/chains';

import { getAll, getAbi, getSource, getDeployment } from './controller';

const router = new Hono()
  .get(
    '/all',
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
      const all = await getAll(chainId, address.toLowerCase() as Address);
      return c.json(all);
    },
  )
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
            constructors: z.boolean().optional(),
            functionNames: z.array(z.string()).optional(),
            functions: z.array(z.string()).optional(),
            events: z.array(z.string()).optional(),
            errors: z.array(z.string()).optional(),
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
  )
  .get(
    '/deployment',
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
      const deployment = await getDeployment(
        chainId,
        address.toLowerCase() as Address,
      );
      return c.json(deployment);
    },
  );

export default router;
