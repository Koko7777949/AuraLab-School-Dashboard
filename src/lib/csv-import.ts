/**
 * CSV Import Utility
 *
 * Provides a robust CSV parser with column mapping, validation, and template
 * generation. Handles BOM, quoted fields, multi-line values, and auto-detects
 * delimiters. Optimised for Arabic RTL data with proper UTF-8 support.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CSVColumnMapping {
  /** The header text expected in the CSV file (Arabic) */
  csvHeader: string;
  /** The JSON key to map this column to in the output objects */
  jsonKey: string;
  /** Whether this field is required — missing values generate a ParseError */
  required: boolean;
  /** Optional transform applied to the raw string value */
  transform?: (val: string) => unknown;
}

export interface ParseError {
  /** 1-based row number where the error occurred (header row = 0) */
  row: number;
  /** The field / column that caused the error */
  field: string;
  /** Human-readable error message (Arabic) */
  message: string;
}

export interface ParseResult<T> {
  /** Whether parsing completed without critical errors */
  success: boolean;
  /** Parsed and mapped data rows (only rows without errors) */
  data: T[];
  /** List of validation / parsing errors */
  errors: ParseError[];
  /** Total number of data rows processed (excluding header) */
  totalRows: number;
}

// ---------------------------------------------------------------------------
// Column Mapping Definitions
// ---------------------------------------------------------------------------

/** Arabic ↔ English status mapping for students */
const STUDENT_STATUS_MAP: Record<string, 'active' | 'inactive' | 'graduated'> = {
  'نشط': 'active',
  'غير نشط': 'inactive',
  'متخرج': 'graduated',
  'متخرّج': 'graduated',
};

/** Arabic ↔ English status mapping for teachers */
const TEACHER_STATUS_MAP: Record<string, 'active' | 'inactive'> = {
  'نشط': 'active',
  'غير نشط': 'inactive',
};

/** Arabic ↔ English permissions mapping */
const PERMISSION_MAP: Record<string, 'admin' | 'teacher' | 'supervisor'> = {
  'مدير': 'admin',
  'معلم': 'teacher',
  'مشرف': 'supervisor',
};

/**
 * Column mapping for student CSV import.
 * CSV headers are in Arabic; jsonKey maps to the Student type fields.
 */
export const STUDENT_IMPORT_COLUMNS: CSVColumnMapping[] = [
  {
    csvHeader: 'الاسم',
    jsonKey: 'name',
    required: true,
  },
  {
    csvHeader: 'الرقم التعريفي',
    jsonKey: 'studentId',
    required: true,
  },
  {
    csvHeader: 'الفصل',
    jsonKey: 'classId',
    required: false,
  },
  {
    csvHeader: 'الحالة',
    jsonKey: 'status',
    required: false,
    transform: (val: string) => {
      const trimmed = val.trim();
      return STUDENT_STATUS_MAP[trimmed] ?? trimmed;
    },
  },
  {
    csvHeader: 'الملاحظات',
    jsonKey: 'notes',
    required: false,
  },
  {
    csvHeader: 'الخلفية النفسية',
    jsonKey: 'psychBackground',
    required: false,
  },
];

/**
 * Column mapping for teacher CSV import.
 * CSV headers are in Arabic; jsonKey maps to the Teacher type fields.
 */
export const TEACHER_IMPORT_COLUMNS: CSVColumnMapping[] = [
  {
    csvHeader: 'الاسم',
    jsonKey: 'name',
    required: true,
  },
  {
    csvHeader: 'المادة',
    jsonKey: 'subject',
    required: false,
  },
  {
    csvHeader: 'الحالة',
    jsonKey: 'status',
    required: false,
    transform: (val: string) => {
      const trimmed = val.trim();
      return TEACHER_STATUS_MAP[trimmed] ?? trimmed;
    },
  },
  {
    csvHeader: 'الصلاحية',
    jsonKey: 'permissions',
    required: false,
    transform: (val: string) => {
      const trimmed = val.trim();
      return PERMISSION_MAP[trimmed] ?? trimmed;
    },
  },
  {
    csvHeader: 'البريد',
    jsonKey: 'email',
    required: false,
  },
  {
    csvHeader: 'الهاتف',
    jsonKey: 'phone',
    required: false,
  },
];

// ---------------------------------------------------------------------------
// Delimiter Detection
// ---------------------------------------------------------------------------

const DELIMITERS = [',', ';', '\t'] as const;

function detectDelimiter(text: string): string {
  const firstLine = text.split('\n')[0] ?? '';
  let bestDelimiter = ',';
  let bestCount = 0;

  for (const d of DELIMITERS) {
    const count = firstLine.split(d).length - 1;
    if (count > bestCount) {
      bestCount = count;
      bestDelimiter = d;
    }
  }

  return bestDelimiter;
}

// ---------------------------------------------------------------------------
// CSV Parsing — robust quote-aware row splitter
// ---------------------------------------------------------------------------

/**
 * Split a CSV line into fields, respecting quoted fields that may contain
 * delimiters, newlines, and escaped double-quotes.
 */
function parseFields(line: string, delimiter: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        // Check for escaped quote (double-quote)
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // skip next quote
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === delimiter) {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }

  fields.push(current.trim());
  return fields;
}

