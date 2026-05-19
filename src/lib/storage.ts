import type { AppState, CaseRecord, DisbursementForm } from '../types';
import { calcTotal } from './workflow';

/** v2：不再將 PDF Base64 寫入 localStorage（避免 QuotaExceededError） */
const STORAGE_KEY = 'bpm-demo-state-v2';
const LEGACY_STORAGE_KEY = 'bpm-demo-state-v1';
const MAX_PERSISTED_CASES = 25;

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

/** 寫入磁碟前剔除 PDF（僅保留於記憶體，需要時再產生） */
export function stripPdfForPersist(record: CaseRecord): CaseRecord {
  return { ...record, pdfBase64: null };
}

export function toPersistedState(state: AppState): AppState {
  const cases = state.cases
    .slice(-MAX_PERSISTED_CASES)
    .map(stripPdfForPersist);
  return { ...state, cases };
}

export function normalizeLoadedState(state: AppState): AppState {
  return {
    ...state,
    cases: state.cases.map(stripPdfForPersist),
  };
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

function parseStoredJson(raw: string): AppState | null {
  const parsed = JSON.parse(raw) as AppState;
  if (!parsed.cases || !parsed.currentRole) return null;
  return normalizeLoadedState(parsed);
}

export function loadState(): AppState {
  try {
    const v2 = localStorage.getItem(STORAGE_KEY);
    if (v2) {
      const state = parseStoredJson(v2);
      if (state) return state;
    }

    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) {
      try {
        const migrated = parseStoredJson(legacy);
        if (migrated) {
          saveState(migrated);
          try {
            localStorage.removeItem(LEGACY_STORAGE_KEY);
          } catch {
            /* ignore */
          }
          return migrated;
        }
      } catch {
        try {
          localStorage.removeItem(LEGACY_STORAGE_KEY);
        } catch {
          /* ignore */
        }
      }
    }

    return getDefaultState();
  } catch {
    return getDefaultState();
  }
}

export function saveState(state: AppState): void {
  const payload = toPersistedState(state);
  const json = JSON.stringify(payload);

  try {
    localStorage.setItem(STORAGE_KEY, json);
    return;
  } catch (e) {
    if (!(e instanceof DOMException) || e.name !== 'QuotaExceededError') {
      console.warn('無法儲存示範資料', e);
      return;
    }
  }

  try {
    const trimmed: AppState = {
      ...payload,
      cases: payload.cases.slice(-8),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (e2) {
    console.warn('localStorage 空間不足，已略過持久化', e2);
  }
}

export function findCaseInStorage(id: string): CaseRecord | undefined {
  return loadState().cases.find((c) => c.id === id);
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
