/**
 * API endpoint for image upload
 * Handles image uploads using the storage abstraction layer
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { ImageUploadManager } from '@/lib/storage/image-upload';
import { getStorageAdapter } from '@/lib/storage/storage-adapter';
import { storageQuotaManager } from '@/lib/storage/storage-quota-manager';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '未授权' },
        { status: 401 }
      );
    }

    // Check storage quota before upload
    const isQuotaExceeded = await storageQuotaManager.isQuotaExceeded(session.user.id);
    if (isQuotaExceeded) {
      return NextResponse.json(
        { error: '存储空间已满，无法上传新文件' },
        { status: 413 } // Payload Too Large
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const noteId = formData.get('noteId') as string;

    if (!file) {
      return NextResponse.json(
        { error: '未提供文件' },
        { status: 400 }
      );
    }

    if (!noteId) {
      return NextResponse.json(
        { error: '未提供笔记ID' },
        { status: 400 }
      );
    }

    // Upload image using storage adapter
    const storageAdapter = getStorageAdapter();
    const uploadManager = new ImageUploadManager(storageAdapter);
    const result = await uploadManager.uploadImage(file, noteId);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Image upload error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: '上传图片时发生未知错误' },
      { status: 500 }
    );
  }
}

// Handle multiple image uploads
export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '未授权' },
        { status: 401 }
      );
    }

    // Check storage quota before upload
    const isQuotaExceeded = await storageQuotaManager.isQuotaExceeded(session.user.id);
    if (isQuotaExceeded) {
      return NextResponse.json(
        { error: '存储空间已满，无法上传新文件' },
        { status: 413 } // Payload Too Large
      );
    }

    // Parse form data
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const noteId = formData.get('noteId') as string;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: '未提供文件' },
        { status: 400 }
      );
    }

    if (!noteId) {
      return NextResponse.json(
        { error: '未提供笔记ID' },
        { status: 400 }
      );
    }

    // Upload images using storage adapter
    const storageAdapter = getStorageAdapter();
    const uploadManager = new ImageUploadManager(storageAdapter);
    const results = await uploadManager.uploadImages(files, noteId);

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Multiple image upload error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: '上传图片时发生未知错误' },
      { status: 500 }
    );
  }
}
