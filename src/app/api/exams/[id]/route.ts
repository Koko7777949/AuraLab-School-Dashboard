import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/exams/[id] — Get single exam
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const exam = await db.exam.findUnique({
      where: { id },
      include: {
        student: {
          select: { id: true, name: true, studentId: true, class: true },
        },
        teacher: { select: { id: true, name: true } },
      },
    });

    if (!exam) {
      return NextResponse.json(
        { success: false, message: 'الاختبار غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: exam });
  } catch (error) {
    console.error('Error fetching exam:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء جلب بيانات الاختبار' },
      { status: 500 }
    );
  }
}

// PUT /api/exams/[id] — Update exam
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, subject, studentId, classId, teacherId, score, maxScore, date, notes } = body;

    const existing = await db.exam.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'الاختبار غير موجود' },
        { status: 404 }
      );
    }

    const exam = await db.exam.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(subject !== undefined && { subject }),
        ...(studentId !== undefined && { studentId: studentId || null }),
        ...(classId !== undefined && { classId: classId || null }),
        ...(teacherId !== undefined && { teacherId: teacherId || null }),
        ...(score !== undefined && { score }),
        ...(maxScore !== undefined && { maxScore }),
        ...(date !== undefined && { date: date ? new Date(date) : existing.date }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        student: { select: { id: true, name: true, studentId: true } },
        teacher: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: exam,
      message: 'تم تحديث بيانات الاختبار بنجاح',
    });
  } catch (error) {
    console.error('Error updating exam:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء تحديث بيانات الاختبار' },
      { status: 500 }
    );
  }
}

// DELETE /api/exams/[id] — Soft-delete exam (move to trash)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const exam = await db.exam.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, name: true } },
        teacher: { select: { id: true, name: true } },
      },
    });

    if (!exam) {
      return NextResponse.json(
        { success: false, message: 'الاختبار غير موجود' },
        { status: 404 }
      );
    }

    // Create trash item before deleting
    await db.trashItem.create({
      data: {
        itemType: 'exam',
        itemId: exam.id,
        itemName: exam.title,
        dataJson: JSON.stringify(exam),
      },
    });

    await db.exam.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: 'تم حذف الاختبار ونقله إلى سلة المحذوفات',
    });
  } catch (error) {
    console.error('Error deleting exam:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء حذف الاختبار' },
      { status: 500 }
    );
  }
}
