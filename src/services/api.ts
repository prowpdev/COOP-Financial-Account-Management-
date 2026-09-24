import { ShareCapitalSetting } from '../types';

export const DEFAULT_API_BASE = 'http://coop-backend.test/api/';

const getInitialApiBase = (): string => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('coop_api_endpoint');
    if (saved) return saved.replace(/\/+$/, '');
  }
  const envApiBase = import.meta.env.VITE_API_BASE_URL;
  if (envApiBase) return envApiBase.replace(/\/+$/, '');

  // In cloud sandbox or dev environments where .test is unresolvable, default to internal /api
  if (typeof window !== 'undefined') {
    const isCloudOrDev = window.location.hostname.includes('.run.app') || 
                          window.location.hostname.includes('webcontainer') || 
                          window.location.hostname.includes('localhost') ||
                          window.location.hostname.includes('127.0.0.1');
    if (isCloudOrDev) {
      return '/api';
    }
  }

  return DEFAULT_API_BASE.replace(/\/+$/, '');
};

let activeApiBase = getInitialApiBase();

export function setApiBase(url: string) {
  activeApiBase = url.replace(/\/$/, '');
  if (typeof window !== 'undefined') {
    localStorage.setItem('coop_api_endpoint', activeApiBase);
    window.dispatchEvent(new CustomEvent('coop:api-endpoint-changed', { detail: activeApiBase }));
  }
}

export function getApiBase() {
  return activeApiBase;
}

export const API_BASE = activeApiBase;

export function safeArray<T = any>(payload: any): T[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (payload.data !== undefined) {
    if (Array.isArray(payload.data)) return payload.data;
    if (payload.data && typeof payload.data === 'object') {
      if (Array.isArray(payload.data.data)) return payload.data.data;
      if (Array.isArray(payload.data.members)) return payload.data.members;
      if (Array.isArray(payload.data.loans)) return payload.data.loans;
      if (Array.isArray(payload.data.accounts)) return payload.data.accounts;
      const vals = Object.values(payload.data);
      if (vals.length > 0 && typeof vals[0] === 'object' && vals[0] !== null) {
        return vals as T[];
      }
    }
  }
  if (Array.isArray(payload.members)) return payload.members;
  if (Array.isArray(payload.loans)) return payload.loans;
  if (Array.isArray(payload.accounts)) return payload.accounts;
  if (typeof payload === 'object') {
    const vals = Object.values(payload);
    if (vals.length > 0 && typeof vals[0] === 'object' && vals[0] !== null && ('id' in vals[0] || 'member_no' in vals[0] || 'code' in vals[0])) {
      return vals as T[];
    }
  }
  return [];
}

export async function fetchApi<T>(endpoint: string, options?: RequestInit, retries = 1): Promise<T> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const targetUrl = `${activeApiBase}${cleanEndpoint}`;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {})
      },
      ...options
    });

    const data = await response.json();
    if (!response.ok || data.success === false) {
      throw new Error(data.error || `API Request failed with status ${response.status}`);
    }
    // Let open reports re-query immediately after any successful create, edit, or posting.
    // This avoids making users refresh the browser to see saved data.
    if (options?.method && options.method.toUpperCase() !== 'GET' && typeof window !== 'undefined') {
      window.dispatchEvent(new Event('coop:data-changed'));
    }
    return data;
  } catch (err: any) {
    // If targeted endpoint is a custom/remote URL (like http://cooperative-api.test/api)
    // and failed (e.g. Mixed Content block in HTTPS preview or local .test domain not resolved in cloud preview),
    // automatically fall back to internal '/api' so user's preview remains seamlessly functional!
    if (activeApiBase !== '/api') {
      console.warn(`[CoopFlex API] Request to ${targetUrl} failed (${err.message}). Attempting fallback to internal /api...`);
      try {
        const fallbackUrl = `/api${cleanEndpoint}`;
        const fallbackRes = await fetch(fallbackUrl, {
          headers: {
            'Content-Type': 'application/json',
            ...(options?.headers || {})
          },
          ...options
        });
        const fallbackData = await fallbackRes.json();
        if (fallbackRes.ok && fallbackData.success !== false) {
          // Update activeApiBase to '/api' so subsequent requests don't repeatedly fail
          activeApiBase = '/api';
          if (typeof window !== 'undefined') {
            try {
              localStorage.removeItem('coop_api_endpoint');
            } catch {
              // ignore
            }
            window.dispatchEvent(new CustomEvent('coop:api-endpoint-changed', { detail: '/api' }));
          }
          if (options?.method && options.method.toUpperCase() !== 'GET' && typeof window !== 'undefined') {
            window.dispatchEvent(new Event('coop:data-changed'));
          }
          return fallbackData;
        }
      } catch (fallbackErr) {
        // Fallback also failed or had an error, continue to retry or throw
      }
    }

    // For transient network hiccups (such as dev server reload), retry once
    if (retries > 0 && (!options?.method || options.method.toUpperCase() === 'GET')) {
      await new Promise(resolve => setTimeout(resolve, 400));
      return fetchApi<T>(endpoint, options, retries - 1);
    }

    throw err;
  }
}

