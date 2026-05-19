import { Link } from 'react-router-dom';
import { ROLE_LABELS } from '../config/roles';
import { useApp } from '../store/AppContext';

export function HomePage() {
  const { currentRole } = useApp();

  return (
    <div className="page home-page">
      <section className="hero card">
        <h1>出帳申請 BPM 展示原型</h1>
        <p>
          此為<strong>展示／說明用</strong>互動原型，無真實帳號登入。請使用頂部選單切換角色，模擬申請人與簽核者操作流程。
        </p>
        <p className="muted">
          目前視角：<strong>{ROLE_LABELS[currentRole]}</strong>
        </p>
        <div className="hero-actions">
          <Link to="/forms/new" className="btn btn-primary">
            新增出帳申請
          </Link>
          <Link to="/inbox" className="btn btn-secondary">
            進入收件夾
          </Link>
        </div>
      </section>

      <section className="card steps-card">
        <h2>建議 Demo 步驟</h2>
        <ol className="steps">
          <li>
            以<strong>申請人</strong>身份新增出帳單、填寫明細後送出。
          </li>
          <li>
            切換為<strong>主管</strong> → 收件夾「待我簽核」→ 同意（PDF 出現主管章）。
          </li>
          <li>
            依序切換<strong>會計</strong>、<strong>出納</strong>完成簽核。
          </li>
          <li>
            可示範<strong>退回重填</strong>：主管退回後，改回申請人修改再送。
          </li>
          <li>
            使用「重置示範資料」恢復含範例單的初始狀態。
          </li>
        </ol>
      </section>
    </div>
  );
}
