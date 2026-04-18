/**
 * CSV Export Utility
 *
 * Provides a generic export-to-CSV function with BOM for proper Arabic/RTL
 * encoding when opened in Microsoft Excel.
 */

/**
 * Escape a single CSV field.
 * Wraps in double-quotes and escapes internal quotes by doubling them.
 */
function escapeField(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value);
  // If the field contains a comma, quote, or newline, wrap it in quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  // Always wrap in quotes for consistency (Arabic text safety)
  return `"${str}"`;
}

/**
 * Export an array of objects to a CSV file and trigger a browser download.
 *
 * @param data    - Array of row objects.
 * @param filename - File name **without** the `.csv` extension.
 * @param columns  - Column definitions mapping `key` to display `label`.
 *
 * @example
 * ```ts
 * exportToCSV(students, 'students', [
 *   { key: 'name', label: 'الاسم' },
 *   { key: 'studentId', label: 'الرقم التعريفي' },
 * ]);
 * ```
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  columns: { key: keyof T; label: string }[],
): void {
  // BOM (Byte Order Mark) ensures Excel recognises UTF-8 encoding for Arabic
  const BOM = '\uFEFF';

  // Header row
  const header = columns.map((col) => escapeField(col.label)).join(',');

  // Data rows
  const rows = data.map((row) =>
    columns.map((col) => escapeField(row[col.key] ?? '')).join(','),
  );

  const csv = BOM + [header, ...rows].join('\n');

  // Create a Blob and trigger download
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

/**
 * Format an ISO date string to Arabic locale format.
 *
 * @param dateStr - ISO date string (e.g. `"2024-09-01T08:00:00.000Z"`)
 * @returns Localised date string (e.g. `"١/٩/٢٠٢٤"`)
 */
export function formatCsvDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}
