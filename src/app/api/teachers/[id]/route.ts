import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/teachers/[id] — Get single teacher
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const teacher = await db.teacher.findUnique({
      where: { id },
      include: {
        classes: { include: { class: true } },
        exams: {
          include: { student: { select: { id: true, name: true } } },
          orderBy: { date: 'desc' },
        },
        sessions: {
          include: { class: true },
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!teacher) {
      return NextResponse.json(
        { success: false, message: 'المعلم غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: teacher });
  } catch (error) {
    console.error('Error fetching teacher:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء جلب بيانات المعلم' },
      { status: 500 }
    );
  }
}

// PUT /api/teachers/[id] — Update teacher
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, subject, status, permissions, avatar, email, phone } = body;

    const existing = await db.teacher.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'المعلم غير موجود' },
        { status: 404 }
      );
    }

    const teacher = await db.teacher.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(subject !== undefined && { subject }),
        ...(status !== undefined && { status }),
        ...(permissions !== undefined && { permissions }),
        ...(avatar !== undefined && { avatar }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
      },
      include: {
        classes: { include: { class: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: teacher,
      message: 'تم تحديث بيانات المعلم بنجاح',
    });
  } catch (error) {
    console.error('Error updating teacher:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء تحديث بيانات المعلم' },
      { status: 500 }
    );
  }
}

// DELETE /api/teachers/[id] — Soft-delete teacher (move to trash)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const teacher = await db.teacher.findUnique({
      where: { id },
      include: { classes: { include: { class: true } } },
    });

    if (!teacher) {
      return NextResponse.json(
        { success: false, message: 'المعلم غير موجود' },
        { status: 404 }
      );
    }

    // Create trash item before deleting
    await db.trashItem.create({
      data: {
        itemType: 'teacher',
        itemId: teacher.id,
        itemName: teacher.name,
        dataJson: JSON.stringify(teacher),
      },
    });

    await db.teacher.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: 'تم حذف المعلم ونقله إلى سلة المحذوفات',
    });
  } catch (error) {
    console.error('Error deleting teacher:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء حذف المعلم' },
      { status: 500 }
    );
  }
}
