'use client';

import { useState, useEffect, useMemo } from 'react';
import SectionCard from './section-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/lib/store';
import type { AppNotification } from '@/lib/types';
import {
  Bell,
  Info,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  CheckCheck,
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
    label: 'تحذيرات',
  },
  success: {
    icon: CheckCircle2,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/10',
    label: 'نجاح',
  },
  error: {
    icon: XCircle,
    color: 'text-red-400',
    bgColor: 'bg-red-400/10',
    label: 'أخطاء',
  },
};

type FilterType = 'all' | AppNotification['type'];

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'الكل' },
  { value: 'info', label: 'معلومات' },
  { value: 'warning', label: 'تحذيرات' },
  { value: 'success', label: 'نجاح' },
  { value: 'error', label: 'أخطاء' },
];

/** Simple relative-time formatter for Arabic */
function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'الآن';
  if (minutes < 60) return `منذ ${minutes} دقائق`;
  if (hours < 24) return `منذ ${hours} ساعات`;
  if (days < 7) return `منذ ${days} أيام`;
  return new Date(dateStr).toLocaleDateString('ar-EG');
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
    type: 'info',
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
    type: 'info',
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
];

/* ------------------------------------------------------------------ */
/*  Notification item                                                  */
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

  return (
    <button
      type="button"
      onClick={() => !notification.isRead && onRead(notification.id)}
      className="w-full text-right rounded-lg p-4 transition-all duration-200 hover:bg-white/[0.04] group"
      style={{
        backgroundColor: notification.isRead ? 'transparent' : 'rgba(212,165,116,0.04)',
      }}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={`mt-0.5 flex shrink-0 items-center justify-center h-10 w-10 rounded-lg ${config.bgColor} ${config.color}`}
        >
          <Icon className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-white text-sm truncate">
              {notification.title}
            </span>

            {/* Unread dot */}
            {!notification.isRead && (
              <span className="shrink-0 mt-1.5 h-2.5 w-2.5 rounded-full bg-[#D4A574]" />
            )}
          </div>

          <p className="text-gray-400 text-sm leading-relaxed line-clamp-2">
            {notification.message}
          </p>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-gray-500">
              {relativeTime(notification.createdAt)}
            </span>
            <span
              className={`text-[11px] font-medium ${config.color}`}
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
/*  Main component                                                     */
/* ------------------------------------------------------------------ */
export default function NotificationsSection() {
  const { notifications, markNotificationRead, setNotifications, addNotification } =
    useAppStore();
  const [filter, setFilter] = useState<FilterType>('all');

  /* Seed mock data on mount if store is empty */
  useEffect(() => {
    if (notifications.length === 0) {
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

  const markAllRead = () => {
    notifications.forEach((n) => {
      if (!n.isRead) markNotificationRead(n.id);
    });
  };

  return (
    <div className="space-y-5">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-11 w-11 rounded-xl bg-[#D4A574]/15 text-[#D4A574]">
            <Bell className="h-6 w-6" />
          </div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-white">مركز الإشعارات</h1>
            {unreadCount > 0 && (
              <Badge className="bg-[#D4A574] text-white hover:bg-[#D4A574]/90 text-xs px-2 py-0.5">
                {unreadCount}
              </Badge>
            )}
          </div>
        </div>

        <Button
          onClick={markAllRead}
          disabled={unreadCount === 0}
          variant="outline"
          className="gap-2 text-gray-300 border-gray-600 hover:bg-[#D4A574]/10 hover:text-[#D4A574] hover:border-[#D4A574]/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <CheckCheck className="h-4 w-4" />
          تحديد الكل كمقروء
        </Button>
      </div>

      <Separator className="bg-white/5" />

      {/* ── Filter tabs ── */}
      <SectionCard
        title="الإشعارات"
        icon={<Filter className="h-5 w-5" />}
        action={
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  filter === opt.value
                    ? 'bg-[#D4A574] text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        }
      >
        {/* ── Notification list ── */}
        {filtered.length > 0 ? (
          <div className="space-y-1 max-h-[600px] overflow-y-auto pr-1">
            {filtered.map((n, idx) => (
              <div key={n.id}>
                <NotificationItem notification={n} onRead={markNotificationRead} />
                {idx < filtered.length - 1 && (
                  <Separator className="my-1 bg-white/5" />
                )}
              </div>
            ))}
          </div>
        ) : (
          /* ── Empty state ── */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex items-center justify-center h-16 w-16 rounded-full bg-white/5">
              <Bell className="h-8 w-8 text-gray-500" />
            </div>
            <p className="text-gray-400 text-sm font-medium">
              {filter === 'all'
                ? 'لا توجد إشعارات حالياً'
                : `لا توجد إشعارات من نوع "${FILTER_OPTIONS.find((o) => o.value === filter)?.label}"`}
            </p>
            <p className="text-gray-500 text-xs mt-1">
              ستظهر الإشعارات الجديدة هنا تلقائياً
            </p>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
