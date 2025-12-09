/**
 * API endpoint for image upload
 * Handles image uploads to Supabase Storage
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { ImageUploadManager } from '@/lib/storage/image-upload';
import { supabaseBrowser } from '@/lib/supabase-browser';
import { storageQuotaManager } from '@/lib/storage/storage-quota-manager';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
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

    // Upload image
    const uploadManager = new ImageUploadManager(supabaseBrowser);
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
    const session = await getServerSession(authOptions);
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

    // Upload images
    const uploadManager = new ImageUploadManager(supabaseBrowser);
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
