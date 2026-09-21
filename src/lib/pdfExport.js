import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Heuristic, field-name-based formatting rather than per-column custom
// formatters — the on-screen Table columns render JSX (StatusBadge, etc.)
// which can't be trivially converted to plain text, and writing a parallel
// text formatter for all ~70 report columns individually wasn't worth the
// duplication. This covers the common cases (dates, currency, snake_case
// enums) well enough for a downloadable reference document; it won't be
// pixel-perfect for every column, but it's readable and correct.
function formatCellForPdf(key, value) {
  if (value === null || value === undefined || value === '') return '—';

  if (typeof value === 'boolean') return value ? 'Yes' : 'No';

  const lowerKey = key.toLowerCase();

  if (lowerKey.includes('cost') || lowerKey.includes('budget')) {
    const num = Number(value);
    // "PHP" as text, not the ₱ symbol: jsPDF's built-in fonts only cover
    // the standard Latin-1 character set, and ₱ falls outside it — it
    // silently renders as "±" or similar garbage instead of failing
    // loudly, which is worse. The on-screen app doesn't have this problem
    // since browsers use full system fonts; this only affects the PDF's
    // built-in font specifically.
    if (!Number.isNaN(num)) return `PHP ${num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  if ((lowerKey.endsWith('_at') || lowerKey.includes('date')) && typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return lowerKey.endsWith('_at') ? parsed.toLocaleString() : parsed.toLocaleDateString();
    }
  }

  // Turns snake_case enum values (status, risk_level, category, etc.)
  // into readable text — this is the majority of remaining column types.
  return String(value).replaceAll('_', ' ');
}

/**
 * Generates a downloadable PDF from a report's column definitions + rows.
 * `columns` is the SAME array the on-screen Table component uses ({ key,
 * header }) — only `key` and `header` are read here, any `render` (JSX)
 * is ignored in favor of the plain-text formatter above.
 */
export function downloadPdf(filename, title, columns, rows) {
  if (!rows.length) return;

  const doc = new jsPDF({ orientation: columns.length > 5 ? 'landscape' : 'portrait' });

  doc.setFontSize(14);
  doc.text(title, 14, 15);
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Generated ${new Date().toLocaleString()} — ${rows.length} record${rows.length === 1 ? '' : 's'}`, 14, 21);

  autoTable(doc, {
    startY: 26,
    head: [columns.map((c) => c.header)],
    body: rows.map((row) => columns.map((c) => formatCellForPdf(c.key, row[c.key]))),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [29, 78, 216] }, // matches the app's brand-700 blue
    alternateRowStyles: { fillColor: [248, 250, 252] }, // slate-50
  });

  doc.save(filename);
}
