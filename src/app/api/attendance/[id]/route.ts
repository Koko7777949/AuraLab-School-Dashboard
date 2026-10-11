import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/attendance/[id] — Get single attendance record
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const record = await db.attendance.findUnique({
      where: { id },
      include: {
        student: {
          select: { id: true, name: true, studentId: true, classId: true },
        },
      },
    });

    if (!record) {
      return NextResponse.json(
        { success: false, message: 'سجل الحضور غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: record });
  } catch (error) {
    console.error('Error fetching attendance record:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء جلب سجل الحضور' },
      { status: 500 }
    );
  }
}

// PUT /api/attendance/[id] — Update attendance record
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, notes, classId, date } = body;

    const existing = await db.attendance.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'سجل الحضور غير موجود' },
        { status: 404 }
      );
    }

    if (status && !['present', 'absent', 'late', 'excused'].includes(status)) {
      return NextResponse.json(
        { success: false, message: 'حالة الحضور غير صالحة' },
        { status: 400 }
      );
    }

    const record = await db.attendance.update({
      where: { id },
      data: {
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes }),
        ...(classId !== undefined && { classId: classId || null }),
        ...(date !== undefined && { date: new Date(date) }),
      },
      include: {
        student: {
          select: { id: true, name: true, studentId: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: record,
      message: 'تم تحديث سجل الحضور بنجاح',
    });
  } catch (error) {
    console.error('Error updating attendance record:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء تحديث سجل الحضور' },
      { status: 500 }
    );
  }
}

// DELETE /api/attendance/[id] — Delete attendance record
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const record = await db.attendance.findUnique({ where: { id } });
    if (!record) {
      return NextResponse.json(
        { success: false, message: 'سجل الحضور غير موجود' },
        { status: 404 }
      );
    }

    await db.attendance.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: 'تم حذف سجل الحضور بنجاح',
    });
  } catch (error) {
    console.error('Error deleting attendance record:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء حذف سجل الحضور' },
      { status: 500 }
    );
  }
}
