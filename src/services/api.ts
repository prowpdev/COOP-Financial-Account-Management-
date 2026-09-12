export const DEFAULT_API_BASE = 'http://cooperative-api.test/api';

const getInitialApiBase = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('coop_api_endpoint');
    if (saved) return saved.replace(/\/$/, '');
  }
  return (((import.meta as any).env?.VITE_API_BASE_URL as string) || DEFAULT_API_BASE).replace(/\/$/, '');
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

export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
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
          if (options?.method && options.method.toUpperCase() !== 'GET' && typeof window !== 'undefined') {
            window.dispatchEvent(new Event('coop:data-changed'));
          }
          return fallbackData;
        }
      } catch (fallbackErr) {
        // Fallback also failed or had an error, continue to rethrow original error
      }
    }
    throw err;
  }
}

export const api = {
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
  updateMapping: (id: string, mapping: any) =>
    fetchApi<{ success: boolean; data: any }>(`/config/accounting-mappings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(mapping)
    }),

  // Loan Products & Versioning
  createLoanProduct: (product: any) =>
    fetchApi<{ success: boolean; data: any }>('/config/loan-products', {
      method: 'POST',
      body: JSON.stringify(product)
    }),
  updateLoanProduct: (id: string, product: any) =>
    fetchApi<{ success: boolean; data: any; previous_version: any }>(`/config/loan-products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product)
    }),

  // Fees & Penalties
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
  getMembers: () => fetchApi<{ success: boolean; data: any[] }>('/members'),
  getMemberReport: (memberId: string) => fetchApi<{ success: boolean; data: any }>(`/members/${memberId}/report`),
  createMember: (member: any) =>
    fetchApi<{ success: boolean; data: any }>('/members', {
      method: 'POST',
      body: JSON.stringify(member)
    }),

  // Operations: Loans
  getLoans: () => fetchApi<{ success: boolean; data: any[] }>('/loans'),
  calculateSchedule: (params: any) =>
    fetchApi<{ success: boolean; data: any }>('/loans/calculate-schedule', {
      method: 'POST',
      body: JSON.stringify(params)
    }),
  originateLoan: (params: any) =>
    fetchApi<{ success: boolean; data: any; schedule: any[]; accounting_posting: any }>('/loans/originate', {
      method: 'POST',
      body: JSON.stringify(params)
    }),
  repayLoan: (loanId: string, params: any) =>
    fetchApi<{ success: boolean; payment: any; allocation: any; loan_updated: any; journal_entry: any }>(`/loans/${loanId}/repay`, {
      method: 'POST',
      body: JSON.stringify(params)
    }),

  // Operations: Savings
  getSavingsAccounts: () => fetchApi<{ success: boolean; data: any[] }>('/savings/accounts'),
  transactSavings: (params: any) =>
    fetchApi<{ success: boolean; data: any; account_updated: any }>('/savings/transact', {
      method: 'POST',
      body: JSON.stringify(params)
    }),

  // Operations: Share Capital
  getShareCapitalAccounts: () => fetchApi<{ success: boolean; data: any[] }>('/share-capital/accounts'),
  payShareCapital: (params: any) =>
    fetchApi<{ success: boolean; data: any; account: any }>('/share-capital/pay', {
      method: 'POST',
      body: JSON.stringify(params)
    }),

  // Operations: General Accounting
  getJournals: () => fetchApi<{ success: boolean; data: any[] }>('/accounting/journals'),
  createManualJournal: (params: any) =>
    fetchApi<{ success: boolean; data: any }>('/accounting/manual-journal', {
      method: 'POST',
      body: JSON.stringify(params)
    }),

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
          total_credit: res.data?.total_credit || 0
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
    const res = await fetchApi<{ success: boolean; data: any }>('/config/all');
    return { success: true, data: res.data?.loan_products || [] };
  },
  getCashAccounts: async () => {
    const res = await fetchApi<{ success: boolean; data: any }>('/config/all');
    return { success: true, data: res.data?.cash_accounts || [] };
  },
  getMemberTypes: async () => {
    const res = await fetchApi<{ success: boolean; data: any }>('/config/all');
    return { success: true, data: res.data?.member_types || [] };
  },
  getCustomFields: async () => {
    const res = await fetchApi<{ success: boolean; data: any }>('/config/all');
    return { success: true, data: res.data?.custom_fields || [] };
  },

  // Verification & Reset
  resetSeed: () => fetchApi<{ success: boolean; message: string }>('/system/reset-seed', { method: 'POST' }),
  resetToSeed: () => fetchApi<{ success: boolean; message: string }>('/system/reset-seed', { method: 'POST' }),
  runVerificationTests: () =>
    fetchApi<{ success: boolean; total_tests: number; passed_count: number; all_passed: boolean; results: any[] }>('/system/run-verification-tests', {
      method: 'POST'
    })
};
