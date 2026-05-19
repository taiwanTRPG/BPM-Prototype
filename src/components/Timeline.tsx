import { ROLE_LABELS } from '../config/roles';
import type { HistoryEntry } from '../types';
import { formatDateTime } from '../lib/workflow';

const ACTION_LABELS: Record<HistoryEntry['action'], string> = {
  create: '建立申請',
  submit: '送出申請',
  approve: '同意',
  reject: '退回',
};

interface Props {
  history: HistoryEntry[];
}

export function Timeline({ history }: Props) {
  const sorted = [...history].sort(
    (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime(),
  );

  return (
    <ol className="timeline">
      {sorted.map((entry) => (
        <li key={entry.id} className={`timeline-item action-${entry.action}`}>
          <span className="timeline-dot" />
          <div className="timeline-body">
            <strong>{ROLE_LABELS[entry.role]}</strong>
            <span className="timeline-action">{ACTION_LABELS[entry.action]}</span>
            <time>{formatDateTime(entry.at)}</time>
          </div>
        </li>
      ))}
    </ol>
  );
}
