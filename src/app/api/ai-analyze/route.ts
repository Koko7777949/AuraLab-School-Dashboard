import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const prompt = (formData.get('prompt') as string) || 'حلل هذا المستند بالتفصيل';
    const fileType = (formData.get('fileType') as string) || '';

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'الملف مطلوب' },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();

    // Check if it's an image file
    const isImage = /^image\/(jpeg|png|webp|gif|bmp)$/i.test(file.type) ||
      /\.(jpe?g|png|webp|gif|bmp)$/i.test(fileType);

    if (isImage) {
      // Use VLM for image analysis
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(new Uint8Array(arrayBuffer));
      const base64Image = buffer.toString('base64');
      const mimeType = file.type || 'image/jpeg';

      const systemPrompt = `أنت المساعد الذكي لنظام AuraLab لإدارة المدارس. أنت تحلل مستندات وصور مدرسية.
أجب باللغة العربية دائماً. كن مهنياً ومفيداً. قدم إجابات منظمة ومحددة.`;

      const completion = await zai.chat.completions.createVision({
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: `${systemPrompt}\n\n${prompt}` },
              {
                type: 'image_url',
                image_url: { url: `data:${mimeType};base64,${base64Image}` },
              },
            ],
          },
        ],
        thinking: { type: 'disabled' },
      } as Parameters<typeof zai.chat.completions.createVision>[0]);

      const analysis = completion.choices[0]?.message?.content;

      if (!analysis) {
        return NextResponse.json({
          response: 'عذراً، لم أتمكن من تحليل الصورة. يرجى المحاولة مرة أخرى.',
        });
      }

      return NextResponse.json({ response: analysis });
    }

    // For PDFs and other documents — extract text and send to LLM
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(new Uint8Array(arrayBuffer));
    const base64File = buffer.toString('base64');

    // Use VLM with file_url for PDF documents
    const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(fileType);

    if (isPdf) {
      const systemPrompt = `أنت المساعد الذكي لنظام AuraLab لإدارة المدارس. أنت تحلل مستندات مدرسية.
أجب باللغة العربية دائماً. كن مهنياً ومفيداً. قدم إجابات منظمة ومحددة.`;

      const completion = await zai.chat.completions.createVision({
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: `${systemPrompt}\n\n${prompt}` },
              {
                type: 'file_url',
                file_url: { url: `data:application/pdf;base64,${base64File}` },
              },
            ],
          },
        ],
        thinking: { type: 'disabled' },
      } as Parameters<typeof zai.chat.completions.createVision>[0]);

      const analysis = completion.choices[0]?.message?.content;

      if (!analysis) {
        return NextResponse.json({
          response: 'عذراً، لم أتمكن من تحليل المستند. يرجى المحاولة مرة أخرى.',
        });
      }

      return NextResponse.json({ response: analysis });
    }

    // Fallback: try to read as text
    const textContent = buffer.toString('utf-8');
    const systemPrompt = `أنت المساعد الذكي لنظام AuraLab لإدارة المدارس. أنت تحلل مستندات مدرسية.
أجب باللغة العربية دائماً. كن مهنياً ومفيداً. قدم إجابات منظمة ومحددة.`;

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `${prompt}\n\nمحتوى الملف:\n${textContent.slice(0, 8000)}` },
      ],
      thinking: { type: 'disabled' },
    });

    const analysis = completion.choices[0]?.message?.content;

    if (!analysis) {
      return NextResponse.json({
        response: 'عذراً، لم أتمكن من تحليل المستند. يرجى المحاولة مرة أخرى.',
      });
    }

    return NextResponse.json({ response: analysis });
  } catch (error) {
    console.error('AI Analyze error:', error);
    return NextResponse.json(
      { error: 'فشل في تحليل الملف' },
      { status: 500 }
    );
  }
}
