import fontkit from '@pdf-lib/fontkit';
import type { PDFDocument, PDFFont } from 'pdf-lib';

/** 繁體中文 TTF（CDN）；亦可將字型放到 public/fonts/NotoSansTC-Regular.ttf */
const FONT_CDN =
  'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-tc@5.2.5/chinese-traditional-400-normal.ttf';

let cachedFontBytes: Uint8Array | null = null;

async function loadFontBytes(): Promise<Uint8Array> {
  if (cachedFontBytes) return cachedFontBytes;

  const localUrl = `${import.meta.env.BASE_URL}fonts/NotoSansTC-Regular.ttf`;
  // 先 CDN，避免未附字型檔時每次 404
  for (const url of [FONT_CDN, localUrl]) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      cachedFontBytes = new Uint8Array(await res.arrayBuffer());
      return cachedFontBytes;
    } catch {
      /* try next */
    }
  }

  throw new Error(
    '無法載入 PDF 中文字型。請確認網路連線，或將 NotoSansTC-Regular.ttf 放到 public/fonts/',
  );
}

export interface PdfFonts {
  regular: PDFFont;
  bold: PDFFont;
}

/** 註冊 fontkit 並嵌入支援中文的字型（pdf-lib 內建 Helvetica 僅支援 WinAnsi） */
export async function embedChineseFonts(doc: PDFDocument): Promise<PdfFonts> {
  doc.registerFontkit(fontkit);
  const bytes = await loadFontBytes();
  const regular = await doc.embedFont(bytes);
  // 展示版共用同一檔案作為粗體
  const bold = await doc.embedFont(bytes);
  return { regular, bold };
}
