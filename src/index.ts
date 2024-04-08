import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { label } from '@/routes/index.js';

const app = new Hono();

app.use(cors());
app.get('/', (c) => {
  return c.text('OK');
});
app.route('/label', label);

export default app;
