import { PDFDocument, rgb } from 'pdf-lib';
import { PDF_LAYOUT, PDF_PAGE, type FieldKey, type SealKey } from '../../config/pdf-layout';
import type { DisbursementForm } from '../../types';
import { calcTotal, formatCurrency } from '../workflow';
import { embedPdfFonts, type PdfFontSet } from './fonts';

const SEAL_FILES: Record<SealKey, string> = {
  supervisor: 'supervisor.png',
  accountant: 'accountant.png',
  cashier: 'cashier.png',
};

async function loadTemplateBytes(): Promise<Uint8Array | null> {
  const base = import.meta.env.BASE_URL;
  const url = `${base}templates/disbursement.pdf`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return new Uint8Array(await res.arrayBuffer());
  } catch {
    return null;
  }
}

async function loadSealPng(key: SealKey): Promise<Uint8Array | null> {
  const base = import.meta.env.BASE_URL;
  const url = `${base}seals/${SEAL_FILES[key]}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return new Uint8Array(await res.arrayBuffer());
  } catch {
    return null;
  }
}

function wrapText(text: string, maxChars: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const ch of text) {
    if (line.length >= maxChars) {
      lines.push(line);
      line = '';
    }
    line += ch;
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

function drawLabel(
  page: ReturnType<PDFDocument['getPages']>[0],
  text: string,
  x: number,
  y: number,
  size: number,
  fonts: PdfFontSet,
) {
  page.drawText(`${text}:`, {
    x,
    y,
    size,
    font: fonts.latin.bold,
    color: rgb(0.28, 0.28, 0.32),
  });
}

function drawValueLines(
  page: ReturnType<PDFDocument['getPages']>[0],
  value: string,
  x: number,
  y: number,
  size: number,
  lineHeight: number,
  maxWidth: number,
  fonts: PdfFontSet,
) {
  const maxChars = Math.max(20, Math.floor(maxWidth / (size * 0.55)));
  const lines = wrapText(value, maxChars);
  lines.forEach((line, i) => {
    page.drawText(line, {
      x,
      y: y - i * lineHeight,
      size,
      font: fonts.pick(line),
      color: rgb(0.1, 0.1, 0.12),
    });
  });
}

async function drawProgrammaticSeal(
  page: ReturnType<PDFDocument['getPages']>[0],
  key: SealKey,
  fonts: PdfFontSet,
) {
  const slot = PDF_LAYOUT.seals[key];
  const cx = slot.x + slot.width / 2;
  const cy = slot.y + slot.height / 2;
  page.drawEllipse({
    x: cx,
    y: cy,
    xScale: slot.width / 2 - 4,
    yScale: slot.height / 2 - 4,
    borderColor: rgb(0.75, 0.1, 0.1),
    borderWidth: 2,
  });
  const label = slot.label;
  const textWidth = fonts.latin.bold.widthOfTextAtSize(label, 11);
  page.drawText(label, {
    x: cx - textWidth / 2,
    y: cy - 5,
    size: 11,
    font: fonts.latin.bold,
    color: rgb(0.75, 0.1, 0.1),
  });
}

async function embedSeal(
  doc: PDFDocument,
  page: ReturnType<PDFDocument['getPages']>[0],
  key: SealKey,
  fonts: PdfFontSet,
) {
  const slot = PDF_LAYOUT.seals[key];
  const png = await loadSealPng(key);
  if (png) {
    const image = await doc.embedPng(png);
    const scale = Math.min(slot.width / image.width, slot.height / image.height);
    const w = image.width * scale;
    const h = image.height * scale;
    page.drawImage(image, {
      x: slot.x + (slot.width - w) / 2,
      y: slot.y + (slot.height - h) / 2,
      width: w,
      height: h,
    });
    return;
  }
  await drawProgrammaticSeal(page, key, fonts);
}

function drawFieldValue(
  page: ReturnType<PDFDocument['getPages']>[0],
  key: FieldKey,
  value: string,
  fonts: PdfFontSet,
) {
  const cfg = PDF_LAYOUT.fields[key];
  const lineHeight = 'lineHeight' in cfg ? cfg.lineHeight : 14;
  const maxWidth = 'maxWidth' in cfg ? cfg.maxWidth : 420;
  drawValueLines(
    page,
    value,
    cfg.valueX,
    cfg.valueY,
    cfg.size,
    lineHeight,
    maxWidth,
    fonts,
  );
}

async function drawFormContent(
  page: ReturnType<PDFDocument['getPages']>[0],
  form: DisbursementForm,
  fonts: PdfFontSet,
  options: { drawLabels: boolean },
) {
  if (options.drawLabels) {
    const { title, subtitle } = PDF_LAYOUT;
    page.drawText(title.text, {
      x: title.x,
      y: title.y,
      size: title.size,
      font: fonts.latin.bold,
      color: rgb(0.12, 0.12, 0.16),
    });
    page.drawText(subtitle.text, {
      x: subtitle.x,
      y: subtitle.y,
      size: subtitle.size,
      font: fonts.latin.regular,
      color: rgb(0.4, 0.4, 0.45),
    });

    const box = PDF_LAYOUT.sealBox;
    page.drawRectangle({
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
      borderColor: rgb(0.85, 0.85, 0.9),
      borderWidth: 1,
    });
    page.drawText('Approvals', {
      x: box.x + 8,
      y: box.y + box.height - 14,
      size: 10,
      font: fonts.latin.bold,
      color: rgb(0.35, 0.35, 0.4),
    });

    for (const key of Object.keys(PDF_LAYOUT.fields) as FieldKey[]) {
      const cfg = PDF_LAYOUT.fields[key];
      if (key === 'lineItems') continue;
      drawLabel(page, cfg.label, cfg.labelX, cfg.labelY, cfg.size, fonts);
    }

    const itemsCfg = PDF_LAYOUT.fields.lineItems;
    drawLabel(
      page,
      itemsCfg.label,
      itemsCfg.labelX,
      itemsCfg.labelY,
      itemsCfg.size,
      fonts,
    );
  }

  drawFieldValue(page, 'applyDate', form.applyDate, fonts);
  drawFieldValue(page, 'applicantName', form.applicantName, fonts);
  drawFieldValue(page, 'purpose', form.purpose, fonts);

  const itemsCfg = PDF_LAYOUT.fields.lineItems;
  form.lineItems.slice(0, itemsCfg.maxRows).forEach((row, i) => {
    const text = `${i + 1}. ${row.item}  ${formatCurrency(row.amount)}${row.note ? ` (${row.note})` : ''}`;
    page.drawText(text, {
      x: itemsCfg.valueX,
      y: itemsCfg.valueY - i * itemsCfg.lineHeight,
      size: itemsCfg.size,
      font: fonts.pick(text),
      color: rgb(0.1, 0.1, 0.12),
    });
  });

  drawFieldValue(
    page,
    'totalAmount',
    formatCurrency(calcTotal(form.lineItems)),
    fonts,
  );
  drawFieldValue(page, 'payeeInfo', form.payeeInfo, fonts);
}

async function drawFormOnBlank(
  doc: PDFDocument,
  form: DisbursementForm,
  activeSeals: SealKey[],
  fonts: PdfFontSet,
) {
  const page = doc.addPage([PDF_PAGE.width, PDF_PAGE.height]);
  await drawFormContent(page, form, fonts, { drawLabels: true });
  for (const seal of activeSeals) {
    await embedSeal(doc, page, seal, fonts);
  }
}

async function drawFormOnTemplate(
  doc: PDFDocument,
  form: DisbursementForm,
  activeSeals: SealKey[],
  fonts: PdfFontSet,
) {
  const page = doc.getPages()[0] ?? doc.addPage([PDF_PAGE.width, PDF_PAGE.height]);
  await drawFormContent(page, form, fonts, { drawLabels: false });
  for (const seal of activeSeals) {
    await embedSeal(doc, page, seal, fonts);
  }
}

export function sealsForVersion(version: number): SealKey[] {
  const all: SealKey[] = ['supervisor', 'accountant', 'cashier'];
  if (version <= 1) return [];
  return all.slice(0, Math.min(version - 1, 3));
}

export async function generateDisbursementPdf(
  form: DisbursementForm,
  pdfVersion: number,
): Promise<string> {
  const activeSeals = sealsForVersion(pdfVersion);
  const templateBytes = await loadTemplateBytes();

  let doc: PDFDocument;
  if (templateBytes) {
    doc = await PDFDocument.load(templateBytes);
    const fonts = await embedPdfFonts(doc);
    await drawFormOnTemplate(doc, form, activeSeals, fonts);
  } else {
    doc = await PDFDocument.create();
    const fonts = await embedPdfFonts(doc);
    await drawFormOnBlank(doc, form, activeSeals, fonts);
  }

  const bytes = await doc.save();
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export function pdfBase64ToBlobUrl(base64: string): string {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], { type: 'application/pdf' });
  return URL.createObjectURL(blob);
}
