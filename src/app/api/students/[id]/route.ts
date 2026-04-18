import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/students/[id] — Get single student
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const student = await db.student.findUnique({
      where: { id },
      include: {
        class: true,
        exams: {
          include: { teacher: { select: { id: true, name: true } } },
          orderBy: { date: 'desc' },
        },
        sessions: {
          include: { class: true, teacher: { select: { id: true, name: true } } },
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, message: 'الطالب غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: student });
  } catch (error) {
    console.error('Error fetching student:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء جلب بيانات الطالب' },
      { status: 500 }
    );
  }
}

// PUT /api/students/[id] — Update student
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, studentId, classId, status, notes, psychBackground, avatar } = body;

    const existing = await db.student.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'الطالب غير موجود' },
        { status: 404 }
      );
    }

    // Check studentId uniqueness if changed
    if (studentId && studentId !== existing.studentId) {
      const duplicate = await db.student.findUnique({ where: { studentId } });
      if (duplicate) {
        return NextResponse.json(
          { success: false, message: 'رقم الطالب مسجل مسبقًا' },
          { status: 409 }
        );
      }
    }

    const student = await db.student.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(studentId !== undefined && { studentId }),
        ...(classId !== undefined && { classId: classId || null }),
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes }),
        ...(psychBackground !== undefined && { psychBackground }),
        ...(avatar !== undefined && { avatar }),
      },
      include: { class: true },
    });

    return NextResponse.json({
      success: true,
      data: student,
      message: 'تم تحديث بيانات الطالب بنجاح',
    });
  } catch (error) {
    console.error('Error updating student:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء تحديث بيانات الطالب' },
      { status: 500 }
    );
  }
}

// DELETE /api/students/[id] — Soft-delete student (move to trash)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const student = await db.student.findUnique({
      where: { id },
      include: { class: true },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, message: 'الطالب غير موجود' },
        { status: 404 }
      );
    }

    // Create trash item before deleting
    await db.trashItem.create({
      data: {
        itemType: 'student',
        itemId: student.id,
        itemName: student.name,
        dataJson: JSON.stringify(student),
      },
    });

    await db.student.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: 'تم حذف الطالب ونقله إلى سلة المحذوفات',
    });
  } catch (error) {
    console.error('Error deleting student:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء حذف الطالب' },
      { status: 500 }
    );
  }
}
