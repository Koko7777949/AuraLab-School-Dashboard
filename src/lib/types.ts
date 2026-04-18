// ============================================================
// AuraLab - Types & Interfaces
// ============================================================

export interface Student {
  id: string;
  name: string;
  studentId: string;
  classId: string | null;
  status: 'active' | 'inactive' | 'graduated';
  notes: string;
  psychBackground: string;
  avatar: string;
  createdAt: string;
  updatedAt: string;
  className?: string;
}

export interface Teacher {
  id: string;
  name: string;
  subject: string;
  status: 'active' | 'inactive';
  permissions: 'admin' | 'teacher' | 'supervisor';
  avatar: string;
  email: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
  classNames?: string[];
}

export interface ClassRoom {
  id: string;
  name: string;
  grade: string;
  room: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  studentCount?: number;
  teacherNames?: string[];
}

export interface Exam {
  id: string;
  title: string;
  subject: string;
  studentId: string | null;
  classId: string | null;
  teacherId: string | null;
  score: number | null;
  maxScore: number;
  date: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  studentName?: string;
  teacherName?: string;
  className?: string;
}

export interface Session {
  id: string;
  classId: string | null;
  teacherId: string | null;
  date: string;
  startTime: string | null;
  endTime: string | null;
  engagementAvg: number | null;
  topic: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  className?: string;
  teacherName?: string;
}

export interface TrashItem {
  id: string;
  itemType: 'student' | 'teacher' | 'class' | 'exam' | 'grade' | 'message' | 'behavior' | 'schedule' | 'library-book';
  itemId: string;
  itemName: string;
  deletedBy: string;
  dataJson: string;
  restoredAt: string | null;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  isRead: boolean;
  createdAt: string;
}

export interface SystemSetting {
  id: string;
  key: string;
  value: string;
  updatedAt: string;
}

export interface GradeRecord {
  id: string;
  studentId: string;
  studentName?: string;
  classId?: string;
  className?: string;
  subject: string;
  term: string;
  examType: string;
  score: number;
  maxScore: number;
  weight: number;
  date: string;
  notes: string;
  createdAt: string;
}

export interface ReportCard {
  id: string;
  studentId: string;
  studentName?: string;
  className?: string;
  term: string;
  gpa: number;
  totalScore: number;
  rank: number;
  totalStudents: number;
  grades: GradeRecord[];
  behaviorGrade: string;
  attendanceRate: number;
  teacherComment: string;
  createdAt: string;
}

export interface BehaviorRecord {
  id: string;
  studentId: string;
  studentName?: string;
  classId?: string;
  className?: string;
  date: string;
  type: 'positive' | 'negative';
  category: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  action: string;
  points: number;
  recordedBy: string;
  createdAt: string;
}

export interface ScheduleBlock {
  id: string;
  dayOfWeek: 'sat' | 'sun' | 'mon' | 'tue' | 'wed' | 'thu';
  period: number;
  subject: string;
  teacherId: string | null;
  teacherName?: string;
  classId: string | null;
  className?: string;
  room: string;
  startTime: string;
  endTime: string;
  color: string;
  notes: string;
}

export type ActiveSection = 
  | 'dashboard' 
  | 'students' 
  | 'teachers' 
  | 'classes' 
  | 'exams' 
  | 'sessions'
  | 'attendance'
  | 'grades'
  | 'messages'
  | 'analytics' 
  | 'reports'
  | 'announcements'
  | 'notifications' 
  | 'trash' 
  | 'settings' 
  | 'ai-assistant'
  | 'behavior'
  | 'timetable'
  | 'library';

export interface KpiData {
  label: string;
  value: string | number;
  percentage?: number;
  status: 'stable' | 'improved' | 'needs-attention' | 'active' | 'completed' | 'critical';
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
  subtext?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName?: string;
  classId?: string;
  className?: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes: string;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: 'general' | 'academic' | 'event' | 'urgent' | 'parent';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  author: string;
  pinned: boolean;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'admin' | 'teacher' | 'parent' | 'student';
  recipientId: string;
  recipientName: string;
  recipientRole: 'admin' | 'teacher' | 'parent' | 'student';
  subject: string;
  content: string;
  isRead: boolean;
  isStarred: boolean;
  isArchived: boolean;
  hasAttachment: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  parentId: string | null;
  createdAt: string;
}

export interface MessageThread {
  id: string;
  participants: { id: string; name: string; role: string; avatar?: string }[];
  messages: Message[];
  lastMessageAt: string;
  unreadCount: number;
  subject: string;
}

export interface LibraryBook {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  publisher: string;
  year: number;
  totalCopies: number;
  availableCopies: number;
  location: string;
  coverColor: string;
  description: string;
  addedBy: string;
  createdAt: string;
}

export interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  totalTeachers: number;
  totalClasses: number;
  avgEngagement: number;
  avgFocus: number;
  avgScore: number;
  attendanceRate: number;
  totalExams: number;
  totalSessions: number;
  alertsCount: number;
  topStudents: Student[];
}
