
---
Task ID: 6b
Agent: Reports Section Builder
Task: Create comprehensive Reports section with report generation, preview, and export

Work Log:
- Read worklog.md, types.ts, store.ts, analytics-section.tsx to understand project patterns
- Read sidebar.tsx and page.tsx for integration points
- Read csv-export.ts for export utility API
- Created `/src/components/dashboard/reports-section.tsx` (~950 lines) with:

### Component Features:
1. **Report Categories Grid**: 6 report type cards in responsive grid (2x3 desktop, 1 col mobile)
   - تقرير الطلاب (FileText, emerald), تقرير المعلمين (GraduationCap, sky), تقرير الحضور (ClipboardCheck, amber)
   - تقرير الدرجات (BarChart3, violet), تقرير الإعلانات (Megaphone, pink), تقرير شامل (BookOpen, amber)
   - Each card: gradient icon bg, title, description, "إنشاء التقرير" button, hover lift effect

2. **Report Generation Form**: Dynamic filters per report type
   - Auto-filled report title (editable)
   - Date range picker (from/to)
   - Student: class + status filters; Teacher: subject + status; Attendance: class + status
   - Grades: class + subject + term; Announcements: category + priority; Comprehensive: all combined
   - Generate button with loading spinner state

3. **Report Preview/Display**: Generated report in card layout
   - Header with title, type badge, date range, generation time
   - 4 summary statistics cards with animated counters
   - SVG bar chart for comparison data (attendance, grades, comprehensive)
   - SVG donut chart for distribution data (students, teachers, announcements)
   - SVG trend/area chart for time-series data
   - Data table with alternating rows, hover effects, row count badge
   - Action buttons: تصدير CSV (uses exportToCSV), طباعة (window.print), تقرير جديد

4. **Recent Reports List**: 3 pre-seeded mock reports via useRef guard pattern
   - Report cards with type icon, title, type badge, date, row count
   - Click to re-view report, delete button, empty state

### Report Generation Logic:
- Uses store data (students, teachers, classes, exams, grades) when available
- Falls back to realistic mock data when store is empty
- Each report type has dedicated generation function
- Student: count by class, status distribution
- Teacher: count by subject, permissions breakdown
- Attendance: rates by class, status breakdown, weekly trends
- Grades: averages by subject, score ranges
- Announcements: count by category
- Comprehensive: combined stats across all entity types

### SVG Charts (pure SVG, no external libraries):
- ReportBarChart: vertical bars with gradient fill, grid lines, value labels
- ReportDonutChart: segments with gaps, center metric, color legend
- ReportTrendChart: line + area fill with gradient, dots, grid lines

### Integration:
- Updated types.ts: Added 'reports' to ActiveSection union type
- Updated sidebar.tsx: Added FileBarChart import, nav item `{ id: 'reports', label: 'التقارير', icon: FileBarChart }`, version → v2.3.0
- Updated page.tsx: Added ReportsSection import, case in SectionRenderer, version → 2.3.0

### Verification:
- ESLint: 0 errors, 1 warning (pre-existing font warning in layout.tsx)
- Dev server: compiles successfully, GET / returns HTTP 200

Stage Summary:
- 1 new component file created (reports-section.tsx, ~950 lines)
- 3 existing files updated (types.ts, sidebar.tsx, page.tsx)
- 6 report types with dynamic filters and generation logic
- 3 pure SVG chart components (inline, no external dependencies)
- CSV export and print functionality
- Animated counters, glassmorphism cards, responsive grid
- Version bumped to 2.3.0
