import { buildApp } from './app.js';

const port = Number(process.env.PORT) || 3001;
const host = process.env.HOST || '127.0.0.1';

async function start() {
  const app = await buildApp();
  try {
    await app.listen({ port, host });
    app.log.info(`ResolveAI Backend running at http://${host}:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
