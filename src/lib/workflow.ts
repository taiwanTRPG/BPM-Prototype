import type { CaseRecord, CaseStatus, Role } from '../types';

const STATUS_LABELS: Record<CaseStatus, string> = {
  editing: '編輯中',
  pending_supervisor: '待主管簽核',
  pending_accountant: '待會計簽核',
  pending_cashier: '待出納簽核',
  completed: '已完成',
};

export function getStatusLabel(status: CaseStatus, wasRejected: boolean): string {
  if (status === 'editing' && wasRejected) return '已退回（待修改）';
  return STATUS_LABELS[status];
}

export function getPendingRole(status: CaseStatus): Role | null {
  switch (status) {
    case 'pending_supervisor':
      return 'supervisor';
    case 'pending_accountant':
      return 'accountant';
    case 'pending_cashier':
      return 'cashier';
    default:
      return null;
  }
}

export function canEditForm(role: Role, record: CaseRecord): boolean {
  return role === 'applicant' && record.status === 'editing';
}

export function canSubmit(role: Role, record: CaseRecord): boolean {
  return role === 'applicant' && record.status === 'editing';
}

export function canApprove(role: Role, record: CaseRecord): boolean {
  return getPendingRole(record.status) === role;
}

export function canReject(role: Role, record: CaseRecord): boolean {
  return canApprove(role, record);
}

export function calcTotal(lineItems: { amount: number }[]): number {
  return lineItems.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
}

export function formatCurrency(amount: number): string {
  return `NT$ ${amount.toLocaleString('zh-TW')}`;
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
