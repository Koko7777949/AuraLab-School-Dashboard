# 🏫 AuraLab — نظام إدارة المدرسة الذكية

> **AI-Powered School Management Dashboard** — A comprehensive, Arabic RTL, dark-mode school management system built with Next.js 16, TypeScript, TailwindCSS 4, and Prisma ORM.

![Version](https://img.shields.io/badge/version-2.7.0-amber?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38BDF8?style=flat-square&logo=tailwindcss)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

---

## ✨ Overview

AuraLab is a production-grade school management dashboard designed for Arabic-speaking educational institutions. It features a stunning dark theme with amber accents, full RTL support, glassmorphism effects, and AI-powered capabilities. The system manages students, teachers, classes, exams, attendance, grades, behavior, timetables, library resources, fees, announcements, and more — all from a single, unified dashboard.

### 🎯 Key Highlights

- **20+ Dashboard Sections** — Comprehensive coverage of all school operations
- **Arabic RTL First** — Native right-to-left support with Noto Sans Arabic font
- **Dark Theme** — Professional charcoal (#121218) with amber (#D4A574) accent design
- **AI Assistant** — LLM-powered chatbot for instant help and data queries
- **3 Custom SVG Charts** — Donut, Radar, and Area charts (zero external chart dependencies)
- **CSV Import/Export** — Full data import with drag-and-drop and BOM-aware export
- **Glassmorphism UI** — Glass cards, gradient borders, ambient background orbs
- **30+ CSS Micro-interactions** — Hover glows, shimmer loading, 3D tilt, stagger animations
- **Theme Customizer** — Accent color, UI density, border radius, background style
- **15+ API Routes** — Full REST CRUD with soft-delete pattern
- **Real-time Stats** — Dashboard pulls live data from Prisma/SQLite database

---

## 📸 Features

### 📊 Dashboard & Analytics
- KPI stat cards with animated counters and trend indicators
- Student performance distribution chart
- Attendance quick tracker with real-time progress bars
- Today's schedule timeline widget
- Upcoming events with color-coded borders
- Live clock with Arabic date display
- Interactive calendar widget with event dots

### 👨‍🎓 Student Management
- Full CRUD operations with search and filters
- Student profile with psych background and avatar
- CSV export with Arabic column headers
- CSV import with drag-and-drop dialog
- Status tracking (active, inactive, graduated)

### 👩‍🏫 Teacher Management
- Teacher profiles with subject, permissions, and contact info
- Status and permission filtering
- CSV import/export support
- Class assignment tracking

### 📚 Class Management
- Class roster with student count and teacher assignments
- Performance chart comparing grade averages across classes
- Grade level and room tracking

### 📝 Exam Management
- Exam scheduling with score tracking
- Subject and date filtering
- Score statistics (average, min, max)
- CSV export support

### ✅ Attendance Tracking
- Daily attendance marking with 4 status types
- Attendance heatmap calendar (monthly view)
- Statistics summary cards
- Per-class and per-student filters
- Batch marking mode

### 📈 Grades & Reports
- Grade records with weighted scoring
- Report card generation with GPA and ranking
- Class performance comparison charts
- Behavior tracking with positive/negative points

### 📅 Timetable & Sessions
- Weekly timetable grid (Saturday–Thursday)
- Session timer with engagement tracking
- Timeline-style session history
- Live session indicator

### 📢 Announcements & Messages
- Announcement board with categories and priority
- Pinned announcements with glass card styling
- Message compose/reply/forward
- Starred and archived message support
- Trash with restore functionality

### 💰 Fees Management
- Fee tracking by type (tuition, transportation, books, activities, lab)
- Payment status with partial payment support
- Due date and overdue tracking

### 📖 Library Management
- Book catalog with ISBN and category
- Copy tracking (total vs. available)
- Location and publisher information

### 🤖 AI Assistant
- LLM-powered conversational interface
- Context-aware school data queries
- Suggestion cards for common queries
- Typing indicator and message grouping

### ⚙️ Settings & Customization
- Theme customizer (accent color, UI density, border radius, background)
- Profile settings
- Notification preferences
- System configuration

### 🗑️ Trash & Recovery
- Soft-delete pattern for all entity types
- Restore from trash with full data recovery
- Permanent delete with confirmation dialog
- Type-specific trash filtering

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 (Strict) |
| **Styling** | TailwindCSS 4 + shadcn/ui (New York) |
| **State** | Zustand 5 |
| **Database** | Prisma ORM + SQLite |
| **AI** | z-ai-web-dev-sdk (LLM, VLM) |
| **Icons** | Lucide React |
| **Animations** | Framer Motion + CSS Keyframes |
| **Forms** | React Hook Form + Zod |
| **Tables** | TanStack Table |
| **Charts** | Custom SVG (no external deps) |
| **Toasts** | Sonner |
| **Auth** | NextAuth.js v4 (available) |
| **i18n** | next-intl (available) |

---

## 📁 Project Structure

```
AuraLab/
├── prisma/
│   └── schema.prisma          # 11 Prisma models
├── src/
│   ├── app/
│   │   ├── api/               # 15+ REST API routes
│   │   │   ├── ai-chat/       # LLM chat endpoint
│   │   │   ├── announcements/ # CRUD + pin toggle
│   │   │   ├── attendance/    # CRUD + stats
│   │   │   ├── classes/       # CRUD
│   │   │   ├── dashboard/     # Aggregated stats
│   │   │   ├── exams/         # CRUD
│   │   │   ├── students/      # CRUD
│   │   │   └── teachers/      # CRUD
│   │   ├── globals.css        # 3,600+ lines of CSS (87 sections)
│   │   ├── layout.tsx         # RTL layout with Arabic font
│   │   └── page.tsx           # Main SPA with section routing
│   ├── components/
│   │   ├── charts/            # Donut, Radar, Area SVG charts
│   │   ├── dashboard/         # 30+ dashboard section components
│   │   └── ui/                # shadcn/ui component library
│   ├── hooks/                 # Custom React hooks
│   └── lib/
│       ├── csv-export.ts      # BOM-aware CSV export
│       ├── csv-import.ts      # Drag-and-drop CSV import
│       ├── db.ts              # Prisma client instance
│       ├── store.ts           # Zustand store (all entities)
│       ├── types.ts           # TypeScript interfaces
│       └── utils.ts           # Utility functions
├── db/
│   └── custom.db              # SQLite database
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── worklog.md                 # Development worklog
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ or **Bun** runtime
- **npm** or **bun** package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/Koko7777949/AuraLab-School-Dashboard.git
cd AuraLab-School-Dashboard

# Install dependencies
bun install

# Set up the database
bun run db:push

# Start the development server
bun run dev
```

The application will be available at `http://localhost:3000`.

### Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL="file:./db/custom.db"
```

---

## 📋 Available Scripts

| Script | Description |
|--------|-------------|
| `bun run dev` | Start development server on port 3000 |
| `bun run build` | Build for production |
| `bun run lint` | Run ESLint for code quality |
| `bun run db:push` | Push Prisma schema to database |
| `bun run db:generate` | Generate Prisma client |
| `bun run db:migrate` | Run database migrations |
| `bun run db:reset` | Reset database |

---

## 🎨 Design System

### Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Charcoal | `#121218` | Background |
| Card Surface | `#1A1A24` | Card backgrounds |
| Amber Accent | `#D4A574` | Primary accent, CTAs |
| Amber Light | `#E8C9A8` | Hover states |
| Emerald | `#4ADE80` | Success, positive |
| Sky | `#38BDF8` | Info, links |
| Rose | `#FB7185` | Error, destructive |
| Violet | `#A78BFA` | Special states |

### Typography

- **Font**: Noto Sans Arabic (RTL optimized)
- **Direction**: RTL (right-to-left)
- **Language**: Arabic (primary), English (code/technical)

### Component Patterns

- **Glass Cards**: `glass-card`, `glass-card-elevated`, `glass-card-hover`
- **Hover Effects**: `card-hover`, `card-tilt`, `hover-lift`
- **Animations**: `animate-fade-in`, `animate-slide-up`, `animate-scale-in`
- **Glows**: `glow-amber-sm`, `glow-emerald-sm`, `glow-rose-sm`
- **Loading**: `shimmer-loading`, `shimmer-card`, `skeleton-glass`

---

## 🔌 API Reference

### Dashboard Stats
```
GET /api/dashboard/stats
```
Returns aggregated statistics: total students, active students, teachers, classes, avg engagement, avg focus, avg score, attendance rate, exam count, session count, alert count, top students.

### Students
```
GET    /api/students          # List all students
POST   /api/students          # Create a student
GET    /api/students/:id      # Get student by ID
PUT    /api/students/:id      # Update student
DELETE /api/students/:id      # Soft-delete student (moves to trash)
```

### Teachers
```
GET    /api/teachers          # List all teachers
POST   /api/teachers          # Create a teacher
GET    /api/teachers/:id      # Get teacher by ID
PUT    /api/teachers/:id      # Update teacher
DELETE /api/teachers/:id      # Soft-delete teacher
```

### Classes
```
GET    /api/classes           # List all classes
POST   /api/classes           # Create a class
GET    /api/classes/:id       # Get class by ID
PUT    /api/classes/:id       # Update class
DELETE /api/classes/:id       # Soft-delete class
```

### Exams
```
GET    /api/exams             # List all exams
POST   /api/exams             # Create an exam
GET    /api/exams/:id         # Get exam by ID
PUT    /api/exams/:id         # Update exam
DELETE /api/exams/:id         # Soft-delete exam
```

### Attendance
```
GET    /api/attendance        # List attendance records
POST   /api/attendance        # Create/batch create records
GET    /api/attendance/stats  # Get attendance statistics
GET    /api/attendance/:id    # Get record by ID
PUT    /api/attendance/:id    # Update record
DELETE /api/attendance/:id    # Delete record
```

### Announcements
```
GET    /api/announcements     # List announcements (filter by category)
POST   /api/announcements     # Create announcement
GET    /api/announcements/:id # Get announcement by ID
PUT    /api/announcements/:id # Update announcement
PUT    /api/announcements/:id/pin  # Toggle pinned status
DELETE /api/announcements/:id # Delete announcement
```

### AI Chat
```
POST   /api/ai-chat           # Send message to AI assistant
```

---

## 🗄️ Database Schema

The application uses **Prisma ORM** with **SQLite**. The schema includes 11 models:

- **Student** — Student profiles with class assignment and status
- **Teacher** — Teacher profiles with subject and permissions
- **Class** — Classrooms with grade level and room info
- **TeacherClass** — Many-to-many teacher-class assignments
- **Exam** — Exams with scores, subjects, and dates
- **Session** — Class sessions with engagement tracking
- **Analytics** — Per-session analytics (engagement, emotion, focus)
- **TrashItem** — Soft-delete recovery with JSON data snapshot
- **Notification** — System notifications
- **SystemSetting** — Key-value system configuration
- **Attendance** — Daily attendance records
- **Announcement** — Announcements with categories and pinning

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + K` or `?` | Open keyboard shortcuts panel |
| `1`–`9` | Navigate to sections |
| `Escape` | Close dialogs/modals |

---

## 🌐 Internationalization

The dashboard is built **Arabic-first** with full RTL support. English i18n support is available via `next-intl` (configured but not yet activated). Language toggle button is present in the header.

---

## 🔒 Security Notes

- All API routes use server-side Prisma queries (no raw SQL)
- Soft-delete pattern prevents accidental data loss
- Confirmation dialogs for destructive operations
- Input validation via Zod schemas (available)
- NextAuth.js authentication available (not yet activated)

---

## 📝 License

This project is licensed under the MIT License.

---

## 🙏 Credits

Built with ❤️ by the AuraLab team using:

- [Next.js](https://nextjs.org/) — React Framework
- [TailwindCSS](https://tailwindcss.com/) — Utility-first CSS
- [shadcn/ui](https://ui.shadcn.com/) — UI Component Library
- [Prisma](https://www.prisma.io/) — Database ORM
- [Zustand](https://zustand-demo.pmnd.rs/) — State Management
- [Lucide](https://lucide.dev/) — Icon Library

---

> **AuraLab v2.7.0** — نظام إدارة المدرسة الذكية | AI-Powered School Management Dashboard
