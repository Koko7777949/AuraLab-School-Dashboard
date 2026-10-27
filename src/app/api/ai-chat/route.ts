import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const { message, history } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'الرسالة مطلوبة' },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();

    const systemPrompt = `أنت المساعد الذكي لنظام AuraLab لإدارة المدارس. أنت تساعد في:
- تحليل أداء الطلاب وتقديم توصيات
- إدارة الفصول والجلسات
- مراقبة الحضور والتفاعل
- تقديم رؤى وتقارير للمدرسين والإدارة
- اقتراح تدخلات تعليمية بناءً على البيانات

أجب باللغة العربية دائماً. كن مهنياً ومفيداً. قدم إجابات منظمة ومحددة.
إذا طُلب منك تحليل، استخدم البيانات المتاحة لتقديم رؤى عملية.`;

    const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [
      { role: 'system', content: systemPrompt },
    ];

    // Add conversation history (last 10 messages for context)
    if (history && Array.isArray(history)) {
      const recentHistory = history.slice(-10);
      for (const msg of recentHistory) {
        messages.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content,
        });
      }
    }

    // Add current message
    messages.push({ role: 'user' as const, content: message });

    const completion = await zai.chat.completions.create({
      messages,
      thinking: { type: 'disabled' },
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      return NextResponse.json({
        response: 'عذراً، لم أتمكن من معالجة طلبك. يرجى المحاولة مرة أخرى.',
      });
    }

    return NextResponse.json({ response });
  } catch (error) {
    console.error('AI Chat error:', error);
    return NextResponse.json(
      {
        response: 'عذراً، حدث خطأ في النظام. يرجى المحاولة مرة أخرى لاحقاً.',
      },
      { status: 500 }
    );
  }
}
