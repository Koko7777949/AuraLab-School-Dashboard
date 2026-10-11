import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/announcements — List all announcements (pinned first, then createdAt desc)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const category = searchParams.get('category') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const where: Record<string, unknown> = {};

    if (category) {
      where.category = category;
    }

    const [announcements, total] = await Promise.all([
      db.announcement.findMany({
        where,
        orderBy: [
          { pinned: 'desc' },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.announcement.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: announcements,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء جلب الإعلانات' },
      { status: 500 }
    );
  }
}

// POST /api/announcements — Create new announcement
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, category, priority, author, pinned, expiresAt } = body;

    if (!title || !content) {
      return NextResponse.json(
        { success: false, message: 'عنوان الإعلان والمحتوى مطلوبان' },
        { status: 400 }
      );
    }

    const announcement = await db.announcement.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        category: category || 'general',
        priority: priority || 'normal',
        author: author || 'المدير',
        pinned: pinned === true,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    return NextResponse.json(
      { success: true, data: announcement, message: 'تم إنشاء الإعلان بنجاح' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating announcement:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء إنشاء الإعلان' },
      { status: 500 }
    );
  }
}
