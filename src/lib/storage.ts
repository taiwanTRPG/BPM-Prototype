import type { AppState, CaseRecord, DisbursementForm } from '../types';
import { calcTotal } from './workflow';

const STORAGE_KEY = 'bpm-demo-state-v1';

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function createEmptyForm(applicantName = '展示用申請人'): DisbursementForm {
  return {
    applyDate: todayIsoDate(),
    applicantName,
    purpose: '',
    lineItems: [{ item: '', amount: 0, note: '' }],
    payeeInfo: '',
  };
}

function uid(): string {
  return crypto.randomUUID();
}

export function createSeedCase(seq: number): CaseRecord {
  const now = new Date().toISOString();
  return {
    id: uid(),
    caseNo: `DEMO-${String(seq).padStart(4, '0')}`,
    form: {
      applyDate: todayIsoDate(),
      applicantName: '王小明',
      purpose: '活動場地租借費用',
      lineItems: [
        { item: '場地租金', amount: 3500, note: '週末場' },
        { item: '清潔費', amount: 500, note: '' },
      ],
      payeeInfo: '○○活動中心\n銀行：012 3456 7890 123',
    },
    status: 'pending_supervisor',
    wasRejected: false,
    history: [
      {
        id: uid(),
        at: now,
        role: 'applicant',
        action: 'create',
      },
      {
        id: uid(),
        at: now,
        role: 'applicant',
        action: 'submit',
      },
    ],
    pdfBase64: null,
    pdfVersion: 1,
    createdAt: now,
    updatedAt: now,
  };
}

export function getDefaultState(): AppState {
  return {
    currentRole: 'applicant',
    cases: [createSeedCase(1)],
    nextCaseSeq: 2,
  };
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultState();
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed.cases || !parsed.currentRole) return getDefaultState();
    return parsed;
  } catch {
    return getDefaultState();
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function validateForm(form: DisbursementForm): string | null {
  if (!form.applyDate) return '請填寫申請日期';
  if (!form.applicantName.trim()) return '請填寫申請人姓名';
  if (!form.purpose.trim()) return '請填寫用途說明';
  if (!form.payeeInfo.trim()) return '請填寫受款人／帳號資訊';
  if (!form.lineItems.length) return '請至少新增一筆費用明細';
  for (const row of form.lineItems) {
    if (!row.item.trim()) return '明細項目不可空白';
    if (!row.amount || row.amount <= 0) return '明細金額須大於 0';
  }
  if (calcTotal(form.lineItems) <= 0) return '合計金額須大於 0';
  return null;
}

export const DEFAULT_APPLICANT_NAME = '展示用申請人';
