import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

function base64Url(input: string) {
  return Buffer.from(input).toString('base64url');
}

function signToken(payload: Record<string, any>, secret: string) {
  const header = { alg: 'HS256', typ: 'JWT', kid: 'collab' };
  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedPayload = base64Url(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${signature}`;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const secret =
    process.env.COLLAB_SERVER_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET;

  if (!secret) {
    return NextResponse.json({ error: 'Missing collab secret' }, { status: 500 });
  }

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: session.user.id,
    userId: session.user.id,
    name: session.user.name || '',
    email: session.user.email || '',
    iat: now,
    exp: now + 60 * 30, // 30 minutes
    iss: 'collab-token',
    aud: 'collab',
  };

  const token = signToken(payload, secret);
  return NextResponse.json({ token });
}
