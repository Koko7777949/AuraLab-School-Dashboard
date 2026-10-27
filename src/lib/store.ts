import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ActiveSection, Student, Teacher, ClassRoom, Exam, Session, TrashItem, AppNotification, ChatMessage, GradeRecord, ReportCard, Message, BehaviorRecord, ScheduleBlock, LibraryBook, FeeRecord, Announcement } from './types';
import type { Locale } from './i18n';

interface CalendarEventItem {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  title: string;
  color: string;
  category: string;
}

interface AdminProfile {
  name: string;
  email: string;
  phone: string;
  role: string;
  avatar: string;
}

interface SchoolInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  logo: string;
}

interface AcademicYearSettings {
  startDate: string;
  endDate: string;
  semester1Name: string;
  semester2Name: string;
}

interface NotificationSettings {
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  soundEnabled: boolean;
}

interface DisplaySettings {
  animationsEnabled: boolean;
}

interface LanguageSettings {
  defaultLanguage: string;
  dateFormat: string;
  timeFormat: string;
  numberFormat: string;
}

interface AppState {
  // Locale (multi-language)
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;

  // Camera settings
  cameraAutoRotate: boolean;
  setCameraAutoRotate: (v: boolean) => void;
  cameraRotateSeconds: number;
  setCameraRotateSeconds: (v: number) => void;

  // Navigation
  activeSection: ActiveSection;
  setActiveSection: (section: ActiveSection) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // Calendar Events
  calendarEvents: CalendarEventItem[];
  setCalendarEvents: (events: CalendarEventItem[]) => void;
  addCalendarEvent: (event: CalendarEventItem) => void;
  deleteCalendarEvent: (id: string) => void;

  // Students
  students: Student[];
  setStudents: (students: Student[]) => void;
  addStudent: (student: Student) => void;
  updateStudent: (id: string, data: Partial<Student>) => void;
  deleteStudent: (id: string) => void;

  // Teachers
  teachers: Teacher[];
  setTeachers: (teachers: Teacher[]) => void;
  addTeacher: (teacher: Teacher) => void;
  updateTeacher: (id: string, data: Partial<Teacher>) => void;
  deleteTeacher: (id: string) => void;

  // Classes
  classes: ClassRoom[];
  setClasses: (classes: ClassRoom[]) => void;
  addClass: (cls: ClassRoom) => void;
  updateClass: (id: string, data: Partial<ClassRoom>) => void;
  deleteClass: (id: string) => void;

  // Exams
  exams: Exam[];
  setExams: (exams: Exam[]) => void;
  addExam: (exam: Exam) => void;
  updateExam: (id: string, data: Partial<Exam>) => void;
  deleteExam: (id: string) => void;

  // Trash
  trashItems: TrashItem[];
  setTrashItems: (items: TrashItem[]) => void;
  addToTrash: (item: TrashItem) => void;
  restoreFromTrash: (id: string) => void;
  removeFromTrash: (id: string) => void;

  // Notifications
  notifications: AppNotification[];
  setNotifications: (notifications: AppNotification[]) => void;
  markNotificationRead: (id: string) => void;
  addNotification: (notification: AppNotification) => void;
  deleteNotification: (id: string) => void;
  markAllNotificationsRead: () => void;

  // AI Chat
  chatMessages: ChatMessage[];
  setChatMessages: (messages: ChatMessage[]) => void;
  addChatMessage: (message: ChatMessage) => void;
  clearChat: () => void;
  isAiLoading: boolean;
  setIsAiLoading: (loading: boolean) => void;

  // Session Timer
  sessionRunning: boolean;
  setSessionRunning: (running: boolean) => void;
  sessionStartTime: number | null;
  setSessionStartTime: (time: number | null) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Grades
  grades: GradeRecord[];
  setGrades: (grades: GradeRecord[]) => void;
  addGrade: (grade: GradeRecord) => void;
  updateGrade: (id: string, data: Partial<GradeRecord>) => void;
  deleteGrade: (id: string) => void;

