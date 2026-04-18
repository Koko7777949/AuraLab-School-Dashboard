import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/classes/[id] — Get single class
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const cls = await db.class.findUnique({
      where: { id },
      include: {
        teachers: { include: { teacher: true } },
        students: {
          orderBy: { name: 'asc' },
        },
        sessions: {
          include: { teacher: { select: { id: true, name: true } } },
          orderBy: { date: 'desc' },
        },
        _count: { select: { students: true, sessions: true } },
      },
    });

    if (!cls) {
      return NextResponse.json(
        { success: false, message: 'الفصل غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: cls });
  } catch (error) {
    console.error('Error fetching class:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء جلب بيانات الفصل' },
      { status: 500 }
    );
  }
}

// PUT /api/classes/[id] — Update class
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, grade, room, notes } = body;

    const existing = await db.class.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'الفصل غير موجود' },
        { status: 404 }
      );
    }

    const cls = await db.class.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(grade !== undefined && { grade }),
        ...(room !== undefined && { room }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        teachers: { include: { teacher: true } },
        _count: { select: { students: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: cls,
      message: 'تم تحديث بيانات الفصل بنجاح',
    });
  } catch (error) {
    console.error('Error updating class:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء تحديث بيانات الفصل' },
      { status: 500 }
    );
  }
}

// DELETE /api/classes/[id] — Soft-delete class (move to trash)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const cls = await db.class.findUnique({
      where: { id },
      include: {
        teachers: { include: { teacher: true } },
        _count: { select: { students: true } },
      },
    });

    if (!cls) {
      return NextResponse.json(
        { success: false, message: 'الفصل غير موجود' },
        { status: 404 }
      );
    }

    // Create trash item before deleting
    await db.trashItem.create({
      data: {
        itemType: 'class',
        itemId: cls.id,
        itemName: cls.name,
        dataJson: JSON.stringify(cls),
      },
    });

    // Unlink students from this class
    await db.student.updateMany({
      where: { classId: id },
      data: { classId: null },
    });

    await db.class.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: 'تم حذف الفصل ونقله إلى سلة المحذوفات',
    });
  } catch (error) {
    console.error('Error deleting class:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء حذف الفصل' },
      { status: 500 }
    );
  }
}
