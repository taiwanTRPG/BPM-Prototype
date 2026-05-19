import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FormFields } from '../components/FormFields';
import { DEFAULT_APPLICANT_NAME, createEmptyForm } from '../lib/storage';
import { useApp } from '../store/AppContext';

export function FormNewPage() {
  const navigate = useNavigate();
  const { currentRole, createCase, submitCase } = useApp();
  const [form, setForm] = useState(() =>
    createEmptyForm(
      currentRole === 'applicant' ? DEFAULT_APPLICANT_NAME : DEFAULT_APPLICANT_NAME,
    ),
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (currentRole !== 'applicant') {
    return (
      <div className="page card">
        <h1>新增出帳申請</h1>
        <p className="empty-state">請切換為「申請人」角色以建立申請單。</p>
        <Link to="/" className="btn btn-secondary">
          返回首頁
        </Link>
      </div>
    );
  }

  const handleSaveAndSubmit = async () => {
    setError(null);
    setBusy(true);
    try {
      const id = await createCase(form);
      await submitCase(id);
      navigate(`/forms/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : '送出失敗');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <h1>新增出帳申請單</h1>
        <Link to="/" className="btn btn-ghost">
          取消
        </Link>
      </header>
      <section className="card">
        {error && <p className="error-banner">{error}</p>}
        <FormFields form={form} onChange={setForm} />
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy}
            onClick={() => void handleSaveAndSubmit()}
          >
            {busy ? '處理中…' : '送出申請'}
          </button>
        </div>
      </section>
        </div>
  );
}
