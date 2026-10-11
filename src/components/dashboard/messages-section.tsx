'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import type { Message } from '@/lib/types';
import { toast } from 'sonner';
import {
  MessageSquare,
  Send,
  Star,
  Archive,
  Trash2,
  Reply,
  Forward,
  Paperclip,
  Search,
  Plus,
  Mail,
  Clock,
  X,
  Inbox,
  Loader2,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const ROLE_CONFIG: Record<
  Message['senderRole'],
  { label: string; color: string; bgColor: string; gradient: string }
> = {
  admin: {
    label: 'مدير',
    color: 'text-[#D4A574]',
    bgColor: 'bg-[#D4A574]/10',
    gradient: 'linear-gradient(135deg, #D4A574, #B07D4F)',
  },
  teacher: {
    label: 'معلم',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/10',
    gradient: 'linear-gradient(135deg, #34d399, #059669)',
  },
  parent: {
    label: 'ولي أمر',
    color: 'text-sky-400',
    bgColor: 'bg-sky-400/10',
    gradient: 'linear-gradient(135deg, #38bdf8, #0284c7)',
  },
  student: {
    label: 'طالب',
    color: 'text-violet-400',
    bgColor: 'bg-violet-400/10',
    gradient: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
  },
};

const PRIORITY_CONFIG: Record<
  Message['priority'],
  { label: string; color: string; bgColor: string; dotColor: string }
> = {
  urgent: {
    label: 'عاجل',
    color: 'text-rose-400',
    bgColor: 'bg-rose-400/10',
    dotColor: 'bg-rose-500',
  },
  high: {
    label: 'مهم',
    color: 'text-amber-400',
    bgColor: 'bg-amber-400/10',
    dotColor: 'bg-amber-500',
  },
  normal: {
    label: 'عادي',
    color: 'text-sky-400',
    bgColor: 'bg-sky-400/10',
    dotColor: 'bg-sky-500',
  },
  low: {
    label: 'منخفض',
    color: 'text-slate-400',
    bgColor: 'bg-slate-400/10',
    dotColor: 'bg-slate-500',
  },
};

type FilterTab = 'all' | 'unread' | 'starred' | 'sent' | 'archived';

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: 'all', label: 'الكل' },
  { value: 'unread', label: 'غير مقروءة' },
  { value: 'starred', label: 'النجوم' },
  { value: 'sent', label: 'المرسلة' },
  { value: 'archived', label: 'الأرشيف' },
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
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  if (hours < 24) return `منذ ${hours} ساعة`;
  if (days < 7) return `منذ ${days} يوم`;
  return new Date(dateStr).toLocaleDateString('ar-EG');
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return parts[0][0] + parts[1][0];
  return parts[0].slice(0, 2);
}

/* ------------------------------------------------------------------ */
/*  Recipient options for compose dialog                                */
/* ------------------------------------------------------------------ */
const RECIPIENT_OPTIONS = [
  { id: 'r1', name: 'أحمد الغامدي', role: 'teacher' },
  { id: 'r2', name: 'سارة الأحمدي', role: 'teacher' },
  { id: 'r3', name: 'خالد العتيبي', role: 'admin' },
  { id: 'r4', name: 'فاطمة الزهراني', role: 'parent' },
  { id: 'r5', name: 'محمد القحطاني', role: 'parent' },
  { id: 'r6', name: 'نورة السبيعي', role: 'teacher' },
  { id: 'r7', name: 'عبدالله المطيري', role: 'parent' },
  { id: 'r8', name: 'مريم الحربي', role: 'parent' },
];

const GROUP_RECIPIENT_OPTIONS = [
  { id: 'all-teachers', name: 'جميع المعلمين', role: 'teacher' as const, isGroup: true },
  { id: 'all-parents', name: 'جميع أولياء الأمور', role: 'parent' as const, isGroup: true },
  { id: 'class-1a', name: 'فصل الأول أ', role: 'student' as const, isGroup: true },
  { id: 'class-1b', name: 'فصل الأول ب', role: 'student' as const, isGroup: true },
  { id: 'class-2a', name: 'فصل الثاني أ', role: 'student' as const, isGroup: true },
  { id: 'class-3a', name: 'فصل الثالث أ', role: 'student' as const, isGroup: true },
  { id: 'class-4a', name: 'فصل الرابع أ', role: 'student' as const, isGroup: true },
  { id: 'class-5a', name: 'فصل الخامس أ', role: 'student' as const, isGroup: true },
];

type RecipientOption = {
  id: string;
  name: string;
  role: string;
  isGroup?: boolean;
};

function formatFullDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ar-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */
const MOCK_MESSAGES: Message[] = [
  {
    id: 'msg1',
    senderId: 'r4',
    senderName: 'فاطمة الزهراني',
    senderRole: 'parent',
    recipientId: 'admin',
    recipientName: 'المدير',
    recipientRole: 'admin',
    subject: 'طلب موعد مع المعلمة',
    content: 'السلام عليكم ورحمة الله وبركاته،\n\nأود طلب موعد مع معلمة الرياضيات الأستاذة سارة لمناقشة مستوى ابني أحمد في المادة. لاحظت تراجعاً في درجاته الأخيرة وأريد التعرف على سبل المساعدة.\n\nهل يمكن تحديد موعد مناسب خلال الأسبوع القادم؟\n\nشكراً لكم.',
    isRead: false,
    isStarred: false,
    hasAttachment: false,
    priority: 'normal',
    parentId: null,
    isArchived: false,
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: 'msg2',
    senderId: 'r1',
    senderName: 'أحمد الغامدي',
    senderRole: 'teacher',
    recipientId: 'admin',
    recipientName: 'المدير',
    recipientRole: 'admin',
    subject: 'تقرير الحضور الأسبوعي',
    content: 'السلام عليكم،\n\nمرفق تقرير الحضور الأسبوعي لفصل الصف الثالث:\n\n- إجمالي الطلاب: 32 طالب\n- نسبة الحضور: 87%\n- حالات الغياب المتكرر: 3 طلاب\n- حالات التأخير: 5 طلاب\n\nأرجو مراجعة حالات الغياب المتكرر واتخاذ الإجراءات المناسبة.\n\nمع خالص التقدير.',
    isRead: false,
    isStarred: true,
    hasAttachment: true,
    priority: 'high',
    parentId: null,
    isArchived: false,
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'msg3',
    senderId: 'r5',
    senderName: 'محمد القحطاني',
    senderRole: 'parent',
    recipientId: 'admin',
    recipientName: 'المدير',
    recipientRole: 'admin',
    subject: 'استفسار عن موعد التسجيل',
    content: 'السلام عليكم،\n\nأريد الاستفسار عن موعد بدء التسجيل للفصل الدراسي القادم وهل هناك أوراق مطلوبة إضافية هذا العام؟\n\nجزاكم الله خيراً.',
    isRead: false,
    isStarred: false,
    hasAttachment: false,
    priority: 'normal',
    parentId: null,
    isArchived: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'msg4',
    senderId: 'r3',
    senderName: 'خالد العتيبي',
    senderRole: 'admin',
    recipientId: 'all-teachers',
    recipientName: 'جميع المعلمين',
    recipientRole: 'teacher',
    subject: 'اجتماع المعلمين الأسبوعي',
    content: 'بسم الله الرحمن الرحيم،\n\nأود تذكيركم بأن اجتماع المعلمين الأسبوعي سيُعقد يوم الأربعاء القادم في تمام الساعة العاشرة صباحاً في قاعة الاجتماعات الكبرى.\n\nجدول الأعمال:\n1. مراجعة نتائج الاختبارات النهائية\n2. مناقشة الخطة الدراسية الجديدة\n3. ترتيبات نهاية العام الدراسي\n\nالحضور إلزامي.\n\nمع التحية،\nخالد العتيبي - مدير المدرسة',
    isRead: true,
    isStarred: false,
    hasAttachment: false,
    priority: 'high',
    parentId: null,
    isArchived: false,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'msg5',
    senderId: 'r2',
    senderName: 'سارة الأحمدي',
    senderRole: 'teacher',
    recipientId: 'admin',
    recipientName: 'المدير',
    recipientRole: 'admin',
    subject: 'طلب تجهيزات للمعمل',
    content: 'السلام عليكم ورحمة الله،\n\nأحتاج إلى تجهيزات إضافية لمعمل العلوم لتنفيذ التجارب العملية المقررة:\n\n1. 10 مجموعات أدوات كهربائية\n2. مواد كيميائية للتجارب (قائمة مرفقة)\n3. مجاهر إضافية\n4. شاشات عرض\n\nالميزانية المقدرة: ٥,٠٠٠ ريال\n\nأرجو الموافقة في أقرب وقت ممكن.\n\nجزاكم الله خيراً.',
    isRead: true,
    isStarred: true,
    hasAttachment: true,
    priority: 'normal',
    parentId: null,
    isArchived: false,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'msg6',
    senderId: 'r7',
    senderName: 'عبدالله المطيري',
    senderRole: 'parent',
    recipientId: 'admin',
    recipientName: 'المدير',
    recipientRole: 'admin',
    subject: 'شكوى حول النقل المدرسي',
    content: 'السلام عليكم،\n\nأود تقديم شكوى بخصوص الحافل المدرسي رقم ٣. الحافل يتأخر يومياً عن موعده بحوالي ١٥ دقيقة مما يتسبب في تأخير ابنتي عن بداية الحصة الأولى.\n\nأرجو اتخاذ الإجراءات اللازمة لحل هذه المشكلة.\n\nمع التقدير.',
    isRead: false,
    isStarred: false,
    hasAttachment: false,
    priority: 'urgent',
    parentId: null,
    isArchived: false,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'msg7',
    senderId: 'admin',
    senderName: 'المدير',
    senderRole: 'admin',
    recipientId: 'r4',
    recipientName: 'فاطمة الزهراني',
    recipientRole: 'parent',
    subject: 'رد: طلب موعد مع المعلمة',
    content: 'وعليكم السلام ورحمة الله وبركاته،\n\nأهلاً بك أخت فاطمة،\n\nتم تنسيق موعد مع الأستاذة سارة يوم الثلاثاء القادم في الساعة الحادية عشرة صباحاً. يرجى الحضور إلى مكتب المرشد الطلابي.\n\nمع خالص التحية.',
    isRead: true,
    isStarred: false,
    hasAttachment: false,
    priority: 'normal',
    parentId: 'msg1',
    createdAt: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
  },
  {
    id: 'msg8',
    senderId: 'r6',
    senderName: 'نورة السبيعي',
    senderRole: 'teacher',
    recipientId: 'admin',
    recipientName: 'المدير',
    recipientRole: 'admin',
    subject: 'اقتراح نشاط رياضي',
    content: 'السلام عليكم،\n\nأقترح تنظيم بطولة رياضية بين الصفوف في نهاية الفصل الدراسي تتضمن:\n\n- كرة قدم\n- كرة سلة\n- سباق تتابع\n- مسابقات قفز\n\nهذا سيعزز الروح التنافسية بين الطلاب ويحسن بيئة المدرسة.\n\nما رأيكم؟',
    isRead: true,
    isStarred: false,
    hasAttachment: false,
    priority: 'low',
    parentId: null,
    isArchived: false,
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'msg9',
    senderId: 'r8',
    senderName: 'مريم الحربي',
    senderRole: 'parent',
    recipientId: 'admin',
    recipientName: 'المدير',
    recipientRole: 'admin',
    subject: 'استفسار عن النتائج',
    content: 'السلام عليكم،\n\nمتى ستكون نتائج اختبارات نهاية الفصل متاحة؟ وما هي طريقة الاطلاع عليها؟\n\nجزاكم الله خيراً.',
    isRead: false,
    isStarred: false,
    hasAttachment: false,
    priority: 'normal',
    parentId: null,
    isArchived: false,
    createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'msg10',
    senderId: 'admin',
    senderName: 'المدير',
    senderRole: 'admin',
    recipientId: 'r1',
    recipientName: 'أحمد الغامدي',
    recipientRole: 'teacher',
    subject: 'تقييم الأداء السنوي',
    content: 'السلام عليكم ورحمة الله،\n\nنود إبلاغك بأنه تم الانتهاء من تقييم الأداء السنوي ونتائجك ممتازة. شكراً على مجهوداتك الكبيرة خلال العام الدراسي.\n\nسيتم توزيع شهادات التقدير يوم الأحد القادم.\n\nمع التحية والتقدير.',
    isRead: true,
    isStarred: true,
    hasAttachment: false,
    priority: 'normal',
    parentId: null,
    isArchived: false,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'msg11',
    senderId: 'r1',
    senderName: 'أحمد الغامدي',
    senderRole: 'teacher',
    recipientId: 'admin',
    recipientName: 'المدير',
    recipientRole: 'admin',
    subject: 'مشكلة في جهاز العرض',
    content: 'السلام عليكم،\n\nجهاز العرض في قاعة الصف الرابع لا يعمل بشكل صحيح. الشاشة تومض بشكل متكرر مما يؤثر على سير الدروس.\n\nأرجو إرسال فريق الصيانة في أقرب فرصة.\n\nشكراً.',
    isRead: true,
    isStarred: false,
    hasAttachment: false,
    priority: 'high',
    parentId: null,
    isArchived: false,
    createdAt: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'msg12',
    senderId: 'r4',
    senderName: 'فاطمة الزهراني',
    senderRole: 'parent',
    recipientId: 'admin',
    recipientName: 'المدير',
    recipientRole: 'admin',
    subject: 'شكر وتقدير',
    content: 'السلام عليكم ورحمة الله،\n\nأتقدم بشكري الجزيل لكم وللمعلمين على الجهود المبذولة في توجيه أبنائنا. لقد لاحظت تحسناً واضحاً في مستوى ابني منذ بداية الفصل.\n\nجزاكم الله خيراً ونفع بعلمكم.',
    isRead: true,
    isStarred: false,
    hasAttachment: false,
    priority: 'low',
    parentId: null,
    isArchived: false,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'msg13',
    senderId: 'admin',
    senderName: 'المدير',
    senderRole: 'admin',
    recipientId: 'r7',
    recipientName: 'عبدالله المطيري',
    recipientRole: 'parent',
    subject: 'رد: شكوى حول النقل المدرسي',
    content: 'وعليكم السلام ورحمة الله،\n\nنشكرك على تواصلك معنا. تم إحالة الشكوى لشركة النقل وسيتم حل المشكلة خلال يومين إن شاء الله.\n\nسنقوم بإبلاغك بالتحديثات.\n\nمع التقدير.',
    isRead: true,
    isStarred: false,
    hasAttachment: false,
    priority: 'urgent',
    parentId: 'msg6',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'msg14',
    senderId: 'r5',
    senderName: 'محمد القحطاني',
    senderRole: 'parent',
    recipientId: 'admin',
    recipientName: 'المدير',
    recipientRole: 'admin',
    subject: 'طلب إعفاء من الرسوم',
    content: 'السلام عليكم،\n\nأود التقدم بطلب إعفاء من الرسوم الدراسية لبنتي لظروف مالية خاصة. مرفق المستندات المطلوبة.\n\nأرجو النظر في الطلب.\n\nجزاكم الله خيراً.',
    isRead: false,
    isStarred: false,
    hasAttachment: true,
    priority: 'high',
    parentId: null,
    isArchived: false,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'msg15',
    senderId: 'admin',
    senderName: 'المدير',
    senderRole: 'admin',
    recipientId: 'r2',
    recipientName: 'سارة الأحمدي',
    recipientRole: 'teacher',
    subject: 'موافقة على طلب التجهيزات',
    content: 'السلام عليكم ورحمة الله،\n\nتمت الموافقة على طلب التجهيزات للمعمل بقيمة ٤,٥٠٠ ريال. يرجى التنسيق مع قسم المشتريات لبدء الإجراءات.\n\nمع التحية.',
    isRead: true,
    isStarred: false,
    hasAttachment: false,
    priority: 'normal',
    parentId: 'msg5',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'msg16',
    senderId: 'r6',
    senderName: 'نورة السبيعي',
    senderRole: 'teacher',
    recipientId: 'admin',
    recipientName: 'المدير',
    recipientRole: 'admin',
    subject: 'تقرير الزيارة الميدانية',
    content: 'السلام عليكم،\n\nمرفق تقرير الزيارة الميدانية لمتحف العلوم والتقنية التي نظمناها لطلاب الصف الخامس يوم الخميس الماضي.\n\nعدد المشاركين: 28 طالب\nالمدة: 4 ساعات\nالتكلفة الإجمالية: 1,400 ريال\n\nالتغذية الراجعة من الطلاب كانت إيجابية جداً.\n\nمع خالص التقدير.',
    isRead: true,
    isStarred: true,
    hasAttachment: true,
    priority: 'normal',
    parentId: null,
    isArchived: false,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

/* ------------------------------------------------------------------ */
/*  Stats card                                                         */
/* ------------------------------------------------------------------ */
function StatsCard({
  icon: Icon,
  label,
  value,
  subtext,
  glowColor,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtext?: string;
  glowColor: string;
}) {
  return (
    <div
      className="glass-card rounded-xl p-5 relative overflow-hidden animate-fade-in-up"
      style={{ animationDelay: '0ms' }}
    >
      {/* Glow effect */}
      <div
        className="absolute -top-6 -left-6 w-24 h-24 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: glowColor }}
      />
      <div className="relative flex items-center gap-4">
        <div
          className="flex items-center justify-center h-12 w-12 rounded-xl shrink-0"
          style={{ background: `${glowColor}15` }}
        >
          <Icon className="h-5 w-5" style={{ color: glowColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
          <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
          {subtext && (
            <p className="text-[11px] text-muted-foreground mt-0.5">{subtext}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Message list item                                                  */
/* ------------------------------------------------------------------ */
function MessageListItem({
  message,
  isSelected,
  onSelect,
  onStarToggle,
  staggerIndex,
}: {
  message: Message;
  isSelected: boolean;
  onSelect: () => void;
  onStarToggle: (e: React.MouseEvent) => void;
  staggerIndex: number;
}) {
  const roleConfig = ROLE_CONFIG[message.senderRole];
  const priorityConfig = PRIORITY_CONFIG[message.priority];
  const isUnread = !message.isRead;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full text-right rounded-xl p-3.5 transition-all duration-200 group relative animate-fade-in-up',
        isSelected
          ? 'bg-[rgba(212,165,116,0.08)]'
          : 'hover:bg-[rgba(212,165,116,0.04)]',
      )}
      style={{
        border: isSelected
          ? '1px solid rgba(212,165,116,0.25)'
          : '1px solid rgba(255,255,255,0.04)',
        borderRight: isUnread
          ? '3px solid #D4A574'
          : isSelected
            ? '3px solid rgba(212,165,116,0.3)'
            : '3px solid transparent',
        animationDelay: `${staggerIndex * 40}ms`,
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = 'rgba(212,165,116,0.06)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className="shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5 shadow-md"
          style={{ background: roleConfig.gradient }}
        >
          {getInitials(message.senderName)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span
              className={cn(
                'text-sm truncate',
                isUnread ? 'font-bold text-white' : 'font-medium text-slate-300',
              )}
            >
              {message.senderName}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              {message.priority === 'urgent' && (
                <span className="status-dot h-2 w-2 rounded-full bg-rose-500" />
              )}
              {message.hasAttachment && (
                <Paperclip className="h-3 w-3 text-slate-500" />
              )}
            </div>
          </div>

          <p
            className={cn(
              'text-xs truncate',
              isUnread ? 'text-slate-200 font-medium' : 'text-slate-400',
            )}
          >
            {message.subject}
          </p>

          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] text-slate-500 truncate flex-1">
              {message.content.slice(0, 50)}...
            </p>
            <span className="text-[10px] text-slate-600 shrink-0 tabular-nums">
              {relativeTime(message.createdAt)}
            </span>
          </div>
        </div>

        {/* Star toggle */}
        <button
          type="button"
          onClick={onStarToggle}
          className={cn(
            'shrink-0 mt-1 transition-all duration-200 active:scale-75',
            message.isStarred
              ? 'text-[#D4A574] hover:text-[#E8C9A8]'
              : 'text-slate-600 hover:text-slate-400',
          )}
          style={{
            transform: message.isStarred ? 'scale(1.1)' : 'scale(1)',
          }}
        >
          {message.isStarred ? (
            <Star className="h-4 w-4 fill-[#D4A574]" />
          ) : (
            <Star className="h-4 w-4" />
          )}
        </button>
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Message detail view                                                */
/* ------------------------------------------------------------------ */
function MessageDetail({
  message,
  threadMessages,
  onReply,
  onDelete,
  onArchive,
  onForward,
  onReplyViaDialog,
  onStarToggle,
}: {
  message: Message;
  threadMessages: Message[];
  onReply: (content: string) => void;
  onDelete: () => void;
  onArchive: () => void;
  onForward: () => void;
  onReplyViaDialog: () => void;
  onStarToggle: () => void;
}) {
  const [replyText, setReplyText] = useState('');
  const senderConfig = ROLE_CONFIG[message.senderRole];
  const recipientConfig = ROLE_CONFIG[message.recipientRole];
  const priorityConfig = PRIORITY_CONFIG[message.priority];

  const handleSendReply = useCallback(() => {
    if (replyText.trim()) {
      onReply(replyText.trim());
      setReplyText('');
    }
  }, [replyText, onReply]);

  return (
    <div className="flex flex-col h-full animate-fade-in-up">
      {/* Header with action buttons row */}
      <div className="flex-shrink-0 p-5 border-b border-white/[0.06]">
        {/* Top action bar */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs text-slate-300 border-white/[0.08] hover:bg-[#D4A574]/10 hover:text-[#D4A574] hover:border-[#D4A574]/40 rounded-lg"
              onClick={onReplyViaDialog}
            >
              <Reply className="h-3.5 w-3.5" />
              رد
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs text-slate-300 border-white/[0.08] hover:bg-white/[0.05] hover:text-slate-200 rounded-lg"
              onClick={onForward}
            >
              <Forward className="h-3.5 w-3.5" />
              إعادة توجيه
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs text-slate-300 border-white/[0.08] hover:bg-white/[0.05] hover:text-slate-200 rounded-lg"
              onClick={onArchive}
            >
              <Archive className="h-3.5 w-3.5" />
              أرشفة
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs text-red-400 border-red-400/20 hover:bg-red-400/10 hover:text-red-300 hover:border-red-400/40 rounded-lg"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
              حذف
            </Button>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onStarToggle}
              className={cn(
                'p-2 rounded-lg transition-all duration-200',
                message.isStarred
                  ? 'text-[#D4A574] hover:bg-[#D4A574]/10'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.05]',
              )}
              title={message.isStarred ? 'إزالة النجمة' : 'تمييز بنجمة'}
            >
              {message.isStarred ? (
                <Star className="h-4 w-4 fill-[#D4A574]" />
              ) : (
                <Star className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Sender info */}
        <div className="flex items-start gap-3 min-w-0">
          {/* Avatar */}
          <div
            className="shrink-0 h-12 w-12 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg mt-0.5"
            style={{ background: senderConfig.gradient }}
          >
            {getInitials(message.senderName)}
          </div>
          <div className="min-w-0 space-y-1 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-white text-base">
                {message.senderName}
              </span>
              <span
                className={cn(
                  'text-[11px] font-medium px-2 py-0.5 rounded-full',
                  senderConfig.color,
                  senderConfig.bgColor,
                )}
              >
                {senderConfig.label}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>إلى: {message.recipientName}</span>
              <span
                className={cn(
                  'text-[10px] font-medium px-1.5 py-0 rounded-full',
                  recipientConfig.color,
                  recipientConfig.bgColor,
                )}
              >
                {recipientConfig.label}
              </span>
            </div>
          </div>
        </div>

        {/* Subject + metadata row */}
        <div className="mt-3 flex items-start justify-between gap-3">
          <h2 className="text-lg font-bold text-white leading-snug">{message.subject}</h2>
          <div className="flex items-center gap-2 shrink-0 mt-1">
            <span
              className={cn(
                'text-[11px] font-medium px-2 py-0.5 rounded-full',
                priorityConfig.color,
                priorityConfig.bgColor,
              )}
            >
              {priorityConfig.label}
            </span>
            {message.hasAttachment && (
              <span className="flex items-center gap-1 text-[11px] text-slate-500">
                <Paperclip className="h-3 w-3" />
                مرفقات
              </span>
            )}
          </div>
        </div>

        {/* Date/time */}
        <div className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-500">
          <Clock className="h-3 w-3" />
          <span>{formatFullDate(message.createdAt)}</span>
          <span className="text-slate-700 mr-1">({relativeTime(message.createdAt)})</span>
        </div>
      </div>

      {/* Thread + Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 sidebar-scroll">
        {/* Thread messages (replies before this message) */}
        {threadMessages.length > 0 && (
          <div className="space-y-3 mb-4">
            {threadMessages
              .filter((m) => m.createdAt < message.createdAt)
              .map((m) => {
                const mConfig = ROLE_CONFIG[m.senderRole];
                return (
                  <div
                    key={m.id}
                    className="rounded-lg p-3 text-sm"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.04)',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-slate-300">
                        {m.senderName}
                      </span>
                      <span
                        className={cn(
                          'text-[10px] px-1.5 py-0 rounded-full',
                          mConfig.color,
                          mConfig.bgColor,
                        )}
                      >
                        {mConfig.label}
                      </span>
                      <span className="text-[10px] text-slate-600">
                        {relativeTime(m.createdAt)}
                      </span>
                    </div>
                    <p className="text-slate-400 whitespace-pre-wrap leading-relaxed">
                      {m.content}
                    </p>
                  </div>
                );
              })}
          </div>
        )}

        {/* Main content */}
        <div
          className="rounded-xl p-5 text-sm leading-[1.9] whitespace-pre-wrap text-slate-200"
          style={{
            backgroundColor: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          {message.content}
        </div>

        {/* Thread messages (replies after this message) */}
        {threadMessages.length > 0 && (
          <div className="space-y-3 mt-4">
            {threadMessages
              .filter((m) => m.createdAt > message.createdAt)
              .map((m) => {
                const mConfig = ROLE_CONFIG[m.senderRole];
                return (
                  <div
                    key={m.id}
                    className="rounded-lg p-3 text-sm"
                    style={{
                      backgroundColor: 'rgba(212,165,116,0.03)',
                      border: '1px solid rgba(212,165,116,0.1)',
                      borderRight: '3px solid rgba(212,165,116,0.3)',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-slate-300">
                        {m.senderName}
                      </span>
                      <span
                        className={cn(
                          'text-[10px] px-1.5 py-0 rounded-full',
                          mConfig.color,
                          mConfig.bgColor,
                        )}
                      >
                        {mConfig.label}
                      </span>
                      <span className="text-[10px] text-slate-600">
                        {relativeTime(m.createdAt)}
                      </span>
                    </div>
                    <p className="text-slate-400 whitespace-pre-wrap leading-relaxed">
                      {m.content}
                    </p>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Quick reply area */}
      <div className="flex-shrink-0 p-4 border-t border-white/[0.06]">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <Textarea
              id="reply-textarea"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="اكتب رد سريع هنا..."
              className="min-h-[60px] max-h-[120px] resize-none rounded-lg text-sm bg-white/[0.03] border-white/[0.08] text-white placeholder:text-slate-600 focus-visible:ring-[#D4A574]/40 focus-visible:border-[#D4A574]/30"
              dir="rtl"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              if (replyText.trim()) handleSendReply();
            }}
            className="shrink-0 flex items-center justify-center h-[60px] w-[60px] rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-40"
            disabled={!replyText.trim()}
            style={{
              background:
                'linear-gradient(135deg, #D4A574 0%, #B07D4F 100%)',
              boxShadow: replyText.trim()
                ? '0 4px 20px rgba(212, 165, 116, 0.3)'
                : 'none',
            }}
          >
            <Send className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Compose dialog                                                     */
/* ------------------------------------------------------------------ */

type ComposeInitialValues = {
  recipientId?: string;
  subject?: string;
  content?: string;
  priority?: Message['priority'];
};

function ComposeDialog({
  open,
  onOpenChange,
  onSend,
  initialValues,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: (data: {
    recipientId: string;
    recipientName: string;
    recipientRole: Message['recipientRole'];
    subject: string;
    content: string;
    priority: Message['priority'];
  }) => void;
  initialValues?: ComposeInitialValues;
}) {
  /* Derive initial state from initialValues */
  const initRecipientId = initialValues?.recipientId ?? '';
  const initRecipientSearch = (() => {
    if (initialValues?.recipientId) {
      const found = RECIPIENT_OPTIONS.find((r) => r.id === initialValues.recipientId)
        ?? GROUP_RECIPIENT_OPTIONS.find((r) => r.id === initialValues.recipientId);
      return found ? found.name : '';
    }
    return '';
  })();

  const [recipientId, setRecipientId] = useState(initRecipientId);
  const [subject, setSubject] = useState(initialValues?.subject ?? '');
  const [content, setContent] = useState(initialValues?.content ?? '');
  const [priority, setPriority] = useState<Message['priority']>(initialValues?.priority ?? 'normal');
  const [isSending, setIsSending] = useState(false);
  const [recipientSearch, setRecipientSearch] = useState(initRecipientSearch);
  const [showGroupSelector, setShowGroupSelector] = useState(false);

  const allRecipients = useMemo<RecipientOption[]>(
    () => [...GROUP_RECIPIENT_OPTIONS, ...RECIPIENT_OPTIONS.map((r) => ({ ...r, isGroup: false }))],
    [],
  );

  const filteredRecipients = useMemo(() => {
    if (!recipientSearch.trim()) {
      return showGroupSelector ? GROUP_RECIPIENT_OPTIONS : RECIPIENT_OPTIONS.map((r) => ({ ...r, isGroup: false }));
    }
    const q = recipientSearch.trim();
    return allRecipients.filter((r) => r.name.includes(q));
  }, [recipientSearch, showGroupSelector, allRecipients]);

  const selectedRecipient = allRecipients.find(
    (r) => r.id === recipientId,
  );

  const handleSend = useCallback(() => {
    if (!recipientId || !subject.trim() || !content.trim()) return;

    setIsSending(true);

    // Simulate send delay
    setTimeout(() => {
      const recipient = allRecipients.find((r) => r.id === recipientId);
      if (recipient) {
        onSend({
          recipientId,
          recipientName: recipient.name,
          recipientRole: recipient.role as Message['recipientRole'],
          subject: subject.trim(),
          content: content.trim(),
          priority,
        });
      }
      setIsSending(false);
      setRecipientId('');
      setSubject('');
      setContent('');
      setPriority('normal');
      setRecipientSearch('');
      setShowGroupSelector(false);
      onOpenChange(false);
    }, 800);
  }, [recipientId, subject, content, priority, onSend, onOpenChange, allRecipients]);

  const canSend = recipientId && subject.trim() && content.trim() && !isSending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="glass-card-elevated max-w-lg w-full p-0"
        dir="rtl"
        style={{
          borderColor: 'rgba(212, 165, 116, 0.15)',
        }}
      >
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#D4A574]/10">
              <Plus className="h-4 w-4 text-[#D4A574]" />
            </div>
            {initialValues ? 'إرسال رسالة' : 'رسالة جديدة'}
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-4">
          {/* Recipient type toggle */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">
              المرسل إليه
            </label>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => setShowGroupSelector(false)}
                className={cn(
                  'text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-200',
                  !showGroupSelector
                    ? 'bg-[#D4A574] text-white shadow-[0_2px_12px_rgba(212,165,116,0.3)]'
                    : 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-slate-200 border border-white/[0.06]',
                )}
              >
                فرد
              </button>
              <button
                type="button"
                onClick={() => setShowGroupSelector(true)}
                className={cn(
                  'text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-200',
                  showGroupSelector
                    ? 'bg-[#D4A574] text-white shadow-[0_2px_12px_rgba(212,165,116,0.3)]'
                    : 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-slate-200 border border-white/[0.06]',
                )}
              >
                مجموعة
              </button>
            </div>
            <div className="relative">
              <Input
                placeholder={showGroupSelector ? 'ابحث عن فصل أو مجموعة...' : 'ابحث عن المرسل إليه...'}
                value={selectedRecipient ? selectedRecipient.name : recipientSearch}
                onChange={(e) => {
                  if (selectedRecipient) {
                    setRecipientId('');
                    setRecipientSearch(selectedRecipient.name);
                  } else {
                    setRecipientSearch(e.target.value);
                  }
                }}
                className="rounded-lg text-sm bg-white/[0.03] border-white/[0.08] text-white placeholder:text-slate-600 focus-visible:ring-[#D4A574]/40 focus-visible:border-[#D4A574]/30"
              />
              {/* Selected recipient badge */}
              {selectedRecipient && (
                <button
                  type="button"
                  onClick={() => {
                    setRecipientId('');
                    setRecipientSearch('');
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              {/* Dropdown */}
              {!selectedRecipient && recipientSearch && filteredRecipients.length > 0 && (
                <div
                  className="absolute top-full right-0 left-0 mt-1 rounded-lg overflow-hidden z-50 max-h-48 overflow-y-auto sidebar-scroll"
                  style={{
                    backgroundColor: '#1A1A24',
                    border: '1px solid rgba(212, 165, 116, 0.15)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                  }}
                >
                  {filteredRecipients.map((r) => {
                    const rConfig = ROLE_CONFIG[r.role as Message['senderRole']];
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          setRecipientId(r.id);
                          setRecipientSearch('');
                        }}
                        className="w-full text-right px-4 py-2.5 text-sm transition-colors hover:bg-[rgba(212,165,116,0.06)] flex items-center justify-between"
                      >
                        <span className="flex items-center gap-2">
                          {r.isGroup && (
                            <span className="flex items-center justify-center h-5 w-5 rounded bg-[#D4A574]/15">
                              <MessageSquare className="h-3 w-3 text-[#D4A574]" />
                            </span>
                          )}
                          <span className="text-slate-200">{r.name}</span>
                        </span>
                        <span
                          className={cn(
                            'text-[10px] font-medium px-2 py-0.5 rounded-full',
                            rConfig.color,
                            rConfig.bgColor,
                          )}
                        >
                          {rConfig.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
              {/* No results */}
              {!selectedRecipient && recipientSearch && filteredRecipients.length === 0 && (
                <div
                  className="absolute top-full right-0 left-0 mt-1 rounded-lg overflow-hidden z-50 p-4 text-center"
                  style={{
                    backgroundColor: '#1A1A24',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <p className="text-sm text-slate-500">لا توجد نتائج</p>
                </div>
              )}
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">
              الموضوع
            </label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="موضوع الرسالة..."
              className="rounded-lg text-sm bg-white/[0.03] border-white/[0.08] text-white placeholder:text-slate-600 focus-visible:ring-[#D4A574]/40 focus-visible:border-[#D4A574]/30"
            />
          </div>

          {/* Message body */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">
              نص الرسالة
            </label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="اكتب رسالتك هنا..."
              className="min-h-[120px] rounded-lg text-sm bg-white/[0.03] border-white/[0.08] text-white placeholder:text-slate-600 focus-visible:ring-[#D4A574]/40 focus-visible:border-[#D4A574]/30 resize-none leading-relaxed"
              dir="rtl"
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">
              الأولوية
            </label>
            <Select
              value={priority}
              onValueChange={(v) => setPriority(v as Message['priority'])}
            >
              <SelectTrigger className="rounded-lg text-sm bg-white/[0.03] border-white/[0.08] text-white focus:ring-[#D4A574]/40 focus:border-[#D4A574]/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A24] border-white/[0.08]">
                {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          'h-2 w-2 rounded-full',
                          config.dotColor,
                        )}
                      />
                      <span>{config.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="p-6 pt-0 flex gap-2">
          <Button
            onClick={handleSend}
            disabled={!canSend}
            className={cn(
              'flex-1 gap-2 rounded-lg text-white font-medium',
              canSend && 'btn-shine',
            )}
            style={{
              background: canSend
                ? 'linear-gradient(135deg, #D4A574 0%, #B07D4F 100%)'
                : undefined,
              boxShadow: canSend
                ? '0 4px 20px rgba(212, 165, 116, 0.3)'
                : 'none',
            }}
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {isSending ? 'جارٍ الإرسال...' : 'إرسال'}
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="gap-2 text-slate-300 border-white/[0.08] hover:bg-white/[0.05] rounded-lg"
          >
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty state – no message selected                                   */
/* ------------------------------------------------------------------ */
function EmptyDetailState() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-20 px-4">
      <div className="relative mb-6">
        <div className="flex items-center justify-center h-24 w-24 rounded-3xl bg-white/[0.03] border border-white/[0.06]">
          <MessageSquare className="h-12 w-12 text-slate-600" />
        </div>
      </div>
      <h3 className="text-lg font-semibold text-slate-400 mb-2">
        لا توجد رسالة محددة
      </h3>
      <p className="text-sm text-muted-foreground text-center max-w-sm leading-relaxed">
        اختر رسالة من القائمة لعرض تفاصيلها
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty state – no messages at all                                   */
/* ------------------------------------------------------------------ */
function EmptyInboxState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 rounded-xl"
      style={{
        backgroundColor: '#1A1A24',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="relative mb-6">
        <div className="flex items-center justify-center h-24 w-24 rounded-3xl bg-white/[0.03] border border-white/[0.06]">
          <Inbox className="h-12 w-12 text-slate-500" />
        </div>
      </div>
      <h3 className="text-lg font-semibold text-slate-300 mb-2">
        لا توجد رسائل
      </h3>
      <p className="text-sm text-muted-foreground text-center max-w-sm leading-relaxed">
        صندوق الوارد فارغ. ستظهر الرسائل الجديدة هنا تلقائياً.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */
export default function MessagesSection() {
  const {
    messages,
    setMessages,
    addMessage,
    deleteMessage,
    archiveMessage,
    unarchiveMessage,
    toggleMessageStar,
    markMessageRead,
  } = useAppStore();

  const [filter, setFilter] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeInitialValues, setComposeInitialValues] = useState<ComposeInitialValues | undefined>(undefined);
  const [mobileShowDetail, setMobileShowDetail] = useState(false);

  /* Seed mock data on mount if store is empty */
  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current && messages.length === 0) {
      initialized.current = true;
      requestAnimationFrame(() => {
        setMessages(MOCK_MESSAGES);
      });
    }
  }, [messages.length, setMessages]);

  /* Computed values */
  const unreadCount = useMemo(
    () => messages.filter((m) => !m.isRead).length,
    [messages],
  );

  const sentToday = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return messages.filter((m) => {
      const isSent = m.senderRole === 'admin';
      return isSent && new Date(m.createdAt) >= todayStart;
    }).length;
  }, [messages]);

  const filtered = useMemo(() => {
    let result = messages;

    // Filter by tab
    switch (filter) {
      case 'unread':
        result = result.filter((m) => !m.isRead);
        break;
      case 'starred':
        result = result.filter((m) => m.isStarred);
        break;
      case 'sent':
        result = result.filter((m) => m.senderRole === 'admin');
        break;
      case 'archived':
        result = result.filter((m) => m.isArchived);
        break;
    }

    // Filter by search
    if (search.trim()) {
      const q = search.trim();
      result = result.filter(
        (m) =>
          m.senderName.includes(q) ||
          m.subject.includes(q) ||
          m.content.includes(q) ||
          m.recipientName.includes(q),
      );
    }

    return result;
  }, [messages, filter, search]);

  const selectedMessage = useMemo(
    () => messages.find((m) => m.id === selectedId) ?? null,
    [messages, selectedId],
  );

  // Thread messages
  const threadMessages = useMemo(() => {
    if (!selectedMessage) return [];
    const threadId = selectedMessage.parentId ?? selectedMessage.id;
    return messages.filter(
      (m) => m.parentId === threadId || m.id === threadId,
    );
  }, [messages, selectedMessage]);

  /* Handlers */
  const handleSelectMessage = useCallback(
    (id: string) => {
      setSelectedId(id);
      setMobileShowDetail(true);
      // Mark as read
      const msg = messages.find((m) => m.id === id);
      if (msg && !msg.isRead) {
        markMessageRead(id);
        toast.success('تم تحديد الرسالة كمقروءة');
      }
    },
    [messages, markMessageRead],
  );

  const handleStarToggle = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      toggleMessageStar(id);
      const msg = messages.find((m) => m.id === id);
      toast.success(msg?.isStarred ? 'تمت إزالة النجمة' : 'تم تمييز الرسالة بنجمة');
    },
    [toggleMessageStar, messages],
  );

  const handleDelete = useCallback(() => {
    if (!selectedMessage) return;
    deleteMessage(selectedMessage.id);
    setSelectedId(null);
    setMobileShowDetail(false);
    toast.success('تم حذف الرسالة');
  }, [selectedMessage, deleteMessage]);

  const handleArchive = useCallback(() => {
    if (!selectedMessage) return;
    if (selectedMessage.isArchived) {
      unarchiveMessage(selectedMessage.id);
      toast.success('تم إلغاء أرشفة الرسالة');
    } else {
      archiveMessage(selectedMessage.id);
      toast.success('تم أرشفة الرسالة');
    }
    setSelectedId(null);
    setMobileShowDetail(false);
  }, [selectedMessage, archiveMessage, unarchiveMessage]);

  const handleForward = useCallback(() => {
    if (!selectedMessage) return;
    setComposeInitialValues({
      subject: `إعادة توجيه: ${selectedMessage.subject}`,
      content: `--- رسالة مُعاد توجيهها ---\n\n${selectedMessage.content}`,
      priority: selectedMessage.priority,
    });
    setComposeOpen(true);
  }, [selectedMessage]);

  const handleReplyViaDialog = useCallback(() => {
    if (!selectedMessage) return;
    setComposeInitialValues({
      recipientId: selectedMessage.senderId,
      subject: `رد: ${selectedMessage.subject}`,
      priority: 'normal',
    });
    setComposeOpen(true);
  }, [selectedMessage]);

  const handleReply = useCallback(
    (content: string) => {
      if (!selectedMessage) return;
      const newMessage: Message = {
        id: `msg_${Date.now()}`,
        senderId: 'admin',
        senderName: 'المدير',
        senderRole: 'admin',
        recipientId: selectedMessage.senderId,
        recipientName: selectedMessage.senderName,
        recipientRole: selectedMessage.senderRole,
        subject: selectedMessage.subject,
        content,
        isRead: true,
        isStarred: false,
        isArchived: false,
        hasAttachment: false,
        priority: 'normal',
        parentId: selectedMessage.parentId ?? selectedMessage.id,
        createdAt: new Date().toISOString(),
      };
      addMessage(newMessage);
      toast.success('تم إرسال الرد بنجاح');
    },
    [selectedMessage, addMessage],
  );

  const handleComposeSend = useCallback(
    (data: {
      recipientId: string;
      recipientName: string;
      recipientRole: Message['recipientRole'];
      subject: string;
      content: string;
      priority: Message['priority'];
    }) => {
      const newMessage: Message = {
        id: `msg_${Date.now()}`,
        senderId: 'admin',
        senderName: 'المدير',
        senderRole: 'admin',
        recipientId: data.recipientId,
        recipientName: data.recipientName,
        recipientRole: data.recipientRole,
        subject: data.subject,
        content: data.content,
        isRead: true,
        isStarred: false,
        isArchived: false,
        hasAttachment: false,
        priority: data.priority,
        parentId: null,
        createdAt: new Date().toISOString(),
      };
      addMessage(newMessage);
      toast.success('تم إرسال الرسالة بنجاح');
    },
    [addMessage],
  );

  const filterLabel =
    filter !== 'all'
      ? FILTER_TABS.find((f) => f.value === filter)?.label ?? null
      : null;

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      {/* ── Page header ── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-[#D4A574]/10">
            <MessageSquare className="h-5 w-5 text-[#D4A574]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight sm:text-3xl flex items-center gap-3">
              الرسائل
              {unreadCount > 0 && (
                <Badge className="bg-[#D4A574] text-white hover:bg-[#D4A574]/90 text-sm px-2.5 py-0.5 rounded-full font-semibold tabular-nums">
                  {unreadCount} جديد
                </Badge>
              )}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              التواصل مع أولياء الأمور والمعلمين
            </p>
          </div>
        </div>

        <Button
          onClick={() => setComposeOpen(true)}
          className="gap-2 rounded-lg text-white font-medium"
          style={{
            background: 'linear-gradient(135deg, #D4A574 0%, #B07D4F 100%)',
            boxShadow: '0 4px 20px rgba(212, 165, 116, 0.3)',
          }}
        >
          <Plus className="h-4 w-4" />
          رسالة جديدة
        </Button>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger-grid">
        <StatsCard
          icon={Mail}
          label="الرسائل غير المقروءة"
          value={unreadCount}
          glowColor="#D4A574"
        />
        <StatsCard
          icon={Send}
          label="الرسائل المرسلة اليوم"
          value={sentToday}
          glowColor="#34d399"
        />
        <StatsCard
          icon={Clock}
          label="متوسط وقت الرد"
          value="2.5 ساعة"
          subtext="أسرع من المتوسط"
          glowColor="#38bdf8"
        />
      </div>

      {/* ── Two-panel layout ── */}
      <div className="flex flex-col lg:flex-row gap-4 min-h-[600px]">
        {/* Left panel – Inbox (40%) */}
        <div
          className="w-full lg:w-[40%] flex flex-col rounded-xl overflow-hidden"
          style={{
            backgroundColor: '#141419',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {/* Filter tabs */}
          <div className="flex-shrink-0 p-3 space-y-3">
            <div
              className="flex items-center gap-1.5 rounded-xl p-1.5 overflow-x-auto"
              style={{
                backgroundColor: '#1A1A24',
                border: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              {FILTER_TABS.map((tab) => {
                const isActive = filter === tab.value;
                return (
                  <button
                    key={tab.value}
                    onClick={() => setFilter(tab.value)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 whitespace-nowrap',
                      isActive
                        ? 'bg-[#D4A574] text-white shadow-[0_2px_12px_rgba(212,165,116,0.3)]'
                        : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-200',
                    )}
                  >
                    {tab.label}
                    {tab.value === 'unread' && unreadCount > 0 && (
                      <span className="flex items-center justify-center h-4 min-w-[16px] rounded-full bg-white/20 text-[10px] px-1 tabular-nums">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث في الرسائل..."
                className="pr-9 rounded-lg text-sm bg-white/[0.03] border-white/[0.06] text-white placeholder:text-slate-600 focus-visible:ring-[#D4A574]/30 focus-visible:border-[#D4A574]/20 h-9"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Message list */}
          <div className="flex-1 overflow-y-auto p-3 pt-0 space-y-1.5 sidebar-scroll">
            {filtered.length > 0 ? (
              filtered.map((msg, idx) => (
                <MessageListItem
                  key={msg.id}
                  message={msg}
                  isSelected={selectedId === msg.id}
                  onSelect={() => handleSelectMessage(msg.id)}
                  onStarToggle={(e) => handleStarToggle(e, msg.id)}
                  staggerIndex={idx}
                />
              ))
            ) : (
              <EmptyInboxState />
            )}
          </div>
        </div>

        {/* Right panel – Detail (60%) */}
        <div
          className="w-full lg:w-[60%] flex flex-col rounded-xl overflow-hidden"
          style={{
            backgroundColor: '#1A1A24',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {/* Mobile back button */}
          <div className="lg:hidden flex-shrink-0 border-b border-white/[0.06]">
            <button
              onClick={() => {
                setMobileShowDetail(false);
                setSelectedId(null);
              }}
              className="flex items-center gap-2 px-4 py-3 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
              العودة للرسائل
            </button>
          </div>

          {selectedMessage && (mobileShowDetail || typeof window === 'undefined') ? (
            <MessageDetail
              message={selectedMessage}
              threadMessages={threadMessages}
              onReply={handleReply}
              onDelete={handleDelete}
              onArchive={handleArchive}
              onForward={handleForward}
              onReplyViaDialog={handleReplyViaDialog}
              onStarToggle={() => {
                if (selectedMessage) {
                  toggleMessageStar(selectedMessage.id);
                  toast.success(
                    selectedMessage.isStarred
                      ? 'تمت إزالة النجمة'
                      : 'تم تمييز الرسالة بنجمة',
                  );
                }
              }}
            />
          ) : (
            <div className={mobileShowDetail ? 'hidden lg:flex' : 'flex'} style={{ display: 'flex' }}>
              <EmptyDetailState />
            </div>
          )}
        </div>
      </div>

      {/* Compose dialog */}
      <ComposeDialog
        key={composeOpen ? (composeInitialValues ? `fwd-${composeInitialValues.subject}` : 'new') : 'closed'}
        open={composeOpen}
        onOpenChange={(val) => {
          setComposeOpen(val);
          if (!val) setComposeInitialValues(undefined);
        }}
        onSend={handleComposeSend}
        initialValues={composeInitialValues}
      />
    </div>
  );
}