export const api = {
  // Seeders
  LoadSeeders: async () => {
    const res = await fetchApi<{ success: boolean; data: any }>('/database/seeder', { method: 'GET' });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('coop:data-changed'));
    }
    return res;
  },
  ResetSeeders: async () => {
    const res = await fetchApi<{ success: boolean; data: any }>('/database/seeder/reset', { method: 'GET' });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('coop:data-changed'));
    }
    return res;
  },
  // Config
  getConfig: () => fetchApi<{ success: boolean; data: any }>('/config/all'),
  updateSetting: (body: { key: string; value: string; changed_by?: string; reason?: string }) =>
    fetchApi<{ success: boolean; setting: any }>('/config/system-settings', {
      method: 'PUT',
      body: JSON.stringify(body)
    }),
  toggleFeature: (key: string, enabled: boolean, changed_by?: string, reason?: string) =>
    fetchApi<{ success: boolean; toggle: any }>('/config/feature-toggles/toggle', {
      method: 'POST',
      body: JSON.stringify({ key, enabled, changed_by, reason })
    }),

  // Chart of Accounts
  getChartOfAccounts: async () => {
    try {
      const res = await fetchApi<{ success: boolean; data: any[] }>('/accounting/chart');
      return { ...res, data: safeArray(res) };
    } catch {
      const cfg = await fetchApi<{ success: boolean; data: any }>('/config/all');
      return { success: true, data: cfg.data?.chart_of_accounts || [] };
    }
  },
  createAccount: (account: any) =>
    fetchApi<{ success: boolean; data: any }>('/config/chart-of-accounts', {
      method: 'POST',
      body: JSON.stringify(account)
    }),
  updateAccount: (id: string, account: any) =>
    fetchApi<{ success: boolean; data: any }>(`/config/chart-of-accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(account)
    }),

  // Accounting Mapping
  getAccountingMappings: () =>
    fetchApi<{ success: boolean; data: any }>('/config/accounting-mappings'),
  createAccountingMapping: (mapping: any) =>
    fetchApi<{ success: boolean; data: any }>('/config/accounting-mappings', {
      method: 'POST',
      body: JSON.stringify(mapping)
    }),
  updateMapping: (id: string, mapping: any) =>
    fetchApi<{ success: boolean; data: any }>(`/config/accounting-mappings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(mapping)
    }),
  deleteMapping: (id: string) =>
    fetchApi<{ success: boolean; data: any }>(`/config/accounting-mappings/${id}`, {
      method: 'DELETE'
    }),
  resetDefaultMappings: () =>
    fetchApi<{ success: boolean; data: any }>('/config/accounting-mappings/reset', {
      method: 'POST'
    }),

  // Loan Products & Versioning
  createLoanProduct: (product: any) =>
    fetchApi<{ success: boolean; data: any }>('/config/loan-products', {
      method: 'POST',
      body: JSON.stringify(product)
    }),
  getLoanProduct: (id: string) =>
    fetchApi<{ success: boolean; data: any }>(`/config/loan-products/${id}`),
  updateLoanProduct: (id: string, product: any) =>
    fetchApi<{ success: boolean; data: any; previous_version: any }>(`/config/loan-products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product)
    }),
  deleteLoanProduct: (id: string, changed_by?: string) =>
    fetchApi<{ success: boolean; message: string }>(`/config/loan-products/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ changed_by })
    }),

  // Fees & Penalties
  getFees: () =>
    fetchApi<{ success: boolean; data: any[] }>('/config/fees'),
  getFee: (id: string) =>
    fetchApi<{ success: boolean; data: any }>(`/config/fees/${id}`),
  createFee: (fee: any) =>
    fetchApi<{ success: boolean; data: any }>('/config/fees', {
      method: 'POST',
      body: JSON.stringify(fee)
    }),
  updateFee: (id: string, fee: any) =>
    fetchApi<{ success: boolean; data: any }>(`/config/fees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(fee)
    }),
  deleteFee: (id: string, changed_by?: string) =>
    fetchApi<{ success: boolean; message: string }>(`/config/fees/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ changed_by })
    }),

  // Cash Accounts
  createCashAccount: (acc: any) =>
    fetchApi<{ success: boolean; data: any }>('/config/cash-accounts', {
      method: 'POST',
      body: JSON.stringify(acc)
    }),
  updateCashAccount: (id: string, acc: any) =>
    fetchApi<{ success: boolean; data: any }>(`/config/cash-accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(acc)
    }),
  deleteCashAccount: (id: string) =>
    fetchApi<{ success: boolean; message?: string }>(`/config/cash-accounts/${id}`, {
      method: 'DELETE'
    }),
  autoAlignCashAccountsGl: () =>
    fetchApi<{ success: boolean; count: number; data: any }>('/config/cash-accounts/auto-align-gl', {
      method: 'POST'
    }),
  transferCash: (data: {
    from_account_id: string;
    to_account_id: string;
    amount: number;
    notes?: string;
    performed_by?: string;
    transaction_date?: string;
  }) =>
    fetchApi<{ success: boolean; data: any }>('/cash-accounts/transfer', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  replenishCash: (data: {
    account_id: string;
    amount: number;
    source_account_id?: string;
    notes?: string;
    transaction_date?: string;
  }) =>
    fetchApi<{ success: boolean; data: any }>('/cash-accounts/replenish', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Branches
  createBranch: (branch: any) =>
    fetchApi<{ success: boolean; data: any }>('/config/branches', {
      method: 'POST',
      body: JSON.stringify(branch)
    }),
  updateBranch: (id: string, branch: any) =>
    fetchApi<{ success: boolean; data: any }>(`/config/branches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(branch)
    }),

  // Approval Workflows & Rules
  createApprovalWorkflow: (wf: any) =>
    fetchApi<{ success: boolean; data: any }>('/config/approval-workflows', {
      method: 'POST',
      body: JSON.stringify(wf)
    }),
  createApprovalRule: (rule: any) =>
    fetchApi<{ success: boolean; data: any }>('/config/approval-rules', {
      method: 'POST',
      body: JSON.stringify(rule)
    }),
  updateApprovalRule: (id: string, rule: any) =>
    fetchApi<{ success: boolean; data: any }>(`/config/approval-rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(rule)
    }),

  // Custom Fields & Member Types
  createCustomField: (field: any) =>
    fetchApi<{ success: boolean; data: any }>('/config/custom-fields', {
      method: 'POST',
      body: JSON.stringify(field)
    }),

  // Savings Products
  createSavingsProduct: (product: any) =>
    fetchApi<{ success: boolean; data: any }>('/config/savings-products', {
      method: 'POST',
      body: JSON.stringify(product)
    }),
  getSavingsProducts: async () => {
    const res = await fetchApi<{ success: boolean; data: any }>('/config/all');
    return { success: true, data: res.data?.savings_products || [] };
  },
  createSavingsAccount: (account: any) =>
    fetchApi<{ success: boolean; data: any }>('/savings/accounts', {
      method: 'POST',
      body: JSON.stringify(account)
    }),

  // Numbering Formats
  updateNumberingFormat: (id: string, fmt: any) =>
    fetchApi<{ success: boolean; data: any }>(`/config/numbering-formats/${id}`, {
      method: 'PUT',
      body: JSON.stringify(fmt)
    }),

  // Payment Allocation Priorities
  updatePaymentAllocationRule: (id: string, priorities: any[]) =>
    fetchApi<{ success: boolean; data: any }>(`/config/payment-allocation-rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ priorities })
    }),

  // Accounting Periods
  closeAccountingPeriod: (period_id: string, closed_by?: string) =>
    fetchApi<{ success: boolean; data: any }>('/config/accounting-periods/close', {
      method: 'POST',
      body: JSON.stringify({ period_id, closed_by })
    }),
  reopenAccountingPeriod: (period_id: string, reopened_by?: string) =>
    fetchApi<{ success: boolean; data: any }>('/config/accounting-periods/reopen', {
      method: 'POST',
      body: JSON.stringify({ period_id, reopened_by })
    }),

  // Operations: Members
  getMembers: async () => {
    try {
      const res = await fetchApi<{ success: boolean; data: any[] }>('/members');
      return { ...res, data: safeArray(res) };
    } catch (err) {
      console.warn('[API] getMembers fallback to empty array:', err);
      return { success: false, data: [] };
    }
  },
