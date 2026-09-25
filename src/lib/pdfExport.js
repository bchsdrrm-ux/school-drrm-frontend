import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SCHOOL } from './school';

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

// Official marks for the letterhead, fetched once from /brand and kept as data URLs.
const LOGO_FILES = {
  seal: '/brand/deped-seal.png',
  matatag: '/brand/deped-matatag.png',
  bagong: '/brand/bagong-pilipinas.png',
};
let logoCache = null;

function toDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function imageSize(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = reject;
    img.src = dataUrl;
  });
}

// Resolves to { seal, matatag, bagong } (each { data, w, h }), or null if any logo can't be loaded,
// so a missing file or offline session still produces a report, just without the marks.
async function loadLogos() {
  if (logoCache) return logoCache;
  try {
    const entries = await Promise.all(Object.entries(LOGO_FILES).map(async ([key, url]) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${url} ${res.status}`);
      const data = await toDataUrl(await res.blob());
      return [key, { data, ...(await imageSize(data)) }];
    }));
    logoCache = Object.fromEntries(entries);
    return logoCache;
  } catch {
    return null;
  }
}

// Draws the letterhead and returns the y position where the report title may start.
function drawLetterhead(doc, logos) {
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  const top = 10;
  const markH = 17;

  if (logos) {
    const place = (img, x) => { const w = (img.w / img.h) * markH; doc.addImage(img.data, 'PNG', x, top, w, markH, undefined, 'FAST'); return w; };
    place(logos.seal, margin);
    // Right-aligned pair: MATATAG then Bagong Pilipinas.
    const bw = (logos.bagong.w / logos.bagong.h) * markH;
    const mw = (logos.matatag.w / logos.matatag.h) * markH;
    place(logos.bagong, pageW - margin - bw);
    place(logos.matatag, pageW - margin - bw - 4 - mw);
  }

  const textX = logos ? margin + markH + 4 : margin;
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Republic of the Philippines', textX, top + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Department of Education', textX, top + 9.5);
  doc.setFontSize(9);
  doc.text(SCHOOL.name, textX, top + 14.5);
  doc.setFont('helvetica', 'normal');

  const ruleY = top + markH + 3;
  doc.setDrawColor(29, 78, 216);
  doc.setLineWidth(0.6);
  doc.line(margin, ruleY, pageW - margin, ruleY);
  return ruleY + 8;
}

function drawFooters(doc) {
  const pages = doc.getNumberOfPages();
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(120);
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i);
    doc.text(`BCHS DRRM Management System - ${SCHOOL.name}`, 14, pageH - 8);
    doc.text(`Page ${i} of ${pages}`, pageW - 14, pageH - 8, { align: 'right' });
  }
}

/**
 * Generates a downloadable PDF from a report's column definitions + rows.
 * `columns` is the SAME array the on-screen Table component uses ({ key,
 * header }) — only `key` and `header` are read here, any `render` (JSX)
 * is ignored in favor of the plain-text formatter above.
 */
export async function downloadPdf(filename, title, columns, rows) {
  if (!rows.length) return;

  const logos = await loadLogos();
  const doc = new jsPDF({ orientation: columns.length > 5 ? 'landscape' : 'portrait', compress: true });

  const titleY = drawLetterhead(doc, logos);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(title, 14, titleY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Generated ${new Date().toLocaleString()} — ${rows.length} record${rows.length === 1 ? '' : 's'}`, 14, titleY + 6);

  autoTable(doc, {
    startY: titleY + 11,
    margin: { bottom: 16 },
    head: [columns.map((c) => c.header)],
    body: rows.map((row) => columns.map((c) => formatCellForPdf(c.key, row[c.key]))),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [29, 78, 216] }, // matches the app's brand-700 blue
    alternateRowStyles: { fillColor: [248, 250, 252] }, // slate-50
  });

  drawFooters(doc);
  doc.save(filename);
}
