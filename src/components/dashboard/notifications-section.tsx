'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';
import type { AppNotification } from '@/lib/types';
import {
  Bell,
  BellOff,
  Info,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  CheckCheck,
  Filter,
  Volume2,
  VolumeX,
  Trash2,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types & Config                                                     */
/* ------------------------------------------------------------------ */

type NotificationType = AppNotification['type'];
type FilterType = 'all' | 'unread' | 'urgent' | 'info' | 'warning' | 'success' | 'error';

const TYPE_CONFIG: Record<NotificationType, {
  icon: typeof Info;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  info: {
    icon: Info,
    label: 'معلومات',
    color: 'text-sky-400',
    bgColor: 'bg-sky-500/10',
    borderColor: 'border-sky-500/30',
  },
  warning: {
    icon: AlertTriangle,
    label: 'تحذير',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
  },
  success: {
    icon: CheckCircle2,
    label: 'نجاح',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
  },
  error: {
    icon: XCircle,
    label: 'خطأ',
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/30',
  },
};

const FILTER_OPTIONS: { value: FilterType; label: string; icon: typeof Bell }[] = [
  { value: 'all', label: 'الكل', icon: Bell },
  { value: 'unread', label: 'غير مقروء', icon: BellOff },
  { value: 'urgent', label: 'عاجل', icon: AlertTriangle },
  { value: 'info', label: 'معلومات', icon: Info },
  { value: 'warning', label: 'تحذير', icon: AlertTriangle },
  { value: 'success', label: 'نجاح', icon: CheckCircle2 },
  { value: 'error', label: 'خطأ', icon: XCircle },
];

/* ------------------------------------------------------------------ */
/*  Notification sound (Web Audio API)                                 */
/* ------------------------------------------------------------------ */

let audioContext: AudioContext | null = null;

function playNotificationChime() {
  try {
    if (!audioContext) {
      audioContext = new AudioContext();
    }

    const ctx = audioContext;
    const now = ctx.currentTime;

    // Subtle two-tone chime
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    gain1.gain.setValueAtTime(0.08, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    // Second tone (higher, delayed)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1100, now + 0.12);
    gain2.gain.setValueAtTime(0.06, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.45);
  } catch {
    // Audio API not available — silent fallback
  }
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
    title: 'تنبيه عاجل: حضور منخفض',
    message: 'نسبة الحضور في فصل الصف الثالث انخفضت إلى 65% هذا الأسبوع. يرجى اتخاذ إجراء فوري.',
    type: 'warning',
    isRead: false,
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: 'n3',
    title: 'تحديث النظام',
    message: 'تم تحديث النظام بنجاح إلى الإصدار 2.4.1 مع تحسينات في الأداء.',
    type: 'info',
    isRead: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 'n4',
    title: 'خطأ في مزامنة البيانات',
    message: 'فشلت عملية مزامنة بيانات التقييمات مع الخادم المركزي. يرجى المحاولة لاحقاً.',
    type: 'error',
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'n5',
    title: 'تقرير الأداء الأسبوعي',
    message: 'متوسط درجات الطلاب في اختبارات الرياضيات هذا الأسبوع: 82%.',
    type: 'success',
    isRead: true,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'n6',
    title: 'تم إنشاء اختبار جديد',
    message: 'المعلم خالد العلي أنشأ اختباراً جديداً في مادة العلوم لفصل الصف الثاني.',
    type: 'success',
    isRead: true,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'n7',
    title: 'تحذير عاجل: انتهاء الصلاحية',
    message: 'صلاحية المعلم سارة أحمد ستنتهي خلال 3 أيام. يرجى التجديد فوراً.',
    type: 'warning',
    isRead: false,
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'n8',
    title: 'فشل في إرسال الإيميل',
    message: 'لم يتم إرسال تقرير الأداء لولي الأمر بسبب مشكلة في خادم البريد.',
    type: 'error',
    isRead: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'n9',
    title: 'صيانة الخادم المجدولة',
    message: 'سيتم إجراء صيانة دورية للخادم يوم الجمعة القادم من الساعة 2 إلى 4 صباحاً.',
    type: 'info',
    isRead: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'n10',
    title: 'تم نسخ بيانات احتياطية',
    message: 'تم إنشاء نسخة احتياطية كاملة لقاعدة البيانات بنجاح.',
    type: 'info',
    isRead: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'n11',
    title: 'عاجل: غياب جماعي',
    message: '5 طلاب من فصل الصف الرابع غابوا اليوم بدون إذن مسبق.',
    type: 'error',
    isRead: false,
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
  {
    id: 'n12',
    title: 'تم تحديث المنهج',
    message: 'تم تحديث منهج مادة التربية الإسلامية للفصل الدراسي الثاني.',
    type: 'info',
    isRead: true,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

/* ------------------------------------------------------------------ */
/*  Notification item with styled card                                  */
/* ------------------------------------------------------------------ */

function NotificationItem({
  notification,
  onRead,
  onDelete,
}: {
  notification: AppNotification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const config = TYPE_CONFIG[notification.type];
  const Icon = config.icon;
  const isUnread = !notification.isRead;
  const isUrgent = notification.type === 'error' || (notification.type === 'warning' && isUnread);

  return (
    <div
      className={cn(
        'w-full text-right rounded-xl p-4 transition-all duration-200 group relative',
        'hover:bg-white/[0.03]',
        isUrgent ? 'bg-rose-500/[0.04]' : isUnread ? 'bg-[rgba(212,165,116,0.04)]' : 'bg-transparent',
      )}
      style={{
        border: isUrgent
          ? '1px solid rgba(244,63,94,0.2)'
          : isUnread
          ? '1px solid rgba(212,165,116,0.15)'
          : '1px solid rgba(255,255,255,0.04)',
        borderRight: isUrgent
          ? '3px solid #f43f5e'
          : isUnread
          ? '3px solid #D4A574'
          : '3px solid transparent',
      }}
    >
      <div className="flex items-start gap-4">
        {/* Icon with category color */}
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

            <div className="flex items-center gap-2 shrink-0">
              {/* Unread dot */}
              {isUnread && (
                <span className={cn(
                  'h-3.5 w-3.5 rounded-full shadow-[0_0_8px_rgba(212,165,116,0.5)]',
                  isUrgent ? 'bg-rose-500' : 'bg-[#D4A574]',
                )} />
              )}

              {/* Delete button */}
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(notification.id); }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-white/[0.06]"
                title="حذف"
              >
                <Trash2 className="h-3.5 w-3.5 text-slate-500 hover:text-rose-400" />
              </button>
            </div>
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
            <div className="flex items-center gap-2">
              {/* Category badge */}
              <span
                className={cn(
                  'text-[11px] font-medium px-2 py-0.5 rounded-full',
                  config.color,
                  config.bgColor,
                )}
              >
                {config.label}
              </span>
              {/* Urgent badge */}
              {isUrgent && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 animate-pulse">
                  عاجل
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Clickable overlay for marking as read */}
      {isUnread && (
        <button
          type="button"
          onClick={() => onRead(notification.id)}
          className="absolute inset-0 rounded-xl cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A574]/50"
          title="تحديد كمقروء"
          aria-label={`تحديد الإشعار "${notification.title}" كمقروء`}
        />
      )}
    </div>
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
  const { notifications, markNotificationRead, setNotifications, addNotification } =
    useAppStore();
  const [filter, setFilter] = useState<FilterType>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const prevCountRef = useRef(0);

  /* Seed mock data on mount if store is empty */
  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current && notifications.length === 0) {
      initialized.current = true;
      setNotifications(MOCK_NOTIFICATIONS);
    }
  }, []);

  /* Play notification sound when new notifications arrive */
  useEffect(() => {
    if (notifications.length > prevCountRef.current && prevCountRef.current > 0 && soundEnabled) {
      playNotificationChime();
    }
    prevCountRef.current = notifications.length;
  }, [notifications.length, soundEnabled]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications],
  );

  const urgentCount = useMemo(
    () => notifications.filter((n) => n.type === 'error' || (n.type === 'warning' && !n.isRead)).length,
    [notifications],
  );

  const filtered = useMemo(() => {
    switch (filter) {
      case 'all': return notifications;
      case 'unread': return notifications.filter((n) => !n.isRead);
      case 'urgent': return notifications.filter((n) => n.type === 'error' || (n.type === 'warning' && !n.isRead));
      default: return notifications.filter((n) => n.type === filter);
    }
  }, [notifications, filter]);

  // Group by date
  const grouped = useMemo(() => {
    const groups: Record<string, AppNotification[]> = {};
    const order = ['اليوم', 'أمس', 'هذا الأسبوع', 'أقدم'];
    for (const n of filtered) {
      const group = getDateGroup(n.createdAt);
      if (!groups[group]) groups[group] = [];
      groups[group].push(n);
    }
    return order.filter((g) => groups[g]).map((g) => ({
      label: g,
      notifications: groups[g],
    }));
  }, [filtered]);

  const markAllRead = useCallback(() => {
    notifications.forEach((n) => {
      if (!n.isRead) markNotificationRead(n.id);
    });
    toast.success('تم تعليم جميع الإشعارات كمقروءة');
  }, [notifications, markNotificationRead]);

  const deleteNotification = useCallback((id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id));
    toast.success('تم حذف الإشعار');
  }, [notifications, setNotifications]);

  /* Simulate receiving a new notification every 45 seconds */
  useEffect(() => {
    const simNotifs = [
      { title: 'تقرير جديد جاهز', message: 'تقرير الحضور اليومي جاهز للمراجعة.', type: 'info' as const },
      { title: 'تم تسجيل درجات', message: 'تم رفع درجات اختبار التربية الإسلامية.', type: 'success' as const },
      { title: 'تحذير: ذاكرة الخادم', message: 'استهلاك الذاكرة وصل إلى 85%.', type: 'warning' as const },
    ];
    let idx = 0;

    const interval = setInterval(() => {
      const sim = simNotifs[idx % simNotifs.length];
      idx++;
      const newNotif: AppNotification = {
        id: `sim-${Date.now()}`,
        title: sim.title,
        message: sim.message,
        type: sim.type,
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      // Cap at 50 notifications: remove oldest if exceeding
      setNotifications((prev) => {
        const next = [newNotif, ...prev];
        return next.length > 50 ? next.slice(0, 50) : next;
      });
    }, 45000);

    return () => clearInterval(interval);
  }, [setNotifications]);

  const filterLabel = filter !== 'all'
    ? FILTER_OPTIONS.find((o) => o.value === filter)?.label ?? null
    : null;

  return (
    <div className="flex flex-col gap-6 card-depth-1" dir="rtl">
      {/* ── Page header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center h-10 w-10 rounded-xl bg-[#D4A574]/10">
            <Bell className="h-5 w-5 text-[#D4A574]" />
            {/* Dynamic count badge */}
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -left-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white px-1 tabular-nums shadow-lg animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
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
              {urgentCount > 0 && (
                <span className="mr-2 text-rose-400 font-medium">
                  • {urgentCount} عاجل
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sound toggle */}
          <Button
            onClick={() => setSoundEnabled(!soundEnabled)}
            variant="outline"
            className="gap-2 text-slate-300 border-white/[0.08] hover:bg-white/[0.05] hover:text-slate-200 transition-colors rounded-lg"
            title={soundEnabled ? 'كتم صوت الإشعارات' : 'تفعيل صوت الإشعارات'}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 text-rose-400" />}
          </Button>

          {/* Mark all as read */}
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
          // Count for each filter
          const count = opt.value === 'all'
            ? notifications.length
            : opt.value === 'unread'
            ? unreadCount
            : opt.value === 'urgent'
            ? urgentCount
            : notifications.filter((n) => n.type === opt.value).length;

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
              <span className={cn(
                'tabular-nums text-[10px] rounded-full px-1.5 py-0.5',
                isActive ? 'bg-white/20' : 'bg-white/[0.06]',
              )}>
                {count}
              </span>
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
                {groupNotifs.map((n, i) => (
                  <div
                    key={n.id}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}
                  >
                    <NotificationItem
                      notification={n}
                      onRead={markNotificationRead}
                      onDelete={deleteNotification}
                    />
                  </div>
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
