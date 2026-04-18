import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/students — List all students with optional search
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get('search') || '';
    const classId = searchParams.get('classId') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const where: Record<string, unknown> = {};

    if (search) {
      where.name = { contains: search };
    }
    if (classId) {
      where.classId = classId;
    }
    if (status) {
      where.status = status;
    }

    const [students, total] = await Promise.all([
      db.student.findMany({
        where,
        include: {
          class: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.student.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: students,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء جلب بيانات الطلاب' },
      { status: 500 }
    );
  }
}

// POST /api/students — Create new student
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, studentId, classId, status, notes, psychBackground, avatar } = body;

    if (!name || !studentId) {
      return NextResponse.json(
        { success: false, message: 'الاسم ورقم الطالب مطلوبان' },
        { status: 400 }
      );
    }

    // Check for duplicate studentId
    const existing = await db.student.findUnique({
      where: { studentId },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: 'رقم الطالب مسجل مسبقًا' },
        { status: 409 }
      );
    }

    const student = await db.student.create({
      data: {
        name,
        studentId,
        classId: classId || null,
        status: status || 'active',
        notes: notes || '',
        psychBackground: psychBackground || '',
        avatar: avatar || '',
      },
      include: { class: true },
    });

    return NextResponse.json(
      { success: true, data: student, message: 'تم إضافة الطالب بنجاح' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء إضافة الطالب' },
      { status: 500 }
    );
  }
}