/**
 * Split CSV text into rows, handling quoted fields that contain newlines.
 */
function splitRows(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let currentLine = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === '"') {
      // Check for escaped quote
      if (inQuotes && i + 1 < text.length && text[i + 1] === '"') {
        currentLine += '""';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
        currentLine += '"';
      }
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      // Skip \r\n sequences
      if (char === '\r' && i + 1 < text.length && text[i + 1] === '\n') {
        i++;
      }

      if (currentLine.trim().length > 0) {
        const fields = parseFields(currentLine, delimiter);
        rows.push(fields);
      }
      currentLine = '';
    } else {
      currentLine += char;
    }
  }

  // Last line without trailing newline
  if (currentLine.trim().length > 0) {
    const fields = parseFields(currentLine, delimiter);
    rows.push(fields);
  }

  return rows;
}

// ---------------------------------------------------------------------------
// Main Parse Function
// ---------------------------------------------------------------------------

/**
 * Parse CSV text into typed objects using column mapping.
 *
 * @param csvText        - Raw CSV file content (string)
 * @param columnMapping  - Array of column mappings (Arabic header → JSON key)
 * @returns ParseResult with parsed data and any errors
 *
 * @example
 * ```ts
 * const result = parseCSV<Student>(csvText, STUDENT_IMPORT_COLUMNS);
 * if (result.success) {
 *   result.data.forEach(s => addStudent(s));
 * }
 * ```
 */
export function parseCSV<T extends Record<string, unknown>>(
  csvText: string,
  columnMapping: CSVColumnMapping[],
): ParseResult<T> {
  // Strip BOM if present
  let text = csvText.replace(/^\uFEFF/, '');
  text = text.trim();

  if (text.length === 0) {
    return { success: false, data: [], errors: [], totalRows: 0 };
  }

  // Detect delimiter
  const delimiter = detectDelimiter(text);

  // Split into rows
  const rows = splitRows(text, delimiter);

  if (rows.length < 2) {
    return {
      success: false,
      data: [],
      errors: [
        {
          row: 0,
          field: 'ملف',
          message: 'الملف فارغ أو يحتوي على صف العناوين فقط',
        },
      ],
      totalRows: 0,
    };
  }

  // Parse header row
  const headerFields = rows[0].map((h) => h.trim());

  // Build a lookup: csvHeader → columnMapping index
  const headerIndexMap = new Map<string, number>();
  for (const col of columnMapping) {
    const idx = headerFields.findIndex(
      (h) => h === col.csvHeader || h.toLowerCase() === col.csvHeader.toLowerCase(),
    );
    headerIndexMap.set(col.csvHeader, idx);
  }

  // Validate required headers exist
  const missingHeaders: ParseError[] = [];
  for (const col of columnMapping) {
    if (col.required && headerIndexMap.get(col.csvHeader) === undefined) {
      missingHeaders.push({
        row: 0,
        field: col.csvHeader,
        message: `عمود "${col.csvHeader}" غير موجود في الملف`,
      });
    }
  }

  if (missingHeaders.length > 0) {
    return {
      success: false,
      data: [],
      errors: missingHeaders,
      totalRows: 0,
    };
  }

  // Parse data rows
  const data: T[] = [];
  const errors: ParseError[] = [];
  const totalRows = rows.length - 1;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];

    // Skip empty rows
    if (row.every((field) => field.trim() === '')) {
      continue;
    }

    const record: Record<string, unknown> = {};
    let rowHasError = false;

    for (const col of columnMapping) {
      const colIdx = headerIndexMap.get(col.csvHeader) ?? -1;
      const rawValue = colIdx >= 0 && colIdx < row.length ? row[colIdx].trim() : '';

      if (col.required && rawValue === '') {
        errors.push({
          row: i + 1, // 1-based for display
          field: col.csvHeader,
          message: `الحقل "${col.csvHeader}" مطلوب ولا يمكن أن يكون فارغاً`,
        });
        rowHasError = true;
        continue;
      }

      // Apply transform if provided
      if (col.transform && rawValue !== '') {
        record[col.jsonKey] = col.transform(rawValue);
      } else {
        record[col.jsonKey] = rawValue;
      }
    }

    if (!rowHasError) {
      data.push(record as T);
    }
  }

  return {
    success: errors.length === 0,
    data,
    errors,
    totalRows,
  };
}

// ---------------------------------------------------------------------------
// Template Download
// ---------------------------------------------------------------------------

/**
 * Generate and download a CSV template file with only the Arabic header row.
 * Includes BOM for proper Arabic encoding in Microsoft Excel.
 *
 * @param columns  - Column mapping defining the headers
 * @param filename - Download filename (without .csv extension)
 */
export function downloadTemplate(columns: CSVColumnMapping[], filename: string): void {
  const BOM = '\uFEFF';
  const headerRow = columns
    .map((col) => {
      const escaped = col.csvHeader.includes(',') || col.csvHeader.includes('"')
        ? `"${col.csvHeader.replace(/"/g, '""')}"`
        : col.csvHeader;
      return escaped;
    })
    .join(',');

  const csv = BOM + headerRow + '\n';

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
