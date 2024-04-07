import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { Address } from 'viem';
import { z } from 'zod';

import { ChainId, chainSchema, parseChainId } from '@/utils/chains.js';

interface Label {}

const app = new Hono();

const labelRegistry: Partial<Record<ChainId, Record<Address, Label>>> = {};

app.get('/', (c) => {
  return c.text('OK');
});

app.get(
  '/label',
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
    const label = await getLabelByAddress(chainId, address as Address);
    return c.json(label);
  },
);

async function getLabelByAddress(
  chain: ChainId,
  address: Address,
): Promise<Label | null> {
  const chainRegistry = labelRegistry[chain];
  if (!chainRegistry) {
    return null;
  }
  return chainRegistry[address] || null;
}

export default app;
