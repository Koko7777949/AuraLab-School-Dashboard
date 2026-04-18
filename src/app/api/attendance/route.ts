import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/attendance — List attendance records with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const classId = searchParams.get('classId') || '';
    const date = searchParams.get('date') || '';
    const status = searchParams.get('status') || '';
    const studentId = searchParams.get('studentId') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const where: Record<string, unknown> = {};

    if (classId) {
      where.classId = classId;
    }
    if (studentId) {
      where.studentId = studentId;
    }
    if (status) {
      where.status = status;
    }
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      where.date = { gte: startDate, lte: endDate };
    }
    if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {};
      if (dateFrom) {
        dateFilter.gte = new Date(dateFrom);
      }
      if (dateTo) {
        dateFilter.lte = new Date(dateTo);
      }
      where.date = { ...dateFilter, ...(where.date as Record<string, Date> | undefined) };
    }

    const [records, total] = await Promise.all([
      db.attendance.findMany({
        where,
        include: {
          student: {
            select: { id: true, name: true, studentId: true },
          },
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.attendance.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء جلب سجلات الحضور' },
      { status: 500 }
    );
  }
}

// POST /api/attendance — Create attendance record(s), supports batch creation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { records } = body;

    // Batch mode: array of attendance records
    if (Array.isArray(records)) {
      if (records.length === 0) {
        return NextResponse.json(
          { success: false, message: 'لم يتم إرسال أي سجلات حضور' },
          { status: 400 }
        );
      }

      // Validate all records
      for (const record of records) {
        if (!record.studentId) {
          return NextResponse.json(
            { success: false, message: 'رقم الطالب مطلوب في جميع السجلات' },
            { status: 400 }
          );
        }
        if (!['present', 'absent', 'late', 'excused'].includes(record.status)) {
          return NextResponse.json(
            { success: false, message: 'حالة الحضور غير صالحة: يجب أن تكون حاضر أو غائب أو متأخر أو مستأذن' },
            { status: 400 }
          );
        }
      }

      // Use upsert to handle existing records (unique on studentId + date)
      const created = await Promise.all(
        records.map((record: Record<string, unknown>) =>
          db.attendance.upsert({
            where: {
              studentId_date: {
                studentId: record.studentId as string,
                date: new Date(record.date as string),
              },
            },
            update: {
              status: record.status as string,
              classId: (record.classId as string) || null,
              notes: (record.notes as string) || '',
            },
            create: {
              studentId: record.studentId as string,
              date: new Date(record.date as string),
              status: record.status as string,
              classId: (record.classId as string) || null,
              notes: (record.notes as string) || '',
            },
          })
        )
      );

      return NextResponse.json(
        {
          success: true,
          data: created,
          message: `تم تسجيل حضور ${created.length} طالب بنجاح`,
        },
        { status: 201 }
      );
    }

    // Single record mode
    const { studentId, classId, date, status, notes } = body;

    if (!studentId) {
      return NextResponse.json(
        { success: false, message: 'رقم الطالب مطلوب' },
        { status: 400 }
      );
    }

    if (!['present', 'absent', 'late', 'excused'].includes(status)) {
      return NextResponse.json(
        { success: false, message: 'حالة الحضور غير صالحة' },
        { status: 400 }
      );
    }

    const attendanceDate = date ? new Date(date) : new Date();

    const record = await db.attendance.upsert({
      where: {
        studentId_date: {
          studentId,
          date: attendanceDate,
        },
      },
      update: {
        status: status || 'present',
        classId: classId || null,
        notes: notes || '',
      },
      create: {
        studentId,
        date: attendanceDate,
        status: status || 'present',
        classId: classId || null,
        notes: notes || '',
      },
      include: {
        student: {
          select: { id: true, name: true, studentId: true },
        },
      },
    });

    return NextResponse.json(
      { success: true, data: record, message: 'تم تسجيل الحضور بنجاح' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating attendance:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء تسجيل الحضور' },
      { status: 500 }
    );
  }
}
