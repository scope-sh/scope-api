import { Hono } from 'hono';

import { label } from '@/routes/index.js';

const app = new Hono();

app.route('/label', label);

export default app;
