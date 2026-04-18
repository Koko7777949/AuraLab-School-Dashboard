import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/teachers — List all teachers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get('search') || '';
    const subject = searchParams.get('subject') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const where: Record<string, unknown> = {};

    if (search) {
      where.name = { contains: search };
    }
    if (subject) {
      where.subject = subject;
    }
    if (status) {
      where.status = status;
    }

    const [teachers, total] = await Promise.all([
      db.teacher.findMany({
        where,
        include: {
          classes: {
            include: { class: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.teacher.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: teachers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء جلب بيانات المعلمين' },
      { status: 500 }
    );
  }
}

// POST /api/teachers — Create teacher
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, subject, status, permissions, avatar, email, phone } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, message: 'اسم المعلم مطلوب' },
        { status: 400 }
      );
    }

    const teacher = await db.teacher.create({
      data: {
        name,
        subject: subject || '',
        status: status || 'active',
        permissions: permissions || 'teacher',
        avatar: avatar || '',
        email: email || '',
        phone: phone || '',
      },
      include: {
        classes: { include: { class: true } },
      },
    });

    return NextResponse.json(
      { success: true, data: teacher, message: 'تم إضافة المعلم بنجاح' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating teacher:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء إضافة المعلم' },
      { status: 500 }
    );
  }
}
