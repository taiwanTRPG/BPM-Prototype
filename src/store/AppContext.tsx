import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AppState, CaseRecord, DisbursementForm, Role } from '../types';
import { generateDisbursementPdf } from '../lib/pdf/generatePdf';
import {
  createEmptyForm,
  createSeedCase,
  getDefaultState,
  loadState,
  saveState,
  validateForm,
} from '../lib/storage';

function uid(): string {
  return crypto.randomUUID();
}

interface AppContextValue {
  state: AppState;
  currentRole: Role;
  setRole: (role: Role) => void;
  resetDemo: () => void;
  createCase: (form: DisbursementForm) => Promise<string>;
  updateCase: (id: string, form: DisbursementForm) => Promise<void>;
  submitCase: (id: string) => Promise<void>;
  approveCase: (id: string) => Promise<void>;
  rejectCase: (id: string) => Promise<void>;
  getCase: (id: string) => CaseRecord | undefined;
  refreshPdf: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

async function attachPdf(record: CaseRecord, version: number): Promise<CaseRecord> {
  const pdfBase64 = await generateDisbursementPdf(record.form, version);
  return { ...record, pdfBase64, pdfVersion: version, updatedAt: new Date().toISOString() };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState());

  useEffect(() => {
    saveState(state);
  }, [state]);

  const setStateAndSave = useCallback((updater: (prev: AppState) => AppState) => {
    setState((prev) => {
      const next = updater(prev);
      saveState(next);
      return next;
    });
  }, []);

  const setRole = useCallback((role: Role) => {
    setStateAndSave((prev) => ({ ...prev, currentRole: role }));
  }, [setStateAndSave]);

  const resetDemo = useCallback(() => {
    const fresh = getDefaultState();
    setState(fresh);
    saveState(fresh);
    void (async () => {
      const seed = fresh.cases[0];
      if (!seed) return;
      const withPdf = await attachPdf(seed, 1);
      setStateAndSave((prev) => ({
        ...prev,
        cases: prev.cases.map((c) => (c.id === withPdf.id ? withPdf : c)),
      }));
    })();
  }, [setStateAndSave]);

  useEffect(() => {
    const needsPdf = state.cases.filter((c) => c.pdfBase64 === null && c.pdfVersion >= 1);
    if (!needsPdf.length) return;
    void (async () => {
      const updated = await Promise.all(
        needsPdf.map((c) => attachPdf(c, c.pdfVersion || 1)),
      );
      setStateAndSave((prev) => ({
        ...prev,
        cases: prev.cases.map((c) => {
          const found = updated.find((u) => u.id === c.id);
          return found ?? c;
        }),
      }));
    })();
  }, [state.cases, setStateAndSave]);

  const createCase = useCallback(
    async (form: DisbursementForm) => {
      const err = validateForm(form);
      if (err) throw new Error(err);
      const now = new Date().toISOString();
      let record: CaseRecord = {
        id: uid(),
        caseNo: '',
        form,
        status: 'editing',
        wasRejected: false,
        history: [{ id: uid(), at: now, role: 'applicant', action: 'create' }],
        pdfBase64: null,
        pdfVersion: 0,
        createdAt: now,
        updatedAt: now,
      };
      let seq = 0;
      setStateAndSave((prev) => {
        seq = prev.nextCaseSeq;
        record = { ...record, caseNo: `OUT-${String(seq).padStart(4, '0')}` };
        return {
          ...prev,
          nextCaseSeq: prev.nextCaseSeq + 1,
          cases: [...prev.cases, record],
        };
      });
      return record.id;
    },
    [setStateAndSave],
  );

  const updateCase = useCallback(
    async (id: string, form: DisbursementForm) => {
      const err = validateForm(form);
      if (err) throw new Error(err);
      setStateAndSave((prev) => ({
        ...prev,
        cases: prev.cases.map((c) =>
          c.id === id
            ? {
                ...c,
                form,
                wasRejected: false,
                updatedAt: new Date().toISOString(),
              }
            : c,
        ),
      }));
    },
    [setStateAndSave],
  );

  const patchCase = useCallback(
    async (id: string, patch: Partial<CaseRecord>) => {
      let target: CaseRecord | undefined;
      setStateAndSave((prev) => {
        const cases = prev.cases.map((c) => {
          if (c.id !== id) return c;
          target = { ...c, ...patch };
          return target;
        });
        return { ...prev, cases };
      });
      return target;
    },
    [setStateAndSave],
  );

  const submitCase = useCallback(
    async (id: string) => {
      const existing = loadState().cases.find((c) => c.id === id);
      if (!existing) return;
      const err = validateForm(existing.form);
      if (err) throw new Error(err);
      const now = new Date().toISOString();
      let next: CaseRecord = {
        ...existing,
        status: 'pending_supervisor',
        wasRejected: false,
        history: [
          ...existing.history,
          { id: uid(), at: now, role: 'applicant', action: 'submit' },
        ],
        pdfVersion: 1,
        updatedAt: now,
      };
      next = await attachPdf(next, 1);
      await patchCase(id, next);
    },
    [patchCase],
  );

  const approveCase = useCallback(
    async (id: string) => {
      const snapshot = loadState();
      const existing = snapshot.cases.find((c) => c.id === id);
      if (!existing) return;
      const role = snapshot.currentRole;
      const now = new Date().toISOString();
      let status = existing.status;
      let version = existing.pdfVersion;

      if (role === 'supervisor' && status === 'pending_supervisor') {
        status = 'pending_accountant';
        version = 2;
      } else if (role === 'accountant' && status === 'pending_accountant') {
        status = 'pending_cashier';
        version = 3;
      } else if (role === 'cashier' && status === 'pending_cashier') {
        status = 'completed';
        version = 4;
      } else {
        throw new Error('目前角色無法簽核此案件');
      }

      let next: CaseRecord = {
        ...existing,
        status,
        history: [
          ...existing.history,
          { id: uid(), at: now, role, action: 'approve' },
        ],
        pdfVersion: version,
        updatedAt: now,
      };
      next = await attachPdf(next, version);
      await patchCase(id, next);
    },
    [patchCase],
  );

  const rejectCase = useCallback(
    async (id: string) => {
      const snapshot = loadState();
      const existing = snapshot.cases.find((c) => c.id === id);
      if (!existing) return;
      const role = snapshot.currentRole;
      const now = new Date().toISOString();
      const next: CaseRecord = {
        ...existing,
        status: 'editing',
        wasRejected: true,
        pdfBase64: null,
        pdfVersion: 0,
        history: [
          ...existing.history,
          { id: uid(), at: now, role, action: 'reject' },
        ],
        updatedAt: now,
      };
      await patchCase(id, next);
    },
    [patchCase],
  );

  const getCase = useCallback(
    (id: string) => state.cases.find((c) => c.id === id),
    [state.cases],
  );

  const refreshPdf = useCallback(
    async (id: string) => {
      const existing = state.cases.find((c) => c.id === id);
      if (!existing || existing.pdfVersion < 1) return;
      const next = await attachPdf(existing, existing.pdfVersion);
      await patchCase(id, next);
    },
    [state.cases, patchCase],
  );

  const value = useMemo(
    () => ({
      state,
      currentRole: state.currentRole,
      setRole,
      resetDemo,
      createCase,
      updateCase,
      submitCase,
      approveCase,
      rejectCase,
      getCase,
      refreshPdf,
    }),
    [
      state,
      setRole,
      resetDemo,
      createCase,
      updateCase,
      submitCase,
      approveCase,
      rejectCase,
      getCase,
      refreshPdf,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export { createEmptyForm, createSeedCase };
