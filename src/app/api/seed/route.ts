import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ============================================================
// Seed API: Seeds the database with Arabic demo data if empty
// GET /api/seed
// ============================================================

const ARABIC_STUDENT_FIRST_NAMES = [
  'أحمد', 'محمد', 'سارة', 'نورة', 'خالد', 'فاطمة', 'عبدالله', 'ريم',
  'عمر', 'ليلى', 'يوسف', 'هند', 'سلطان', 'مريم', 'ماجد', 'دانة',
  'فيصل', 'أمل', 'تركي', 'غادة',
];

const ARABIC_STUDENT_LAST_NAMES = [
  'العتيبي', 'القحطاني', 'الدوسري', 'الشمري', 'الحربي',
  'الغامدي', 'المالكي', 'الزهراني', 'السبيعي', 'الرشيدي',
  'المطيري', 'العنزي', 'البلوي', 'الجهني', 'السلمي',
];

const ARABIC_TEACHER_NAMES = [
  'خالد العلي', 'فاطمة الحربي', 'سارة القحطاني', 'ماجد الدوسري',
  'نورة الشمري', 'عبدالله الغامدي', 'ريم المالكي', 'سلطان الزهراني',
  'هند السبيعي', 'فيصل الرشيدي',
];

const SUBJECTS = ['الرياضيات', 'العلوم', 'اللغة العربية', 'اللغة الإنجليزية', 'التربية الإسلامية', 'التاريخ'];

const CLASS_DATA = [
  { name: 'الصف الأول أ', grade: 'الأول', room: 'قاعة 101' },
  { name: 'الصف الأول ب', grade: 'الأول', room: 'قاعة 102' },
  { name: 'الصف الثاني أ', grade: 'الثاني', room: 'قاعة 201' },
  { name: 'الصف الثاني ب', grade: 'الثاني', room: 'قاعة 202' },
  { name: 'الصف الثالث أ', grade: 'الثالث', room: 'قاعة 301' },
  { name: 'الصف الثالث ب', grade: 'الثالث', room: 'قاعة 302' },
];

const ANNOUNCEMENTS = [
  { title: 'بداية الفصل الدراسي الثاني', content: 'نبدأ الفصل الدراسي الثاني يوم الأحد القادم. يرجى التأكد من حضور جميع الطلاب.', category: 'academic', priority: 'high' },
  { title: 'اجتماع أولياء الأمور', content: 'موعد اجتماع أولياء الأمور يوم الخميس القادم في الساعة 4:00 مساءً في القاعة الكبرى.', category: 'parent', priority: 'normal' },
  { title: 'صيانة المختبرات', content: 'ستغلق المختبرات يوم الثلاثاء للصيانة الدورية.', category: 'general', priority: 'low' },
  { title: 'نتائج الامتحانات', content: 'ستعلن نتائج امتحانات نهاية الفصل يوم الأربعاء القادم.', category: 'academic', priority: 'high' },
  { title: 'نشاط رياضي', content: 'المدرسة تنظم بطولة كرة قدم بين الفصول يوم الخميس.', category: 'event', priority: 'normal' },
];

const NOTIFICATION_SEED = [
  { title: 'تم تسجيل طالب جديد', message: 'تمت إضافة الطالب أحمد العتيبي إلى فصل الصف الأول أ.', type: 'success' },
  { title: 'تنبيه: حضور منخفض', message: 'نسبة الحضور في فصل الصف الثالث أ انخفضت إلى 65%.', type: 'warning' },
  { title: 'خطأ في المزامنة', message: 'فشلت عملية مزامنة بيانات التقييمات.', type: 'error' },
  { title: 'تحديث النظام', message: 'تم تحديث النظام بنجاح إلى الإصدار 2.4.1.', type: 'info' },
  { title: 'تم إنشاء اختبار جديد', message: 'المعلم خالد العلي أنشأ اختباراً في مادة العلوم.', type: 'success' },
  { title: 'صيانة مجدولة', message: 'سيتم إجراء صيانة دورية للخادم يوم الجمعة.', type: 'info' },
  { title: 'تحذير انتهاء الصلاحية', message: 'صلاحية المعلم سارة القحطاني ستنتهي خلال 3 أيام.', type: 'warning' },
  { title: 'فشل إرسال إيميل', message: 'لم يتم إرسال تقرير الأداء لولي الأمر.', type: 'error' },
  { title: 'تقرير الأداء الأسبوعي', message: 'متوسط درجات الطلاب هذا الأسبوع: 82%.', type: 'success' },
  { title: 'نسخ احتياطي', message: 'تم إنشاء نسخة احتياطية كاملة لقاعدة البيانات بنجاح.', type: 'info' },
];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateStudentId(index: number): string {
  return `STD-${String(2024001 + index).padStart(7, '0')}`;
}

