import { vValidator } from '@hono/valibot-validator';
import { Context, Hono, Next } from 'hono';
import * as v from 'valibot';
import { Address } from 'viem';

import { chainSchema, parseChainId } from '@/utils/chains';

import {
  getAllAddressLabels,
  getPrimaryAddressLabels,
  searchLabels,
  fetchLabels,
} from './controller';

const env = process.env.NODE_ENV;

const CACHE_DURATION = 1000 * 60 * 60 * 24;
let lastUpdate = Date.now();

if (env === 'production') {
  await fetchLabels();
}

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
    '/all',
    updateCacheIfStale,
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
      const labels = await getAllAddressLabels(chainId, address as Address);
      return c.json(labels);
    },
  )
  .post(
    '/primary',
    updateCacheIfStale,
    vValidator(
      'query',
      v.object({
        chain: chainSchema,
      }),
    ),
    vValidator(
      'json',
      v.object({
        addresses: v.array(v.string()),
      }),
    ),
    async (c) => {
      const { chain } = c.req.valid('query');
      const { addresses } = c.req.valid('json');
      const chainId = parseChainId(chain);
      const labels = await getPrimaryAddressLabels(
        chainId,
        addresses as Address[],
      );
      return c.json(labels);
    },
  )
  .get(
    '/search',
    updateCacheIfStale,
    vValidator(
      'query',
      v.object({
        query: v.string(),
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
