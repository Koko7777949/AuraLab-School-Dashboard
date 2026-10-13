'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from '@/components/ui/command';
import { useAppStore } from '@/lib/store';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  BookOpen,
  FileText,
  Timer,
  ClipboardCheck,
  BarChart3,
  Bell,
  Bot,
  Trash2,
  Settings,
  UserPlus,
  CalendarPlus,
  ClipboardList,
  Search,
  MessageSquare,
  BookMarked,
  CreditCard,
  Megaphone,
  Brain,
  Calendar,
} from 'lucide-react';
import type { ActiveSection } from '@/lib/types';

// ---------------------------------------------------------------------------
// Navigation items
// ---------------------------------------------------------------------------

interface NavItem {
  id: ActiveSection;
  label: string;
  icon: React.ElementType;
  shortcut?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard, shortcut: 'D' },
  { id: 'students', label: 'الطلاب', icon: GraduationCap, shortcut: 'S' },
  { id: 'teachers', label: 'المعلمون', icon: Users, shortcut: 'T' },
  { id: 'classes', label: 'الصفوف', icon: BookOpen, shortcut: 'C' },
  { id: 'exams', label: 'الامتحانات', icon: FileText, shortcut: 'E' },
  { id: 'sessions', label: 'الجلسات', icon: Timer },
  { id: 'attendance', label: 'الحضور', icon: ClipboardCheck },
  { id: 'grades', label: 'الدرجات', icon: BarChart3 },
  { id: 'behavior', label: 'السلوك', icon: Brain },
  { id: 'timetable', label: 'الجدول', icon: Calendar },
  { id: 'analytics', label: 'التحليلات', icon: BarChart3 },
  { id: 'reports', label: 'التقارير', icon: BookMarked },
  { id: 'announcements', label: 'الإعلانات', icon: Megaphone },
  { id: 'messages', label: 'الرسائل', icon: MessageSquare },
  { id: 'notifications', label: 'الإشعارات', icon: Bell, shortcut: 'N' },
  { id: 'library', label: 'المكتبة', icon: BookOpen },
  { id: 'fees', label: 'الرسوم', icon: CreditCard },
  { id: 'ai-assistant', label: 'المساعد الذكي', icon: Bot, shortcut: 'A' },
  { id: 'trash', label: 'سلة المحذوفات', icon: Trash2 },
  { id: 'settings', label: 'الإعدادات', icon: Settings },
];

// ---------------------------------------------------------------------------
// Quick Actions
// ---------------------------------------------------------------------------

interface QuickAction {
  label: string;
  icon: React.ElementType;
  section: ActiveSection;
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: 'إضافة طالب جديد', icon: UserPlus, section: 'students' },
  { label: 'إنشاء امتحان', icon: CalendarPlus, section: 'exams' },
  { label: 'تسجيل حضور', icon: ClipboardList, section: 'attendance' },
  { label: 'إرسال إشعار', icon: Bell, section: 'notifications' },
  { label: 'عرض التقارير', icon: BarChart3, section: 'analytics' },
];

// ---------------------------------------------------------------------------
// Command Palette Component
// ---------------------------------------------------------------------------

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const { setActiveSection, students, teachers } = useAppStore();

  // ── Keyboard shortcut: Ctrl+K (or Cmd+K on Mac) ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only open with Cmd/Ctrl+K when no other input is focused
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        // Don't interfere if a dialog is already open or input focused
        const tag = document.activeElement?.tagName?.toLowerCase();
        if (tag === 'input' || tag === 'textarea') return;
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNavigate = useCallback((section: ActiveSection) => {
    setActiveSection(section);
    setOpen(false);
  }, [setActiveSection]);

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="لوحة الأوامر"
      description="ابحث عن قسم أو نفذ إجراءً سريعاً"
      className="sm:max-w-lg"
    >
      <div dir="rtl">
        <CommandInput placeholder="ابحث عن قسم، طالب، معلم..." />
        <CommandList className="max-h-[350px]">
          <CommandEmpty>لم يتم العثور على نتائج</CommandEmpty>

          {/* ── Quick Actions ── */}
          <CommandGroup heading="إجراءات سريعة">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <CommandItem
                  key={action.label}
                  onSelect={() => handleNavigate(action.section)}
                  className="flex items-center gap-3 cursor-pointer rounded-lg px-3 py-2
                    transition-all duration-200
                    data-[selected=true]:bg-[#D4A574]/10 data-[selected=true]:text-[#D4A574]"
                >
                  <Icon className="h-4 w-4 text-[#D4A574]" />
                  <span className="text-sm">{action.label}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>

          {/* ── Navigation ── */}
          <CommandGroup heading="التنقل">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem
                  key={item.id}
                  onSelect={() => handleNavigate(item.id)}
                  className="flex items-center gap-3 cursor-pointer rounded-lg px-3 py-2
                    transition-all duration-200
                    data-[selected=true]:bg-[#D4A574]/10 data-[selected=true]:text-[#D4A574]"
                >
                  <Icon className="h-4 w-4 text-slate-400" />
                  <span className="text-sm">{item.label}</span>
                  {item.shortcut && (
                    <CommandShortcut className="text-[10px] text-slate-500 bg-white/[0.06] px-1.5 py-0.5 rounded font-bold">
                      {item.shortcut}
                    </CommandShortcut>
                  )}
                </CommandItem>
              );
            })}
          </CommandGroup>

          {/* ── Search Students ── */}
          {students.length > 0 && (
            <CommandGroup heading="الطلاب">
              {students.slice(0, 5).map((student) => (
                <CommandItem
                  key={student.id}
                  onSelect={() => handleNavigate('students')}
                  className="flex items-center gap-3 cursor-pointer rounded-lg px-3 py-2
                    transition-all duration-200
                    data-[selected=true]:bg-[#D4A574]/10 data-[selected=true]:text-[#D4A574]"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#D4A574]/10 text-xs font-bold text-[#D4A574]">
                    {student.name.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm">{student.name}</span>
                    <span className="text-[10px] text-slate-500">{student.className || student.studentId}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* ── Search Teachers ── */}
          {teachers.length > 0 && (
            <CommandGroup heading="المعلمون">
              {teachers.slice(0, 5).map((teacher) => (
                <CommandItem
                  key={teacher.id}
                  onSelect={() => handleNavigate('teachers')}
                  className="flex items-center gap-3 cursor-pointer rounded-lg px-3 py-2
                    transition-all duration-200
                    data-[selected=true]:bg-[#D4A574]/10 data-[selected=true]:text-[#D4A574]"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-bold text-emerald-400">
                    {teacher.name.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm">{teacher.name}</span>
                    <span className="text-[10px] text-slate-500">{teacher.subject}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </div>
    </CommandDialog>
  );
}
