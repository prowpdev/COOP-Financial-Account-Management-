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

type CrudField = {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'select' | 'checkbox';
  required?: boolean;
  initial?: string | number | boolean;
  options?: string[];
};

const crudFields: Record<SheetKey, CrudField[]> = {
  loan_products: [
    { key: 'code', label: 'Product Code', required: true },
    { key: 'name', label: 'Product Name', required: true },
    { key: 'description', label: 'Description' },
    { key: 'min_amount', label: 'Minimum Amount', type: 'number', initial: 5000 },
    { key: 'max_amount', label: 'Maximum Amount', type: 'number', initial: 500000 },
    { key: 'annual_interest_rate', label: 'Annual Interest Rate (%)', type: 'number', initial: 6 },
    { key: 'interest_calculation_method', label: 'Calculation Method', type: 'select', initial: 'Diminishing Balance', options: ['Diminishing Balance', 'Flat Rate', 'Equal Amortization'] },
    { key: 'default_term_months', label: 'Default Term (Months)', type: 'number', initial: 12 },
    { key: 'grace_period_days', label: 'Grace Period (Days)', type: 'number', initial: 0 },
    { key: 'processing_fee_percentage', label: 'Processing Fee (%)', type: 'number', initial: 0 },
    { key: 'gl_receivable_account_id', label: 'Receivable GL Account ID', required: true, initial: 'acc_1210' },
    { key: 'gl_interest_income_account_id', label: 'Interest Income GL Account ID', required: true, initial: 'acc_4110' },
    { key: 'active', label: 'Active', type: 'checkbox', initial: true }
  ],
  chart_of_accounts: [
    { key: 'account_code', label: 'Account Code', required: true },
    { key: 'name', label: 'Account Name', required: true },
    { key: 'category', label: 'Category', type: 'select', required: true, initial: 'Asset', options: ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'] },
    { key: 'report_group', label: 'Report Group', required: true, initial: 'Current Assets' },
    { key: 'normal_balance', label: 'Normal Balance', type: 'select', required: true, initial: 'Debit', options: ['Debit', 'Credit'] },
    { key: 'parent_account_id', label: 'Parent Account ID' },
    { key: 'description', label: 'Description' },
    { key: 'is_active', label: 'Active', type: 'checkbox', initial: true }
  ],
  fees: [
    { key: 'code', label: 'Fee Code', required: true },
    { key: 'name', label: 'Fee Name', required: true },
    { key: 'calculation_type', label: 'Calculation Type', type: 'select', required: true, initial: 'Fixed', options: ['Fixed', 'Percentage', 'Percentage of Principal'] },
    { key: 'fixed_amount', label: 'Fixed Amount', type: 'number', initial: 0 },
    { key: 'percentage', label: 'Rate (%)', type: 'number', initial: 0 },
    { key: 'applicable_module', label: 'Applicable Module', initial: 'Loans' },
    { key: 'accounting_account_id', label: 'Income GL Account ID', required: true, initial: 'acc_4110' },
    { key: 'active', label: 'Active', type: 'checkbox', initial: true }
  ],
  branches: [
    { key: 'code', label: 'Branch Code', required: true },
    { key: 'name', label: 'Branch Name', required: true },
    { key: 'address', label: 'Address', required: true },
    { key: 'contact_number', label: 'Phone' },
    { key: 'manager_name', label: 'Manager' },
    { key: 'active', label: 'Active', type: 'checkbox', initial: true }
  ],
  cash_accounts: [
    { key: 'name', label: 'Account Name', required: true },
    { key: 'account_number', label: 'Account Number', required: true },
    { key: 'bank_name', label: 'Bank / Depository', initial: 'Cash Depository' },
    { key: 'branch_id', label: 'Branch ID', required: true, initial: 'branch_tar' },
    { key: 'gl_account_id', label: 'GL Account ID', required: true, initial: 'acc_1110' },
    { key: 'opening_balance', label: 'Opening Balance', type: 'number', initial: 0 },
    { key: 'currency', label: 'Currency', required: true, initial: 'PHP' },
    { key: 'active', label: 'Active', type: 'checkbox', initial: true }
  ],
  approval_rules: [
    { key: 'workflow_id', label: 'Workflow ID', required: true, initial: 'wf_loan_standard' },
    { key: 'level_name', label: 'Approval Level', required: true },
    { key: 'minimum_amount', label: 'Minimum Amount', type: 'number', initial: 0 },
    { key: 'maximum_amount', label: 'Maximum Amount', type: 'number', initial: 1000000 },
    { key: 'required_role', label: 'Required Role', required: true, initial: 'Loan Officer' },
    { key: 'required_approvals', label: 'Required Approvers', type: 'number', initial: 1 },
    { key: 'order', label: 'Step Order', type: 'number', initial: 1 },
    { key: 'active', label: 'Active', type: 'checkbox', initial: true }
  ],
  custom_fields: [
    { key: 'entity_type', label: 'Entity', type: 'select', required: true, initial: 'Member', options: ['Member', 'Loan', 'Savings', 'ShareCapital'] },
    { key: 'field_key', label: 'Field Key', required: true },
    { key: 'label', label: 'Label', required: true },
    { key: 'field_type', label: 'Field Type', type: 'select', required: true, initial: 'Text', options: ['Text', 'Number', 'Date', 'Select', 'Boolean', 'Phone', 'Dropdown', 'File', 'Image', 'PDF', 'Document'] },
    { key: 'options', label: 'Options (comma-separated)' },
    { key: 'is_required', label: 'Required', type: 'checkbox', initial: false },
    { key: 'active', label: 'Active', type: 'checkbox', initial: true },
    { key: 'display_order', label: 'Display Order', type: 'number', initial: 0 }
  ],
  numbering_formats: [
    { key: 'module', label: 'Module', required: true },
    { key: 'prefix', label: 'Prefix', required: true },
    { key: 'pattern', label: 'Pattern', required: true },
    { key: 'padding', label: 'Sequence Padding', type: 'number', initial: 5 },
    { key: 'next_number', label: 'Next Sequence Number', type: 'number', initial: 1 },
    { key: 'branch_specific', label: 'Branch Specific', type: 'checkbox', initial: true },
    { key: 'include_year', label: 'Include Year', type: 'checkbox', initial: true }
  ]
};

export const ExcelWorkbench: React.FC<ExcelWorkbenchProps> = ({
  configData: initialConfigData,
  currentUser,
  onRefresh,
  showNotice
}) => {
  const [internalConfig, setInternalConfig] = useState<any>(initialConfigData || null);
  const [activeSheet, setActiveSheet] = useState<SheetKey>('loan_products');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSavingCreate, setIsSavingCreate] = useState(false);
  const [createValues, setCreateValues] = useState<Record<string, string | boolean>>({});
  const [workbenchNotice, setWorkbenchNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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
    setWorkbenchNotice({ type, message: msg });
    window.setTimeout(() => setWorkbenchNotice(null), 4000);
    if (showNotice) showNotice(type, msg);
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (onRefresh) await onRefresh();
      else await loadData();
    } finally {
      setIsRefreshing(false);
    }
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

  const startCreate = () => {
    const values: Record<string, string | boolean> = {};
    crudFields[activeSheet].forEach(field => {
      values[field.key] = field.initial ?? '';
    });
    setCreateValues(values);
    setIsCreating(true);
  };

  const refreshAfterWrite = async () => {
    if (onRefresh) await onRefresh();
    else await loadData();
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSavingCreate(true);
    try {
      const values: Record<string, any> = {};
      crudFields[activeSheet].forEach(field => {
        const value = createValues[field.key];
        values[field.key] = field.type === 'number'
          ? Number(value || 0)
          : field.type === 'checkbox'
          ? Boolean(value)
          : typeof value === 'string'
          ? value.trim()
          : value;
      });

      if (activeSheet === 'loan_products') {
        await api.createLoanProduct(values);
      } else if (activeSheet === 'chart_of_accounts') {
        values.code = values.account_code;
        values.type = values.category === 'Revenue' ? 'Income' : values.category;
        values.parent_account_id = values.parent_account_id || null;
        await api.createAccount({ ...values, changed_by: currentUser.name, reason: 'Created from Excel Workbench' });
      } else if (activeSheet === 'fees') {
        values.amount = values.fixed_amount;
        values.applies_to = values.applicable_module;
        values.gl_account_id = values.accounting_account_id;
        await api.createFee(values);
      } else if (activeSheet === 'branches') {
        await api.createBranch(values);
      } else if (activeSheet === 'cash_accounts') {
        await api.createCashAccount(values);
      } else if (activeSheet === 'approval_rules') {
        await api.createApprovalRule(values);
      } else if (activeSheet === 'custom_fields') {
        values.options = String(values.options || '').split(',').map((option: string) => option.trim()).filter(Boolean);
        values.is_required = values.is_required;
        await api.createCustomField(values);
      } else {
        await api.createNumberingFormat(values);
      }

      const label = String(values.name || values.level_name || values.label || values.module || values.account_code || values.code);
      setIsCreating(false);
      notify('success', `${label} added successfully.`);
      await refreshAfterWrite();
    } catch (error: any) {
      notify('error', error.message || 'Unable to create this record.');
    } finally {
      setIsSavingCreate(false);
    }
  };

  const handleDelete = async (item: Record<string, any>) => {
    const label = item.name || item.level_name || item.label || item.module || item.account_code || item.code || item.id;
    if (!window.confirm(`Delete "${label}" from ${sheetTabs.find(tab => tab.id === activeSheet)?.name}?`)) return;

    try {
      if (activeSheet === 'loan_products') await api.deleteLoanProduct(item.id, currentUser.name);
      else if (activeSheet === 'chart_of_accounts') await api.deleteAccount(item.id);
      else if (activeSheet === 'fees') await api.deleteFee(item.id, currentUser.name);
      else if (activeSheet === 'branches') await api.deleteBranch(item.id);
      else if (activeSheet === 'cash_accounts') await api.deleteCashAccount(item.id);
      else if (activeSheet === 'approval_rules') await api.deleteApprovalRule(item.id);
      else if (activeSheet === 'custom_fields') await api.deleteCustomField(item.id, currentUser.name);
      else await api.deleteNumberingFormat(item.id);

      notify('success', `${label} deleted successfully.`);
      await refreshAfterWrite();
    } catch (error: any) {
      notify('error', error.message || 'Unable to delete this record.');
      throw error;
    }
  };

  // --- LOAN PRODUCTS COLUMNS ---
  const loanProductCols: ExcelColumn<LoanProduct>[] = [
    { key: 'code', header: 'Product Code', width: '130px', type: 'text', sortable: true, editable: true },
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
      sortable: true,
      editable: true
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
      sortable: true,
      editable: true
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
      editable: true,
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
      editable: true,
      accessor: a => a.parent_account_id || a.parent_id || ''
    },
    {
      key: 'description',
      header: 'Description',
      width: '260px',
      type: 'text',
      sortable: true,
      editable: true,
      accessor: a => a.description || ''
    },
    {
      key: 'is_active',
      header: 'Status',
      width: '90px',
      type: 'boolean',
      align: 'center',
      sortable: true,
      editable: true,
      accessor: a => (a.is_active !== undefined ? a.is_active : a.active !== false)
    }
  ];

  // --- FEES & CHARGES COLUMNS ---
  const feeCols: ExcelColumn<Fee>[] = [
    { key: 'code', header: 'Fee Code', width: '120px', type: 'text', sortable: true, editable: true },
    { key: 'name', header: 'Fee Description', width: '220px', type: 'text', sortable: true, editable: true },
    {
      key: 'calculation_type',
      header: 'Fee Type',
      width: '130px',
      type: 'badge',
      sortable: true,
      editable: true,
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
      editable: true,
      accessor: f => f.applicable_module || f.applies_to || 'Loans'
    },
    {
      key: 'accounting_account_id',
      header: 'GL Account ID',
      width: '140px',
      type: 'text',
      sortable: true,
      editable: true,
      accessor: f => f.accounting_account_id || f.gl_account_id || '—'
    },
    { key: 'active', header: 'Active', width: '90px', type: 'boolean', align: 'center', sortable: true, editable: true }
  ];

  // --- BRANCHES COLUMNS ---
  const branchCols: ExcelColumn<Branch>[] = [
    { key: 'code', header: 'Branch Code', width: '120px', type: 'text', sortable: true, editable: true },
    { key: 'name', header: 'Branch Name', width: '220px', type: 'text', sortable: true, editable: true },
    { key: 'address', header: 'Physical Address', width: '280px', type: 'text', sortable: true, editable: true },
    { key: 'contact_number', header: 'Contact Telephone', width: '160px', type: 'text', sortable: true, editable: true },
    { key: 'manager_name', header: 'Branch Manager', width: '180px', type: 'text', sortable: true, editable: true },
    { key: 'active', header: 'Active', width: '90px', type: 'boolean', align: 'center', sortable: true, editable: true }
  ];

  // --- CASH ACCOUNTS COLUMNS ---
  const cashCols: ExcelColumn<CashAccount>[] = [
    { key: 'account_number', header: 'Account No.', width: '150px', type: 'text', sortable: true, editable: true },
    { key: 'name', header: 'Cash Account Name', width: '220px', type: 'text', sortable: true, editable: true },
    { key: 'bank_name', header: 'Bank / Depository', width: '180px', type: 'text', sortable: true, editable: true },
    { key: 'branch_id', header: 'Branch ID', width: '130px', type: 'text', sortable: true, editable: true },
    {
      key: 'current_balance',
      header: 'Current Balance',
      width: '160px',
      type: 'currency',
      align: 'right',
      sortable: true
    },
    { key: 'currency', header: 'Currency', width: '90px', type: 'text', align: 'center', editable: true },
    { key: 'active', header: 'Active', width: '90px', type: 'boolean', align: 'center', sortable: true, editable: true }
  ];

  // --- APPROVAL RULES COLUMNS ---
  const approvalCols: ExcelColumn<ApprovalRule>[] = [
    { key: 'workflow_id', header: 'Workflow ID', width: '160px', type: 'text', sortable: true, editable: true },
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
    { key: 'order', header: 'Step Order', width: '100px', type: 'number', align: 'center', sortable: true, editable: true },
    { key: 'active', header: 'Active', width: '90px', type: 'boolean', align: 'center', sortable: true, editable: true }
  ];

  // --- CUSTOM FIELDS COLUMNS ---
  const customFieldCols: ExcelColumn<CustomField>[] = [
    { key: 'entity_type', header: 'Entity', width: '130px', type: 'text', sortable: true, editable: true },
    { key: 'field_key', header: 'Field Key', width: '160px', type: 'text', sortable: true, editable: true },
    { key: 'label', header: 'Label', width: '200px', type: 'text', sortable: true, editable: true },
    {
      key: 'field_type',
      header: 'Field Type',
      width: '130px',
      type: 'badge',
      sortable: true,
      editable: true,
      badgeColor: () => 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    },
    { key: 'is_required', header: 'Required', width: '100px', type: 'boolean', align: 'center', sortable: true, editable: true },
    {
      key: 'options',
      header: 'Dropdown Options',
      width: '240px',
      type: 'text',
      editable: true,
      accessor: field => {
        if (Array.isArray(field.options)) return field.options.join(', ');
        if (typeof field.options === 'string') {
          try {
            const parsed = JSON.parse(field.options);
            return Array.isArray(parsed) ? parsed.join(', ') : field.options;
          } catch {
            return field.options;
          }
        }
        return '';
      },
      render: val => (Array.isArray(val) ? val.join(', ') : String(val || '-'))
    },
    { key: 'display_order', header: 'Display Order', width: '110px', type: 'number', align: 'center', editable: true },
    { key: 'active', header: 'Active', width: '90px', type: 'boolean', align: 'center', editable: true }
  ];

  // --- NUMBERING FORMATS COLUMNS ---
  const numberingCols: ExcelColumn<NumberingFormat>[] = [
    { key: 'module', header: 'Module', width: '140px', type: 'text', sortable: true, editable: true },
    { key: 'prefix', header: 'Prefix', width: '110px', type: 'text', sortable: true, editable: true },
    { key: 'pattern', header: 'Pattern', width: '180px', type: 'text', sortable: true, editable: true },
    { key: 'padding', header: 'Sequence Padding', width: '130px', type: 'number', align: 'center', sortable: true, editable: true },
    {
      key: 'next_number',
      header: 'Next Sequence Number',
      width: '160px',
      type: 'number',
      align: 'center',
      sortable: true,
      editable: true
    },
    { key: 'branch_specific', header: 'Branch Specific', width: '130px', type: 'boolean', align: 'center', editable: true },
    { key: 'include_year', header: 'Include Year', width: '110px', type: 'boolean', align: 'center', editable: true }
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
    await refreshAfterWrite();
  };

  const handleEditAccount = async (account: Account, fieldKey: string, newVal: any) => {
    const value = fieldKey === 'account_code' ? String(newVal).trim() : newVal;
    if (fieldKey === 'account_code' && !value) {
      throw new Error('Account code is required.');
    }
    if (fieldKey === 'name' && !String(newVal).trim()) {
      throw new Error('Account name is required.');
    }
    if (fieldKey === 'category' && !['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'].includes(newVal)) {
      throw new Error('Select a valid account category.');
    }
    if (fieldKey === 'normal_balance' && !['Debit', 'Credit'].includes(newVal)) {
      throw new Error('Normal balance must be Debit or Credit.');
    }

    const activeValue = fieldKey === 'is_active'
      ? (typeof newVal === 'boolean' ? newVal : String(newVal).toLowerCase() === 'true')
      : newVal;
    const updated = {
      ...account,
      [fieldKey]: fieldKey === 'is_active' ? activeValue : fieldKey === 'name' ? String(value).trim() : value,
      ...(fieldKey === 'account_code' ? { account_code: value, code: value } : {}),
      ...(fieldKey === 'parent_account_id' ? { parent_account_id: value || null, parent_id: value || null } : {}),
      ...(fieldKey === 'category' ? { type: value === 'Revenue' ? 'Income' : value } : {}),
      ...(fieldKey === 'is_active' ? { is_active: activeValue, active: activeValue } : {}),
      changed_by: currentUser.name,
      reason: `Excel Spreadsheet direct edit: ${fieldKey}`
    };
    await api.updateAccount(account.id, updated);
    notify('success', `Account "${updated.account_code || updated.code} - ${updated.name}" updated successfully.`);
    if (onRefresh) await onRefresh();
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
    notify('success', `Fee "${fee.name}" updated successfully.`);
    await refreshAfterWrite();
  };

  const handleEditBranch = async (branch: Branch, fieldKey: string, newVal: any) => {
    const updated = {
      ...branch,
      [fieldKey]: newVal,
      changed_by: currentUser.name,
      reason: `Excel Spreadsheet direct edit: ${fieldKey}`
    };
    await api.updateBranch(branch.id, updated);
    notify('success', `Branch "${branch.name}" updated successfully.`);
    await refreshAfterWrite();
  };

  const handleEditCashAccount = async (acc: CashAccount, fieldKey: string, newVal: any) => {
    if (fieldKey === 'current_balance' || fieldKey === 'opening_balance') {
      throw new Error('Cash balances must be changed through a cash transaction.');
    }
    const updated = {
      ...acc,
      [fieldKey]: newVal,
      changed_by: currentUser.name,
      reason: `Excel Spreadsheet direct edit: ${fieldKey}`
    };
    await api.updateCashAccount(acc.id, updated);
    notify('success', `Cash account "${acc.name}" updated successfully.`);
    await refreshAfterWrite();
  };

  const handleEditApprovalRule = async (rule: ApprovalRule, fieldKey: string, newVal: any) => {
    const value = fieldKey === 'active'
      ? (typeof newVal === 'boolean' ? newVal : String(newVal).toLowerCase() === 'true')
      : newVal;
    const updated = {
      ...rule,
      [fieldKey]: value,
      changed_by: currentUser.name,
      reason: `Excel Spreadsheet direct edit: ${fieldKey}`
    };
    await api.updateApprovalRule(rule.id, updated);
    notify('success', `Approval rule "${rule.level_name}" updated successfully.`);
    await refreshAfterWrite();
  };

  const handleEditCustomField = async (field: CustomField, fieldKey: string, newVal: any) => {
    const value = fieldKey === 'options'
      ? String(newVal).split(',').map(option => option.trim()).filter(Boolean)
      : fieldKey === 'is_required' || fieldKey === 'active'
      ? (typeof newVal === 'boolean' ? newVal : String(newVal).toLowerCase() === 'true')
      : newVal;
    const updated = { ...field, [fieldKey]: value };
    await api.updateCustomField(field.id, updated);
    notify('success', `Custom field "${field.label || field.field_key}" updated successfully.`);
    await refreshAfterWrite();
  };

  const handleEditNumberingFormat = async (format: NumberingFormat, fieldKey: string, newVal: any) => {
    const updated = {
      ...format,
      [fieldKey]: newVal,
      changed_by: currentUser.name,
      reason: `Excel Spreadsheet direct edit: ${fieldKey}`
    };
    await api.updateNumberingFormat(format.id, updated);
    notify('success', `Numbering format "${format.module}" updated successfully.`);
    await refreshAfterWrite();
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

  const addRecordButton = (
    <button
      type="button"
      onClick={startCreate}
      className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-500"
    >
      <Plus className="h-3.5 w-3.5" />
      Add Record
    </button>
  );

  return (
    <div className="space-y-4">
      {workbenchNotice && (
        <div role="status" className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
          workbenchNotice.type === 'success'
            ? 'border-emerald-500/30 bg-emerald-950/50 text-emerald-300'
            : 'border-rose-500/30 bg-rose-950/50 text-rose-300'
        }`}>
          {workbenchNotice.message}
        </div>
      )}
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
                onClick={() => {
                  setActiveSheet(tab.id);
                  setIsCreating(false);
                }}
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

      {isCreating && (
        <form onSubmit={handleCreate} className="rounded-2xl border border-emerald-500/30 bg-slate-900 p-4 shadow-lg">
          <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Add {sheetTabs.find(tab => tab.id === activeSheet)?.name} Record</h3>
              <p className="mt-1 text-[11px] text-slate-400">Complete the fields below to create a record.</p>
            </div>
            <button type="button" onClick={() => setIsCreating(false)} className="rounded px-2 py-1 text-xs text-slate-400 hover:bg-slate-800 hover:text-white">
              Cancel
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {crudFields[activeSheet].map(field => (
              <label key={field.key} className={`space-y-1 text-xs text-slate-300 ${field.type === 'checkbox' ? 'flex items-center gap-2 pt-5' : ''}`}>
                {field.type === 'checkbox' ? (
                  <>
                    <input
                      type="checkbox"
                      checked={Boolean(createValues[field.key])}
                      onChange={event => setCreateValues(prev => ({ ...prev, [field.key]: event.target.checked }))}
                      className="rounded border-slate-600 bg-slate-950 text-emerald-500"
                    />
                    <span>{field.label}</span>
                  </>
                ) : (
                  <>
                    <span className="block font-medium">{field.label}{field.required ? ' *' : ''}</span>
                    {field.type === 'select' ? (
                      <select
                        required={field.required}
                        value={String(createValues[field.key] ?? '')}
                        onChange={event => setCreateValues(prev => ({ ...prev, [field.key]: event.target.value }))}
                        className="w-full rounded border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs text-white"
                      >
                        {(field.options || []).map(option => <option key={option} value={option}>{option}</option>)}
                      </select>
                    ) : (
                      <input
                        required={field.required}
                        type={field.type === 'number' ? 'number' : 'text'}
                        step={field.type === 'number' ? 'any' : undefined}
                        value={String(createValues[field.key] ?? '')}
                        onChange={event => setCreateValues(prev => ({ ...prev, [field.key]: event.target.value }))}
                        className="w-full rounded border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs text-white placeholder:text-slate-600"
                      />
                    )}
                  </>
                )}
              </label>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={isSavingCreate}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSavingCreate ? 'Saving…' : 'Create Record'}
            </button>
          </div>
        </form>
      )}

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
          onRowDelete={handleDelete}
          toolbarExtra={addRecordButton}
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
          onRowDelete={handleDelete}
          toolbarExtra={addRecordButton}
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
          onRowDelete={handleDelete}
          toolbarExtra={addRecordButton}
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
          onRowDelete={handleDelete}
          toolbarExtra={addRecordButton}
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
          onRowDelete={handleDelete}
          toolbarExtra={addRecordButton}
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
          onRowDelete={handleDelete}
          toolbarExtra={addRecordButton}
        />
      )}

      {activeSheet === 'custom_fields' && (
        <ExcelGridTable
          title="Dynamic Custom Field Definitions"
          subtitle="Custom attributes and dynamic form controls configured for member onboarding and transaction flows."
          exportFileName="coopflex_custom_fields"
          data={configData.custom_fields}
          columns={customFieldCols}
          defaultSortKey="field_key"
          onCellEdit={handleEditCustomField}
          onRowDelete={handleDelete}
          toolbarExtra={addRecordButton}
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
          onCellEdit={handleEditNumberingFormat}
          onRowDelete={handleDelete}
          toolbarExtra={addRecordButton}
        />
      )}
    </div>
  );
};
