export type Role = 'applicant' | 'supervisor' | 'accountant' | 'cashier';

export type CaseStatus =
  | 'editing'
  | 'pending_supervisor'
  | 'pending_accountant'
  | 'pending_cashier'
  | 'completed';

export type HistoryAction = 'create' | 'submit' | 'approve' | 'reject';

export interface LineItem {
  item: string;
  amount: number;
  note: string;
}

export interface DisbursementForm {
  applyDate: string;
  applicantName: string;
  purpose: string;
  lineItems: LineItem[];
  payeeInfo: string;
}

export interface HistoryEntry {
  id: string;
  at: string;
  role: Role;
  action: HistoryAction;
}

export interface CaseRecord {
  id: string;
  caseNo: string;
  form: DisbursementForm;
  status: CaseStatus;
  wasRejected: boolean;
  history: HistoryEntry[];
  pdfBase64: string | null;
  pdfVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface AppState {
  currentRole: Role;
  cases: CaseRecord[];
  nextCaseSeq: number;
}
