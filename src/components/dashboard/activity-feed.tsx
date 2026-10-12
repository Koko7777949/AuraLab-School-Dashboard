'use client';

import { useMemo } from 'react';
import {
  UserPlus,
  CheckCircle,
  UserCheck,
  MessageSquare,
  Megaphone,
  FileText,
  AlertTriangle,
  BookOpen,
  Settings,
  Bell,
  GraduationCap,
  Trophy,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Activity {
  id: string;
  icon: React.ElementType;
  description: string;
  timestamp: string; // ISO string
  user: string;
  color: string;
  bgColor: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'الآن';
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  if (hours < 24) return `منذ ${hours} ساعة`;
  if (days < 7) return `منذ ${days} أيام`;
  return new Date(dateStr).toLocaleDateString('ar-EG');
}

function getDateGroup(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 86400000;
  const weekAgoStart = todayStart - 7 * 86400000;
  const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

  if (dateStart >= todayStart) return 'اليوم';
  if (dateStart >= yesterdayStart) return 'أمس';
  if (dateStart >= weekAgoStart) return 'هذا الأسبوع';
  return 'أقدم';
}

/* ------------------------------------------------------------------ */
/*  Mock Activity Data                                                 */
/* ------------------------------------------------------------------ */

const ACTIVITIES: Activity[] = [
  {
    id: 'a1',
    icon: UserPlus,
    description: 'تم إضافة طالب جديد: نورة القحطاني في الصف الثاني أ',
    timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    user: 'المدير',
    color: '#10b981',
    bgColor: 'bg-emerald-500/15',
  },
  {
    id: 'a2',
    icon: UserCheck,
    description: 'تم تسجيل حضور 28 طالب من أصل 32 في حصة الرياضيات',
    timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    user: 'أ. خالد العلي',
    color: '#f59e0b',
    bgColor: 'bg-amber-500/15',
  },
  {
    id: 'a3',
    icon: FileText,
    description: 'تم إنشاء امتحان نهاية الفصل لمادة العلوم',
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    user: 'أ. سارة القحطاني',
    color: '#38bdf8',
    bgColor: 'bg-sky-500/15',
  },
  {
    id: 'a4',
    icon: CheckCircle,
    description: 'تم رفع درجات اختبار اللغة العربية للصف الأول',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    user: 'أ. فاطمة الحربي',
    color: '#10b981',
    bgColor: 'bg-emerald-500/15',
  },
  {
    id: 'a5',
    icon: MessageSquare,
    description: 'أ. ماجد الدوسري أرسل رسالة لولي أمر الطالب أحمد',
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    user: 'أ. ماجد الدوسري',
    color: '#A78BFA',
    bgColor: 'bg-violet-500/15',
  },
  {
    id: 'a6',
    icon: Megaphone,
    description: 'إعلان جديد: موعد اجتماع أولياء الأمور يوم الخميس',
    timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    user: 'المدير',
    color: '#f43f5e',
    bgColor: 'bg-rose-500/15',
  },
  {
    id: 'a7',
    icon: AlertTriangle,
    description: 'تنبيه: 3 طلاب غابوا عن حصتين متتاليتين في الصف الثالث',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    user: 'النظام',
    color: '#f59e0b',
    bgColor: 'bg-amber-500/15',
  },
  {
    id: 'a8',
    icon: BookOpen,
    description: 'تم تحديث منهج مادة التربية الإسلامية',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    user: 'أ. عبدالله الغامدي',
    color: '#38bdf8',
    bgColor: 'bg-sky-500/15',
  },
  {
    id: 'a9',
    icon: Settings,
    description: 'تم تحديث إعدادات النظام: تفعيل الإشعارات الصوتية',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    user: 'المدير',
    color: '#8B8B9E',
    bgColor: 'bg-slate-500/15',
  },
  {
    id: 'a10',
    icon: Trophy,
    description: 'الطالبة سارة القحطاني حصلت على المركز الأول في مسابقة القراءة',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    user: 'النظام',
    color: '#10b981',
    bgColor: 'bg-emerald-500/15',
  },
  {
    id: 'a11',
    icon: Bell,
    description: 'تم إرسال إشعار جماعي لأولياء الأمور بخصوص الامتحانات',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    user: 'المدير',
    color: '#f59e0b',
    bgColor: 'bg-amber-500/15',
  },
  {
    id: 'a12',
    icon: GraduationCap,
    description: 'تم تسجيل 5 طلاب جدد في الصف الأول أ',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    user: 'المدير',
    color: '#10b981',
    bgColor: 'bg-emerald-500/15',
  },
  {
    id: 'a13',
    icon: CheckCircle,
    description: 'تم مراجعة وتأكيد درجات اختبار العلوم',
    timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
    user: 'أ. سارة القحطاني',
    color: '#10b981',
    bgColor: 'bg-emerald-500/15',
  },
  {
    id: 'a14',
    icon: FileText,
    description: 'تم إنشاء تقرير الأداء الأسبوعي تلقائياً',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    user: 'النظام',
    color: '#38bdf8',
    bgColor: 'bg-sky-500/15',
  },
  {
    id: 'a15',
    icon: UserPlus,
    description: 'تم تسجيل المعلمة هند السبيعي كمعلمة جديدة',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    user: 'المدير',
    color: '#10b981',
    bgColor: 'bg-emerald-500/15',
  },
];

/* ------------------------------------------------------------------ */
/*  Activity Item                                                      */
/* ------------------------------------------------------------------ */

function ActivityItem({ activity, index }: { activity: Activity; index: number }) {
  const Icon = activity.icon;

  return (
    <div
      className="flex items-start gap-3 py-3 group animate-fade-in-up"
      style={{ animationDelay: `${index * 40}ms`, animationFillMode: 'both' }}
    >
      {/* Icon */}
      <div
        className={`mt-0.5 flex shrink-0 items-center justify-center h-9 w-9 rounded-lg ${activity.bgColor} transition-transform duration-200 group-hover:scale-110`}
      >
        <Icon className="h-4 w-4" style={{ color: activity.color }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm leading-relaxed text-slate-300 group-hover:text-white transition-colors line-clamp-2">
          {activity.description}
        </p>
        <div className="flex items-center gap-3 text-[11px]">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5"
            style={{
              backgroundColor: `${activity.color}15`,
              color: activity.color,
            }}
          >
            {activity.user}
          </span>
          <span className="text-[#A0A0B8]">
            {relativeTime(activity.timestamp)}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

interface ActivityFeedProps {
  /** Optional max items to show */
  maxItems?: number;
  /** Optional className */
  className?: string;
}

export default function ActivityFeed({ maxItems, className = '' }: ActivityFeedProps) {
  const displayActivities = useMemo(() => {
    const sorted = [...ACTIVITIES].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    return maxItems ? sorted.slice(0, maxItems) : sorted;
  }, [maxItems]);

  // Group by date
  const grouped = useMemo(() => {
    const groups: Record<string, Activity[]> = {};
    const order = ['اليوم', 'أمس', 'هذا الأسبوع', 'أقدم'];
    for (const activity of displayActivities) {
      const group = getDateGroup(activity.timestamp);
      if (!groups[group]) groups[group] = [];
      groups[group].push(activity);
    }
    return order.filter((g) => groups[g]).map((g) => ({
      label: g,
      activities: groups[g],
    }));
  }, [displayActivities]);

  let globalIndex = 0;

  return (
    <div className={`flex flex-col gap-4 ${className}`} dir="rtl">
      {grouped.map(({ label, activities }) => (
        <div key={label}>
          {/* Date group header */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-[#D4A574]">{label}</span>
            <div className="h-px flex-1 bg-white/[0.06]" />
          </div>

          {/* Activities */}
          <div className="flex flex-col divide-y divide-white/[0.04]">
            {activities.map((activity) => {
              const idx = globalIndex++;
              return (
                <ActivityItem key={activity.id} activity={activity} index={idx} />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