getMemberReport: async (memberId: string) => {
  const res = await fetchApi<{ success: boolean; data: any }>(
    `/members/${memberId}/report`
  );

  const report = res.data || {};

  // ==========================================
  // JOURNAL VOUCHERS
  // ==========================================

  const journalVouchers = Array.isArray(report.journal_vouchers)
    ? report.journal_vouchers
    : Array.isArray(report.journalVouchers)
      ? report.journalVouchers
      : [];

  // ==========================================
  // JOURNAL TRANSACTION LINES
  // ==========================================

  const journalTransactions = Array.isArray(report.journal_voucher_lines)
    ? report.journal_voucher_lines
    : Array.isArray(report.journalVoucherLines)
      ? report.journalVoucherLines
      : journalVouchers.flatMap(
          (voucher: any) =>
            Array.isArray(voucher.lines)
              ? voucher.lines.map((line: any) => ({
                  ...line,
                  journal_entry_id:
                    line.journal_entry_id || voucher.id,
                  voucher_id: voucher.id,
                  voucher_number: voucher.voucher_number,
                  date: voucher.posting_date,
                  description: voucher.description || '',
                  status: voucher.status || null
                }))
              : []
        );

  // ==========================================
  // TRANSACTIONS
  // ==========================================

  const transactions = Array.isArray(report.transactions)
    ? report.transactions.map((transaction: any) => {
        const type =
          transaction.type ||
          transaction.transaction_type ||
          'Transaction';

        const source = String(
          transaction.category ||
          transaction.source ||
          ''
        ).toLowerCase();

        const category = transaction.category || (
          source.includes('loan') ? 'Loans' :
          source.includes('saving') ? 'Savings' :
          source.includes('share') ? 'Share Capital' :
          'Journal'
        );

        const amount = Number(
          transaction.amount ||
          transaction.total_amount ||
          0
        );

        const isLoanRelease =
          type === 'LOAN_RELEASE' ||
          String(type).toLowerCase().includes('loan release');

        const isLoanPayment =
          type === 'LOAN_PAYMENT' ||
          String(type).toLowerCase().includes('loan payment');

        // ==========================================
        // MATCH JOURNAL LINES TO TRANSACTION
        // ==========================================

        const lines = journalTransactions.filter(
          (line: any) => {

            // Match by journal entry ID
            if (
              line.journal_entry_id &&
              line.journal_entry_id === transaction.transaction_id
            ) {
              return true;
            }

            // Match by voucher ID
            if (
              line.voucher_id &&
              line.voucher_id === transaction.transaction_id
            ) {
              return true;
            }

            // Match by voucher number
            if (
              line.voucher_number &&
              line.voucher_number === transaction.reference_number
            ) {
              return true;
            }

            return false;
          }
        );

        return {
          ...transaction,

          id:
            transaction.id ||
            transaction.transaction_id ||
            transaction.reference_number,

          date:
            transaction.date ||
            transaction.transaction_date,

          type: isLoanRelease
            ? 'Loan released'
            : isLoanPayment
              ? 'Loan payment'
              : type,

          reference:
            transaction.reference ||
            transaction.reference_number ||
            transaction.voucher_number,

          category,

          amount,

          // ==========================================
          // JOURNAL LINES
          // ==========================================
          lines,

          debit:
            transaction.debit !== undefined
              ? Number(transaction.debit)
              : isLoanRelease
                ? amount
                : 0,

          credit:
            transaction.credit !== undefined
              ? Number(transaction.credit)
              : isLoanPayment
                ? amount
                : 0
        };
      })
    : [];

  return {
    ...res,

    data: {
      ...report,

      transactions,

      journalVouchers,

      journalTransactions
    }
  };
},
  createMember: (member: any) =>
    fetchApi<{ success: boolean; data: any }>('/members', {
      method: 'POST',
      body: JSON.stringify(member)
    }),
  // update loan status
  updateLoan:async(loanId:number,status:any)=>{
    fetchApi<{ success: boolean; data: any }>(`/loan/${loanId}`, {
        method: 'PUT',
        body: JSON.stringify(status)
    });
  },
  // Operations: Loans
  getLoans: async () => {
    try {
      const res = await fetchApi<{ success: boolean; data: any[] }>('/loans');
      return { ...res, data: safeArray(res) };
    } catch (err) {
      console.warn('[API] getLoans fallback to empty array:', err);
      return { success: false, data: [] };
    }
  },
  calculateSchedule: async (params: any) => {
    const res = await fetchApi<any>('/loans/calculate-schedule', {
      method: 'POST',
      body: JSON.stringify({
        ...params,
        principal_amount: params.principal_amount ?? params.principal,
        annual_interest_rate: params.annual_interest_rate ?? params.annual_rate,
        interest_calculation_method: params.interest_calculation_method ?? params.method,
        payment_frequency: params.payment_frequency ?? params.frequency,
        disbursement_date: params.disbursement_date ?? params.start_date
      })
    });
    const schedule = res.data?.schedule || res.schedule || [];
    const summary = res.data?.summary || res.summary || {};
    return {
      ...res,
      data: {
        ...(res.data || {}),
        schedule,
        installment_amount: res.data?.installment_amount
          ?? res.installment_amount
          ?? schedule[0]?.total_installment
          ?? 0,
        total_principal: res.data?.total_principal
          ?? summary.principal
          ?? params.principal_amount
          ?? params.principal
          ?? 0,
        total_interest: res.data?.total_interest
          ?? summary.total_interest
          ?? 0,
        total_repayment: res.data?.total_repayment
          ?? summary.total_payment
          ?? 0
      }
    };
  },
  originateLoan: (params: any) =>
    fetchApi<{ success: boolean; data: any; schedule: any[]; accounting_posting: any }>('/loan/originate', {
      method: 'POST',
      body: JSON.stringify(params)
    }),
  applyLoan: (params: any) =>
    fetchApi<{ success: boolean; data: any; schedule?: any[]; accounting_posting?: any }>('/loan/apply', {
      method: 'POST',
      body: JSON.stringify(params)
    }),
