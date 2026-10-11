'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import type { AppNotification } from '@/lib/types';
import {
  Bell,
  Info,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  CheckCheck,
  BellOff,
  Newspaper,
  Settings,
  Filter,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const TYPE_CONFIG: Record<
  AppNotification['type'],
  { icon: React.ElementType; color: string; bgColor: string; label: string }
> = {
  info: {
    icon: Info,
    color: 'text-sky-400',
    bgColor: 'bg-sky-400/10',
    label: 'معلومات',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-400',
    bgColor: 'bg-amber-400/10',
    label: 'تنبيهات',
  },
  success: {
    icon: CheckCircle2,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/10',
    label: 'أخبار',
  },
  error: {
    icon: XCircle,
    color: 'text-red-400',
    bgColor: 'bg-red-400/10',
    label: 'نظام',
  },
};

type FilterType = 'all' | 'info' | 'warning' | 'success' | 'error';

const FILTER_OPTIONS: { value: FilterType; label: string; icon: React.ElementType }[] = [
  { value: 'all', label: 'الكل', icon: Bell },
  { value: 'warning', label: 'تنبيهات', icon: AlertTriangle },
  { value: 'success', label: 'أخبار', icon: Newspaper },
  { value: 'error', label: 'نظام', icon: Settings },
  { value: 'info', label: 'معلومات', icon: Info },
];

/** Simple relative-time formatter for Arabic */
function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 60) return 'الآن';
  if (minutes < 60) return `منذ ${minutes} دقائق`;
  if (hours < 24) return `منذ ${hours} ساعات`;
  return new Date(dateStr).toLocaleDateString('ar-EG');
}

/** Get date group label */
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
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */
const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    title: 'تم تسجيل طالب جديد',
    message: 'تمت إضافة الطالب أحمد محمد إلى فصل الصف الأول بقسم أ.',
    type: 'success',
    isRead: false,
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: 'n2',
    title: 'تنبيه: حضور منخفض',
    message: 'نسبة الحضور في فصل الصف الثالث انخفضت إلى 65% هذا الأسبوع.',
    type: 'warning',
    isRead: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 'n3',
    title: 'تحديث النظام',
    message: 'تم تحديث النظام بنجاح إلى الإصدار 2.4.1 مع تحسينات في الأداء.',
    type: 'error',
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'n4',
    title: 'خطأ في مزامنة البيانات',
    message: 'فشلت عملية مزامنة بيانات التقييمات مع الخادم المركزي. يرجى المحاولة لاحقاً.',
    type: 'error',
    isRead: false,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'n5',
    title: 'تقرير الأداء الأسبوعي',
    message: 'متوسط درجات الطلاب في اختبارات الرياضيات هذا الأسبوع: 82%.',
    type: 'success',
    isRead: true,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'n6',
    title: 'تم إنشاء اختبار جديد',
    message: 'المعلم خالد العلي أنشأ اختباراً جديداً في مادة العلوم لفصل الصف الثاني.',
    type: 'success',
    isRead: true,
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'n7',
    title: 'تحذير انتهاء الصلاحية',
    message: 'صلاحية المعلم سارة أحمد ستنتهي خلال 3 أيام. يرجى تجديدها.',
    type: 'warning',
    isRead: false,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'n8',
    title: 'فشل في إرسال الإيميل',
    message: 'لم يتم إرسال تقرير الأداء لولي الأمر بسبب مشكلة في خادم البريد.',
    type: 'error',
    isRead: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'n9',
    title: 'صيانة الخادم المجدولة',
    message: 'سيتم إجراء صيانة دورية للخادم يوم الجمعة القادم من الساعة 2 إلى 4 صباحاً.',
    type: 'info',
    isRead: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'n10',
    title: 'تم نسخ بيانات احتياطية',
    message: 'تم إنشاء نسخة احتياطية كاملة لقاعدة البيانات بنجاح.',
    type: 'info',
    isRead: true,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

