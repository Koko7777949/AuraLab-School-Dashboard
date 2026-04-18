import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

// GET /api/attendance/stats — Get attendance statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const classId = searchParams.get('classId') || '';
    const studentId = searchParams.get('studentId') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';

    // Build where clause
    const where: Record<string, unknown> = {};
    if (classId) where.classId = classId;
    if (studentId) where.studentId = studentId;
    if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {};
      if (dateFrom) dateFilter.gte = new Date(dateFrom);
      if (dateTo) dateFilter.lte = new Date(dateTo);
      where.date = dateFilter;
    }

    // Total counts by status
    const [totalRecords, statusCounts] = await Promise.all([
      db.attendance.count({ where }),
      db.attendance.groupBy({
        by: ['status'],
        where,
        _count: { status: true },
      }),
    ]);

    const presentCount = statusCounts.find((s) => s.status === 'present')?._count.status || 0;
    const absentCount = statusCounts.find((s) => s.status === 'absent')?._count.status || 0;
    const lateCount = statusCounts.find((s) => s.status === 'late')?._count.status || 0;
    const excusedCount = statusCounts.find((s) => s.status === 'excused')?._count.status || 0;

    const attendanceRate = totalRecords > 0
      ? Math.round(((presentCount + lateCount) / totalRecords) * 100)
      : 0;

    // Per-class statistics
    const classStats = await db.attendance.groupBy({
      by: ['classId'],
      where: classId ? where : { classId: { not: null } },
      _count: { id: true },
      _sum: {
        id: true,
      },
    });

    const classNames = new Map<string, string>();
    if (classStats.length > 0) {
      const classIds = classStats.map((c) => c.classId).filter(Boolean) as string[];
      const classes = await db.class.findMany({
        where: { id: { in: classIds } },
        select: { id: true, name: true },
      });
      classes.forEach((c) => classNames.set(c.id, c.name));
    }

    const classStatsFormatted = classStats.map((c) => ({
      classId: c.classId,
      className: c.classId ? (classNames.get(c.classId) || 'غير محدد') : 'غير محدد',
      totalRecords: c._count.id,
    }));

    // Per-student statistics (top/bottom attendance)
    const studentStats = await db.attendance.groupBy({
      by: ['studentId'],
      where,
      _count: { id: true },
    });

    const studentIds = studentStats.map((s) => s.studentId);
    const students = await db.student.findMany({
      where: { id: { in: studentIds } },
      select: { id: true, name: true, studentId: true, classId: true },
    });
    const studentMap = new Map(students.map((s) => [s.id, s]));

    const studentStatsFormatted = await Promise.all(
      studentStats.map(async (s) => {
        const student = studentMap.get(s.studentId);
        const studentWhere = { ...where, studentId: s.studentId } as Prisma.AttendanceWhereInput;

        const sCounts = await db.attendance.groupBy({
          by: ['status'],
          where: studentWhere,
          _count: { status: true },
        });

        const sPresent = sCounts.find((c) => c.status === 'present')?._count.status || 0;
        const sAbsent = sCounts.find((c) => c.status === 'absent')?._count.status || 0;
        const sLate = sCounts.find((c) => c.status === 'late')?._count.status || 0;
        const sExcused = sCounts.find((c) => c.status === 'excused')?._count.status || 0;
        const sTotal = sPresent + sAbsent + sLate + sExcused;
        const sRate = sTotal > 0 ? Math.round(((sPresent + sLate) / sTotal) * 100) : 0;

        return {
          studentId: s.studentId,
          studentName: student?.name || 'غير معروف',
          studentCode: student?.studentId || '',
          classId: student?.classId || null,
          total: sTotal,
          present: sPresent,
          absent: sAbsent,
          late: sLate,
          excused: sExcused,
          rate: sRate,
        };
      })
    );

    // Sort by rate ascending for worst, descending for best
    const sortedByRate = [...studentStatsFormatted].sort((a, b) => b.rate - a.rate);
    const topStudents = sortedByRate.slice(0, 5);
    const worstStudents = sortedByRate.slice(-5).reverse();

    // Monthly trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const monthlyRecords = await db.attendance.findMany({
      where: {
        ...where,
        date: { gte: thirtyDaysAgo },
      },
      select: { date: true, status: true },
      orderBy: { date: 'asc' },
    });

    // Group by date
    const dailyMap = new Map<string, { date: string; present: number; absent: number; late: number; excused: number }>();
    for (const rec of monthlyRecords) {
      const dateKey = rec.date.toISOString().split('T')[0];
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, { date: dateKey, present: 0, absent: 0, late: 0, excused: 0 });
      }
      const day = dailyMap.get(dateKey)!;
      if (rec.status === 'present') day.present++;
      else if (rec.status === 'absent') day.absent++;
      else if (rec.status === 'late') day.late++;
      else if (rec.status === 'excused') day.excused++;
    }
    const dailyTrend = Array.from(dailyMap.values());

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          total: totalRecords,
          present: presentCount,
          absent: absentCount,
          late: lateCount,
          excused: excusedCount,
          attendanceRate,
        },
        classStats: classStatsFormatted,
        topStudents,
        worstStudents,
        dailyTrend,
      },
    });
  } catch (error) {
    console.error('Error fetching attendance stats:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء جلب إحصائيات الحضور' },
      { status: 500 }
    );
  }
}
