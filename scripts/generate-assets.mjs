/**
 * 產生展示用 PDF 空白模板（執行：npm install && npm run generate:assets）
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const templatesDir = join(__dirname, '..', 'public', 'templates');

async function main() {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]);
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontReg = await doc.embedFont(StandardFonts.Helvetica);

  page.drawText('Disbursement Request Form', {
    x: 150,
    y: 800,
    size: 18,
    font,
    color: rgb(0.15, 0.15, 0.2),
  });
  page.drawText('Chu-Zhang Shen-Qing Dan / Demo Template', {
    x: 110,
    y: 775,
    size: 11,
    font: fontReg,
    color: rgb(0.4, 0.4, 0.45),
  });

  const labels = [
    [72, 755, 'Shen-Qing Ri-Qi / Date:'],
    [72, 730, 'Shen-Qing Ren / Applicant:'],
    [72, 690, 'Yong-Tu / Purpose:'],
    [72, 620, 'Fei-Yong Ming-Xi / Items:'],
    [72, 480, 'He-Ji / Total:'],
    [72, 450, 'Shou-Kuan / Payee:'],
    [72, 200, 'Qian-He / Seals:'],
  ];
  for (const [x, y, text] of labels) {
    page.drawText(text, { x, y, size: 10, font: fontReg, color: rgb(0.35, 0.35, 0.4) });
  }

  page.drawRectangle({
    x: 60,
    y: 80,
    width: 475,
    height: 110,
    borderColor: rgb(0.85, 0.85, 0.9),
    borderWidth: 1,
  });

  const bytes = await doc.save();
  await mkdir(templatesDir, { recursive: true });
  await writeFile(join(templatesDir, 'disbursement.pdf'), bytes);
  console.log('Wrote public/templates/disbursement.pdf');
}

main();
