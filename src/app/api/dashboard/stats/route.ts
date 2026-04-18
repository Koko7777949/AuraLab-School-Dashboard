import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/dashboard/stats — Return aggregated dashboard statistics
export async function GET() {
  try {
    const [
      totalStudents,
      totalTeachers,
      totalClasses,
      totalExams,
      totalSessions,
      studentsByStatus,
      examScores,
      attendanceStats,
      recentNotifications,
    ] = await Promise.all([
      // Total active students
      db.student.count({ where: { status: 'active' } }),

      // Total active teachers
      db.teacher.count({ where: { status: 'active' } }),

      // Total classes
      db.class.count(),

      // Total exams
      db.exam.count(),

      // Total sessions
      db.session.count(),

      // Students grouped by status
      db.student.groupBy({
        by: ['status'],
        _count: { status: true },
      }),

      // Exam score averages
      db.exam.aggregate({
        where: { score: { not: null } },
        _avg: { score: true },
        _min: { score: true },
        _max: { score: true },
        _count: true,
      }),

      // Attendance rates
      db.attendance.groupBy({
        by: ['status'],
        _count: { status: true },
      }),

      // Recent unread notifications count
      db.notification.count({ where: { isRead: false } }),
    ]);

    // Calculate attendance rate
    const attendanceTotal = attendanceStats.reduce((sum, a) => sum + a._count.status, 0);
    const presentCount = attendanceStats.find((a) => a.status === 'present')?._count.status || 0;
    const lateCount = attendanceStats.find((a) => a.status === 'late')?._count.status || 0;
    const absentCount = attendanceStats.find((a) => a.status === 'absent')?._count.status || 0;
    const excusedCount = attendanceStats.find((a) => a.status === 'excused')?._count.status || 0;

    const attendanceRate = attendanceTotal > 0
      ? (((presentCount + lateCount) / attendanceTotal) * 100).toFixed(1)
      : '0';

    // Build status breakdown for students
    const studentStatusBreakdown: Record<string, number> = {};
    for (const item of studentsByStatus) {
      studentStatusBreakdown[item.status] = item._count.status;
    }

    // Average engagement score from sessions
    const engagementStats = await db.session.aggregate({
      where: { engagementAvg: { not: null } },
      _avg: { engagementAvg: true },
    });

    // Class sizes (top 5 by student count)
    const classSizes = await db.class.findMany({
      select: {
        id: true,
        name: true,
        grade: true,
        _count: { select: { students: true } },
      },
      orderBy: { students: { _count: 'desc' } },
      take: 5,
    });

    // Score distribution for exams
    const scoreDistribution = {
      excellent: 0, // 90-100
      veryGood: 0,  // 80-89
      good: 0,       // 70-79
      pass: 0,       // 50-69
      fail: 0,       // below 50
    };

    const examScoreRecords = await db.exam.findMany({
      where: { score: { not: null } },
      select: { score: true },
    });

    for (const exam of examScoreRecords) {
      if (exam.score === null) continue;
      if (exam.score >= 90) scoreDistribution.excellent++;
      else if (exam.score >= 80) scoreDistribution.veryGood++;
      else if (exam.score >= 70) scoreDistribution.good++;
      else if (exam.score >= 50) scoreDistribution.pass++;
      else scoreDistribution.fail++;
    }

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalStudents,
          totalTeachers,
          totalClasses,
          totalExams,
          totalSessions,
          unreadNotifications: recentNotifications,
        },
        studentStats: {
          byStatus: studentStatusBreakdown,
        },
        examStats: {
          averageScore: examScores._avg.score ? Number(examScores._avg.score.toFixed(1)) : 0,
          minScore: examScores._min.score ?? 0,
          maxScore: examScores._max.score ?? 0,
          totalGraded: examScores._count,
          scoreDistribution,
        },
        attendance: {
          rate: parseFloat(attendanceRate),
          present: presentCount,
          absent: absentCount,
          late: lateCount,
          excused: excusedCount,
          total: attendanceTotal,
        },
        engagement: {
          averageScore: engagementStats._avg.engagementAvg
            ? Number(engagementStats._avg.engagementAvg.toFixed(1))
            : 0,
        },
        topClasses: classSizes.map((c) => ({
          id: c.id,
          name: c.name,
          grade: c.grade,
          studentCount: c._count.students,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء جلب إحصائيات لوحة التحكم' },
      { status: 500 }
    );
  }
}
