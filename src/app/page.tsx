'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import Sidebar from '@/components/dashboard/sidebar';
import Header from '@/components/dashboard/header';
import DashboardOverview from '@/components/dashboard/dashboard-overview';
import StudentsSection from '@/components/dashboard/students-section';
import TeachersSection from '@/components/dashboard/teachers-section';
import ClassesSection from '@/components/dashboard/classes-section';
import ExamsSection from '@/components/dashboard/exams-section';
import SessionsSection from '@/components/dashboard/sessions-section';
import AnalyticsSection from '@/components/dashboard/analytics-section';
import NotificationsSection from '@/components/dashboard/notifications-section';
import AiAssistant from '@/components/dashboard/ai-assistant';
import TrashSection from '@/components/dashboard/trash-section';
import SettingsSection from '@/components/dashboard/settings-section';
import type { ActiveSection } from '@/lib/types';

function SectionRenderer({ section }: { section: ActiveSection }) {
  switch (section) {
    case 'dashboard':
      return <DashboardOverview />;
    case 'students':
      return <StudentsSection />;
    case 'teachers':
      return <TeachersSection />;
    case 'classes':
      return <ClassesSection />;
    case 'exams':
      return <ExamsSection />;
    case 'sessions':
      return <SessionsSection />;
    case 'analytics':
      return <AnalyticsSection />;
    case 'notifications':
      return <NotificationsSection />;
    case 'ai-assistant':
      return <AiAssistant />;
    case 'trash':
      return <TrashSection />;
    case 'settings':
      return <SettingsSection />;
    default:
      return <DashboardOverview />;
  }
}

export default function Home() {
  const { activeSection, sidebarOpen, setSidebarOpen } = useAppStore();

  // Responsive sidebar: close on mobile by default
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setSidebarOpen]);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          sidebarOpen ? 'lg:mr-60' : 'lg:mr-[72px]'
        }`}
      >
        {/* Header */}
        <Header />

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 pt-20">
          <SectionRenderer section={activeSection} />
        </main>

        {/* Footer */}
        <footer className="border-t border-border/50 py-4 px-6 mt-auto">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>© 2025 AuraLab - نظام إدارة المدرسة الذكية</p>
            <p>الإصدار 2.0.0</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
