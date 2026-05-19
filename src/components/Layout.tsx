import { Link, Outlet, useLocation } from 'react-router-dom';
import { ROLE_LABELS } from '../config/roles';
import { countPending } from '../lib/inbox';
import { useApp } from '../store/AppContext';
import { ROLE_OPTIONS } from '../config/roles';

export function Layout() {
  const { state, currentRole, setRole, resetDemo } = useApp();
  const location = useLocation();
  const pending = countPending(state.cases, currentRole);

  const navLink = (to: string, label: string) => {
    const active = location.pathname === to || location.pathname.startsWith(to + '/');
    return (
      <Link to={to} className={active ? 'nav-link active' : 'nav-link'}>
        {label}
        {to === '/inbox' && pending > 0 && (
          <span className="badge">{pending}</span>
        )}
      </Link>
    );
  };

  return (
    <div className="layout">
      <header className="header">
        <div className="header-inner">
          <Link to="/" className="brand">
            BPM 展示原型
          </Link>
          <nav className="nav">
            {navLink('/', '首頁')}
            {navLink('/inbox', '收件夾')}
          </nav>
          <div className="header-actions">
            <label className="role-select">
              <span>目前角色</span>
              <select
                value={currentRole}
                onChange={(e) => setRole(e.target.value as typeof currentRole)}
              >
                {ROLE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className="btn btn-ghost" onClick={resetDemo}>
              重置示範資料
            </button>
          </div>
        </div>
        <p className="demo-banner">
          展示模式：目前為【{ROLE_LABELS[currentRole]}】視角（無需登入，切換角色以模擬不同人員）
        </p>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
