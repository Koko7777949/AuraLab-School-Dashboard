# Task 6a: Grades Section Builder

## Summary

Created a comprehensive **Grades/Report Cards** section for the AuraLab Arabic RTL school management dashboard.

## Files Created

### `/src/components/dashboard/grades-section.tsx` (1400 lines)
Full-featured grades management component with:

**Header Area:**
- Section title "سجل الدرجات" with Trophy icon and total count badge
- Three action buttons: إضافة درجة (amber), تصدير CSV (amber outline), إنشاء كشف درجات (amber outline)

**Statistics Row (4 cards with stagger-grid animation):**
- المعدل العام (GPA) — weighted average out of 4.0
- أعلى درجة (Highest Score) — with subject name subtext
- متوسط الدرجات (Average Score) — weighted percentage
- عدد السجلات (Total Records) — count

**Filters Row:**
- Student name search input
- Subject filter dropdown (12 Arabic subjects)
- Term filter (الفصل الأول / الفصل الثاني)
- Exam type filter (5 types)

**Grade Table:**
- Student name with avatar initial, subject, exam type badge, score badge (color-coded), weight, date, action buttons
- Color-coded score badges: emerald ≥90%, amber ≥70%, rose <70%
- Alternating row backgrounds, hover effects
- Pagination (10 per page) with RTL-aware navigation

**Add/Edit Grade Dialog:**
- Student select (12 Arabic students), Subject, Term, Exam Type dropdowns
- Score/MaxScore/Weight number inputs, Date picker, Notes textarea
- Toast notifications on add/update

**View Grade Dialog:**
- Circular SVG progress indicator with color-coded score
- ScoreBadge component, detailed info fields with icons, notes section

**Delete Grade Dialog:**
- Confirmation with student name and subject highlighted
- Rose-colored destructive action button

**Report Card Generator:**
- Generates a report card for the student with the most grade records
- Report card dialog showing:
  - Student info header with avatar and class
  - Circular GPA indicator (color-coded: green ≥3.5, amber ≥2.5, red <2.5)
  - Stats row: class rank, attendance rate, behavior grade
  - Subject averages table with weighted calculations and grade labels
  - Teacher comment (auto-generated based on GPA)
  - Print button (window.print())
- Uses `computeSubjectAverages()` pure function (extracted for React Compiler compatibility)

**Mock Data:**
- 20 grade records across 12 students, 12 subjects, 2 terms, 5 exam types
- Realistic Arabic student names and varied score distributions
- `useRef` guard pattern to prevent re-seeding

## Files Modified

### `/src/lib/types.ts`
- Added `GradeRecord` interface (id, studentId, studentName, classId, className, subject, term, examType, score, maxScore, weight, date, notes, createdAt)
- Added `ReportCard` interface (id, studentId, studentName, className, term, gpa, totalScore, rank, totalStudents, grades, behaviorGrade, attendanceRate, teacherComment, createdAt)
- Added `'grades'` to `ActiveSection` type union

### `/src/lib/store.ts`
- Imported `GradeRecord` type
- Added grades state: `grades`, `setGrades`, `addGrade`, `updateGrade`, `deleteGrade`

### `/src/components/dashboard/sidebar.tsx`
- Imported `Trophy` icon from lucide-react
- Added `{ id: 'grades', label: 'الدرجات', icon: Trophy, showCount: true }` to NAV_ITEMS
- Added `grades` to store destructuring and `counts` memo

### `/src/app/page.tsx`
- Imported `GradesSection` component
- Added `case 'grades': return <GradesSection />` to SectionRenderer

## Styling Details
- Amber (#D4A574) accent throughout
- Dark theme: #121218 background, #1A1A24 cards
- Text colors: #F1F1F6 (primary), #C4C4D4 (secondary), #8B8B9E (muted)
- CSS utilities: glass-card-elevated, hover-lift, stagger-grid, animate-fade-in-up, gradient-text-amber
- Consistent with existing section patterns (exams-section, attendance-section)
- RTL-compatible throughout

## ESLint: 0 errors, 0 warnings
- Fixed `react-hooks/rules-of-hooks` by moving useMemo before early return, then extracting to pure function
- Fixed `react-hooks/set-state-in-effect` by using inline setState in filter handlers instead of useEffect
- Fixed `react-hooks/preserve-manual-memoization` by extracting `computeSubjectAverages` as pure function
