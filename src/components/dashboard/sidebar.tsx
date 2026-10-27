'use client';

import { useMemo, useCallback, useEffect, useState } from 'react';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  School,
  FileText,
  Calendar,
  BarChart3,
  Bell,
  Bot,
  Trash2,
  Settings,
  PanelRightClose,
  PanelRightOpen,
  Sparkles,
  ClipboardCheck,
  Megaphone,
  Wallet,
  Trophy,
  MessageSquare,
  FileBarChart,
  ShieldAlert,
  BookOpen,
  CalendarRange,
  Camera,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import type { ActiveSection } from '@/lib/types';

// ---------------------------------------------------------------------------
// Navigation items definition
// ---------------------------------------------------------------------------
interface NavItem {
  id: ActiveSection;
  label: string;
  /** i18n key for the label (falls back to label) */
  labelKey?: string;
  icon: React.ElementType;
  /** If true, shows a numeric count badge */
  showCount?: boolean;
  /** If true, the badge is a red "unread" dot / count */
  isAlert?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'لوحة التحكم', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { id: 'students', label: 'الطلاب', labelKey: 'nav.students', icon: GraduationCap, showCount: true },
  { id: 'teachers', label: 'المعلمون', labelKey: 'nav.teachers', icon: Users, showCount: true },
  { id: 'classes', label: 'الصفوف', labelKey: 'nav.classes', icon: School, showCount: true },
  { id: 'exams', label: 'الامتحانات', labelKey: 'nav.exams', icon: FileText, showCount: true },
  { id: 'sessions', label: 'الجلسات', labelKey: 'nav.sessions', icon: Calendar },
  { id: 'attendance', label: 'الحضور', labelKey: 'nav.attendance', icon: ClipboardCheck, showCount: true },
  { id: 'grades', label: 'الدرجات', labelKey: 'nav.grades', icon: Trophy, showCount: true },
  { id: 'behavior', label: 'سلوك الطلاب', labelKey: 'nav.behavior', icon: ShieldAlert, showCount: true },
  { id: 'timetable', label: 'الجدول الدراسي', labelKey: 'nav.timetable', icon: CalendarRange },
  { id: 'analytics', label: 'التحليلات', labelKey: 'nav.analytics', icon: BarChart3 },
  { id: 'reports', label: 'التقارير', labelKey: 'nav.reports', icon: FileBarChart },
  { id: 'announcements', label: 'الإعلانات', labelKey: 'nav.announcements', icon: Megaphone, isAlert: true },
  { id: 'messages', label: 'الرسائل', labelKey: 'nav.messages', icon: MessageSquare, isAlert: true },
  { id: 'notifications', label: 'الإشعارات', labelKey: 'nav.notifications', icon: Bell, isAlert: true },
  { id: 'ai-assistant', label: 'المساعد الذكي', labelKey: 'nav.ai', icon: Bot },
  { id: 'trash', label: 'المحذوفات', labelKey: 'nav.trash', icon: Trash2, showCount: true },
  { id: 'library', label: 'المكتبة', labelKey: 'nav.library', icon: BookOpen, showCount: true },
  { id: 'fees', label: 'الرسوم', labelKey: 'nav.fees', icon: Wallet, showCount: true },
  { id: 'camera', label: 'كاميرات الفصول', labelKey: 'nav.camera', icon: Camera },
  { id: 'settings', label: 'الإعدادات', labelKey: 'nav.settings', icon: Settings },
];

