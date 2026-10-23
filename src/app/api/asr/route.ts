import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio');

    if (!audioFile || !(audioFile instanceof File)) {
      return NextResponse.json(
        { error: 'ملف الصوت مطلوب' },
        { status: 400 }
      );
    }

    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(new Uint8Array(arrayBuffer));
    const base64Audio = buffer.toString('base64');

    const zai = await ZAI.create();

    const response = await zai.audio.asr.create({
      file_base64: base64Audio,
    });

    if (!response.text || response.text.trim().length === 0) {
      return NextResponse.json(
        { transcript: '', error: 'لم يتم التعرف على كلام' },
        { status: 200 }
      );
    }

    return NextResponse.json({ transcript: response.text });
  } catch (error) {
    console.error('ASR API error:', error);
    return NextResponse.json(
      { error: 'فشل في التعرف على الصوت' },
      { status: 500 }
    );
  }
}
