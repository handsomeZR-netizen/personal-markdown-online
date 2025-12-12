import { Server } from '@hocuspocus/server';
import { Database } from '@hocuspocus/extension-database';
import { Logger } from '@hocuspocus/extension-logger';
import * as Y from 'yjs';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

/**
 * Hocuspocus WebSocket Server Configuration
 * Handles real-time collaboration with Y.js CRDT
 */
interface HocuspocusConfig {
  port: number;
  host: string;
  secret: string;
  allowedOrigins: string[];
  storeDebounceMs: number;
}

/**
 * Create and configure the Hocuspocus server
 */
export function createHocuspocusServer(config: HocuspocusConfig) {
  // Debounce document stores to reduce Neon write pressure
  const pendingStores = new Map<string, { timer: NodeJS.Timeout | null; state: Uint8Array }>();

  const flushStore = async (documentName: string) => {
    const pending = pendingStores.get(documentName);
    if (!pending) return;
    pendingStores.delete(documentName);

    try {
      const base64State = Buffer.from(pending.state).toString('base64');
      await prisma.note.update({
        where: { id: documentName },
        data: {
          content: base64State,
          contentType: 'yjs-binary',
          updatedAt: new Date(),
        },
      });
      console.log(`[store] saved room=${documentName} size=${pending.state.length}b`);
    } catch (error) {
      console.error('Error storing document:', error);
      throw error;
    }
  };

  const server = new Server({
    port: config.port,
    address: config.host,

    async onAuthenticate({ token, documentName, request }) {
      if (!token) {
        throw new Error('No token provided');
      }

      const origin = request?.headers?.origin;
      if (!isOriginAllowed(origin, config.allowedOrigins)) {
        throw new Error(`Origin not allowed: ${origin ?? 'unknown'}`);
      }

      try {
        const payload = await verifyToken(token, config.secret);
        const noteId = documentName;
        const { hasAccess, canEdit } = await checkNoteAccess(payload.userId, noteId);

        if (!hasAccess) {
          throw new Error('Access denied to this note');
        }

        // For real-time collaboration, user must have edit permission
        // Read-only users (public viewers, viewer collaborators) should not connect via WebSocket
        if (!canEdit) {
          throw new Error('Read-only access: real-time collaboration requires edit permission');
        }

        console.log(
          `[auth] ok room=${noteId} user=${hashIdentifier(payload.userId)} canEdit=${canEdit} origin=${origin ?? '-'}`,
        );

        return {
          user: {
            id: payload.userId,
            name: payload.name,
            email: payload.email,
            canEdit,
          },
        };
      } catch (error) {
        console.error('Authentication failed:', error);
        throw new Error('Authentication failed');
      }
    },

    extensions: [
      new Logger(),
      new Database({
        fetch: async ({ documentName }) => {
          try {
            const note = await prisma.note.findUnique({
              where: { id: documentName },
              select: { content: true, contentType: true },
            });

            if (!note) {
              return null;
            }

            if (note.contentType === 'yjs-binary') {
              return Buffer.from(note.content, 'base64');
            }

            const ydoc = new Y.Doc();
            const ytext = ydoc.getText('content');

            if (note.content) {
              try {
                const jsonContent = JSON.parse(note.content);
                const plainText = extractTextFromTiptap(jsonContent);
                ytext.insert(0, plainText);
              } catch {
                ytext.insert(0, note.content);
              }
            }

            return Y.encodeStateAsUpdate(ydoc);
          } catch (error) {
            console.error('Error fetching document:', error);
            return null;
          }
        },

        store: async ({ documentName, state }) => {
          const existing = pendingStores.get(documentName);
          if (existing?.timer) {
            clearTimeout(existing.timer);
          }

          const timer = setTimeout(() => flushStore(documentName), config.storeDebounceMs);
          pendingStores.set(documentName, { timer, state });
        },
      }),
    ],

    async onConnect({ documentName, context, request }) {
      const origin = request?.headers?.origin ?? '-';
      console.log(
        `[connect] room=${documentName} origin=${origin} user=${hashContextUser(context)}`,
      );
    },

    async onDisconnect({ documentName, context }) {
      console.log(`[disconnect] room=${documentName} user=${hashContextUser(context)}`);
    },

    async onLoadDocument({ documentName }) {
      console.log(`[load] room=${documentName}`);
    },

    async onStoreDocument({ documentName }) {
      console.log(`[store-hook] room=${documentName}`);
    },

    async onChange({ documentName }) {
      console.log(`[change] room=${documentName}`);
    },
  });

  return server;
}

