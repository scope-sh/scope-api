import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { evm, label } from '@/routes/index.js';

const app = new Hono();

app.use(cors());

const routes = app
  .get('/', (c) => {
    return c.text('OK');
  })
  .route('/label', label)
  .route('/evm', evm);

export default app;
export type AppType = typeof routes;
