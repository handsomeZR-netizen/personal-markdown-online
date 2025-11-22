/**
 * Health Check API Endpoint
 * 
 * Simple endpoint to verify server connectivity.
 * Used by NetworkStatusManager to check real network status.
 */

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ status: 'ok' }, { status: 200 });
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