/* ------------------------------------------------------------------ */
/*  Notification item with styled card                                  */
/* ------------------------------------------------------------------ */
function NotificationItem({
  notification,
  onRead,
}: {
  notification: AppNotification;
  onRead: (id: string) => void;
}) {
  const config = TYPE_CONFIG[notification.type];
  const Icon = config.icon;
  const isUnread = !notification.isRead;

  return (
    <button
      type="button"
      onClick={() => !notification.isRead && onRead(notification.id)}
      className={cn(
        'w-full text-right rounded-xl p-4 transition-all duration-200 group relative',
        'hover:bg-white/[0.03]',
        isUnread ? 'bg-[rgba(212,165,116,0.04)]' : 'bg-transparent',
      )}
      style={{
        border: isUnread
          ? '1px solid rgba(212,165,116,0.15)'
          : '1px solid rgba(255,255,255,0.04)',
        borderRight: isUnread
          ? '3px solid #D4A574'
          : '3px solid transparent',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = isUnread
          ? 'rgba(212,165,116,0.25)'
          : 'rgba(255,255,255,0.08)';
        e.currentTarget.style.borderRightColor = isUnread ? '#D4A574' : 'transparent';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = isUnread
          ? 'rgba(212,165,116,0.15)'
          : 'rgba(255,255,255,0.04)';
        e.currentTarget.style.borderRightColor = isUnread ? '#D4A574' : 'transparent';
      }}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className={cn(
            'mt-0.5 flex shrink-0 items-center justify-center h-11 w-11 rounded-xl transition-colors',
            config.bgColor,
            config.color,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className={cn(
              'font-semibold text-sm truncate',
              isUnread ? 'text-white' : 'text-slate-300',
            )}>
              {notification.title}
            </span>

            {/* Unread dot */}
            {isUnread && (
              <span className="shrink-0 h-3.5 w-3.5 rounded-full bg-[#D4A574] shadow-[0_0_8px_rgba(212,165,116,0.5)]" />
            )}
          </div>

          <p className={cn(
            'text-sm leading-relaxed line-clamp-2',
            isUnread ? 'text-slate-300' : 'text-[#A0A0B8]',
          )}>
            {notification.message}
          </p>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-[#A0A0B8]">
              {relativeTime(notification.createdAt)}
            </span>
            <span
              className={cn(
                'text-[11px] font-medium px-2 py-0.5 rounded-full',
                config.color,
                config.bgColor,
              )}
            >
              {config.label}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty state                                                        */
/* ------------------------------------------------------------------ */
function EmptyState({ filterLabel }: { filterLabel: string | null }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-20 px-4 rounded-xl"
      style={{
        backgroundColor: '#1A1A24',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="relative mb-6">
        <div className="flex items-center justify-center h-24 w-24 rounded-3xl bg-white/[0.03] border border-white/[0.06]">
          <BellOff className="h-12 w-12 text-slate-500" />
        </div>
      </div>
      <h3 className="text-lg font-semibold text-slate-300 mb-2">
        لا توجد إشعارات
      </h3>
      <p className="text-sm text-muted-foreground mb-2 text-center max-w-sm leading-relaxed">
        {filterLabel
          ? `لا توجد إشعارات من نوع "${filterLabel}" حالياً`
          : 'لا توجد إشعارات حالياً'}
      </p>
      <p className="text-xs text-slate-600 text-center">
        ستظهر الإشعارات الجديدة هنا تلقائياً
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */
export default function NotificationsSection() {
  const { notifications, markNotificationRead, setNotifications } =
    useAppStore();
  const [filter, setFilter] = useState<FilterType>('all');

  /* Seed mock data on mount if store is empty */
  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current && notifications.length === 0) {
      initialized.current = true;
      setNotifications(MOCK_NOTIFICATIONS);
    }
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications],
  );

  const filtered = useMemo(
    () =>
      filter === 'all'
        ? notifications
        : notifications.filter((n) => n.type === filter),
    [notifications, filter],
  );

  // Group by date
  const grouped = useMemo(() => {
    const groups: Record<string, AppNotification[]> = {};
    const order = ['اليوم', 'أمس', 'هذا الأسبوع', 'أقدم'];
    for (const n of filtered) {
      const group = getDateGroup(n.createdAt);
      if (!groups[group]) groups[group] = [];
      groups[group].push(n);
    }
    // Return ordered groups
    return order.filter((g) => groups[g]).map((g) => ({
      label: g,
      notifications: groups[g],
    }));
  }, [filtered]);

  const markAllRead = () => {
    notifications.forEach((n) => {
      if (!n.isRead) markNotificationRead(n.id);
    });
  };

  const filterLabel = filter !== 'all'
    ? FILTER_OPTIONS.find((o) => o.value === filter)?.label ?? null
    : null;

  return (
    <div className="flex flex-col gap-6 card-depth-1" dir="rtl">
      {/* ── Page header ── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-[#D4A574]/10">
            <Bell className="h-5 w-5 text-[#D4A574]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight sm:text-3xl flex items-center gap-3">
              مركز الإشعارات
              {unreadCount > 0 && (
                <Badge className="bg-[#D4A574] text-white hover:bg-[#D4A574]/90 text-sm px-2.5 py-0.5 rounded-full font-semibold tabular-nums">
                  {unreadCount} جديد
                </Badge>
              )}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              متابعة جميع التنبيهات والأخبار وتحديثات النظام
            </p>
          </div>
        </div>

        <Button
          onClick={markAllRead}
          disabled={unreadCount === 0}
          variant="outline"
          className="gap-2 text-slate-300 border-white/[0.08] hover:bg-[#D4A574]/10 hover:text-[#D4A574] hover:border-[#D4A574]/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors rounded-lg"
        >
          <CheckCheck className="h-4 w-4" />
          تحديد الكل كمقروء
        </Button>
      </div>

      {/* ── Filter tabs ── */}
      <div
        className="flex items-center gap-2 rounded-xl p-2 overflow-x-auto"
        style={{
          backgroundColor: '#1A1A24',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex items-center gap-1.5 text-slate-500 ml-2 shrink-0">
          <Filter className="h-3.5 w-3.5" />
        </div>
        {FILTER_OPTIONS.map((opt) => {
          const isActive = filter === opt.value;
          const OptIcon = opt.icon;
          return (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={cn(
                'flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-all duration-200 whitespace-nowrap',
                isActive
                  ? 'bg-[#D4A574] text-white shadow-[0_2px_12px_rgba(212,165,116,0.3)]'
                  : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-200',
              )}
            >
              <OptIcon className="h-3.5 w-3.5" />
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* ── Notification list grouped by date ── */}
      {filtered.length > 0 ? (
        <div className="flex flex-col gap-6">
          {grouped.map(({ label, notifications: groupNotifs }) => (
            <div key={label}>
              {/* Date group header */}
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-sm font-semibold text-[#D4A574]">{label}</h2>
                <Badge variant="outline" className="bg-white/[0.04] text-slate-500 border-white/[0.06] text-[11px] px-2 py-0 rounded-full tabular-nums">
                  {groupNotifs.length}
                </Badge>
                <div className="h-px flex-1 bg-white/[0.06]" />
              </div>

              {/* Notifications in this group */}
              <div className="flex flex-col gap-2">
                {groupNotifs.map((n) => (
                  <NotificationItem key={n.id} notification={n} onRead={markNotificationRead} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState filterLabel={filterLabel} />
      )}
    </div>
  );
}
