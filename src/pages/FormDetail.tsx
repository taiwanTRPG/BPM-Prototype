import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FormFields } from '../components/FormFields';
import { PdfSection } from '../components/PdfSection';
import { Timeline } from '../components/Timeline';
import {
  canApprove,
  canEditForm,
  canReject,
  canSubmit,
} from '../lib/workflow';
import { useApp } from '../store/AppContext';

export function FormDetailPage() {
  const { id } = useParams<{ id: string }>();
  const {
    currentRole,
    getCase,
    updateCase,
    submitCase,
    approveCase,
    rejectCase,
  } = useApp();
  const record = id ? getCase(id) : undefined;
  const [form, setForm] = useState(record?.form);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (record) setForm(record.form);
  }, [record?.id, record?.updatedAt]);

  if (!record || !form) {
    return (
      <div className="page card">
        <h1>找不到案件</h1>
        <Link to="/inbox">返回收件夾</Link>
      </div>
    );
  }

  const editable = canEditForm(currentRole, record);
  const showSubmit = canSubmit(currentRole, record);
  const showApprove = canApprove(currentRole, record);
  const showReject = canReject(currentRole, record);

  const run = async (fn: () => Promise<void>) => {
    setError(null);
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : '操作失敗');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page detail-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">出帳申請</p>
          <h1>{record.caseNo}</h1>
        </div>
        <Link to="/inbox" className="btn btn-ghost">
          返回收件夾
        </Link>
      </header>

      {error && <p className="error-banner">{error}</p>}

      <div className="detail-grid">
        <section className="card">
          <h2>表單內容</h2>
          <FormFields
            form={form}
            readOnly={!editable}
            onChange={editable ? setForm : undefined}
          />
          <div className="form-actions">
            {showSubmit && (
              <>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      await updateCase(record.id, form);
                    })
                  }
                >
                  儲存修改
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      await updateCase(record.id, form);
                      await submitCase(record.id);
                    })
                  }
                >
                  重新送出
                </button>
              </>
            )}
            {showApprove && (
              <button
                type="button"
                className="btn btn-primary"
                disabled={busy}
                onClick={() => void run(() => approveCase(record.id))}
              >
                同意
              </button>
            )}
            {showReject && (
              <button
                type="button"
                className="btn btn-danger"
                disabled={busy}
                onClick={() => {
                  if (!confirm('確定要退回給申請人嗎？')) return;
                  void run(() => rejectCase(record.id));
                }}
              >
                退回
              </button>
            )}
          </div>
        </section>

        <section className="card">
          <h2>簽核歷程</h2>
          <Timeline history={record.history} />
        </section>

        <PdfSection pdfBase64={record.pdfBase64} version={record.pdfVersion} />
      </div>
    </div>
  );
}
