import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/exams — List exams with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get('search') || '';
    const studentId = searchParams.get('studentId') || '';
    const classId = searchParams.get('classId') || '';
    const teacherId = searchParams.get('teacherId') || '';
    const subject = searchParams.get('subject') || '';
    const minScore = searchParams.get('minScore') || '';
    const maxScore = searchParams.get('maxScore') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const where: Record<string, unknown> = {};

    if (search) {
      where.title = { contains: search };
    }
    if (studentId) {
      where.studentId = studentId;
    }
    if (classId) {
      where.classId = classId;
    }
    if (teacherId) {
      where.teacherId = teacherId;
    }
    if (subject) {
      where.subject = subject;
    }
    if (minScore || maxScore) {
      const scoreFilter: Record<string, unknown> = {};
      if (minScore) scoreFilter.gte = parseFloat(minScore);
      if (maxScore) scoreFilter.lte = parseFloat(maxScore);
      where.score = scoreFilter;
    }

    const [exams, total] = await Promise.all([
      db.exam.findMany({
        where,
        include: {
          student: { select: { id: true, name: true, studentId: true } },
          teacher: { select: { id: true, name: true } },
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.exam.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: exams,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching exams:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء جلب بيانات الاختبارات' },
      { status: 500 }
    );
  }
}

// POST /api/exams — Create exam
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, subject, studentId, classId, teacherId, score, maxScore, date, notes } = body;

    if (!title) {
      return NextResponse.json(
        { success: false, message: 'عنوان الاختبار مطلوب' },
        { status: 400 }
      );
    }

    const exam = await db.exam.create({
      data: {
        title,
        subject: subject || '',
        studentId: studentId || null,
        classId: classId || null,
        teacherId: teacherId || null,
        score: score !== undefined ? score : null,
        maxScore: maxScore || 100,
        date: date ? new Date(date) : new Date(),
        notes: notes || '',
      },
      include: {
        student: { select: { id: true, name: true, studentId: true } },
        teacher: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(
      { success: true, data: exam, message: 'تم إضافة الاختبار بنجاح' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating exam:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء إضافة الاختبار' },
      { status: 500 }
    );
  }
}