  // Behaviors
  behaviors: BehaviorRecord[];
  setBehaviors: (behaviors: BehaviorRecord[]) => void;
  addBehavior: (behavior: BehaviorRecord) => void;
  updateBehavior: (id: string, data: Partial<BehaviorRecord>) => void;
  deleteBehavior: (id: string) => void;

  // Messages
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, data: Partial<Message>) => void;
  deleteMessage: (id: string) => void;
  archiveMessage: (id: string) => void;
  unarchiveMessage: (id: string) => void;
  toggleMessageStar: (id: string) => void;
  markMessageRead: (id: string) => void;

  // Schedule Blocks
  scheduleBlocks: ScheduleBlock[];
  setScheduleBlocks: (blocks: ScheduleBlock[]) => void;
  addScheduleBlock: (block: ScheduleBlock) => void;
  updateScheduleBlock: (id: string, data: Partial<ScheduleBlock>) => void;
  deleteScheduleBlock: (id: string) => void;

  // Library Books
  libraryBooks: LibraryBook[];
  setLibraryBooks: (books: LibraryBook[]) => void;
  addLibraryBook: (book: LibraryBook) => void;
  updateLibraryBook: (id: string, data: Partial<LibraryBook>) => void;
  deleteLibraryBook: (id: string) => void;

  // Fees
  fees: FeeRecord[];
  setFees: (fees: FeeRecord[]) => void;
  addFee: (fee: FeeRecord) => void;
  updateFee: (id: string, data: Partial<FeeRecord>) => void;
  deleteFee: (id: string) => void;

  // Announcements
  announcements: Announcement[];
  setAnnouncements: (announcements: Announcement[]) => void;
  addAnnouncement: (announcement: Announcement) => void;
  updateAnnouncement: (id: string, data: Partial<Announcement>) => void;
  deleteAnnouncement: (id: string) => void;
  toggleAnnouncementPin: (id: string) => void;

  // Sessions
  sessions: Session[];
  setSessions: (sessions: Session[]) => void;
  addSession: (session: Session) => void;
  updateSession: (id: string, data: Partial<Session>) => void;
  deleteSession: (id: string) => void;

  // Report Cards
  reportCards: ReportCard[];
  setReportCards: (reportCards: ReportCard[]) => void;
  addReportCard: (reportCard: ReportCard) => void;
  updateReportCard: (id: string, data: Partial<ReportCard>) => void;
  deleteReportCard: (id: string) => void;

  // Theme Customizer
  accentColor: string;
  setAccentColor: (color: string) => void;
  uiDensity: 'compact' | 'default' | 'comfortable';
  setUiDensity: (density: 'compact' | 'default' | 'comfortable') => void;
  borderRadius: number;
  setBorderRadius: (radius: number) => void;
  backgroundStyle: 'solid' | 'gradient' | 'dots';
  setBackgroundStyle: (style: 'solid' | 'gradient' | 'dots') => void;

  // Admin Profile
  adminProfile: AdminProfile;
  setAdminProfile: (profile: AdminProfile) => void;
  updateAdminProfile: (data: Partial<AdminProfile>) => void;

  // School Info
  schoolInfo: SchoolInfo;
  setSchoolInfo: (info: SchoolInfo) => void;
  updateSchoolInfo: (data: Partial<SchoolInfo>) => void;

  // Academic Year Settings
  academicYear: AcademicYearSettings;
  setAcademicYear: (settings: AcademicYearSettings) => void;
  updateAcademicYear: (data: Partial<AcademicYearSettings>) => void;

  // Notification Settings
  notificationSettings: NotificationSettings;
  setNotificationSettings: (settings: NotificationSettings) => void;
  updateNotificationSettings: (data: Partial<NotificationSettings>) => void;

  // Display Settings
  displaySettings: DisplaySettings;
  setDisplaySettings: (settings: DisplaySettings) => void;
  updateDisplaySettings: (data: Partial<DisplaySettings>) => void;

  // Language Settings
  languageSettings: LanguageSettings;
  setLanguageSettings: (settings: LanguageSettings) => void;
  updateLanguageSettings: (data: Partial<LanguageSettings>) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Locale
      locale: 'ar',
      setLocale: (locale) => set({ locale }),
      toggleLocale: () => set((state) => ({ locale: state.locale === 'ar' ? 'en' : 'ar' })),

      // Camera settings
      cameraAutoRotate: false,
      setCameraAutoRotate: (v) => set({ cameraAutoRotate: v }),
      cameraRotateSeconds: 8,
      setCameraRotateSeconds: (v) => set({ cameraRotateSeconds: v }),

      // Navigation
      activeSection: 'dashboard',
      setActiveSection: (section) => set({ activeSection: section }),
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      // Calendar Events
      calendarEvents: [],
      setCalendarEvents: (events) => set({ calendarEvents: events }),
      addCalendarEvent: (event) => set((state) => ({ calendarEvents: [...state.calendarEvents, event] })),
      deleteCalendarEvent: (id) => set((state) => ({ calendarEvents: state.calendarEvents.filter((e) => e.id !== id) })),

      // Students
      students: [],
      setStudents: (students) => set({ students }),
      addStudent: (student) => set((state) => ({ students: [...state.students, student] })),
      updateStudent: (id, data) => set((state) => ({
        students: state.students.map((s) => (s.id === id ? { ...s, ...data } : s)),
      })),
      deleteStudent: (id) => set((state) => ({
        students: state.students.filter((s) => s.id !== id),
      })),

      // Teachers
      teachers: [],
      setTeachers: (teachers) => set({ teachers }),
      addTeacher: (teacher) => set((state) => ({ teachers: [...state.teachers, teacher] })),
      updateTeacher: (id, data) => set((state) => ({
        teachers: state.teachers.map((t) => (t.id === id ? { ...t, ...data } : t)),
      })),
      deleteTeacher: (id) => set((state) => ({
        teachers: state.teachers.filter((t) => t.id !== id),
      })),

      // Classes
      classes: [],
      setClasses: (classes) => set({ classes }),
      addClass: (cls) => set((state) => ({ classes: [...state.classes, cls] })),
      updateClass: (id, data) => set((state) => ({
        classes: state.classes.map((c) => (c.id === id ? { ...c, ...data } : c)),
      })),
      deleteClass: (id) => set((state) => ({
        classes: state.classes.filter((c) => c.id !== id),
      })),

      // Exams
      exams: [],
      setExams: (exams) => set({ exams }),
      addExam: (exam) => set((state) => ({ exams: [...state.exams, exam] })),
      updateExam: (id, data) => set((state) => ({
        exams: state.exams.map((e) => (e.id === id ? { ...e, ...data } : e)),
      })),
      deleteExam: (id) => set((state) => ({
        exams: state.exams.filter((e) => e.id !== id),
      })),

      // Trash
      trashItems: [],
      setTrashItems: (items) => set({ trashItems: items }),
      addToTrash: (item) => set((state) => ({ trashItems: [...state.trashItems, item] })),
      restoreFromTrash: (id) => set((state) => {
        const item = state.trashItems.find((t) => t.id === id);
        const patch: Record<string, unknown> = {
          trashItems: state.trashItems.filter((t) => t.id !== id),
        };
        if (item) {
          try {
            const data = JSON.parse(item.dataJson);
            switch (item.itemType) {
              case 'student':
                if (!state.students.find((s) => s.id === data.id)) {
                  patch.students = [...state.students, data as Student];
                }
                break;
              case 'teacher':
                if (!state.teachers.find((t) => t.id === data.id)) {
                  patch.teachers = [...state.teachers, data as Teacher];
                }
                break;
              case 'class':
                if (!state.classes.find((c) => c.id === data.id)) {
                  patch.classes = [...state.classes, data as ClassRoom];
                }
                break;
              case 'exam':
                if (!state.exams.find((e) => e.id === data.id)) {
                  patch.exams = [...state.exams, data as Exam];
                }
                break;
              case 'grade':
                if (!state.grades.find((g) => g.id === data.id)) {
                  patch.grades = [...state.grades, data as GradeRecord];
                }
                break;
              case 'message':
                if (!state.messages.find((m) => m.id === data.id)) {
                  patch.messages = [...state.messages, data as Message];
                }
                break;
              case 'behavior':
                if (!state.behaviors.find((b) => b.id === data.id)) {
                  patch.behaviors = [...state.behaviors, data as BehaviorRecord];
                }
                break;
              case 'schedule':
                if (!state.scheduleBlocks.find((b) => b.id === data.id)) {
                  patch.scheduleBlocks = [...state.scheduleBlocks, data as ScheduleBlock];
                }
                break;
              case 'library-book':
                if (!state.libraryBooks.find((b) => b.id === data.id)) {
                  patch.libraryBooks = [...state.libraryBooks, data as LibraryBook];
                }
                break;
            }
          } catch {
            // dataJson parse failed — still remove from trash
          }
        }
        return patch;
      }),
      removeFromTrash: (id) => set((state) => ({
        trashItems: state.trashItems.filter((t) => t.id !== id),
      })),

      // Notifications
      notifications: [],
      setNotifications: (notifications) => set({ notifications }),
      markNotificationRead: (id) => set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        ),
      })),
      addNotification: (notification) => set((state) => ({
        notifications: [notification, ...state.notifications],
      })),
      deleteNotification: (id) => set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      })),
      markAllNotificationsRead: () => set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      })),

      // AI Chat
      chatMessages: [],
      setChatMessages: (messages) => set({ chatMessages: messages }),
      addChatMessage: (message) => set((state) => ({
        chatMessages: [...state.chatMessages, message],
      })),
      clearChat: () => set({ chatMessages: [] }),
      isAiLoading: false,
      setIsAiLoading: (loading) => set({ isAiLoading: loading }),

      // Session Timer
      sessionRunning: false,
      setSessionRunning: (running) => set({ sessionRunning: running }),
      sessionStartTime: null,
      setSessionStartTime: (time) => set({ sessionStartTime: time }),

      // Search
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),

      // Grades
      grades: [],
      setGrades: (grades) => set({ grades }),
      addGrade: (grade) => set((state) => ({ grades: [...state.grades, grade] })),
      updateGrade: (id, data) => set((state) => ({
        grades: state.grades.map((g) => (g.id === id ? { ...g, ...data } : g)),
      })),
      deleteGrade: (id) => set((state) => ({
        grades: state.grades.filter((g) => g.id !== id),
      })),

      // Behaviors
      behaviors: [],
      setBehaviors: (behaviors) => set({ behaviors }),
      addBehavior: (behavior) => set((state) => ({ behaviors: [...state.behaviors, behavior] })),
      updateBehavior: (id, data) => set((state) => ({
        behaviors: state.behaviors.map((b) => (b.id === id ? { ...b, ...data } : b)),
      })),
      deleteBehavior: (id) => set((state) => ({
        behaviors: state.behaviors.filter((b) => b.id !== id),
      })),

      // Messages
      messages: [],
      setMessages: (messages) => set({ messages }),
      addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
      updateMessage: (id, data) => set((state) => ({
        messages: state.messages.map((m) => (m.id === id ? { ...m, ...data } : m)),
      })),
      deleteMessage: (id) => set((state) => ({
        messages: state.messages.filter((m) => m.id !== id),
      })),
      archiveMessage: (id) => set((state) => ({
        messages: state.messages.map((m) =>
          m.id === id ? { ...m, isArchived: true } : m
        ),
      })),
      unarchiveMessage: (id) => set((state) => ({
        messages: state.messages.map((m) =>
          m.id === id ? { ...m, isArchived: false } : m
        ),
      })),
      toggleMessageStar: (id) => set((state) => ({
        messages: state.messages.map((m) =>
          m.id === id ? { ...m, isStarred: !m.isStarred } : m
        ),
      })),
      markMessageRead: (id) => set((state) => ({
        messages: state.messages.map((m) =>
          m.id === id ? { ...m, isRead: true } : m
        ),
      })),

      // Schedule Blocks
      scheduleBlocks: [],
      setScheduleBlocks: (blocks) => set({ scheduleBlocks: blocks }),
      addScheduleBlock: (block) => set((state) => ({ scheduleBlocks: [...state.scheduleBlocks, block] })),
      updateScheduleBlock: (id, data) => set((state) => ({
        scheduleBlocks: state.scheduleBlocks.map((b) => (b.id === id ? { ...b, ...data } : b)),
      })),
      deleteScheduleBlock: (id) => set((state) => ({
        scheduleBlocks: state.scheduleBlocks.filter((b) => b.id !== id),
      })),

      // Library Books
      libraryBooks: [],
      setLibraryBooks: (books) => set({ libraryBooks: books }),
      addLibraryBook: (book) => set((state) => ({ libraryBooks: [...state.libraryBooks, book] })),
      updateLibraryBook: (id, data) => set((state) => ({
        libraryBooks: state.libraryBooks.map((b) => (b.id === id ? { ...b, ...data } : b)),
      })),
      deleteLibraryBook: (id) => set((state) => ({
        libraryBooks: state.libraryBooks.filter((b) => b.id !== id),
      })),

      // Fees
      fees: [],
      setFees: (fees) => set({ fees }),
      addFee: (fee) => set((state) => ({ fees: [...state.fees, fee] })),
      updateFee: (id, data) => set((state) => ({
        fees: state.fees.map((f) => (f.id === id ? { ...f, ...data } : f)),
      })),
      deleteFee: (id) => set((state) => ({
        fees: state.fees.filter((f) => f.id !== id),
      })),

      // Announcements
      announcements: [],
      setAnnouncements: (announcements) => set({ announcements }),
      addAnnouncement: (announcement) => set((state) => ({ announcements: [...state.announcements, announcement] })),
      updateAnnouncement: (id, data) => set((state) => ({
        announcements: state.announcements.map((a) => (a.id === id ? { ...a, ...data } : a)),
      })),
      deleteAnnouncement: (id) => set((state) => ({
        announcements: state.announcements.filter((a) => a.id !== id),
      })),
      toggleAnnouncementPin: (id) => set((state) => ({
        announcements: state.announcements.map((a) => (a.id === id ? { ...a, pinned: !a.pinned } : a)),
      })),

      // Sessions
      sessions: [],
      setSessions: (sessions) => set({ sessions }),
      addSession: (session) => set((state) => ({ sessions: [...state.sessions, session] })),
      updateSession: (id, data) => set((state) => ({
        sessions: state.sessions.map((s) => (s.id === id ? { ...s, ...data } : s)),
      })),
      deleteSession: (id) => set((state) => ({
        sessions: state.sessions.filter((s) => s.id !== id),
      })),

      // Report Cards
      reportCards: [],
      setReportCards: (reportCards) => set({ reportCards }),
      addReportCard: (reportCard) => set((state) => ({ reportCards: [...state.reportCards, reportCard] })),
      updateReportCard: (id, data) => set((state) => ({
        reportCards: state.reportCards.map((r) => (r.id === id ? { ...r, ...data } : r)),
      })),
      deleteReportCard: (id) => set((state) => ({
        reportCards: state.reportCards.filter((r) => r.id !== id),
      })),

      // Theme Customizer
      accentColor: '#D4A574',
      setAccentColor: (color) => set({ accentColor: color }),
      uiDensity: 'default',
      setUiDensity: (density) => set({ uiDensity: density }),
      borderRadius: 8,
      setBorderRadius: (radius) => set({ borderRadius: radius }),
      backgroundStyle: 'dots',
      setBackgroundStyle: (style) => set({ backgroundStyle: style }),

      // Admin Profile
      adminProfile: {
        name: 'مدير النظام',
        email: 'admin@auralab.edu.sa',
        phone: '+966 5x xxx xxxx',
        role: 'مدير النظام',
        avatar: '',
      },
      setAdminProfile: (profile) => set({ adminProfile: profile }),
      updateAdminProfile: (data) => set((state) => ({
        adminProfile: { ...state.adminProfile, ...data },
      })),

      // School Info
      schoolInfo: {
        name: 'مدرسة الأفق الخاصّة',
        address: 'الرياض، حي الملقا، شارع الأمير سلطان',
        phone: '+966 11 xxx xxxx',
        email: 'info@alofuq.edu.sa',
        logo: '',
      },
      setSchoolInfo: (info) => set({ schoolInfo: info }),
      updateSchoolInfo: (data) => set((state) => ({
        schoolInfo: { ...state.schoolInfo, ...data },
      })),

      // Academic Year Settings
      academicYear: {
        startDate: '2025-09-01',
        endDate: '2026-06-30',
        semester1Name: 'الفصل الدراسي الأول',
        semester2Name: 'الفصل الدراسي الثاني',
      },
      setAcademicYear: (settings) => set({ academicYear: settings }),
      updateAcademicYear: (data) => set((state) => ({
        academicYear: { ...state.academicYear, ...data },
      })),

      // Notification Settings
      notificationSettings: {
        emailEnabled: true,
        smsEnabled: false,
        pushEnabled: true,
        soundEnabled: true,
      },
      setNotificationSettings: (settings) => set({ notificationSettings: settings }),
      updateNotificationSettings: (data) => set((state) => ({
        notificationSettings: { ...state.notificationSettings, ...data },
      })),

      // Display Settings
      displaySettings: {
        animationsEnabled: true,
      },
      setDisplaySettings: (settings) => set({ displaySettings: settings }),
      updateDisplaySettings: (data) => set((state) => ({
        displaySettings: { ...state.displaySettings, ...data },
      })),

      // Language Settings
      languageSettings: {
        defaultLanguage: 'ar',
        dateFormat: 'yyyy/mm/dd',
        timeFormat: '24h',
        numberFormat: 'arabic',
      },
      setLanguageSettings: (settings) => set({ languageSettings: settings }),
      updateLanguageSettings: (data) => set((state) => ({
        languageSettings: { ...state.languageSettings, ...data },
      })),
    }),
    {
      name: 'auralab-store',
      partialize: (state) => ({
        locale: state.locale,
        cameraAutoRotate: state.cameraAutoRotate,
        cameraRotateSeconds: state.cameraRotateSeconds,
        students: state.students,
        teachers: state.teachers,
        classes: state.classes,
        exams: state.exams,
        grades: state.grades,
        behaviors: state.behaviors,
        messages: state.messages,
        scheduleBlocks: state.scheduleBlocks,
        libraryBooks: state.libraryBooks,
        fees: state.fees,
        announcements: state.announcements,
        trashItems: state.trashItems,
        notifications: state.notifications,
        chatMessages: state.chatMessages,
        accentColor: state.accentColor,
        uiDensity: state.uiDensity,
        borderRadius: state.borderRadius,
        backgroundStyle: state.backgroundStyle,
        activeSection: state.activeSection,
        calendarEvents: state.calendarEvents,
        adminProfile: state.adminProfile,
        sessions: state.sessions,
        reportCards: state.reportCards,
        schoolInfo: state.schoolInfo,
        academicYear: state.academicYear,
        notificationSettings: state.notificationSettings,
        displaySettings: state.displaySettings,
        languageSettings: state.languageSettings,
      }),
    }
  )
);
