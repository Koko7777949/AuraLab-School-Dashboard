'use client';

import { useMemo, useCallback } from 'react';
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
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import type { ActiveSection } from '@/lib/types';

// ---------------------------------------------------------------------------
// Navigation items definition
// ---------------------------------------------------------------------------
interface NavItem {
  id: ActiveSection;
  label: string;
  icon: React.ElementType;
  /** If true, shows a numeric count badge */
  showCount?: boolean;
  /** If true, the badge is a red "unread" dot / count */
  isAlert?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  { id: 'students', label: 'الطلاب', icon: GraduationCap, showCount: true },
  { id: 'teachers', label: 'المعلمون', icon: Users, showCount: true },
  { id: 'classes', label: 'الصفوف', icon: School, showCount: true },
  { id: 'exams', label: 'الامتحانات', icon: FileText, showCount: true },
  { id: 'sessions', label: 'الجلسات', icon: Calendar },
  { id: 'analytics', label: 'التحليلات', icon: BarChart3 },
  { id: 'notifications', label: 'الإشعارات', icon: Bell, isAlert: true },
  { id: 'ai-assistant', label: 'المساعد الذكي', icon: Bot },
  { id: 'trash', label: 'المحذوفات', icon: Trash2, showCount: true },
  { id: 'settings', label: 'الإعدادات', icon: Settings },
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
    notifications,
    trashItems,
  } = useAppStore();

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
      notifications: unreadCount,
      trash: trashItems.length,
    }),
    [students, teachers, classes, exams, unreadCount, trashItems],
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
    <aside
      dir="rtl"
      className={`
        fixed right-0 top-0 z-40 flex h-screen flex-col
        border-l border-[#2A2A38] bg-[#16161E]
        transition-all duration-300 ease-in-out
        ${sidebarOpen ? 'w-60' : 'w-[72px]'}
      `}
    >
      {/* ---- Top: Toggle button ---- */}
      <div
        className={`
          flex h-16 items-center justify-between px-4
          ${sidebarOpen ? 'flex-row-reverse' : 'flex-col items-center justify-center'}
        `}
      >
        {/* App Logo (visible when open) */}
        <div
          className={`
            flex items-center gap-2 overflow-hidden whitespace-nowrap
            transition-all duration-300
            ${sidebarOpen ? 'opacity-100' : 'pointer-events-none absolute opacity-0'}
          `}
        >
          {/* Gradient dot */}
          <span
            className="inline-block h-8 w-8 shrink-0 rounded-lg"
            style={{
              background:
                'linear-gradient(135deg, #D4A574 0%, #B07D4F 100%)',
            }}
          />
          <span className="text-lg font-bold text-white tracking-tight">
            Aura<span className="text-[#D4A574]">Lab</span>
          </span>
        </div>

        {/* Collapse / Expand button */}
        <button
          onClick={toggleSidebar}
          aria-label={sidebarOpen ? 'طي القائمة' : 'توسيع القائمة'}
          className={`
            flex h-9 w-9 shrink-0 items-center justify-center rounded-lg
            text-[#8B8B9E] transition-colors duration-200
            hover:bg-[#1E1E2A] hover:text-[#D4A574]
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A574]/50
            ${!sidebarOpen ? 'mt-0' : ''}
          `}
        >
          {sidebarOpen ? <PanelRightClose size={20} /> : <PanelRightOpen size={20} />}
        </button>
      </div>

      {/* ---- Divider ---- */}
      <div className="mx-3 h-px bg-[#2A2A38]" />

      {/* ---- Navigation list ---- */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3">
        <ul className="flex flex-col gap-1 px-3">
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            const Icon = item.icon;
            const count =
              item.id === 'notifications'
                ? counts.notifications
                : item.showCount
                  ? counts[item.id as keyof typeof counts] ?? 0
                  : 0;

            return (
              <li key={item.id}>
                <button
                  onClick={() => handleNavClick(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  title={!sidebarOpen ? item.label : undefined}
                  className={`
                    group flex w-full items-center gap-3 rounded-xl
                    px-3 py-2.5 text-sm font-medium
                    transition-all duration-200
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A574]/50
                    ${
                      isActive
                        ? 'bg-[#D4A574]/15 text-[#D4A574]'
                        : 'text-[#8B8B9E] hover:bg-[#1E1E2A] hover:text-[#C4C4D4]'
                    }
                    ${sidebarOpen ? 'flex-row-reverse' : 'flex-col items-center justify-center gap-1'}
                  `}
                >
                  {/* Icon */}
                  <span
                    className={`
                      shrink-0 transition-colors duration-200
                      ${isActive ? 'text-[#D4A574]' : 'text-[#8B8B9E] group-hover:text-[#C4C4D4]'}
                    `}
                  >
                    <Icon size={20} strokeWidth={isActive ? 2 : 1.6} />
                  </span>

                  {/* Label */}
                  <span
                    className={`
                      truncate transition-all duration-300
                      ${sidebarOpen ? 'opacity-100 w-auto' : 'pointer-events-none absolute opacity-0 w-0'}
                    `}
                  >
                    {item.label}
                  </span>

                  {/* Count / Alert badge (visible only when sidebar open) */}
                  {sidebarOpen && count > 0 && (
                    <span
                      className={`
                        mr-auto flex h-5 min-w-[20px] items-center justify-center
                        rounded-full px-1.5 text-xs font-semibold leading-none
                        transition-all duration-200
                        ${
                          item.isAlert
                            ? 'bg-red-500/90 text-white'
                            : 'bg-[#D4A574]/15 text-[#D4A574]'
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
                        ${
                          item.isAlert
                            ? 'bg-red-500'
                            : 'bg-[#D4A574]'
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

      {/* ---- Bottom: App name ---- */}
      <div className="border-t border-[#2A2A38] px-4 py-4">
        <div
          className={`
            flex items-center justify-center overflow-hidden whitespace-nowrap
            transition-all duration-300
            ${sidebarOpen ? 'flex-row-reverse gap-2' : 'flex-col items-center gap-1'}
          `}
        >
          {/* Gradient orb */}
          <span
            className={`
              inline-block shrink-0 rounded-full
              ${sidebarOpen ? 'h-7 w-7' : 'h-6 w-6'}
            `}
            style={{
              background:
                'linear-gradient(135deg, #D4A574 0%, #B07D4F 60%, #8B6332 100%)',
            }}
          />
          {sidebarOpen && (
            <span className="text-sm font-semibold tracking-wide text-[#8B8B9E]">
              AuraLab
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}
