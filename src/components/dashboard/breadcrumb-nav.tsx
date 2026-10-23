'use client';

import { useAppStore } from '@/lib/store';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { ChevronLeft, Home } from 'lucide-react';
import type { ActiveSection } from '@/lib/types';

const SECTION_LABELS: Record<ActiveSection, string> = {
  dashboard: 'لوحة التحكم',
  students: 'الطلاب',
  teachers: 'المعلمون',
  classes: 'الفصول',
  exams: 'الامتحانات',
  sessions: 'الحصص',
  attendance: 'الحضور',
  grades: 'الدرجات',
  messages: 'الرسائل',
  analytics: 'التحليلات',
  reports: 'التقارير',
  announcements: 'الإعلانات',
  notifications: 'الإشعارات',
  trash: 'سلة المحذوفات',
  settings: 'الإعدادات',
  'ai-assistant': 'المساعد الذكي',
  behavior: 'السلوك',
  timetable: 'الجدول الدراسي',
  library: 'المكتبة',
  fees: 'الرسوم',
  camera: 'الكاميرات',
};

export default function BreadcrumbNav() {
  const { activeSection, setActiveSection } = useAppStore();

  return (
    <nav dir="rtl" className="mb-4" aria-label="مسار التنقل">
      <Breadcrumb>
        <BreadcrumbList className="text-sm">
          <BreadcrumbItem>
            <BreadcrumbLink
              asChild
              className="cursor-pointer text-muted-foreground hover:text-[#D4A574] transition-colors"
            >
              <button
                onClick={() => setActiveSection('dashboard')}
                className="flex items-center gap-1.5"
              >
                <Home className="h-3.5 w-3.5" />
                الرئيسية
              </button>
            </BreadcrumbLink>
          </BreadcrumbItem>

          {activeSection !== 'dashboard' && (
            <>
              <BreadcrumbSeparator>
                <ChevronLeft className="h-3 w-3 text-muted-foreground/40" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbPage className="text-[#D4A574] font-medium">
                  {SECTION_LABELS[activeSection] || activeSection}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
    </nav>
  );
}
