import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { imageBase64, items, targetLength, price } = body;

    if (!imageBase64 || !items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    // Validate base64 image (only allow PNG/JPEG)
    const match = imageBase64.match(/^data:image\/(png|jpeg);base64,(.+)$/);
    if (!match) {
      return NextResponse.json({ error: 'Invalid image format. Only PNG and JPEG are allowed.' }, { status: 400 });
    }

    const extension = match[1];
    const base64Data = match[2];
    
    // Check size (limit to ~5MB)
    if (base64Data.length > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image too large (max 5MB)' }, { status: 400 });
    }

    const buffer = Buffer.from(base64Data, 'base64');
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 8);
    const filename = `${id}.${extension}`;
    
    const galleryDir = path.join(process.cwd(), 'public', 'gallery', 'images');
    if (!fs.existsSync(galleryDir)) {
      fs.mkdirSync(galleryDir, { recursive: true });
    }
    
    fs.writeFileSync(path.join(galleryDir, filename), buffer);

    const dataFile = path.join(process.cwd(), 'public', 'gallery', 'data.json');
    let galleryData = [];
    if (fs.existsSync(dataFile)) {
      const content = fs.readFileSync(dataFile, 'utf-8');
      try {
        galleryData = JSON.parse(content);
      } catch (e) {}
    }

    const newEntry = {
      id,
      imageUrl: `/gallery/images/${filename}`,
      items,
      targetLength,
      price,
      createdAt: new Date().toISOString()
    };

    galleryData.unshift(newEntry); // Add to top
    fs.writeFileSync(dataFile, JSON.stringify(galleryData, null, 2));

    return NextResponse.json({ success: true, data: newEntry });
  } catch (error) {
    console.error('Share error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const dataFile = path.join(process.cwd(), 'public', 'gallery', 'data.json');
    if (!fs.existsSync(dataFile)) {
      return NextResponse.json([]);
    }
    const content = fs.readFileSync(dataFile, 'utf-8');
    return NextResponse.json(JSON.parse(content));
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch gallery' }, { status: 500 });
  }
}
