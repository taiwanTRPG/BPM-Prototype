import type { CaseRecord, Role } from '../types';
import { getPendingRole } from './workflow';

export type InboxTab = 'pending' | 'submitted' | 'completed';

export function filterCases(
  cases: CaseRecord[],
  tab: InboxTab,
  role: Role,
): CaseRecord[] {
  const sorted = [...cases].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  switch (tab) {
    case 'pending':
      return sorted.filter((c) => getPendingRole(c.status) === role);
    case 'submitted':
      if (role !== 'applicant') return [];
      return sorted.filter((c) => {
        if (c.status === 'completed') return false;
        if (c.status === 'editing') return c.wasRejected;
        return true;
      });
    case 'completed':
      return sorted.filter((c) => c.status === 'completed');
    default:
      return [];
  }
}

export function countPending(cases: CaseRecord[], role: Role): number {
  return filterCases(cases, 'pending', role).length;
}
