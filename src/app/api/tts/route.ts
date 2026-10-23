import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const { text, voice = 'tongtong', speed = 1.0 } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'النص مطلوب' },
        { status: 400 }
      );
    }

    // TTS API has a 1024 character limit; split if needed
    const trimmed = text.trim().slice(0, 1024);

    const zai = await ZAI.create();

    const response = await zai.audio.tts.create({
      input: trimmed,
      voice: voice as 'tongtong',
      speed: Math.max(0.5, Math.min(2.0, speed)),
      response_format: 'mp3',
      stream: false,
    });

    // Get array buffer from the Response object
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(new Uint8Array(arrayBuffer));

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('TTS API error:', error);
    return NextResponse.json(
      { error: 'فشل في إنشاء الصوت' },
      { status: 500 }
    );
  }
}
