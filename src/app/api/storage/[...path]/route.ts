/**
 * Local Storage API Route
 * Serves files from local storage when in local mode
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStorageAdapter } from '@/lib/storage/storage-adapter';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const filePath = path.join('/');
    
    if (!filePath) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      );
    }

    // Security: Prevent path traversal attacks
    if (filePath.includes('..') || filePath.includes('\\') || filePath.startsWith('/')) {
      return NextResponse.json(
        { error: 'Invalid file path' },
        { status: 400 }
      );
    }

    // Security: Only allow image file extensions
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    const ext = filePath.split('.').pop()?.toLowerCase();
    if (!ext || !allowedExtensions.includes(ext)) {
      return NextResponse.json(
        { error: 'Invalid file type' },
        { status: 400 }
      );
    }

    const storageAdapter = getStorageAdapter();
    
    // Download the file
    const blob = await storageAdapter.download(filePath);
    
    // Determine content type from file extension (ext already validated above)
    const contentTypeMap: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
    };
    
    const contentType = contentTypeMap[ext] || 'application/octet-stream';
    
    // Return the file
    return new NextResponse(blob, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return NextResponse.json(
      { error: 'File not found' },
      { status: 404 }
    );
  }
}
