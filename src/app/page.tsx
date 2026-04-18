'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import Sidebar from '@/components/dashboard/sidebar';
import Header from '@/components/dashboard/header';
import DashboardOverview from '@/components/dashboard/dashboard-overview';
import StudentsSection from '@/components/dashboard/students-section';
import TeachersSection from '@/components/dashboard/teachers-section';
import ClassesSection from '@/components/dashboard/classes-section';
import ExamsSection from '@/components/dashboard/exams-section';
import SessionsSection from '@/components/dashboard/sessions-section';
import AttendanceSection from '@/components/dashboard/attendance-section';
import GradesSection from '@/components/dashboard/grades-section';
import AnalyticsSection from '@/components/dashboard/analytics-section';
import AnnouncementsSection from '@/components/dashboard/announcements-section';
import MessagesSection from '@/components/dashboard/messages-section';
import NotificationsSection from '@/components/dashboard/notifications-section';
import AiAssistant from '@/components/dashboard/ai-assistant';
import TrashSection from '@/components/dashboard/trash-section';
import SettingsSection from '@/components/dashboard/settings-section';
import KeyboardShortcuts from '@/components/dashboard/keyboard-shortcuts';
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
    case 'attendance':
      return <AttendanceSection />;
    case 'grades':
      return <GradesSection />;
    case 'analytics':
      return <AnalyticsSection />;
    case 'announcements':
      return <AnnouncementsSection />;
    case 'messages':
      return <MessagesSection />;
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

function LoadingOverlay() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  const handleDismiss = useCallback(() => {
    setFadeOut(true);
    setTimeout(() => setVisible(false), 300);
  }, []);

  useEffect(() => {
    const timer = setTimeout(handleDismiss, 600);
    return () => clearTimeout(timer);
  }, [handleDismiss]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center ${
        fadeOut ? 'animate-loading-fade-out' : ''
      }`}
      style={{ backgroundColor: '#121218' }}
    >
      {/* Glass card container */}
      <div className="glass-card-elevated rounded-2xl px-10 py-8 flex flex-col items-center gap-5">
        {/* Amber logo dot with pulse rings */}
        <div className="relative w-14 h-14 flex items-center justify-center">
          {/* Outer pulse ring */}
          <span className="absolute inset-0 rounded-full bg-amber-accent/20 animate-loading-pulse-ring" />
          {/* Inner pulse ring (delayed) */}
          <span
            className="absolute inset-0 rounded-full bg-amber-accent/15 animate-loading-pulse-ring"
            style={{ animationDelay: '0.5s' }}
          />
          {/* Core dot */}
          <span className="relative w-6 h-6 rounded-full bg-amber-accent animate-loading-pulse-dot shadow-lg" />
        </div>

        {/* Brand name */}
        <div className="text-center space-y-1">
          <p className="text-lg font-semibold text-foreground tracking-wide">
            AuraLab
          </p>
          <p className="text-xs text-muted-foreground">
            جارٍ تحميل لوحة التحكم...
          </p>
        </div>
      </div>
    </div>
  );
}

const footerQuickLinks = [
  { label: 'سياسة الخصوصية', disabled: true },
  { label: 'الشروط والأحكام', disabled: true },
  { label: 'المساعدة', disabled: true },
] as const;

export default function Home() {
  const { activeSection, sidebarOpen, setSidebarOpen, students } = useAppStore();
  const [isStoreReady, setIsStoreReady] = useState(false);

  // Mark store as ready once initial data has been hydrated
  useEffect(() => {
    // Give Zustand a tick to initialize
    const readyTimer = setTimeout(() => setIsStoreReady(true), 50);
    return () => clearTimeout(readyTimer);
  }, []);

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
    <>
      {/* Loading overlay */}
      {!isStoreReady && <LoadingOverlay />}

      <div className="min-h-screen bg-background flex relative overflow-hidden">
        {/* Floating Ambient Orbs - decorative background elements */}
        <div className="ambient-orb-1 pointer-events-none" aria-hidden="true" />
        <div className="ambient-orb-2 pointer-events-none" aria-hidden="true" />
        <div className="ambient-orb-3 pointer-events-none" aria-hidden="true" />
        
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
            {/* Section transition: key triggers re-mount + animation */}
            <div key={activeSection} className="animate-section-fade-in-up">
              <SectionRenderer section={activeSection} />
            </div>
          </main>

          {/* Footer */}
          <footer className="mt-auto">
            {/* Gradient separator line */}
            <div
              className="h-px mx-4 md:mx-6 lg:mx-8"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(212,165,116,0.25) 30%, rgba(212,165,116,0.4) 50%, rgba(212,165,116,0.25) 70%, transparent 100%)',
              }}
            />

            <div className="px-4 md:px-6 lg:px-8 py-5">
              {/* Desktop layout: three columns */}
              <div className="hidden md:flex items-center justify-between">
                {/* Copyright with amber dot */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span
                    className="inline-block w-2 h-2 rounded-full bg-amber-accent flex-shrink-0"
                    aria-hidden="true"
                  />
                  <span>© 2025 AuraLab — نظام إدارة المدرسة الذكية</span>
                </div>

                {/* Quick links */}
                <nav className="flex items-center gap-1" aria-label="روابط سريعة">
                  {footerQuickLinks.map((link) => (
                    <button
                      key={link.label}
                      disabled={link.disabled}
                      className="px-3 py-1.5 text-xs text-muted-foreground/60 rounded-md
                                 transition-colors duration-200
                                 hover:text-muted-foreground hover:bg-white/[0.03]
                                 disabled:cursor-not-allowed disabled:opacity-50"
                      title={link.disabled ? 'قريباً' : undefined}
                    >
                      {link.label}
                      {link.disabled && (
                        <span className="mr-1 text-[10px] text-amber-accent/50">
                          (قريباً)
                        </span>
                      )}
                    </button>
                  ))}
                </nav>

                {/* Version */}
                <p className="text-xs text-muted-foreground/50">الإصدار 2.2.0</p>
              </div>

              {/* Mobile layout: stacked */}
              <div className="flex flex-col md:hidden items-center gap-3 text-center">
                {/* Copyright with amber dot */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span
                    className="inline-block w-2 h-2 rounded-full bg-amber-accent flex-shrink-0"
                    aria-hidden="true"
                  />
                  <span>© 2025 AuraLab</span>
                </div>

                {/* Quick links row */}
                <nav className="flex items-center gap-3" aria-label="روابط سريعة">
                  {footerQuickLinks.map((link) => (
                    <button
                      key={link.label}
                      disabled={link.disabled}
                      className="px-2 py-1 text-xs text-muted-foreground/50 rounded
                                 transition-colors duration-200
                                 hover:text-muted-foreground
                                 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {link.label}
                    </button>
                  ))}
                </nav>

                <p className="text-[11px] text-muted-foreground/40">الإصدار 2.2.0</p>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* Keyboard Shortcuts Overlay (global) */}
      <KeyboardShortcuts />
    </>
  );
}
