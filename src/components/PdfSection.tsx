import { useEffect, useState } from 'react';
import { pdfBase64ToBlobUrl } from '../lib/pdf/generatePdf';

interface Props {
  pdfBase64: string | null;
  version: number;
}

export function PdfSection({ pdfBase64, version }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!pdfBase64) {
      setPreviewUrl(null);
      return;
    }
    try {
      const url = pdfBase64ToBlobUrl(pdfBase64);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } catch {
      setPreviewUrl(null);
    }
  }, [pdfBase64]);

  if (!pdfBase64 || !previewUrl) {
    return (
      <section className="pdf-section card">
        <h2>文件</h2>
        <p className="muted">尚未產生 PDF（送出申請或完成簽核後會自動產生）</p>
      </section>
    );
  }

  const download = () => {
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = `disbursement-v${version}.pdf`;
    a.click();
  };

  return (
    <section className="pdf-section card">
      <div className="section-head">
        <h2>文件（版本 v{version}）</h2>
        <button type="button" className="btn btn-primary" onClick={download}>
          下載 PDF
        </button>
      </div>
      <iframe
        title="PDF 預覽"
        src={previewUrl}
        className="pdf-frame"
      />
    </section>
  );
}
