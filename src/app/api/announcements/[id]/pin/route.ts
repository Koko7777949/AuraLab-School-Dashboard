import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// PUT /api/announcements/[id]/pin — Toggle pinned status
export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.announcement.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'الإعلان غير موجود' },
        { status: 404 }
      );
    }

    const announcement = await db.announcement.update({
      where: { id },
      data: {
        pinned: !existing.pinned,
      },
    });

    return NextResponse.json({
      success: true,
      data: announcement,
      message: announcement.pinned ? 'تم تثبيت الإعلان' : 'تم إلغاء تثبيت الإعلان',
    });
  } catch (error) {
    console.error('Error toggling pin:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء تحديث حالة التثبيت' },
      { status: 500 }
    );
  }
}
