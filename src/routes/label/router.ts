import { zValidator } from '@hono/zod-validator';
import { Context, Hono, Next } from 'hono';
import { Address } from 'viem';
import { z } from 'zod';

import { chainSchema, parseChainId } from '@/utils/chains';

import {
  getLabelByAddress,
  getLabelsByAddressList,
  searchLabels,
  fetchLabels,
} from './controller';

const CACHE_DURATION = 1000 * 60 * 60 * 24;
let lastUpdate = Date.now();

await fetchLabels();

async function updateCacheIfStale(_c: Context, next: Next): Promise<void> {
  const now = Date.now();
  if (now - lastUpdate > CACHE_DURATION) {
    fetchLabels();
    lastUpdate = now;
  }
  await next();
}

const router = new Hono()
  .get(
    '/one',
    updateCacheIfStale,
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
  )
  .post(
    '/many',
    updateCacheIfStale,
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
      const labels = getLabelsByAddressList(chainId, addresses as Address[]);
      return c.json(labels);
    },
  )
  .get(
    '/search',
    updateCacheIfStale,
    zValidator(
      'query',
      z.object({
        query: z.string(),
        chain: chainSchema,
      }),
    ),
    async (c) => {
      const { query, chain } = c.req.valid('query');
      const chainId = parseChainId(chain);
      const labels = await searchLabels(chainId, query);
      return c.json(labels);
    },
  );

export default router;
