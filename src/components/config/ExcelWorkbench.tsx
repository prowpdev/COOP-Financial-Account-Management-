import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Plus,
  RefreshCw,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
  TableProperties,
  ArrowRight
} from 'lucide-react';
import { ExcelGridTable, ExcelColumn } from '../common/ExcelGridTable';
import { api } from '../../services/api';
import {
  LoanProduct,
  Account,
  Fee,
  Branch,
  CashAccount,
  ApprovalRule,
  CustomField,
  NumberingFormat,
  User
} from '../../types';

interface ExcelWorkbenchProps {
  configData?: {
    loan_products?: LoanProduct[];
    chart_of_accounts?: Account[];
    fees?: Fee[];
    branches?: Branch[];
    cash_accounts?: CashAccount[];
    approval_rules?: ApprovalRule[];
    custom_fields?: CustomField[];
    numbering_formats?: NumberingFormat[];
  };
  currentUser: User;
  onRefresh?: () => void;
  showNotice?: (type: 'success' | 'error', msg: string) => void;
}

type SheetKey =
  | 'loan_products'
  | 'chart_of_accounts'
  | 'fees'
  | 'branches'
  | 'cash_accounts'
  | 'approval_rules'
  | 'custom_fields'
  | 'numbering_formats';

export const ExcelWorkbench: React.FC<ExcelWorkbenchProps> = ({
  configData: initialConfigData,
  currentUser,
  onRefresh,
  showNotice
}) => {
  const [internalConfig, setInternalConfig] = useState<any>(initialConfigData || null);
  const [activeSheet, setActiveSheet] = useState<SheetKey>('loan_products');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const res = await api.getConfig();
      if (res && res.data) {
        setInternalConfig(res.data);
      }
    } catch (e) {
      console.error('Failed to load workbench data:', e);
    }
  };

  React.useEffect(() => {
    if (initialConfigData) {
      setInternalConfig(initialConfigData);
    } else {
      loadData();
    }
  }, [initialConfigData]);

  const notify = (type: 'success' | 'error', msg: string) => {
    if (showNotice) showNotice(type, msg);
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    if (onRefresh) await onRefresh();
    setIsRefreshing(false);
  };

  const configData = {
    loan_products: internalConfig?.loan_products || [],
    chart_of_accounts: internalConfig?.chart_of_accounts || [],
    fees: internalConfig?.fees || [],
    branches: internalConfig?.branches || [],
    cash_accounts: internalConfig?.cash_accounts || [],
    approval_rules: internalConfig?.approval_rules || [],
    custom_fields: internalConfig?.custom_fields || [],
    numbering_formats: internalConfig?.numbering_formats || []
  };

  // --- LOAN PRODUCTS COLUMNS ---
  const loanProductCols: ExcelColumn<LoanProduct>[] = [
    { key: 'code', header: 'Product Code', width: '130px', type: 'text', sortable: true },
    { key: 'name', header: 'Product Name', width: '220px', type: 'text', sortable: true, editable: true },
    {
      key: 'version',
      header: 'Version',
      width: '90px',
      type: 'badge',
      align: 'center',
      badgeColor: () => 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      render: val => <span className="font-mono font-bold text-blue-400">v{val}</span>
    },
    {
      key: 'annual_interest_rate',
      header: 'Interest Rate (% p.a.)',
      width: '160px',
      type: 'percent',
      align: 'right',
      sortable: true,
      editable: true
    },
    {
      key: 'interest_calculation_method',
      header: 'Calc Method',
      width: '170px',
      type: 'text',
      sortable: true
    },
    {
      key: 'default_term_months',
      header: 'Term (Months)',
      width: '120px',
      type: 'number',
      align: 'center',
      sortable: true,
      editable: true
    },
    {
      key: 'min_amount',
      header: 'Min Principal',
      width: '140px',
      type: 'currency',
      align: 'right',
      sortable: true,
      editable: true
    },
    {
      key: 'max_amount',
      header: 'Max Principal',
      width: '140px',
      type: 'currency',
      align: 'right',
      sortable: true,
      editable: true
    },
    {
      key: 'grace_period_days',
      header: 'Grace (Days)',
      width: '120px',
      type: 'number',
      align: 'center',
      sortable: true,
      editable: true
    },
    {
      key: 'processing_fee_percentage',
      header: 'Proc Fee %',
      width: '110px',
      type: 'percent',
      align: 'right',
      sortable: true,
      editable: true
    },
    {
      key: 'active',
      header: 'Status',
      width: '100px',
      type: 'boolean',
      align: 'center',
      sortable: true
    }
  ];

  // --- CHART OF ACCOUNTS COLUMNS ---
  const coaCols: ExcelColumn<Account>[] = [
    {
      key: 'account_code',
      header: 'Account Code',
      width: '130px',
      type: 'text',
      sortable: true,
      accessor: a => a.account_code || a.code
    },
    { key: 'name', header: 'Account Name', width: '250px', type: 'text', sortable: true, editable: true },
    {
      key: 'category',
      header: 'Category',
      width: '130px',
      type: 'badge',
      sortable: true,
      editable: true,
      accessor: a => a.category || a.type,
      badgeColor: val => {
        switch (val) {
          case 'Asset':
            return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
          case 'Liability':
            return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
          case 'Equity':
            return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
          case 'Revenue':
          case 'Income':
            return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
          case 'Expense':
            return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
          default:
            return 'bg-slate-800 text-slate-300 border-slate-700';
        }
      }
    },
    {
      key: 'report_group',
      header: 'Report Group',
      width: '180px',
      type: 'text',
      sortable: true,
      editable: true,
      accessor: a => a.report_group || a.category
    },
    {
      key: 'normal_balance',
      header: 'Normal Bal',
      width: '110px',
      type: 'text',
      align: 'center',
      sortable: true,
      editable: true,
      render: val => (
        <span
          className={`font-mono text-xs font-semibold ${
            val === 'Debit' ? 'text-blue-400' : 'text-purple-400'
          }`}
        >
          {val}
        </span>
      )
    },
    {
      key: 'parent_account_id',
      header: 'Parent Account',
      width: '140px',
      type: 'text',
      sortable: true,
      accessor: a => a.parent_account_id || a.parent_id || '—'
    },
    {
      key: 'description',
      header: 'Description',
      width: '260px',
      type: 'text',
      sortable: true,
      editable: true,
      accessor: a => a.description || '—'
    },
    {
      key: 'is_active',
      header: 'Status',
      width: '90px',
      type: 'boolean',
      align: 'center',
      sortable: true,
      accessor: a => (a.is_active !== undefined ? a.is_active : a.active !== false)
    }
  ];

  // --- FEES & CHARGES COLUMNS ---
  const feeCols: ExcelColumn<Fee>[] = [
    { key: 'code', header: 'Fee Code', width: '120px', type: 'text', sortable: true },
    { key: 'name', header: 'Fee Description', width: '220px', type: 'text', sortable: true, editable: true },
    {
      key: 'calculation_type',
      header: 'Fee Type',
      width: '130px',
      type: 'badge',
      sortable: true,
      badgeColor: val =>
        val === 'Percentage'
          ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    },
    {
      key: 'fixed_amount',
      header: 'Fixed Amount',
      width: '140px',
      type: 'currency',
      align: 'right',
      sortable: true,
      editable: true,
      accessor: f => (f.fixed_amount !== undefined ? f.fixed_amount : (f.amount !== undefined ? f.amount : 0))
    },
    {
      key: 'percentage',
      header: 'Rate (%)',
      width: '120px',
      type: 'percent',
      align: 'right',
      sortable: true,
      editable: true,
      accessor: f => (f.percentage !== undefined ? f.percentage : (f.rate !== undefined ? f.rate : 0))
    },
    {
      key: 'applicable_module',
      header: 'Module',
      width: '120px',
      type: 'text',
      sortable: true,
      accessor: f => f.applicable_module || f.applies_to || 'Loans'
    },
    {
      key: 'accounting_account_id',
      header: 'GL Account ID',
      width: '140px',
      type: 'text',
      sortable: true,
      accessor: f => f.accounting_account_id || f.gl_account_id || '—'
    },
    { key: 'active', header: 'Active', width: '90px', type: 'boolean', align: 'center', sortable: true }
  ];

  // --- BRANCHES COLUMNS ---
  const branchCols: ExcelColumn<Branch>[] = [
    { key: 'code', header: 'Branch Code', width: '120px', type: 'text', sortable: true },
    { key: 'name', header: 'Branch Name', width: '220px', type: 'text', sortable: true, editable: true },
    { key: 'address', header: 'Physical Address', width: '280px', type: 'text', sortable: true, editable: true },
    { key: 'phone', header: 'Contact Telephone', width: '160px', type: 'text', sortable: true, editable: true },
    { key: 'manager_name', header: 'Branch Manager', width: '180px', type: 'text', sortable: true, editable: true },
    { key: 'active', header: 'Active', width: '90px', type: 'boolean', align: 'center', sortable: true }
  ];

  // --- CASH ACCOUNTS COLUMNS ---
  const cashCols: ExcelColumn<CashAccount>[] = [
    { key: 'account_number', header: 'Account No.', width: '150px', type: 'text', sortable: true },
    { key: 'name', header: 'Cash Account Name', width: '220px', type: 'text', sortable: true, editable: true },
    { key: 'bank_name', header: 'Bank / Depository', width: '180px', type: 'text', sortable: true, editable: true },
    { key: 'branch_id', header: 'Branch ID', width: '130px', type: 'text', sortable: true },
    {
      key: 'current_balance',
      header: 'Current Balance',
      width: '160px',
      type: 'currency',
      align: 'right',
      sortable: true
    },
    { key: 'currency', header: 'Currency', width: '90px', type: 'text', align: 'center' },
    { key: 'active', header: 'Active', width: '90px', type: 'boolean', align: 'center', sortable: true }
  ];

  // --- APPROVAL RULES COLUMNS ---
  const approvalCols: ExcelColumn<ApprovalRule>[] = [
    { key: 'level_name', header: 'Level Name', width: '180px', type: 'text', sortable: true, editable: true },
    {
      key: 'minimum_amount',
      header: 'Min Threshold',
      width: '150px',
      type: 'currency',
      align: 'right',
      sortable: true,
      editable: true
    },
    {
      key: 'maximum_amount',
      header: 'Max Threshold',
      width: '150px',
      type: 'currency',
      align: 'right',
      sortable: true,
      editable: true
    },
    { key: 'required_role', header: 'Required Role', width: '180px', type: 'text', sortable: true, editable: true },
    {
      key: 'required_approvals',
      header: 'Required Approvers',
      width: '150px',
      type: 'number',
      align: 'center',
      sortable: true,
      editable: true
    },
    { key: 'order', header: 'Step Order', width: '100px', type: 'number', align: 'center', sortable: true }
  ];

  // --- CUSTOM FIELDS COLUMNS ---
  const customFieldCols: ExcelColumn<CustomField>[] = [
    { key: 'module', header: 'Module', width: '130px', type: 'text', sortable: true },
    { key: 'field_name', header: 'Field Key', width: '160px', type: 'text', sortable: true },
    { key: 'field_label', header: 'Label', width: '200px', type: 'text', sortable: true },
    {
      key: 'field_type',
      header: 'Field Type',
      width: '130px',
      type: 'badge',
      sortable: true,
      badgeColor: () => 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    },
    { key: 'required', header: 'Required', width: '100px', type: 'boolean', align: 'center', sortable: true },
    {
      key: 'options',
      header: 'Dropdown Options',
      width: '240px',
      type: 'text',
      render: val => (Array.isArray(val) ? val.join(', ') : String(val || '-'))
    }
  ];

  // --- NUMBERING FORMATS COLUMNS ---
  const numberingCols: ExcelColumn<NumberingFormat>[] = [
    { key: 'module', header: 'Module', width: '140px', type: 'text', sortable: true },
    { key: 'prefix', header: 'Prefix', width: '110px', type: 'text', sortable: true },
    { key: 'pattern', header: 'Pattern', width: '180px', type: 'text', sortable: true },
    { key: 'length', header: 'Seq Length', width: '110px', type: 'number', align: 'center', sortable: true },
    {
      key: 'current_seq',
      header: 'Current Seq Counter',
      width: '160px',
      type: 'number',
      align: 'center',
      sortable: true
    }
  ];

  // --- CELL EDIT HANDLERS ---
  const handleEditLoanProduct = async (product: LoanProduct, fieldKey: string, newVal: any) => {
    const updated = {
      ...product,
      [fieldKey]: newVal,
      changed_by: currentUser.name,
      reason: `Excel Spreadsheet direct edit: ${fieldKey} updated to ${newVal}`
    };
    await api.updateLoanProduct(product.id, updated);
    notify('success', `Loan product "${product.name}" updated to v${(product.version || 1) + 1}!`);
    onRefresh();
  };

  const handleEditAccount = async (account: Account, fieldKey: string, newVal: any) => {
    const updated = {
      ...account,
      [fieldKey]: newVal,
      ...(fieldKey === 'account_code' ? { code: newVal } : {}),
      ...(fieldKey === 'code' ? { account_code: newVal } : {}),
      ...(fieldKey === 'category' ? { type: newVal === 'Revenue' ? 'Income' : newVal } : {}),
      ...(fieldKey === 'is_active' ? { active: newVal } : {}),
      changed_by: currentUser.name,
      reason: `Excel Spreadsheet direct edit: ${fieldKey}`
    };
    await api.updateAccount(account.id, updated);
    notify('success', `Account "${account.account_code || account.code} - ${account.name}" updated!`);
    onRefresh();
  };

  const handleEditFee = async (fee: Fee, fieldKey: string, newVal: any) => {
    const numVal = (fieldKey === 'fixed_amount' || fieldKey === 'percentage' || fieldKey === 'amount' || fieldKey === 'rate')
      ? (parseFloat(newVal) || 0)
      : newVal;
    const updated = {
      ...fee,
      [fieldKey]: numVal,
      ...(fieldKey === 'fixed_amount' ? { amount: numVal } : {}),
      ...(fieldKey === 'percentage' ? { rate: numVal, amount: fee.calculation_type === 'Fixed' ? fee.fixed_amount : numVal } : {}),
      ...(fieldKey === 'applicable_module' ? { applies_to: newVal } : {}),
      ...(fieldKey === 'applies_to' ? { applicable_module: newVal } : {}),
      ...(fieldKey === 'accounting_account_id' ? { gl_account_id: newVal } : {}),
      ...(fieldKey === 'gl_account_id' ? { accounting_account_id: newVal } : {}),
      changed_by: currentUser.name,
      reason: `Excel Spreadsheet direct edit: ${fieldKey}`
    };
    await api.updateFee(fee.id, updated);
    notify('success', `Fee "${fee.name}" updated!`);
    if (onRefresh) onRefresh();
  };

  const handleEditBranch = async (branch: Branch, fieldKey: string, newVal: any) => {
    const updated = {
      ...branch,
      [fieldKey]: newVal,
      changed_by: currentUser.name,
      reason: `Excel Spreadsheet direct edit: ${fieldKey}`
    };
    await api.updateBranch(branch.id, updated);
    notify('success', `Branch "${branch.name}" updated!`);
    onRefresh();
  };

  const handleEditCashAccount = async (acc: CashAccount, fieldKey: string, newVal: any) => {
    const updated = {
      ...acc,
      [fieldKey]: newVal,
      changed_by: currentUser.name,
      reason: `Excel Spreadsheet direct edit: ${fieldKey}`
    };
    await api.updateCashAccount(acc.id, updated);
    notify('success', `Cash account "${acc.name}" updated!`);
    onRefresh();
  };

  const handleEditApprovalRule = async (rule: ApprovalRule, fieldKey: string, newVal: any) => {
    const updated = {
      ...rule,
      [fieldKey]: newVal,
      changed_by: currentUser.name,
      reason: `Excel Spreadsheet direct edit: ${fieldKey}`
    };
    await api.updateApprovalRule(rule.id, updated);
    notify('success', `Approval rule "${rule.level_name}" updated!`);
    onRefresh();
  };

  const sheetTabs = [
    {
      id: 'loan_products' as SheetKey,
      name: 'Loan Products',
      icon: '📊',
      count: configData.loan_products.length
    },
    {
      id: 'chart_of_accounts' as SheetKey,
      name: 'Chart of Accounts',
      icon: '📋',
      count: configData.chart_of_accounts.length
    },
    {
      id: 'fees' as SheetKey,
      name: 'Fees & Penalties',
      icon: '💰',
      count: configData.fees.length
    },
    {
      id: 'branches' as SheetKey,
      name: 'Branch Registry',
      icon: '🏢',
      count: configData.branches.length
    },
    {
      id: 'cash_accounts' as SheetKey,
      name: 'Cash Accounts',
      icon: '🏦',
      count: configData.cash_accounts.length
    },
    {
      id: 'approval_rules' as SheetKey,
      name: 'Approval Rules',
      icon: '⚖️',
      count: configData.approval_rules.length
    },
    {
      id: 'custom_fields' as SheetKey,
      name: 'Custom Fields',
      icon: '🏷️',
      count: configData.custom_fields.length
    },
    {
      id: 'numbering_formats' as SheetKey,
      name: 'Numbering Formats',
      icon: '🔢',
      count: configData.numbering_formats.length
    }
  ];

  return (
    <div className="space-y-4">
      {/* Workbench Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Excel Spreadsheet Configurator & Data Grid
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                  Live Double-Click Editing
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Inspect, filter, export, and directly modify cooperative parameters in an Excel-grade interactive grid with instant audit tracking.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
              <span>Refresh Sheets</span>
            </button>
          </div>
        </div>

        {/* Workbook Sheet Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto pt-4 mt-3 border-t border-slate-800/80 no-scrollbar">
          {sheetTabs.map(tab => {
            const isActive = activeSheet === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSheet(tab.id)}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Sheet Table View */}
      {activeSheet === 'loan_products' && (
        <ExcelGridTable
          title="Loan Products & Versioning Registry"
          subtitle="Annual interest rates, grace periods, minimum/maximum principals, and fee structures. Double-click any cell to adjust parameters."
          exportFileName="coopflex_loan_products"
          data={configData.loan_products}
          columns={loanProductCols}
          defaultSortKey="code"
          onCellEdit={handleEditLoanProduct}
        />
      )}

      {activeSheet === 'chart_of_accounts' && (
        <ExcelGridTable
          title="Chart of Accounts (CDA Standard COA)"
          subtitle="Complete ledger hierarchy across Assets, Liabilities, Equity, Revenues, and Expenses. Filter by account classification or normal balance."
          exportFileName="coopflex_chart_of_accounts"
          data={configData.chart_of_accounts}
          columns={coaCols}
          defaultSortKey="account_code"
          onCellEdit={handleEditAccount}
        />
      )}

      {activeSheet === 'fees' && (
        <ExcelGridTable
          title="Fees & Penalties Directory"
          subtitle="Fixed service fees, loan processing rates, and delinquency charges mapped directly to general ledger income accounts."
          exportFileName="coopflex_fees_penalties"
          data={configData.fees}
          columns={feeCols}
          defaultSortKey="code"
          onCellEdit={handleEditFee}
        />
      )}

      {activeSheet === 'branches' && (
        <ExcelGridTable
          title="Cooperative Branch Network"
          subtitle="Configured geographic branches, regional offices, telephone directories, and branch managers."
          exportFileName="coopflex_branches"
          data={configData.branches}
          columns={branchCols}
          defaultSortKey="code"
          onCellEdit={handleEditBranch}
        />
      )}

      {activeSheet === 'cash_accounts' && (
        <ExcelGridTable
          title="Cash & Depository Accounts"
          subtitle="Teller drawers, petty cash repositories, and commercial depository bank accounts per branch."
          exportFileName="coopflex_cash_accounts"
          data={configData.cash_accounts}
          columns={cashCols}
          defaultSortKey="account_number"
          onCellEdit={handleEditCashAccount}
        />
      )}

      {activeSheet === 'approval_rules' && (
        <ExcelGridTable
          title="Approval Workflows & Authorization Thresholds"
          subtitle="Multi-level governance rules. Double-click threshold limits to adjust approval ceilings (e.g. from ₱50k to ₱100k)."
          exportFileName="coopflex_approval_rules"
          data={configData.approval_rules}
          columns={approvalCols}
          defaultSortKey="order"
          onCellEdit={handleEditApprovalRule}
        />
      )}

      {activeSheet === 'custom_fields' && (
        <ExcelGridTable
          title="Dynamic Custom Field Definitions"
          subtitle="Custom attributes and dynamic form controls configured for member onboarding and transaction flows."
          exportFileName="coopflex_custom_fields"
          data={configData.custom_fields}
          columns={customFieldCols}
          defaultSortKey="field_name"
          readOnly
        />
      )}

      {activeSheet === 'numbering_formats' && (
        <ExcelGridTable
          title="Document Numbering Formats & Sequences"
          subtitle="Document prefixes, date patterns, and sequence lengths for vouchers, member numbers, ORs, and loans."
          exportFileName="coopflex_numbering_formats"
          data={configData.numbering_formats}
          columns={numberingCols}
          defaultSortKey="module"
          readOnly
        />
      )}
    </div>
  );
};
