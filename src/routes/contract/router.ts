import { vValidator } from '@hono/valibot-validator';
import { Hono } from 'hono';
import * as v from 'valibot';
import { Address } from 'viem';

import { chainSchema, parseChainId } from '@/utils/chains';

import { getAll, getAbi, getSource, getDeployment, getImplementationAddress } from './controller';

const router = new Hono()
  .get(
    '/all',
    vValidator(
      'query',
      v.object({
        address: v.string(),
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
    vValidator(
      'query',
      v.object({
        address: v.string(),
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
    vValidator(
      'query',
      v.object({
        chain: chainSchema,
      }),
    ),
    vValidator(
      'json',
      v.object({
        contracts: v.record(
          v.string(),
          v.object({
            constructors: v.optional(v.boolean()),
            functionNames: v.optional(v.array(v.string())),
            functions: v.optional(v.array(v.string())),
            events: v.optional(v.array(v.string())),
            errors: v.optional(v.array(v.string())),
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
    '/implementation',
    vValidator(
      'query',
      v.object({
        address: v.string(),
        chain: chainSchema,
      }),
    ),
    async (c) => {
      const { address, chain } = c.req.valid('query');
      const chainId = parseChainId(chain);
      const implementationAddress = await getImplementationAddress(
        chainId,
        address.toLowerCase() as Address,
      );
      return c.json({
        address: implementationAddress,
      });
    },
  )
  .get(
    '/deployment',
    vValidator(
      'query',
      v.object({
        address: v.string(),
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
