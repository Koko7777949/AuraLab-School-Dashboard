// ============================================================
// AuraLab - Data Export Utility
// Supports CSV (with BOM for Excel Arabic), JSON, and Print
// ============================================================

export interface ExportColumn {
  /** Arabic header label */
  header: string;
  /** Key to access value from data object */
  key: string;
  /** Optional formatter for the value */
  format?: (value: unknown) => string;
}

/**
 * Export data as CSV with Arabic headers and UTF-8 BOM for Excel compatibility.
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn[],
  filename: string
): void {
  if (!data.length) return;

  // UTF-8 BOM for Excel Arabic text support
  const BOM = '\uFEFF';
  const separator = ',';

  // Build header row
  const headerRow = columns.map((col) => `"${col.header}"`).join(separator);

  // Build data rows
  const dataRows = data.map((row) =>
    columns
      .map((col) => {
        const rawValue = row[col.key];
        const formatted = col.format ? col.format(rawValue) : String(rawValue ?? '');
        // Escape quotes and wrap in quotes
        return `"${formatted.replace(/"/g, '""')}"`;
      })
      .join(separator)
  );

  const csvContent = BOM + [headerRow, ...dataRows].join('\n');

  downloadFile(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * Export data as JSON with Arabic-friendly formatting.
 */
export function exportToJSON<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn[],
  filename: string
): void {
  if (!data.length) return;

  // Map data to use Arabic headers as keys
  const mappedData = data.map((row) => {
    const item: Record<string, unknown> = {};
    columns.forEach((col) => {
      const rawValue = row[col.key];
      item[col.header] = col.format ? col.format(rawValue) : rawValue;
    });
    return item;
  });

  const jsonContent = JSON.stringify(mappedData, null, 2);
  downloadFile(jsonContent, `${filename}.json`, 'application/json;charset=utf-8;');
}

/**
 * Generate a simple print-friendly report using browser print.
 * Opens a new window with styled table of the data.
 */
export function exportToPrint<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn[],
  title: string
): void {
  if (!data.length) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  // Build HTML table
  const headerCells = columns.map((col) => `<th style="padding:8px 12px;text-align:right;border-bottom:2px solid #D4A574;color:#D4A574;font-weight:600;">${col.header}</th>`).join('');

  const dataRows = data.map((row) => {
    const cells = columns.map((col) => {
      const rawValue = row[col.key];
      const formatted = col.format ? col.format(rawValue) : String(rawValue ?? '');
      return `<td style="padding:6px 12px;text-align:right;border-bottom:1px solid #e5e5e5;">${formatted}</td>`;
    }).join('');
    return `<tr>${cells}</tr>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Noto Sans Arabic', 'Segoe UI', sans-serif; padding: 40px; color: #1a1a2e; direction: rtl; }
    h1 { color: #D4A574; margin-bottom: 8px; font-size: 24px; }
    p.subtitle { color: #666; margin-bottom: 24px; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    th { background: #1a1a2e; color: #D4A574; }
    tr:nth-child(even) { background: #f8f8fc; }
    .footer { margin-top: 20px; font-size: 12px; color: #999; text-align: center; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p class="subtitle">تقرير مُصدّر من نظام AuraLab — ${new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
  <table>
    <thead><tr>${headerCells}</tr></thead>
    <tbody>${dataRows}</tbody>
  </table>
  <p class="footer">© ${new Date().getFullYear()} AuraLab — نظام إدارة المدرسة الذكية</p>
  <script>window.onload = () => { window.print(); };</script>
</body>
</html>`;

  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Trigger a file download in the browser.
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format a date for Arabic display in exports.
 */
export function formatDateArabic(value: unknown): string {
  if (!value) return '';
  try {
    const date = new Date(String(value));
    if (isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return String(value);
  }
}

/**
 * Format a number with Arabic locale.
 */
export function formatNumberArabic(value: unknown): string {
  if (value === null || value === undefined) return '';
  const num = Number(value);
  if (isNaN(num)) return String(value);
  return num.toLocaleString('ar-EG');
}

/**
 * Format a percentage value.
 */
export function formatPercentage(value: unknown): string {
  if (value === null || value === undefined) return '';
  const num = Number(value);
  if (isNaN(num)) return String(value);
  return `${num.toFixed(1)}%`;
}
