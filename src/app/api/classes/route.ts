import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/classes — List all classes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get('search') || '';
    const grade = searchParams.get('grade') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const where: Record<string, unknown> = {};

    if (search) {
      where.name = { contains: search };
    }
    if (grade) {
      where.grade = grade;
    }

    const [classes, total] = await Promise.all([
      db.class.findMany({
        where,
        include: {
          teachers: { include: { teacher: true } },
          _count: { select: { students: true, sessions: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.class.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: classes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching classes:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء جلب بيانات الفصول' },
      { status: 500 }
    );
  }
}

// POST /api/classes — Create class
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, grade, room, notes } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, message: 'اسم الفصل مطلوب' },
        { status: 400 }
      );
    }

    const cls = await db.class.create({
      data: {
        name,
        grade: grade || '',
        room: room || '',
        notes: notes || '',
      },
      include: {
        teachers: { include: { teacher: true } },
        _count: { select: { students: true } },
      },
    });

    return NextResponse.json(
      { success: true, data: cls, message: 'تم إضافة الفصل بنجاح' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating class:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء إضافة الفصل' },
      { status: 500 }
    );
  }
}
