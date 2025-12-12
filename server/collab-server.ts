#!/usr/bin/env node

/**
 * Standalone Hocuspocus WebSocket Server
 * Run with: npx tsx server/collab-server.ts
 */

import { startHocuspocusServer } from '../src/lib/collaboration/hocuspocus-server';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables (try multiple files for different environments)
// In production (Docker), env vars are passed directly, so this is a fallback
const envFiles = ['.env.local', '.env.production', '.env'];
for (const file of envFiles) {
  dotenv.config({ path: path.resolve(__dirname, '..', file) });
}

async function main() {
  try {
    console.log('Starting Hocuspocus collaboration server...');
    const server = await startHocuspocusServer();

    // Graceful shutdown handling
    const shutdown = async (signal: string) => {
      console.log(`\n[${signal}] Shutting down gracefully...`);
      try {
        // Give pending stores time to flush (debounce + buffer)
        const flushTimeout = parseInt(process.env.COLLAB_STORE_DEBOUNCE_MS || '750', 10) + 500;
        console.log(`Waiting ${flushTimeout}ms for pending stores to flush...`);
        await new Promise((resolve) => setTimeout(resolve, flushTimeout));

        await server.destroy();
        console.log('Server stopped successfully');
        process.exit(0);
      } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();
