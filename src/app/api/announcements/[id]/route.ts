import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/announcements/[id] — Get single announcement
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const announcement = await db.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      return NextResponse.json(
        { success: false, message: 'الإعلان غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: announcement,
    });
  } catch (error) {
    console.error('Error fetching announcement:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء جلب الإعلان' },
      { status: 500 }
    );
  }
}

// PUT /api/announcements/[id] — Update announcement
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, content, category, priority, author, pinned, expiresAt } = body;

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
        ...(title !== undefined ? { title: title.trim() } : {}),
        ...(content !== undefined ? { content: content.trim() } : {}),
        ...(category !== undefined ? { category } : {}),
        ...(priority !== undefined ? { priority } : {}),
        ...(author !== undefined ? { author } : {}),
        ...(pinned !== undefined ? { pinned: !!pinned } : {}),
        ...(expiresAt !== undefined
          ? { expiresAt: expiresAt ? new Date(expiresAt) : null }
          : {}),
      },
    });

    return NextResponse.json({
      success: true,
      data: announcement,
      message: 'تم تحديث الإعلان بنجاح',
    });
  } catch (error) {
    console.error('Error updating announcement:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء تحديث الإعلان' },
      { status: 500 }
    );
  }
}

// DELETE /api/announcements/[id] — Delete announcement
export async function DELETE(
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

    await db.announcement.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'تم حذف الإعلان بنجاح',
    });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء حذف الإعلان' },
      { status: 500 }
    );
  }
}
