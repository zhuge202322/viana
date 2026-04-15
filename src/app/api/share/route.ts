import { NextResponse } from 'next/server';
// 模拟内存数据库，在 Vercel Serverless 环境下可以保持短期的状态
// 注意：每次 Vercel 实例重启（休眠后唤醒或重新部署）后，这个内存数据都会清空。
// 如果需要永久保存，必须使用真实的数据库（如 MongoDB, Supabase, Vercel Postgres）和对象存储（如 Vercel Blob, AWS S3）。
let mockGalleryData: any[] = [];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { imageBase64, items, targetLength, price } = body;

    if (!imageBase64 || !items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    // Check size (limit to ~5MB)
    if (imageBase64.length > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image too large (max 5MB)' }, { status: 400 });
    }

    const id = Date.now().toString() + Math.random().toString(36).substring(2, 8);

    // 在 Vercel 环境中，我们直接把 Base64 字符串作为图片 URL 存入内存数组中，
    // 这样前端就可以直接渲染这张 Base64 图片，而不需要真正写入磁盘。
    const newEntry = {
      id,
      imageUrl: imageBase64,
      items,
      targetLength,
      price,
      createdAt: new Date().toISOString()
    };

    mockGalleryData.unshift(newEntry); // Add to top

    return NextResponse.json({ success: true, data: newEntry });
  } catch (error) {
    console.error('Share error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    return NextResponse.json(mockGalleryData);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch gallery' }, { status: 500 });
  }
}
