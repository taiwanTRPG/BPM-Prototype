import { useEffect, useState } from 'react';
import { pdfBase64ToBlobUrl } from '../lib/pdf/generatePdf';

interface Props {
  pdfBase64: string | null;
  version: number;
}

const PDF_DEMO_NOTICE =
  '補充說明：目前僅為展示用 PDF，簽章僅為圖檔疊加。正式規格將採用 PDF/A 格式，並透過內部伺服器進行數位簽章驗證。';

function DocumentHeading({ version }: { version?: number }) {
  return (
    <div className="pdf-section-heading">
      <h2>{version ? `文件（版本 v${version}）` : '文件'}</h2>
      <p className="pdf-notice muted">{PDF_DEMO_NOTICE}</p>
    </div>
  );
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
        <DocumentHeading />
        <p className="muted pdf-pending">尚未產生 PDF（送出申請或完成簽核後會自動產生）</p>
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
        <DocumentHeading version={version} />
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
