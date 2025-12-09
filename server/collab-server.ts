#!/usr/bin/env node

/**
 * Standalone Hocuspocus WebSocket Server
 * Run with: npx tsx server/collab-server.ts
 */

import { startHocuspocusServer } from '../src/lib/collaboration/hocuspocus-server';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function main() {
  try {
    console.log('Starting Hocuspocus collaboration server...');
    await startHocuspocusServer();
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();
