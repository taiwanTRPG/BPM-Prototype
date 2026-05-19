/**
 * Generate English disbursement PDF template (run: npm run generate:assets)
 * Coordinates must match src/config/pdf-layout.ts
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const templatesDir = join(__dirname, '..', 'public', 'templates');

const LAYOUT = {
  title: { text: 'Disbursement Request Form', x: 72, y: 800, size: 18 },
  subtitle: { text: '(Demonstration)', x: 72, y: 782, size: 10 },
  fields: [
    { label: 'Date', labelX: 72, labelY: 748 },
    { label: 'Applicant', labelX: 72, labelY: 723 },
    { label: 'Purpose', labelX: 72, labelY: 688 },
    { label: 'Line items', labelX: 72, labelY: 628 },
    { label: 'Total', labelX: 72, labelY: 478 },
    { label: 'Payee / Account', labelX: 72, labelY: 448 },
  ],
  sealBox: { x: 60, y: 78, width: 475, height: 118 },
  sealSlots: [
    { label: 'Supervisor', x: 82, y: 102 },
    { label: 'Accountant', x: 232, y: 102 },
    { label: 'Cashier', x: 382, y: 102 },
  ],
};

async function main() {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const font = await doc.embedFont(StandardFonts.Helvetica);

  page.drawText(LAYOUT.title.text, {
    x: LAYOUT.title.x,
    y: LAYOUT.title.y,
    size: LAYOUT.title.size,
    font: fontBold,
    color: rgb(0.12, 0.12, 0.16),
  });
  page.drawText(LAYOUT.subtitle.text, {
    x: LAYOUT.subtitle.x,
    y: LAYOUT.subtitle.y,
    size: LAYOUT.subtitle.size,
    font,
    color: rgb(0.4, 0.4, 0.45),
  });

  for (const f of LAYOUT.fields) {
    page.drawText(`${f.label}:`, {
      x: f.labelX,
      y: f.labelY,
      size: 10,
      font: fontBold,
      color: rgb(0.28, 0.28, 0.32),
    });
  }

  const box = LAYOUT.sealBox;
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
    font: fontBold,
    color: rgb(0.35, 0.35, 0.4),
  });

  for (const s of LAYOUT.sealSlots) {
    page.drawText(s.label, {
      x: s.x,
      y: s.y - 18,
      size: 9,
      font,
      color: rgb(0.5, 0.5, 0.55),
    });
  }

  const bytes = await doc.save();
  await mkdir(templatesDir, { recursive: true });
  await writeFile(join(templatesDir, 'disbursement.pdf'), bytes);
  console.log('Wrote public/templates/disbursement.pdf');
}

main();
