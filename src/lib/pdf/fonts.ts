import fontkit from '@pdf-lib/fontkit';
import { PDFDocument, StandardFonts, type PDFFont } from 'pdf-lib';

/** Traditional Chinese TTF for user-entered form values */
const FONT_CDN =
  'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-tc@5.2.5/chinese-traditional-400-normal.ttf';

let cachedCjkBytes: Uint8Array | null = null;

const CJK_REGEX = /[\u4e00-\u9fff\u3400-\u4dbf]/;

export function textNeedsCjkFont(text: string): boolean {
  return CJK_REGEX.test(text);
}

async function loadCjkFontBytes(): Promise<Uint8Array> {
  if (cachedCjkBytes) return cachedCjkBytes;

  const localUrl = `${import.meta.env.BASE_URL}fonts/NotoSansTC-Regular.ttf`;
  for (const url of [FONT_CDN, localUrl]) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      cachedCjkBytes = new Uint8Array(await res.arrayBuffer());
      return cachedCjkBytes;
    } catch {
      /* try next */
    }
  }

  throw new Error(
    'Cannot load CJK font for PDF. Check network or add NotoSansTC-Regular.ttf to public/fonts/',
  );
}

export interface LatinFonts {
  regular: PDFFont;
  bold: PDFFont;
}

export interface CjkFonts {
  regular: PDFFont;
}

export async function embedLatinFonts(doc: PDFDocument): Promise<LatinFonts> {
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  return { regular, bold };
}

export async function embedCjkFonts(doc: PDFDocument): Promise<CjkFonts> {
  doc.registerFontkit(fontkit);
  const bytes = await loadCjkFontBytes();
  const regular = await doc.embedFont(bytes);
  return { regular };
}

export type PdfFontSet = {
  latin: LatinFonts;
  cjk: CjkFonts;
  pick: (text: string) => PDFFont;
};

export async function embedPdfFonts(doc: PDFDocument): Promise<PdfFontSet> {
  const latin = await embedLatinFonts(doc);
  const cjk = await embedCjkFonts(doc);
  return {
    latin,
    cjk,
    pick: (text: string) =>
      textNeedsCjkFont(text) ? cjk.regular : latin.regular,
  };
}
