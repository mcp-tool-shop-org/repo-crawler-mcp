#!/usr/bin/env node
import { startServer } from './server.js';

process.on('uncaughtException', (error) => {
  console.error('[repo-crawler-mcp] Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('[repo-crawler-mcp] Unhandled rejection:', reason);
  process.exit(1);
});

startServer().catch((error) => {
  console.error('[repo-crawler-mcp] Fatal error:', error);
  process.exit(1);
});