export async function GET() {
  try {
    // Check if database already has data
    const existingStudents = await db.student.count();
    const existingTeachers = await db.teacher.count();
    const existingClasses = await db.class.count();

    if (existingStudents > 0 || existingTeachers > 0 || existingClasses > 0) {
      return NextResponse.json({
        seeded: false,
        message: 'قاعدة البيانات تحتوي بيانات بالفعل',
        counts: {
          students: existingStudents,
          teachers: existingTeachers,
          classes: existingClasses,
        },
      });
    }

    // ── Seed Classes ──
    const createdClasses: Array<{ id: string; classId?: string }> = [];
    for (const cls of CLASS_DATA) {
      const created = await db.class.create({
        data: {
          name: cls.name,
          grade: cls.grade,
          room: cls.room,
          notes: '',
        },
      });
      createdClasses.push(created);
    }

    // ── Seed Teachers ──
    const createdTeachers: Array<{ id: string; classId?: string }> = [];
    for (let i = 0; i < ARABIC_TEACHER_NAMES.length; i++) {
      const name = ARABIC_TEACHER_NAMES[i];
      const subject = SUBJECTS[i % SUBJECTS.length];
      const created = await db.teacher.create({
        data: {
          name,
          subject,
          status: 'active',
          permissions: i === 0 ? 'admin' : 'teacher',
          email: `teacher${i + 1}@auralab.sa`,
          phone: `05${String(10000000 + i * 1234567).slice(0, 8)}`,
        },
      });
      createdTeachers.push(created);
    }

    // ── Assign teachers to classes (TeacherClass) ──
    for (const teacher of createdTeachers) {
      const classCount = Math.random() > 0.5 ? 2 : 1;
      const shuffledClasses = [...createdClasses].sort(() => Math.random() - 0.5);
      for (let i = 0; i < classCount && i < shuffledClasses.length; i++) {
        await db.teacherClass.create({
          data: {
            teacherId: teacher.id,
            classId: shuffledClasses[i].id,
          },
        });
      }
    }

    // ── Seed Students ──
    const createdStudents: Array<{ id: string; classId?: string | null }> = [];
    for (let i = 0; i < 20; i++) {
      const firstName = ARABIC_STUDENT_FIRST_NAMES[i];
      const lastName = randomFrom(ARABIC_STUDENT_LAST_NAMES);
      const name = `${firstName} ${lastName}`;
      const studentId = generateStudentId(i);
      const assignedClass = randomFrom(createdClasses);

      const created = await db.student.create({
        data: {
          name,
          studentId,
          classId: assignedClass.id,
          status: i < 18 ? 'active' : 'inactive',
          notes: '',
          psychBackground: '',
          avatar: '',
        },
      });
      createdStudents.push(created);
    }

    // ── Seed Exams (30) ──
    let examCount = 0;
    for (let i = 0; i < 30; i++) {
      const student = randomFrom(createdStudents);
      const teacher = randomFrom(createdTeachers);
      const subject = randomFrom(SUBJECTS);
      const maxScore = 100;
      const score = Math.round(40 + Math.random() * 60);

      await db.exam.create({
        data: {
          title: `اختبار ${subject} - ${i < 15 ? 'نهاية الفصل' : 'نصف الفصل'}`,
          subject,
          studentId: student.id,
          classId: student.classId,
          teacherId: teacher.id,
          score,
          maxScore,
          date: new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000),
          notes: '',
        },
      });
      examCount++;
    }

    // ── Seed Attendance (50) ──
    let attendanceCount = 0;
    const statuses = ['present', 'present', 'present', 'present', 'present', 'late', 'absent', 'excused'];
    for (let i = 0; i < 50; i++) {
      const student = randomFrom(createdStudents);
      const status = randomFrom(statuses);
      const dayOffset = Math.floor(Math.random() * 14);

      try {
        await db.attendance.create({
          data: {
            studentId: student.id,
            classId: student.classId,
            date: new Date(Date.now() - dayOffset * 86400000),
            status,
            notes: '',
          },
        });
        attendanceCount++;
      } catch {
        // Skip duplicate (unique constraint on studentId + date)
      }
    }

    // ── Seed Announcements (5) ──
    let announcementCount = 0;
    for (const ann of ANNOUNCEMENTS) {
      await db.announcement.create({
        data: {
          title: ann.title,
          content: ann.content,
          category: ann.category,
          priority: ann.priority,
          author: 'المدير',
          pinned: ann.priority === 'high',
        },
      });
      announcementCount++;
    }

    // ── Seed Notifications (10) ──
    let notificationCount = 0;
    for (const notif of NOTIFICATION_SEED) {
      await db.notification.create({
        data: {
          title: notif.title,
          message: notif.message,
          type: notif.type,
          isRead: Math.random() > 0.6,
        },
      });
      notificationCount++;
    }

    return NextResponse.json({
      seeded: true,
      message: 'تمت تهيئة قاعدة البيانات بنجاح ببيانات عربية تجريبية',
      counts: {
        students: createdStudents.length,
        teachers: createdTeachers.length,
        classes: createdClasses.length,
        exams: examCount,
        attendance: attendanceCount,
        announcements: announcementCount,
        notifications: notificationCount,
      },
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      {
        seeded: false,
        message: 'حدث خطأ أثناء تهيئة قاعدة البيانات',
        error: String(error),
      },
      { status: 500 }
    );
  }
}
