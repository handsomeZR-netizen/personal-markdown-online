import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function POST(request: NextRequest) {
  try {
    // Security: Require authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '未授权' },
        { status: 401 }
      );
    }

    const { apiKey, apiUrl, model } = await request.json();

    if (!apiKey || !apiUrl || !model) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // Security: Validate apiUrl to prevent SSRF attacks
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(apiUrl);
    } catch {
      return NextResponse.json(
        { success: false, error: '无效的 API URL' },
        { status: 400 }
      );
    }

    // Only allow HTTPS URLs (except localhost for development)
    const isLocalhost = parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1';
    if (!isLocalhost && parsedUrl.protocol !== 'https:') {
      return NextResponse.json(
        { success: false, error: 'API URL 必须使用 HTTPS' },
        { status: 400 }
      );
    }

    // Block internal/private IP ranges
    const blockedPatterns = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^169\.254\./,
      /^0\./,
    ];
    if (!isLocalhost && blockedPatterns.some(pattern => pattern.test(parsedUrl.hostname))) {
      return NextResponse.json(
        { success: false, error: '不允许访问内部网络地址' },
        { status: 400 }
      );
    }

    // 测试API连接
    const response = await fetch(`${parsedUrl.origin}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 5,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json({
        success: false,
        error: error.error?.message || `API请求失败: ${response.status}`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '网络错误',
    });
  }
}
