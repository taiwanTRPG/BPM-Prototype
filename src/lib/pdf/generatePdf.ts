import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { PDF_LAYOUT, type SealKey } from '../../config/pdf-layout';
import type { DisbursementForm } from '../../types';
import { calcTotal, formatCurrency } from '../workflow';

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

async function drawProgrammaticSeal(
  page: ReturnType<PDFDocument['getPages']>[0],
  key: SealKey,
  font: Awaited<ReturnType<PDFDocument['embedFont']>>,
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
  const textWidth = font.widthOfTextAtSize(label, 14);
  page.drawText(label, {
    x: cx - textWidth / 2,
    y: cy - 6,
    size: 14,
    font,
    color: rgb(0.75, 0.1, 0.1),
  });
}

async function embedSeal(
  doc: PDFDocument,
  page: ReturnType<PDFDocument['getPages']>[0],
  key: SealKey,
  font: Awaited<ReturnType<PDFDocument['embedFont']>>,
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
  await drawProgrammaticSeal(page, key, font);
}

async function drawFormOnBlank(
  doc: PDFDocument,
  form: DisbursementForm,
  activeSeals: SealKey[],
) {
  const page = doc.addPage([595, 842]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  page.drawText('Taiwan TRPG Association', {
    x: PDF_LAYOUT.title.x,
    y: PDF_LAYOUT.title.y,
    size: PDF_LAYOUT.title.size,
    font: fontBold,
    color: rgb(0.15, 0.15, 0.2),
  });
  page.drawText('Disbursement Request / Chu-Zhang Shen-Qing', {
    x: 120,
    y: PDF_LAYOUT.title.y - 24,
    size: 12,
    font,
    color: rgb(0.35, 0.35, 0.4),
  });

  const drawLabeled = (
    key: keyof typeof PDF_LAYOUT.fields,
    value: string,
  ) => {
    const cfg = PDF_LAYOUT.fields[key];
    page.drawText(`${cfg.label}：`, {
      x: 72,
      y: cfg.y + 4,
      size: 10,
      font: fontBold,
      color: rgb(0.3, 0.3, 0.35),
    });
    const maxWidth = 'maxWidth' in cfg ? cfg.maxWidth : 420;
    const lines = wrapText(value, Math.floor(maxWidth / 6));
    lines.forEach((line, i) => {
      page.drawText(line, {
        x: cfg.x,
        y: cfg.y - i * 14,
        size: cfg.size,
        font,
      });
    });
  };

  drawLabeled('applyDate', form.applyDate);
  drawLabeled('applicantName', form.applicantName);
  drawLabeled('purpose', form.purpose);

  const itemsCfg = PDF_LAYOUT.fields.lineItems;
  page.drawText(`${itemsCfg.label}：`, {
    x: 72,
    y: itemsCfg.y + 4,
    size: 10,
    font: fontBold,
    color: rgb(0.3, 0.3, 0.35),
  });
  form.lineItems.slice(0, 8).forEach((row, i) => {
    const text = `${i + 1}. ${row.item}  ${formatCurrency(row.amount)}${row.note ? `  (${row.note})` : ''}`;
    page.drawText(text, {
      x: itemsCfg.x,
      y: itemsCfg.y - i * itemsCfg.lineHeight,
      size: itemsCfg.size,
      font,
    });
  });

  drawLabeled('totalAmount', formatCurrency(calcTotal(form.lineItems)));
  drawLabeled('payeeInfo', form.payeeInfo);

  for (const seal of activeSeals) {
    await embedSeal(doc, page, seal, font);
  }
}

async function drawFormOnTemplate(
  doc: PDFDocument,
  form: DisbursementForm,
  activeSeals: SealKey[],
) {
  const page = doc.getPages()[0] ?? doc.addPage([595, 842]);
  const font = await doc.embedFont(StandardFonts.Helvetica);

  const entries: { key: keyof typeof PDF_LAYOUT.fields; value: string }[] = [
    { key: 'applyDate', value: form.applyDate },
    { key: 'applicantName', value: form.applicantName },
    { key: 'purpose', value: form.purpose },
    {
      key: 'lineItems',
      value: form.lineItems
        .map(
          (r, i) =>
            `${i + 1}. ${r.item} ${formatCurrency(r.amount)}${r.note ? ` (${r.note})` : ''}`,
        )
        .join('\n'),
    },
    { key: 'totalAmount', value: formatCurrency(calcTotal(form.lineItems)) },
    { key: 'payeeInfo', value: form.payeeInfo },
  ];

  for (const { key, value } of entries) {
    const cfg = PDF_LAYOUT.fields[key];
    const lines =
      key === 'lineItems'
        ? value.split('\n')
        : wrapText(value, Math.floor(('maxWidth' in cfg ? cfg.maxWidth : 400) / 6));
    lines.forEach((line, i) => {
      const lh = 'lineHeight' in cfg ? cfg.lineHeight : 14;
      page.drawText(line, {
        x: cfg.x,
        y: cfg.y - i * lh,
        size: cfg.size,
        font,
      });
    });
  }

  for (const seal of activeSeals) {
    await embedSeal(doc, page, seal, font);
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
    await drawFormOnTemplate(doc, form, activeSeals);
  } else {
    doc = await PDFDocument.create();
    await drawFormOnBlank(doc, form, activeSeals);
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
