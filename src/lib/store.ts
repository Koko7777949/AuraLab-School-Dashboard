import { create } from 'zustand';
import type { ActiveSection, Student, Teacher, ClassRoom, Exam, TrashItem, AppNotification, ChatMessage, GradeRecord, Message } from './types';

interface AppState {
  // Navigation
  activeSection: ActiveSection;
  setActiveSection: (section: ActiveSection) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

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

  // Messages
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, data: Partial<Message>) => void;
  deleteMessage: (id: string) => void;
  archiveMessage: (id: string) => void;
  toggleMessageStar: (id: string) => void;
  markMessageRead: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Navigation
  activeSection: 'dashboard',
  setActiveSection: (section) => set({ activeSection: section }),
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

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
      m.id === id ? { ...m, isArchived: !m.isArchived } : m
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
}));
