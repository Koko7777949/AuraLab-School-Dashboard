---
Task ID: 5b
Agent: CSV Import Feature Agent
Task: Create CSV Data Import feature for students and teachers

Work Log:
- Read worklog.md to understand full project context (5 prior tasks completed)
- Reviewed existing csv-export.ts utility, types.ts, store.ts for patterns
- Reviewed students-section.tsx and teachers-section.tsx for integration points
- Checked available shadcn/ui components (Dialog, Progress, ScrollArea, Button, Badge, etc.)

### Files Created:

#### 1. `/src/lib/csv-import.ts` — CSV Import Utility
- **Types**: `CSVColumnMapping`, `ParseError`, `ParseResult<T>`
- **`parseCSV<T>(csvText, columnMapping)`**: Full-featured CSV parser
  - BOM stripping for UTF-8 files
  - Auto-detect delimiter (comma, semicolon, tab) by counting occurrences in first line
  - Quote-aware field parsing (handles commas, newlines, escaped double-quotes inside quoted fields)
  - Row splitting that respects quoted multi-line values
  - Column header mapping with case-insensitive matching
  - Required field validation with Arabic error messages
  - Skip empty rows
  - Trim whitespace from all values
  - Transform functions applied per-column (e.g., Arabic status → English)
- **`STUDENT_IMPORT_COLUMNS`**: 6-column mapping
  - الاسم → name (required), الرقم التعريفي → studentId (required), الفصل → classId, الحالة → status (Arabic→English), الملاحظات → notes, الخلفية النفسية → psychBackground
- **`TEACHER_IMPORT_COLUMNS`**: 6-column mapping
  - الاسم → name (required), المادة → subject, الحالة → status (Arabic→English), الصلاحية → permissions (Arabic→English), البريد → email, الهاتف → phone
- **`downloadTemplate(columns, filename)`**: Generates CSV with BOM-prefixed Arabic headers only, triggers browser download

#### 2. `/src/components/dashboard/import-dialog.tsx` — Reusable Import Dialog
- **Props**: `open`, `onOpenChange`, `type`, `columns`, `onImport`, `templateFilename`
- **4-step state machine**: idle → previewing → importing → done
- **Idle step**:
  - Drag-and-drop zone with amber highlight on drag
  - File picker button (hidden input triggered on click)
  - Download template card with sky-blue accent button
  - Supported columns display with required field badges (amber tint + asterisk)
- **Preview step**:
  - File info bar showing filename, row count, valid/error badges
  - Warning banner for error rows (amber tint)
  - ScrollArea preview table: Row #, Data, Status (✓ green / ✗ red)
  - Valid rows: transparent bg, emerald CheckCircle2 icon
  - Error rows: rose tinted bg, rose XCircle icon, error messages displayed
- **Importing step**:
  - Animated ping glow ring around Loader2 spinner
  - Real-time progress bar with percentage
  - Batch import (20 batches with 80ms delay each)
- **Done step**:
  - Large emerald success circle with CheckCircle2
  - Summary showing imported count and skipped errors
- **Footer buttons**: Contextual per step (Download Template/Cancel → Re-preview/Import N/Back → Done)
- All text in Arabic, dark theme (#1A1A24), amber (#D4A574) accent, RTL dir="rtl"

### Files Modified:

#### 3. `/src/components/dashboard/students-section.tsx` — Student Import Integration
- Added `Upload` icon import from lucide-react
- Added `STUDENT_IMPORT_COLUMNS` import from csv-import
- Added `ImportDialog` component import
- Added `importOpen` state variable
- Added `handleImportStudents()` callback: creates Student objects from parsed CSV data with unique IDs, defaults for optional fields
- Added "استيراد CSV" button (amber outline) before "تصدير CSV" button in action bar
- Added `<ImportDialog>` instance with type="students" and STUDENT_IMPORT_COLUMNS

#### 4. `/src/components/dashboard/teachers-section.tsx` — Teacher Import Integration
- Added `Upload` icon import from lucide-react
- Added `TEACHER_IMPORT_COLUMNS` import from csv-import
- Added `ImportDialog` component import
- Added `importOpen` state variable
- Added `handleImportTeachers()` callback: creates Teacher objects from parsed CSV data with unique IDs, default permissions/status
- Added "استيراد CSV" button (amber outline) before "تصدير CSV" button in action bar
- Added `<ImportDialog>` instance with type="teachers" and TEACHER_IMPORT_COLUMNS

### Verification:
- All imports verified correct
- No existing files modified beyond adding import button + dialog
- No changes to page.tsx, types.ts, store.ts, sidebar.tsx
- Code follows existing patterns (dark theme styling, amber accent, Arabic labels, shadcn Dialog usage)
- Files NOT linted (per instructions: DO NOT run bun run lint)

Stage Summary:
- 2 new files created: csv-import.ts (utility), import-dialog.tsx (component)
- 2 existing files modified: students-section.tsx, teachers-section.tsx
- Full CSV import pipeline: upload → parse → preview → import → success
- Reusable dialog works for both students and teachers via props
- Template download for both entity types
- Consistent with project design system (dark theme, amber accent, Arabic RTL)
