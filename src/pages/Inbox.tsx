import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CaseList } from '../components/CaseList';
import { ROLE_LABELS } from '../config/roles';
import { filterCases, type InboxTab } from '../lib/inbox';
import { useApp } from '../store/AppContext';

const TABS: { id: InboxTab; label: string }[] = [
  { id: 'pending', label: '待我簽核' },
  { id: 'submitted', label: '我送出的' },
  { id: 'completed', label: '已完成' },
];

export function InboxPage() {
  const { state, currentRole } = useApp();
  const [tab, setTab] = useState<InboxTab>('pending');
  const cases = filterCases(state.cases, tab, currentRole);

  const emptyMessages: Record<InboxTab, string> = {
    pending: '目前沒有待您簽核的案件',
    submitted:
      currentRole !== 'applicant'
        ? '請切換為「申請人」角色以檢視您送出的案件'
        : '目前沒有進行中的申請',
    completed: '尚無已結案案件',
  };

  return (
    <div className="page inbox-page">
      <header className="page-header">
        <h1>收件夾</h1>
        {currentRole === 'applicant' && (
          <Link to="/forms/new" className="btn btn-primary">
            新增出帳申請
          </Link>
        )}
      </header>

      <p className="muted inbox-hint">
        目前角色：{ROLE_LABELS[currentRole]}
      </p>

      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={tab === t.id ? 'tab active' : 'tab'}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            {t.id === 'pending' && (
              <span className="tab-count">
                {filterCases(state.cases, 'pending', currentRole).length}
              </span>
            )}
          </button>
        ))}
      </div>

      <CaseList cases={cases} emptyMessage={emptyMessages[tab]} />
    </div>
  );
}