// ---------------------------------------------------------------------------
// Sidebar Component
// ---------------------------------------------------------------------------
export default function Sidebar() {
  const {
    activeSection,
    setActiveSection,
    sidebarOpen,
    toggleSidebar,
    students,
    teachers,
    classes,
    exams,
    grades,
    messages,
    notifications,
    trashItems,
    behaviors,
    libraryBooks,
    locale,
  } = useAppStore();

  // Track mobile state for slide-in animation
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Derive mobile visibility from props
  const mobileVisible = isMobile && sidebarOpen;

  // Compute badge counts ----------------------------------------------------
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications],
  );

  const counts = useMemo(
    () => ({
      students: students.length,
      teachers: teachers.length,
      classes: classes.length,
      exams: exams.length,
      grades: grades.length,
      attendance: 0, // attendance records tracked in separate section
      behavior: behaviors.length,
      announcements: 0, // announcements managed with local mock data
      messages: messages.filter((m) => !m.isRead).length,
      notifications: unreadCount,
      trash: trashItems.length,
      library: libraryBooks.length,
    }),
    [students, teachers, classes, exams, grades, messages, unreadCount, trashItems, behaviors, libraryBooks],
  );

  // Handlers ----------------------------------------------------------------
  const handleNavClick = useCallback(
    (id: ActiveSection) => {
      setActiveSection(id);
    },
    [setActiveSection],
  );

  // -----------------------------------------------------------------------
  return (
    <>
    {/* ---- Mobile overlay with shadow ---- */}
    {sidebarOpen && (
      <div
        className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
        onClick={toggleSidebar}
        style={{
          boxShadow: 'inset -60px 0 80px -40px rgba(0, 0, 0, 0.5)',
        }}
      />
    )}

    {/* ---- Sidebar main container ---- */}
    <aside
      dir="rtl"
      className={`
        fixed right-0 top-0 z-40 flex h-screen flex-col
        transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
        ${sidebarOpen ? 'w-60' : 'w-[72px]'}
        ${isMobile && sidebarOpen ? 'animate-sidebar-slide-in' : ''}
        ${isMobile && !sidebarOpen ? 'translate-x-full' : ''}
      `}
      style={{
        background: 'rgba(18, 18, 24, 0.85)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderLeft: '1px solid rgba(212, 165, 116, 0.08)',
      }}
    >
      {/* ---- Subtle gradient overlay (top to bottom) ---- */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(212,165,116,0.03) 0%, transparent 40%, rgba(0,0,0,0.08) 100%)',
        }}
        aria-hidden="true"
      />

      {/* ---- Top: Toggle button ---- */}
      <div className="relative z-10">
        <div
          className={`
            flex h-16 items-center justify-between px-4
            ${sidebarOpen ? 'flex-row-reverse' : 'flex-col items-center justify-center'}
          `}
        >
          {/* App Logo (visible when open) */}
          <div
            className={`
              flex items-center gap-2.5 overflow-hidden whitespace-nowrap border-glow-pulse rounded-lg
              transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
              ${sidebarOpen ? 'opacity-100' : 'pointer-events-none absolute opacity-0'}
            `}
          >
            {/* Animated gradient dot */}
            <span
              className="animate-logo-gradient inline-block h-9 w-9 shrink-0 rounded-xl shadow-lg shadow-[#D4A574]/20"
              style={{
                background:
                  'linear-gradient(135deg, #D4A574 0%, #E8C9A8 25%, #B07D4F 50%, #D4A574 75%, #E8C9A8 100%)',
                backgroundSize: '200% 200%',
              }}
            />
            <span className="text-lg font-bold tracking-tight text-white">
              Aura<span className="gradient-text-amber">Lab</span>
            </span>
          </div>

          {/* Collapse / Expand button */}
          <button
            onClick={toggleSidebar}
            aria-label={sidebarOpen ? t('nav.collapse', locale) : t('nav.collapse', locale)}
            className={`
              flex h-9 w-9 shrink-0 items-center justify-center rounded-lg
              text-[#8B8B9E] transition-all duration-300 ease-out
              hover:bg-[rgba(212,165,116,0.08)] hover:text-[#D4A574]
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A574]/50
              active:scale-95
              ${!sidebarOpen ? 'mt-0' : ''}
            `}
          >
            {sidebarOpen ? <PanelRightClose size={20} /> : <PanelRightOpen size={20} />}
          </button>
        </div>

        {/* ---- Decorative divider with amber tint ---- */}
        <div
          className="mx-3 h-px"
          style={{
            background:
              'linear-gradient(to left, transparent 0%, rgba(212,165,116,0.15) 30%, rgba(212,165,116,0.15) 70%, transparent 100%)',
          }}
        />
      </div>

      {/* ---- Navigation list ---- */}
      <nav className="sidebar-scroll relative z-10 flex-1 overflow-y-auto overflow-x-hidden py-3">
        <ul className="flex flex-col gap-1 px-3">
          {NAV_ITEMS.map((item, index) => {
            const isActive = activeSection === item.id;
            const Icon = item.icon;
            const count =
              item.id === 'notifications'
                ? counts.notifications
                : item.showCount
                  ? counts[item.id as keyof typeof counts] ?? 0
                  : 0;

            return (
              <li key={item.id} className="relative">
                {/* Active indicator bar (right side - amber) */}
                {isActive && (
                  <span
                    className="animate-indicator-glow absolute right-0 top-1/2 h-8 w-[4px] -translate-y-1/2 rounded-l-full bg-[#D4A574] shadow-[0_0_12px_rgba(212,165,116,0.6)]"
                  />
                )}

                {/* Active indicator line (left side - subtle) */}
                {isActive && (
                  <span
                    className="absolute left-0 top-1/2 h-5 w-[2.5px] -translate-y-1/2 rounded-r-full bg-[#D4A574]/40"
                  />
                )}

                <button
                  onClick={() => handleNavClick(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  title={!sidebarOpen ? (item.labelKey ? t(item.labelKey, locale) : item.label) : undefined}
                  className={`
                    group relative flex w-full items-center gap-3 rounded-xl
                    px-3 py-2.5 text-sm font-medium
                    transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A574]/50
                    ${
                      isActive
                        ? 'bg-[rgba(212,165,116,0.15)] text-[#E8C9A8]'
                        : 'text-[#8B8B9E] hover:text-[#C4C4D4]'
                    }
                    ${sidebarOpen ? 'flex-row-reverse' : 'flex-col items-center justify-center gap-1'}
                  `}
                  style={
                    !isActive
                      ? {
                          background: 'transparent',
                        }
                      : undefined
                  }
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background =
                        'linear-gradient(to left, rgba(212,165,116,0.06) 0%, transparent 100%)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  {/* Icon with amber glow for active */}
                  <span
                    className={`
                      shrink-0 transition-all duration-300 ease-out
                      ${isActive ? 'text-[#E8C9A8]' : 'text-[#8B8B9E] group-hover:text-[#C4C4D4]'}
                    `}
                    style={
                      isActive
                        ? {
                            filter: 'drop-shadow(0 0 10px rgba(212, 165, 116, 0.6))',
                          }
                        : undefined
                    }
                  >
                    <Icon
                      size={20}
                      strokeWidth={isActive ? 2 : 1.6}
                    />
                  </span>

                  {/* Label */}
                  <span
                    className={`
                      truncate transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
                      ${sidebarOpen ? 'opacity-100 w-auto' : 'pointer-events-none absolute opacity-0 w-0'}
                    `}
                  >
                    {item.labelKey ? t(item.labelKey, locale) : item.label}
                  </span>

                  {/* Count / Alert badge (visible only when sidebar open) */}
                  {sidebarOpen && count > 0 && (
                    <span
                      className={`
                        mr-auto flex h-5 min-w-[20px] items-center justify-center
                        rounded-full px-1.5 text-xs font-semibold leading-none
                        transition-all duration-300
                        ${
                          item.isAlert
                            ? 'bg-red-500/90 text-white shadow-[0_0_8px_rgba(239,68,68,0.3)]'
                            : 'bg-[rgba(212,165,116,0.12)] text-[#D4A574] ring-1 ring-[rgba(212,165,116,0.15)]'
                        }
                      `}
                    >
                      {count > 99 ? '+99' : count}
                    </span>
                  )}

                  {/* Compact badge (collapsed: small dot) */}
                  {!sidebarOpen && count > 0 && (
                    <span
                      className={`
                        absolute -left-0.5 top-1 h-2 w-2 rounded-full
                        transition-all duration-300
                        ${
                          item.isAlert
                            ? 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]'
                            : 'bg-[#D4A574] shadow-[0_0_4px_rgba(212,165,116,0.4)]'
                        }
                      `}
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ---- Bottom Section ---- */}
      <div className="relative z-10">
        {/* Decorative separator */}
        <div
          className="mx-3 h-px"
          style={{
            background:
              'linear-gradient(to left, transparent 0%, rgba(212,165,116,0.1) 20%, rgba(212,165,116,0.1) 80%, transparent 100%)',
          }}
        />

        <div className="px-4 py-4">
          {/* Logo + brand row */}
          <div
            className={`
              flex items-center justify-center overflow-hidden whitespace-nowrap
              transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
              ${sidebarOpen ? 'flex-row-reverse gap-2' : 'flex-col items-center gap-1'}
            `}
          >
            {/* Gradient orb */}
            <span
              className={`
                animate-logo-gradient inline-block shrink-0 rounded-full
                ${sidebarOpen ? 'h-7 w-7' : 'h-6 w-6'}
                shadow-md shadow-[#D4A574]/15
              `}
              style={{
                background:
                  'linear-gradient(135deg, #D4A574 0%, #E8C9A8 25%, #B07D4F 50%, #D4A574 75%, #E8C9A8 100%)',
                backgroundSize: '200% 200%',
              }}
            />
            {sidebarOpen && (
              <span className="text-sm font-semibold tracking-wide text-[#8B8B9E]">
                AuraLab
              </span>
            )}
          </div>

          {/* Powered by text & version (visible only when open) */}
          <div
            className={`
              mt-2 overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
              ${sidebarOpen ? 'max-h-12 opacity-100' : 'max-h-0 opacity-0'}
            `}
          >
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1 text-[10px] text-[#5A5A6E]">
                <Sparkles size={10} className="text-[#D4A574]/40" />
                <span>{locale === 'ar' ? 'مدعوم بـ AuraLab' : 'Powered by AuraLab'}</span>
                <Sparkles size={10} className="text-[#D4A574]/40" />
              </div>
              <span className="text-[9px] tracking-widest text-[#3E3E4E]">
                v2.7.0
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
    </>
  );
}