getLoanApplications: async (params?: {
  branchId?: string;
  status?: string;
  memberId?: string;
}) => {
  try {
    const payload = {
      branch_id: params?.branchId && params.branchId !== 'all'
        ? params.branchId
        : undefined,

      status: params?.status && params.status !== 'all'
        ? params.status
        : undefined,

      member_id: params?.memberId || undefined,
    };

    const res = await fetchApi<{ success: boolean; data: any[] }>(
      '/loan/applications',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );

    return {
      ...res,
      data: safeArray(res),
    };
  } catch (err) {
    console.warn('[API] getLoanApplications fallback:', err);
    return {
      success: false,
      data: [],
    };
  }
},
  applyLoanApplication: (params: any) =>
    fetchApi<{ success: boolean; data: any; message?: string }>('/loan/apply', {
      method: 'POST',
      body: JSON.stringify(params)
    }),
  approveLoanApplication: (params: { application_id: string; approved_amount: number; approved_by?: string; reviewed_by?: string; reviewed_date?: string; remarks?: string; performed_by?: string }) =>
    fetchApi<{ success: boolean; data: any; message?: string }>('/loan/applications/approve', {
      method: 'POST',
      body: JSON.stringify(params)
    }),
  rejectLoanApplication: (params: { application_id: string; reviewed_by?: string; remarks?: string; performed_by?: string }) =>
    fetchApi<{ success: boolean; data: any; message?: string }>('/loan/applications/reject', {
      method: 'POST',
      body: JSON.stringify(params)
    }),
  originateApprovedLoan: (params: { application_id: string; cash_account_id: string; disbursement_date?: string; first_due_date?: string; performed_by?: string }) =>
    fetchApi<{ success: boolean; data: any; schedule?: any[]; accounting_posting?: any; message?: string }>('/loan/originate', {
      method: 'POST',
      body: JSON.stringify(params)
    }),
  getLoan: (loanId: string) =>
    fetchApi<{ success: boolean; data: any }>(`/loans/${loanId}`),
  getLoanSchedule: (loanId: string) =>
    fetchApi<{ success: boolean; data: any[] }>(`/loans/${loanId}/schedule`),
  getLoanLedger: (loanId: string) =>
    fetchApi<{ success: boolean; data: { loan: any; schedule: any[]; payments: any[]; ledger: any[] } }>(`/loans/${loanId}/ledger`),
  repayLoan: (loanId: string, params: any) =>
    fetchApi<{ success: boolean; payment: any; allocation: any; loan_updated: any; journal_entry: any }>(`/loans/${loanId}/repay`, {
      method: 'POST',
      body: JSON.stringify(params)
    }),
  getAuditLogs: async () => {
    try {
      const res = await fetchApi<{ success: boolean; data: any[] }>('/audit-logs');
      return { ...res, data: safeArray(res) };
    } catch (err) {
      console.warn('[API] getAuditLogs fallback:', err);
      return { success: false, data: [] };
    }
  },
  recordAuditLog: (params: { setting: string; old_value?: any; new_value?: any; changed_by?: string; reason?: string }) =>
    fetchApi<{ success: boolean; data: any }>('/audit-logs', {
      method: 'POST',
      body: JSON.stringify(params)
    }),

  // Operations: Savings
  getSavingsAccounts: async () => {
    try {
      const res = await fetchApi<{ success: boolean; data: any[] }>('/savings/accounts');
      return { ...res, data: safeArray(res) };
    } catch (err) {
      console.warn('[API] getSavingsAccounts fallback to empty array:', err);
      return { success: false, data: [] };
    }
  },
  transactSavings: (params: any) =>
    fetchApi<{ success: boolean; data: any; account_updated: any }>('/savings/transact', {
      method: 'POST',
      body: JSON.stringify(params)
    }),

  // Operations: Share Capital
  getShareCapitalAccounts: async () => {
    try {
      const res = await fetchApi<{ success: boolean; data: any[] }>('/share-capital/accounts');
      return { ...res, data: safeArray(res) };
    } catch (err) {
      console.warn('[API] getShareCapitalAccounts fallback to empty array:', err);
      return { success: false, data: [] };
    }
  },
  getShareCapitalAccount: (id: string) =>
    fetchApi<{ success: boolean; data: any }>(`/share-capital/accounts/${id}`),
  getShareCapitalLedger: (id: string) =>
    fetchApi<{ success: boolean; data: { account: any; ledger: any[] } }>(`/share-capital/accounts/${id}/ledger`),
  createShareCapitalAccount: (account: any) =>
    fetchApi<{ success: boolean; data: any }>('/share-capital/accounts', {
      method: 'POST',
      body: JSON.stringify(account)
    }),
  updateShareCapitalAccount: (id: string, updates: any) =>
    fetchApi<{ success: boolean; data: any; message?: string }>(`/share-capital/accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }),
  deleteShareCapitalAccount: (id: string) =>
    fetchApi<{ success: boolean; message: string }>(`/share-capital/accounts/${id}`, {
      method: 'DELETE'
    }),
  payShareCapital: (params: any) =>
    fetchApi<{ success: boolean; data: any; account: any }>('/share-capital/pay', {
      method: 'POST',
      body: JSON.stringify(params)
    }),
  getShareCapitalSettings: async () => {
    try {
      const res = await fetchApi<{ success: boolean; data: ShareCapitalSetting[] }>('/share-capital/settings');
      return { ...res, data: safeArray<ShareCapitalSetting>(res) };
    } catch (err) {
      console.warn('[API] getShareCapitalSettings fallback:', err);
      return { success: false, data: [] };
    }
  },
  createShareCapitalSetting: (setting: Partial<ShareCapitalSetting> & { changed_by?: string; reason?: string }) =>
    fetchApi<{ success: boolean; data: ShareCapitalSetting; message?: string }>('/share-capital/settings', {
      method: 'POST',
      body: JSON.stringify(setting)
    }),
  updateShareCapitalSetting: (id: string, updates: Partial<ShareCapitalSetting> & { changed_by?: string; reason?: string }) =>
    fetchApi<{ success: boolean; data: ShareCapitalSetting; message?: string }>(`/share-capital/settings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }),

  // Operations: General Accounting
  getJournals: async () => {
    try {
      const res = await fetchApi<{ success: boolean; data: any[] }>('/accounting/journals');
      return { ...res, data: safeArray(res) };
    } catch (err) {
      console.warn('[API] getJournals fallback to empty array:', err);
      return { success: false, data: [] };
    }
  },
  createManualJournal: (params: any) =>
    fetchApi<{ success: boolean; data: any }>('/accounting/manual-journal', {
      method: 'POST',
      body: JSON.stringify(params)
    }),
  getGLReconciliation: (branch_id?: string) =>
    fetchApi<{
      success: boolean;
      data: {
        timestamp: string;
        branch_id: string;
        all_reconciled: boolean;
        total_variance_magnitude: number;
        checks: Array<{
          id: string;
          name: string;
          control_gl_code: string;
          control_gl_name: string;
          normal_balance: string;
          subledger_balance: number;
          gl_balance: number;
          variance: number;
          is_reconciled: boolean;
          items_count: number;
          breakdown: any[];
        }>;
      };
    }>(`/accounting/reconciliation${branch_id && branch_id !== 'all' ? `?branch_id=${branch_id}` : ''}`),

  // Reports
  getTrialBalance: (branch_id?: string) =>
    fetchApi<{ success: boolean; data: any }>(`/reports/trial-balance${branch_id && branch_id !== 'all' ? `?branch_id=${branch_id}` : ''}`),
  getFinancialStatements: (branch_id?: string) =>
    fetchApi<{ success: boolean; data: any }>(`/reports/financial-statements${branch_id && branch_id !== 'all' ? `?branch_id=${branch_id}` : ''}`),
  getFinancialReport: async (type: string, branch_id?: string) => {
    const q = branch_id && branch_id !== 'all' ? `?branch_id=${branch_id}` : '';
    if (type === 'trial_balance') {
      const res = await fetchApi<{ success: boolean; data: any }>(`/reports/trial-balance${q}`);
      return {
        success: true,
        data: {
          accounts: res.data?.balances || [],
          total_debit: res.data?.total_debit || 0,
          total_credit: res.data?.total_credit || 0,
          variance: res.data?.variance ?? (res.data?.total_debit - res.data?.total_credit) ?? 0,
          difference: res.data?.difference ?? (res.data?.total_debit - res.data?.total_credit) ?? 0,
          is_balanced: res.data?.is_balanced ?? (Math.abs((res.data?.total_debit || 0) - (res.data?.total_credit || 0)) < 0.01)
        }
      };
    }
    const res = await fetchApi<{ success: boolean; data: any }>(`/reports/financial-statements${q}`);
    const pos = res.data?.statement_of_financial_position;
    const ops = res.data?.statement_of_operations;

    if (type === 'balance_sheet') {
      const assets = pos?.categories?.filter((c: any) => c.category.includes('Asset')).flatMap((c: any) => c.accounts) || [];
      const liab = pos?.categories?.filter((c: any) => c.category.includes('Liabilit')).flatMap((c: any) => c.accounts) || [];
      const eq = pos?.categories?.filter((c: any) => c.category === 'Equity').flatMap((c: any) => c.accounts) || [];
      return {
        success: true,
        data: {
          assets,
          total_assets: pos?.total_assets || 0,
          liabilities: liab,
          total_liabilities: pos?.total_liabilities || 0,
          equity: eq,
          total_equity: pos?.total_equity || 0,
          total_liabilities_and_equity: pos?.total_liabilities_and_equity || 0
        }
      };
    }
    if (type === 'income_statement') {
      const rev = pos?.categories?.find((c: any) => c.category === 'Income')?.accounts || [];
      const exp = pos?.categories?.find((c: any) => c.category === 'Expenses')?.accounts || [];
      return {
        success: true,
        data: {
          revenues: rev,
          total_income: ops?.total_income || 0,
          expenses: exp,
          total_expenses: ops?.total_expenses || 0,
          net_surplus: ops?.net_surplus || 0
        }
      };
    }
    if (type === 'cda_statutory') {
      const net = ops?.net_surplus || 0;
      return {
        success: true,
        data: {
          net_surplus: net,
          reserve_fund: Number((net * 0.10).toFixed(2)),
          education_training_fund: Number((net * 0.05).toFixed(2)),
          community_dev_fund: Number((net * 0.03).toFixed(2)),
          optional_fund: Number((net * 0.07).toFixed(2)),
          interest_on_share_capital: Number((net * 0.75).toFixed(2))
        }
      };
    }
    return { success: true, data: null };
  },

  // Dashboard Stats
  getDashboardStats: (branch_id?: string) =>
    fetchApi<{ success: boolean; data: any }>(`/dashboard/stats${branch_id ? `?branch_id=${branch_id}` : ''}`),

  // Config Entity Direct Getters
  getCoopProfile: async () => {
    const res = await fetchApi<{ success: boolean; data: any }>('/config/all');
    return { success: true, data: res.data?.cooperative || res.data?.cooperatives?.[0] };
  },
  getBranches: async () => {
    const res = await fetchApi<{ success: boolean; data: any }>('/config/all');
    return { success: true, data: res.data?.branches || [] };
  },
  getUsers: async () => {
    const res = await fetchApi<{ success: boolean; data: any }>('/config/all');
    return { success: true, data: res.data?.users || [] };
  },
  getFeatureToggles: async () => {
    const res = await fetchApi<{ success: boolean; data: any }>('/config/all');
    return { success: true, data: res.data?.feature_toggles || [] };
  },
  getAccounts: async () => {
    const res = await fetchApi<{ success: boolean; data: any }>('/config/all');
    return { success: true, data: res.data?.chart_of_accounts || [] };
  },
  getLoanProducts: async () => {
    return fetchApi<{ success: boolean; data: any[] }>('/config/loan-products');
  },
  getCashAccounts: async (branchId?: string) => {
    const url = branchId && branchId !== 'all' ? `/cash-accounts?branch_id=${branchId}` : '/cash-accounts';
    try {
      const res = await fetchApi<{ success: boolean; data: any; stats?: any }>(url);
      if (res && res.data) return res;
      throw new Error('Fallback to config');
    } catch {
      const res = await fetchApi<{ success: boolean; data: any }>('/config/all');
      return { success: true, data: res.data?.cash_accounts || [] };
    }
  },
  getMemberTypes: async () => {
    const res = await fetchApi<{ success: boolean; data: any }>('/config/all');
    return { success: true, data: res.data?.member_types || [] };
  },
  getCustomFields: async () => {
    const res = await fetchApi<{ success: boolean; data: any }>('/config/all');
    return { success: true, data: res.data?.custom_fields || [] };
  },

  // Authentication & Users
  login: (credentials: { username?: string; email?: string; password: string }) =>
    fetchApi<{ success: boolean; message?: string; data: { user: any; token: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),
  register: (userData: { username: string; email: string; full_name: string; password: string; role_id?: string; branch_id?: string }) =>
    fetchApi<{ success: boolean; message?: string; data: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    }),
  getUsersList: () => fetchApi<{ success: boolean; data: any[] }>('/users'),
  getUserRoles: () => fetchApi<{ success: boolean; data: any[] }>('/user-roles'),

  // Member Portal Authentication & Endpoints
  memberLogin: (credentials: { identifier: string; password?: string }) =>
    fetchApi<{ success: boolean; message?: string; data: { member: any; token: string } }>('/auth/member-login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),
  memberRegister: (memberData: any) =>
    fetchApi<{ success: boolean; message?: string; data: { member: any; token: string } }>('/auth/member-register', {
      method: 'POST',
      body: JSON.stringify(memberData)
    }),
  getMemberPortalDashboard: (memberId: string) =>
    fetchApi<{ success: boolean; message?: string; data: any }>(`/member-portal/${encodeURIComponent(memberId)}/dashboard`),
  memberApplyLoan: (memberId: string, payload: { loan_product_id: string; principal_amount: number; term_months: number; notes?: string }) =>
    fetchApi<{ success: boolean; message?: string; data: any }>(`/member-portal/${encodeURIComponent(memberId)}/apply-loan`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  memberDepositSavings: (memberId: string, payload: { savings_account_id?: string; amount: number; notes?: string }) =>
    fetchApi<{ success: boolean; message?: string; data: any }>(`/member-portal/${encodeURIComponent(memberId)}/deposit`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  memberPayShareCapital: (memberId: string, payload: { amount: number; notes?: string }) =>
    fetchApi<{ success: boolean; message?: string; data: any }>(`/member-portal/${encodeURIComponent(memberId)}/pay-share-capital`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  memberMakeLoanPayment: (memberId: string, payload: { loan_id: string; amount: number; notes?: string }) =>
    fetchApi<{ success: boolean; message?: string; data: any }>(`/member-portal/${encodeURIComponent(memberId)}/loan-payment`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  // Verification & Reset
  resetSeed: () => fetchApi<{ success: boolean; message: string }>('/system/reset-seed', { method: 'POST' }),
  resetToSeed: () => fetchApi<{ success: boolean; message: string }>('/system/reset-seed', { method: 'POST' }),
  purgeOperationalData: (performed_by?: string) =>
    fetchApi<{ success: boolean; message: string }>('/system/purge-operational-data', {
      method: 'POST',
      body: JSON.stringify({ performed_by })
    }),
  resetToScratch: (performed_by?: string) =>
    fetchApi<{ success: boolean; message: string }>('/system/setup/reset-scratch', {
      method: 'POST',
      body: JSON.stringify({ performed_by })
    }),
  getSetupStatus: () =>
    fetchApi<{
      success: boolean;
      data: {
        is_fully_configured: boolean;
        completion_percentage: number;
        completed_count: number;
        total_count: number;
        requirements: Array<{
          id: string;
          step: number;
          name: string;
          status: 'completed' | 'pending';
          summary: string;
          details: string;
        }>;
        stats: {
          cooperative_name: string;
          branches_count: number;
          accounts_count: number;
          members_count: number;
          loans_count: number;
          vault_cash_total: number;
          is_gl_balanced: boolean;
          gl_discrepancy: number;
        };
      };
    }>('/system/setup/status'),
  completeAllSetup: (performed_by?: string) =>
    fetchApi<{
      success: boolean;
      message: string;
      data?: any;
    }>('/system/setup/complete-all', {
      method: 'POST',
      body: JSON.stringify({ performed_by })
    }),
  runSetupStep: (step: number, performed_by?: string) =>
    fetchApi<{ success: boolean; message: string }>('/system/setup/step', {
      method: 'POST',
      body: JSON.stringify({ step, performed_by })
    }),
  seedSampleMembers: () => fetchApi<{ success: boolean; message: string; data?: any }>('/system/seed-sample-data', { method: 'POST' }),
  runVerificationTests: () =>
    fetchApi<{ success: boolean; total_tests: number; passed_count: number; all_passed: boolean; results: any[] }>('/system/run-verification-tests', {
      method: 'POST'
    }),

  // System Notifications (Loan Applications & Interest Received)
  getNotifications: async (params?: { category?: string; unread_only?: boolean; member_id?: string; limit?: number }) => {
    try {
      const queryParts: string[] = [];
      if (params?.category) queryParts.push(`category=${encodeURIComponent(params.category)}`);
      if (params?.unread_only) queryParts.push('unread_only=true');
      if (params?.member_id) queryParts.push(`member_id=${encodeURIComponent(params.member_id)}`);
      if (params?.limit) queryParts.push(`limit=${params.limit}`);
      const qs = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';

      const res = await fetchApi<{
        success: boolean;
        total: number;
        unread_count: number;
        loan_applications_count: number;
        interest_notifications_count: number;
        data: any[];
      }>(`/notifications${qs}`);
      return {
        ...res,
        data: safeArray(res)
      };
    } catch (err) {
      console.warn('[API] getNotifications fallback:', err);
      return {
        success: false,
        total: 0,
        unread_count: 0,
        loan_applications_count: 0,
        interest_notifications_count: 0,
        data: []
      };
    }
  },
  getNotificationsSummary: () =>
    fetchApi<{ success: boolean; summary: any }>('/notifications/summary'),
  markNotificationRead: (id?: string, all?: boolean, ids?: string[]) =>
    fetchApi<{ success: boolean; message: string }>('/notifications/mark-read', {
      method: 'POST',
      body: JSON.stringify({ id, all, ids })
    }),
  markNotificationUnread: (id?: string, ids?: string[]) =>
    fetchApi<{ success: boolean; message: string }>('/notifications/mark-unread', {
      method: 'POST',
      body: JSON.stringify({ id, ids })
    }),
  dismissNotification: (id: string) =>
    fetchApi<{ success: boolean; message: string }>(`/notifications/${id}`, {
      method: 'DELETE'
    }),
  clearAllNotifications: () =>
    fetchApi<{ success: boolean; message: string }>('/notifications/clear-all', {
      method: 'POST'
    }),
  createNotification: (data: { title: string; message: string; category?: string; type?: string; member_id?: string; member_name?: string; amount?: number }) =>
    fetchApi<{ success: boolean; data: any }>('/notifications/create', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  postSavingsInterestBatch: (params?: { period_months?: number; performed_by?: string }) =>
    fetchApi<{ success: boolean; total_credited: number; accounts_credited: number; message: string; transactions?: any[] }>('/savings/post-interest-batch', {
      method: 'POST',
      body: JSON.stringify(params || {})
    })
};
