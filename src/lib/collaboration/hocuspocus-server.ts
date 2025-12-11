import { Server } from '@hocuspocus/server';
import { Database } from '@hocuspocus/extension-database';
import { Logger } from '@hocuspocus/extension-logger';
import * as Y from 'yjs';
import { prisma } from '@/lib/prisma';

/**
 * Hocuspocus WebSocket Server Configuration
 * Handles real-time collaboration with Y.js CRDT
 */

interface HocuspocusConfig {
  port: number;
  secret: string;
}

/**
 * Create and configure the Hocuspocus server
 */
export function createHocuspocusServer(config: HocuspocusConfig) {
  const server = new Server({
    port: config.port,
    
    // JWT Authentication
    async onAuthenticate({ token, documentName }) {
      if (!token) {
        throw new Error('No token provided');
      }

      try {
        // Verify JWT token
        const payload = await verifyToken(token, config.secret);
        
        // Extract noteId from documentName
        const noteId = documentName;
        
        // Check if user has access to this note
        const hasAccess = await checkNoteAccess(payload.userId, noteId);
        
        if (!hasAccess) {
          throw new Error('Access denied to this note');
        }

        return {
          user: {
            id: payload.userId,
            name: payload.name,
            email: payload.email,
          },
        };
      } catch (error) {
        console.error('Authentication failed:', error);
        throw new Error('Authentication failed');
      }
    },

    // Document persistence
    extensions: [
      new Logger(),
      new Database({
        // Fetch document from database
        fetch: async ({ documentName }) => {
          try {
            const note = await prisma.note.findUnique({
              where: { id: documentName },
              select: { content: true, contentType: true },
            });

            if (!note) {
              return null;
            }

            // If content is already Y.js binary, return it
            if (note.contentType === 'yjs-binary') {
              return Buffer.from(note.content, 'base64');
            }

            // Otherwise, create new Y.Doc from JSON content
            const ydoc = new Y.Doc();
            const ytext = ydoc.getText('content');
            
            if (note.content) {
              try {
                const jsonContent = JSON.parse(note.content);
                // Convert Tiptap JSON to plain text for initial Y.js state
                const plainText = extractTextFromTiptap(jsonContent);
                ytext.insert(0, plainText);
              } catch {
                // If not JSON, treat as plain text
                ytext.insert(0, note.content);
              }
            }

            return Y.encodeStateAsUpdate(ydoc);
          } catch (error) {
            console.error('Error fetching document:', error);
            return null;
          }
        },

        // Store document to database
        store: async ({ documentName, state }) => {
          try {
            // Convert Y.js state to base64 for storage
            const base64State = Buffer.from(state).toString('base64');

            await prisma.note.update({
              where: { id: documentName },
              data: {
                content: base64State,
                contentType: 'yjs-binary',
                updatedAt: new Date(),
              },
            });
          } catch (error) {
            console.error('Error storing document:', error);
            throw error;
          }
        },
      }),
    ],

    // Connection lifecycle hooks
    async onConnect({ documentName, context }) {
      console.log(`Client connected to document: ${documentName}`);
    },

    async onDisconnect({ documentName, context }) {
      console.log(`Client disconnected from document: ${documentName}`);
    },

    async onLoadDocument({ documentName }) {
      console.log(`Document loaded: ${documentName}`);
    },

    async onStoreDocument({ documentName }) {
      console.log(`Document stored: ${documentName}`);
    },

    async onChange({ documentName }) {
      console.log(`Document changed: ${documentName}`);
    },
  });

  return server;
}

/**
 * Verify JWT token
 */
async function verifyToken(token: string, secret: string): Promise<{
  userId: string;
  name: string;
  email: string;
}> {
  // Simple JWT verification (in production, use a proper JWT library)
  try {
    const [, payloadBase64] = token.split('.');
    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString());
    
    // Verify signature would go here in production
    
    return {
      userId: payload.sub || payload.userId,
      name: payload.name || '',
      email: payload.email || '',
    };
  } catch (error) {
    throw new Error('Invalid token format');
  }
}

/**
 * Check if user has access to a note
 */
async function checkNoteAccess(userId: string, noteId: string): Promise<boolean> {
  try {
    const note = await prisma.note.findFirst({
      where: {
        id: noteId,
        OR: [
          { userId: userId }, // User is creator
          { ownerId: userId }, // User is owner
          {
            Collaborator: {
              some: {
                userId: userId,
              },
            },
          }, // User is collaborator
          { isPublic: true }, // Note is public
        ],
      },
    });

    return note !== null;
  } catch (error) {
    console.error('Error checking note access:', error);
    return false;
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
    
    // Add newlines for block elements
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
  const secret = process.env.COLLAB_SERVER_SECRET || process.env.AUTH_SECRET || 'default-secret';

  const server = createHocuspocusServer({ port, secret });

  await server.listen();

  console.log(`🚀 Hocuspocus server running on ws://localhost:${port}`);

  return server;
}