/**
 * Verify JWT token with HMAC-SHA256 signature
 */
async function verifyToken(token: string, secret: string): Promise<{
  userId: string;
  name: string;
  email: string;
}> {
  const [headerB64, payloadB64, signature] = token.split('.');
  if (!headerB64 || !payloadB64 || !signature) {
    throw new Error('Malformed token');
  }

  const data = `${headerB64}.${payloadB64}`;
  const expected = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  if (expected !== signature) {
    throw new Error('Invalid signature');
  }

  const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
  if (payload.exp && Date.now() / 1000 > payload.exp) {
    throw new Error('Token expired');
  }

  return {
    userId: payload.sub || payload.userId,
    name: payload.name || '',
    email: payload.email || '',
  };
}

/**
 * Check if user has access to a note and determine permission level
 * Returns: { hasAccess: boolean, canEdit: boolean }
 */
async function checkNoteAccess(
  userId: string,
  noteId: string,
): Promise<{ hasAccess: boolean; canEdit: boolean }> {
  try {
    const note = await prisma.note.findUnique({
      where: { id: noteId },
      select: {
        userId: true,
        ownerId: true,
        isPublic: true,
        Collaborator: {
          where: { userId },
          select: { role: true },
        },
      },
    });

    if (!note) {
      return { hasAccess: false, canEdit: false };
    }

    // Owner or creator has full access
    if (note.userId === userId || note.ownerId === userId) {
      return { hasAccess: true, canEdit: true };
    }

    // Check collaborator role
    const collaborator = note.Collaborator[0];
    if (collaborator) {
      return {
        hasAccess: true,
        canEdit: collaborator.role === 'editor',
      };
    }

    // Public notes: read-only access (no WebSocket editing for public viewers)
    // Public viewers should use the read-only public page, not real-time collaboration
    if (note.isPublic) {
      return { hasAccess: true, canEdit: false };
    }

    return { hasAccess: false, canEdit: false };
  } catch (error) {
    console.error('Error checking note access:', error);
    return { hasAccess: false, canEdit: false };
  }
}

/**
 * Extract plain text from Tiptap JSON content
 */
function extractTextFromTiptap(content: any): string {
  if (!content || !content.content) {
    return '';
  }

  let text = '';

  function traverse(node: any) {
    if (node.type === 'text') {
      text += node.text || '';
    }

    if (node.content && Array.isArray(node.content)) {
      node.content.forEach(traverse);
    }

    if (node.type === 'paragraph' || node.type === 'heading') {
      text += '\n';
    }
  }

  traverse(content);

  return text.trim();
}

/**
 * Start the Hocuspocus server
 */
export async function startHocuspocusServer() {
  const port = parseInt(process.env.COLLAB_SERVER_PORT || '1234', 10);
  const host = process.env.COLLAB_SERVER_HOST || '0.0.0.0';
  const secret = process.env.COLLAB_SERVER_SECRET || process.env.AUTH_SECRET || 'default-secret';
  const allowedOrigins = process.env.COLLAB_ALLOWED_ORIGINS
    ? process.env.COLLAB_ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : [];
  const storeDebounceMs = parseInt(process.env.COLLAB_STORE_DEBOUNCE_MS || '750', 10);

  const server = createHocuspocusServer({
    port,
    host,
    secret,
    allowedOrigins,
    storeDebounceMs,
  });

  await server.listen();

  console.log(
    `Hocuspocus server running on ws://${host}:${port} | origins: ${
      allowedOrigins.length ? allowedOrigins.join(',') : 'any'
    } | debounce=${storeDebounceMs}ms`,
  );

  return server;
}

function isOriginAllowed(origin: string | undefined, allowedOrigins: string[]) {
  if (!allowedOrigins.length) return true;
  if (!origin) return false;
  return allowedOrigins.some((allowed) => origin.startsWith(allowed));
}

function hashIdentifier(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex').slice(0, 8);
}

function hashContextUser(context: any): string {
  const id = context?.user?.id || context?.user?.sub || context?.userId || 'anonymous';
  return hashIdentifier(String(id));
}
