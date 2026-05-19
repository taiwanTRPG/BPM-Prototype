import { Link } from 'react-router-dom';
import type { CaseRecord } from '../types';
import { calcTotal, formatCurrency, formatDateTime, getStatusLabel } from '../lib/workflow';

interface Props {
  cases: CaseRecord[];
  emptyMessage?: string;
}

export function CaseList({ cases, emptyMessage = '目前沒有案件' }: Props) {
  if (!cases.length) {
    return <p className="empty-state">{emptyMessage}</p>;
  }

  return (
    <ul className="case-list">
      {cases.map((c) => (
        <li key={c.id}>
          <Link to={`/forms/${c.id}`} className="case-card">
            <div className="case-card-head">
              <span className="case-no">{c.caseNo}</span>
              <span className={`status-pill status-${c.status}`}>
                {getStatusLabel(c.status, c.wasRejected)}
              </span>
            </div>
            <p className="case-purpose">{c.form.purpose || '（無用途說明）'}</p>
            <p className="case-meta">
              {formatCurrency(calcTotal(c.form.lineItems))}
              <span>·</span>
              更新於 {formatDateTime(c.updatedAt)}
              {c.pdfVersion > 0 && (
                <>
                  <span>·</span>
                  PDF v{c.pdfVersion}
                </>
              )}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
