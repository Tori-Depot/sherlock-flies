import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { analyzeWorkflow } from './analyzer.js';

const app = new Hono();

app.use('/*', cors());

app.post('/api/analyze', async (c) => {
  try {
    const body = await c.req.json<{ yaml: string }>();
    if (!body.yaml || typeof body.yaml !== 'string') {
      return c.json({ error: 'Missing "yaml" field in request body' }, 400);
    }
    const report = analyzeWorkflow(body.yaml);
    return c.json(report);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return c.json({ error: message }, 400);
  }
});

app.get('/health', (c) => c.json({ status: 'ok' }));

const port = parseInt(process.env.PORT ?? '3001', 10);
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`API server running on http://localhost:${info.port}`);
});
