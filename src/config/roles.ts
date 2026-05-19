import type { Role } from '../types';

export const ROLE_LABELS: Record<Role, string> = {
  applicant: '申請人',
  supervisor: '主管',
  accountant: '會計',
  cashier: '出納',
};

export const ROLE_OPTIONS: { value: Role; label: string }[] = (
  Object.entries(ROLE_LABELS) as [Role, string][]
).map(([value, label]) => ({ value, label }));
