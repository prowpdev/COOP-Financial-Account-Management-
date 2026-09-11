import React, { useState, useEffect } from 'react';
import {
  Settings,
  BookOpen,
  ArrowLeftRight,
  CreditCard,
  Calculator,
  Percent,
  ListOrdered,
  Workflow,
  Sliders,
  PiggyBank,
  Building2,
  Binary,
  GitBranch,
  Calendar,
  ToggleLeft,
  History,
  Plus,
  Edit2,
  Check,
  X,
  AlertCircle,
  Save,
  Trash2,
  RefreshCw,
  FileSpreadsheet,
  Search
} from 'lucide-react';
import { api } from '../../services/api';
import { ExcelWorkbench } from './ExcelWorkbench';
import { AccountingMappingsView } from './AccountingMappingsView';
import {
  Account,
  AccountingMapping,
  AccountingPeriod,
  ApprovalRule,
  ApprovalWorkflow,
  Branch,
  CashAccount,
  ConfigurationAuditTrail,
  CustomField,
  FeatureToggle,
  Fee,
  LoanProduct,
  MemberType,
  NumberingFormat,
  PaymentAllocationRule,
  PenaltyRule,
  SavingsProduct,
  SystemSetting,
  User
} from '../../types';

interface ConfigCenterProps {
  configData?: {
    cooperatives?: any[];
    branches?: Branch[];
    system_settings?: SystemSetting[];
    feature_toggles?: FeatureToggle[];
    chart_of_accounts?: Account[];
    accounting_mappings?: AccountingMapping[];
    accounting_periods?: AccountingPeriod[];
    numbering_formats?: NumberingFormat[];
    approval_workflows?: ApprovalWorkflow[];
    approval_rules?: ApprovalRule[];
    custom_fields?: CustomField[];
    member_types?: MemberType[];
    loan_products?: LoanProduct[];
    savings_products?: SavingsProduct[];
    share_capital_settings?: any[];
    cash_accounts?: CashAccount[];
    fees?: Fee[];
    penalty_rules?: PenaltyRule[];
    payment_allocation_rules?: PaymentAllocationRule[];
    configuration_audit_trails?: ConfigurationAuditTrail[];
  };
  currentUser: User;
  onRefresh?: () => void;
  onConfigUpdated?: () => void;
}

type ConfigSection =
  | 'cooperative'
  | 'chart_of_accounts'
  | 'accounting_mappings'
  | 'loan_products'
  | 'interest_engine'
  | 'fees_penalties'
  | 'payment_allocations'
  | 'approvals'
  | 'custom_fields'
  | 'savings_cbu'
  | 'cash_accounts'
  | 'numbering'
  | 'branches'
  | 'accounting_periods'
  | 'feature_toggles'
  | 'audit_trail';

export const ConfigCenter: React.FC<ConfigCenterProps> = ({
  configData: initialConfigData,
  currentUser,
  onRefresh,
  onConfigUpdated
}) => {
  const [internalData, setInternalData] = useState<any>(initialConfigData || null);
  const [isLoading, setIsLoading] = useState(!initialConfigData);
  const [centerMode, setCenterMode] = useState<'form' | 'excel'>('form');
  const [activeSection, setActiveSection] = useState<ConfigSection>('loan_products');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchFullConfig = async () => {
    try {
      setIsLoading(true);
      const res = await api.getConfig();
      if (res && res.data) {
        setInternalData(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load configuration:', err);
      showNotice('error', `Failed to load config: ${err.message || err}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialConfigData) {
      setInternalData(initialConfigData);
    } else {
      fetchFullConfig();
    }
  }, [initialConfigData]);

  const handleRefresh = async () => {
    await fetchFullConfig();
    if (onRefresh) onRefresh();
    if (onConfigUpdated) onConfigUpdated();
  };

  const showNotice = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const configData = {
    cooperatives: internalData?.cooperatives || [],
    branches: internalData?.branches || [],
    system_settings: internalData?.system_settings || [],
    feature_toggles: internalData?.feature_toggles || [],
    chart_of_accounts: internalData?.chart_of_accounts || [],
    accounting_mappings: internalData?.accounting_mappings || [],
    accounting_periods: internalData?.accounting_periods || [],
    numbering_formats: internalData?.numbering_formats || [],
    approval_workflows: internalData?.approval_workflows || [],
    approval_rules: internalData?.approval_rules || [],
    custom_fields: internalData?.custom_fields || [],
    member_types: internalData?.member_types || [],
    loan_products: internalData?.loan_products || [],
    savings_products: internalData?.savings_products || [],
    share_capital_settings: internalData?.share_capital_settings || [],
    cash_accounts: internalData?.cash_accounts || [],
    fees: internalData?.fees || [],
    penalty_rules: internalData?.penalty_rules || [],
    payment_allocation_rules: internalData?.payment_allocation_rules || [],
    configuration_audit_trails: internalData?.configuration_audit_trails || []
  };

  const [configSearch, setConfigSearch] = useState('');
  const [configCategory, setConfigCategory] = useState<'all' | 'lending' | 'accounting' | 'members' | 'governance' | 'network'>('all');

  // Categorized Section Groups
  const sectionGroups = [
    {
      category: 'lending' as const,
      categoryName: 'Lending & Credit Engine',
      items: [
        { id: 'loan_products' as ConfigSection, label: 'Loan Products & Versions', icon: CreditCard, count: configData.loan_products.length },
        { id: 'interest_engine' as ConfigSection, label: 'Interest & Amortization', icon: Calculator },
        { id: 'fees_penalties' as ConfigSection, label: 'Fees & Penalty Rules', icon: Percent, count: configData.fees.length },
        { id: 'payment_allocations' as ConfigSection, label: 'Payment Allocations', icon: ListOrdered }
      ]
    },
    {
      category: 'accounting' as const,
      categoryName: 'Accounting & General Ledger',
      items: [
        { id: 'chart_of_accounts' as ConfigSection, label: 'Chart of Accounts (COA)', icon: BookOpen, count: configData.chart_of_accounts.length },
        { id: 'accounting_mappings' as ConfigSection, label: 'Accounting Mappings (GL)', icon: ArrowLeftRight, count: configData.accounting_mappings.length },
        { id: 'cash_accounts' as ConfigSection, label: 'Cash & Bank Accounts', icon: Building2, count: configData.cash_accounts.length },
        { id: 'accounting_periods' as ConfigSection, label: 'Accounting Periods', icon: Calendar, count: configData.accounting_periods.length }
      ]
    },
    {
      category: 'members' as const,
      categoryName: 'Membership & Capital',
      items: [
        { id: 'custom_fields' as ConfigSection, label: 'Member Fields & Types', icon: Sliders, count: configData.custom_fields.length },
        { id: 'savings_cbu' as ConfigSection, label: 'Savings & Share Capital', icon: PiggyBank, count: configData.savings_products.length }
      ]
    },
    {
      category: 'governance' as const,
      categoryName: 'Governance & Workflows',
      items: [
        { id: 'approvals' as ConfigSection, label: 'Approval Workflows & Rules', icon: Workflow, count: configData.approval_workflows.length },
        { id: 'numbering' as ConfigSection, label: 'Document Numbering', icon: Binary, count: configData.numbering_formats.length },
        { id: 'feature_toggles' as ConfigSection, label: 'Feature Toggles', icon: ToggleLeft, count: configData.feature_toggles.length },
        { id: 'audit_trail' as ConfigSection, label: 'Configuration Audit Trail', icon: History }
      ]
    },
    {
      category: 'network' as const,
      categoryName: 'Organization & Network',
      items: [
        { id: 'cooperative' as ConfigSection, label: 'Cooperative Profile', icon: Settings },
        { id: 'branches' as ConfigSection, label: 'Branch Network', icon: GitBranch, count: configData.branches.length }
      ]
    }
  ];

  const filteredGroups = sectionGroups
    .filter(grp => configCategory === 'all' || grp.category === configCategory)
    .map(grp => ({
      ...grp,
      items: grp.items.filter(item =>
        item.label.toLowerCase().includes(configSearch.toLowerCase())
      )
    }))
    .filter(grp => grp.items.length > 0);

  return (
    <div className="space-y-6">
      {/* Title & Overview Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
              <span>Centralized Configuration Engine</span>
              <span>•</span>
              <span className="text-slate-400">Zero Code Deployment</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
              System Configuration Center
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Every business rule, interest rate, GL account mapping, workflow threshold, and numbering format is dynamically stored and managed in the database.
            </p>
          </div>

          {/* View Mode Switcher: Form Studio vs Excel Spreadsheet Grid */}
          <div className="flex items-center bg-slate-950 p-1.5 rounded-xl border border-slate-800 shadow-inner self-start sm:self-auto">
            <button
              onClick={() => setCenterMode('form')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                centerMode === 'form'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Form Studio</span>
            </button>
            <button
              onClick={() => setCenterMode('excel')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                centerMode === 'excel'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel Workbench</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-700/80 text-emerald-100 font-mono">
                Grid
              </span>
            </button>
          </div>
        </div>

        {/* Quick Configuration Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80">
          <div className="bg-slate-800/50 rounded-xl p-2.5 border border-slate-700/50 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">{configData.loan_products.length} Products</div>
              <div className="text-xs text-slate-400 font-medium">Loan Facilities</div>
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-2.5 border border-slate-700/50 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">{configData.chart_of_accounts.length} Accounts</div>
              <div className="text-xs text-slate-400 font-medium">General Ledger COA</div>
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-2.5 border border-slate-700/50 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold text-xs">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">{configData.accounting_mappings.length} Auto Rules</div>
              <div className="text-xs text-slate-400 font-medium">GL Event Mappings</div>
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-2.5 border border-slate-700/50 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-amber-600/20 text-amber-400 flex items-center justify-center font-bold text-xs">
              <GitBranch className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">{configData.branches.length} Branches</div>
              <div className="text-xs text-slate-400 font-medium">Operating Network</div>
            </div>
          </div>
        </div>
      </div>

      {notification && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between border ${
          notification.type === 'success'
            ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
            : 'bg-rose-950/80 border-rose-500/50 text-rose-300'
        }`}>
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Container with Left Categorized Navigation and Right Content */}
      {centerMode === 'excel' ? (
        <ExcelWorkbench
          configData={configData}
          currentUser={currentUser}
          onRefresh={handleRefresh}
          showNotice={showNotice}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Categorized Sub-Navigation */}
          <div className="lg:col-span-3 bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-4 h-fit">
            {/* Search Box for Configuration Topics */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search config topics..."
                value={configSearch}
                onChange={(e) => setConfigSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setConfigCategory('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  configCategory === 'all'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setConfigCategory('lending')}
                className={`px-2 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  configCategory === 'lending'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                Lending
              </button>
              <button
                onClick={() => setConfigCategory('accounting')}
                className={`px-2 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  configCategory === 'accounting'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                GL
              </button>
              <button
                onClick={() => setConfigCategory('members')}
                className={`px-2 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  configCategory === 'members'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                Members
              </button>
              <button
                onClick={() => setConfigCategory('governance')}
                className={`px-2 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  configCategory === 'governance'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                Rules
              </button>
            </div>

            {/* Grouped Section Buttons */}
            <div className="space-y-4 pt-1">
              {filteredGroups.map(group => (
                <div key={group.category} className="space-y-1">
                  <p className="px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800/60 pb-1">
                    {group.categoryName}
                  </p>
                  <div className="space-y-0.5 pt-1">
                    {group.items.map(item => {
                      const Icon = item.icon;
                      const isSelected = activeSection === item.id;
                      return (
                        <button
                          key={item.id}
                          id={`config-tab-${item.id}`}
                          onClick={() => setActiveSection(item.id)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer text-left ${
                            isSelected
                              ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 truncate">
                            <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                            <span className="truncate">{item.label}</span>
                          </div>
                          {item.count !== undefined && (
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ${
                                isSelected
                                  ? 'bg-emerald-700 text-white'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}
                            >
                              {item.count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {filteredGroups.length === 0 && (
                <div className="text-center py-6 text-xs text-slate-400">
                  No configuration sections match your search.
                </div>
              )}
            </div>
          </div>

          {/* Right Active Panel */}
          <div className="lg:col-span-9 bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-sm min-h-[500px]">
          {isLoading && !internalData ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
              <p className="text-xs uppercase tracking-wider font-semibold text-slate-300">
                Loading Configuration...
              </p>
            </div>
          ) : (
            <>
              {activeSection === 'loan_products' && (
                <LoanProductsConfig
                  products={configData.loan_products}
                  accounts={configData.chart_of_accounts}
                  currentUser={currentUser}
                  onRefresh={handleRefresh}
                  showNotice={showNotice}
                />
              )}

              {activeSection === 'chart_of_accounts' && (
                <ChartOfAccountsConfig
                  accounts={configData.chart_of_accounts}
                  currentUser={currentUser}
                  onRefresh={handleRefresh}
                  showNotice={showNotice}
                />
              )}

              {activeSection === 'accounting_mappings' && (
                <AccountingMappingsView
                  mappings={configData.accounting_mappings}
                  accounts={configData.chart_of_accounts}
                  currentUser={currentUser}
                  onRefresh={handleRefresh}
                  showNotice={showNotice}
                />
              )}

              {activeSection === 'interest_engine' && (
                <InterestEngineSandbox
                  products={configData.loan_products}
                />
              )}

              {activeSection === 'fees_penalties' && (
                <FeesAndPenaltiesConfig
                  fees={configData.fees}
                  penalties={configData.penalty_rules}
                  accounts={configData.chart_of_accounts}
                  currentUser={currentUser}
                  onRefresh={handleRefresh}
                  showNotice={showNotice}
                />
              )}

              {activeSection === 'payment_allocations' && (
                <PaymentAllocationsConfig
                  rules={configData.payment_allocation_rules}
                  currentUser={currentUser}
                  onRefresh={handleRefresh}
                  showNotice={showNotice}
                />
              )}

              {activeSection === 'approvals' && (
                <ApprovalsConfig
                  workflows={configData.approval_workflows}
                  rules={configData.approval_rules}
                  currentUser={currentUser}
                  onRefresh={handleRefresh}
                  showNotice={showNotice}
                />
              )}

              {activeSection === 'custom_fields' && (
                <CustomFieldsConfig
                  fields={configData.custom_fields}
                  memberTypes={configData.member_types}
                  currentUser={currentUser}
                  onRefresh={handleRefresh}
                  showNotice={showNotice}
                />
              )}

              {activeSection === 'savings_cbu' && (
                <SavingsAndCbuConfig
                  savingsProducts={configData.savings_products}
                  shareCapitalSettings={configData.share_capital_settings}
                  accounts={configData.chart_of_accounts}
                  currentUser={currentUser}
                  onRefresh={handleRefresh}
                  showNotice={showNotice}
                />
              )}

              {activeSection === 'cash_accounts' && (
                <CashAccountsConfig
                  cashAccounts={configData.cash_accounts}
                  branches={configData.branches}
                  accounts={configData.chart_of_accounts}
                  currentUser={currentUser}
                  onRefresh={handleRefresh}
                  showNotice={showNotice}
                />
              )}

              {activeSection === 'numbering' && (
                <NumberingConfig
                  formats={configData.numbering_formats}
                  currentUser={currentUser}
                  onRefresh={handleRefresh}
                  showNotice={showNotice}
                />
              )}

              {activeSection === 'branches' && (
                <BranchesConfig
                  branches={configData.branches}
                  currentUser={currentUser}
                  onRefresh={handleRefresh}
                  showNotice={showNotice}
                />
              )}

              {activeSection === 'accounting_periods' && (
                <AccountingPeriodsConfig
                  periods={configData.accounting_periods}
                  currentUser={currentUser}
                  onRefresh={handleRefresh}
                  showNotice={showNotice}
                />
              )}

              {activeSection === 'feature_toggles' && (
                <FeatureTogglesConfig
                  toggles={configData.feature_toggles}
                  currentUser={currentUser}
                  onRefresh={handleRefresh}
                  showNotice={showNotice}
                />
              )}

              {activeSection === 'cooperative' && (
                <CooperativeProfileConfig
                  cooperatives={configData.cooperatives}
                  settings={configData.system_settings}
                  currentUser={currentUser}
                  onRefresh={handleRefresh}
                  showNotice={showNotice}
                />
              )}

              {activeSection === 'audit_trail' && (
                <AuditTrailConfig
                  auditTrails={configData.configuration_audit_trails}
                />
              )}
            </>
          )}
        </div>
      </div>
      )}
    </div>
  );
};

// ==========================================
// SUB-PANEL: LOAN PRODUCTS & VERSIONING
// ==========================================
function LoanProductsConfig({
  products,
  accounts,
  currentUser,
  onRefresh,
  showNotice
}: {
  products: LoanProduct[];
  accounts: Account[];
  currentUser: User;
  onRefresh: () => void;
  showNotice: (type: 'success' | 'error', msg: string) => void;
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    min_amount: 10000,
    max_amount: 250000,
    annual_interest_rate: 10.0,
    interest_calculation_method: 'Diminishing Balance',
    default_term_months: 12,
    payment_frequency: 'Monthly',
    grace_period_days: 5,
    processing_fee_percentage: 2.0,
    service_fee_fixed: 200,
    debit_account_id: 'acc_1210'
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createLoanProduct({
        ...formData,
        changed_by: currentUser.name,
        reason: 'New loan product created via Admin Config'
      });
      setIsCreating(false);
      showNotice('success', `Created loan product "${formData.name}" successfully.`);
      onRefresh();
    } catch (err: any) {
      showNotice('error', err.message);
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      await api.updateLoanProduct(id, {
        ...formData,
        changed_by: currentUser.name,
        reason: `Updated interest rate/terms for ${formData.name}`
      });
      setEditingId(null);
      showNotice('success', `Loan product updated with automatic version bump. Historical loans protected.`);
      onRefresh();
    } catch (err: any) {
      showNotice('error', err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Dynamic Loan Products</h2>
          <p className="text-xs text-slate-400">
            Create and edit loan products with automatic version snapshots (Req #5, #34, #35).
          </p>
        </div>
        <button
          id="btn-new-loan-product"
          onClick={() => {
            setFormData({
              code: `LP-${Math.floor(100 + Math.random() * 900)}`,
              name: '',
              description: '',
              min_amount: 10000,
              max_amount: 250000,
              annual_interest_rate: 10.0,
              interest_calculation_method: 'Diminishing Balance',
              default_term_months: 12,
              payment_frequency: 'Monthly',
              grace_period_days: 5,
              processing_fee_percentage: 2.0,
              service_fee_fixed: 200,
              debit_account_id: 'acc_1210'
            });
            setIsCreating(true);
            setEditingId(null);
          }}
          className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create Loan Product</span>
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="bg-slate-800/80 rounded-xl p-4 border border-slate-700 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2">
            <h3 className="text-sm font-bold text-emerald-400">Create New Loan Product</h3>
            <button type="button" onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-300 font-medium">Product Code</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={e => setFormData({ ...formData, code: e.target.value })}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 font-medium">Product Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Educational Loan"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 font-medium">Interest Calculation Method</label>
              <select
                value={formData.interest_calculation_method}
                onChange={e => setFormData({ ...formData, interest_calculation_method: e.target.value })}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white cursor-pointer"
              >
                <option value="Diminishing Balance">Diminishing Balance</option>
                <option value="Flat Rate">Flat Rate</option>
                <option value="Simple Interest">Simple Interest</option>
                <option value="Fixed Interest">Fixed Interest</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-300 font-medium">Annual Interest Rate (%)</label>
              <input
                type="number"
                step="0.1"
                required
                value={formData.annual_interest_rate}
                onChange={e => setFormData({ ...formData, annual_interest_rate: parseFloat(e.target.value) || 0 })}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 font-medium">Payment Frequency</label>
              <select
                value={formData.payment_frequency}
                onChange={e => setFormData({ ...formData, payment_frequency: e.target.value })}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white cursor-pointer"
              >
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Bi-weekly">Bi-weekly</option>
                <option value="Semi-monthly">Semi-monthly</option>
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Semi-annually">Semi-annually</option>
                <option value="Annually">Annually</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-300 font-medium">Default Term (Months)</label>
              <input
                type="number"
                required
                value={formData.default_term_months}
                onChange={e => setFormData({ ...formData, default_term_months: parseInt(e.target.value) || 12 })}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 font-medium">Min Amount (₱)</label>
              <input
                type="number"
                value={formData.min_amount}
                onChange={e => setFormData({ ...formData, min_amount: parseFloat(e.target.value) || 0 })}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 font-medium">Max Amount (₱)</label>
              <input
                type="number"
                value={formData.max_amount}
                onChange={e => setFormData({ ...formData, max_amount: parseFloat(e.target.value) || 0 })}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 font-medium">Processing Fee (%)</label>
              <input
                type="number"
                step="0.1"
                value={formData.processing_fee_percentage}
                onChange={e => setFormData({ ...formData, processing_fee_percentage: parseFloat(e.target.value) || 0 })}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs cursor-pointer"
            >
              Save Product
            </button>
          </div>
        </form>
      )}

      {/* Product List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {products.map(p => {
          const isEditing = editingId === p.id;
          return (
            <div key={p.id} className="bg-slate-800/60 rounded-xl p-4 border border-slate-700 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-white">{p.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-semibold border border-blue-500/30">
                      v{p.version || 1}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                    {p.code}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">{p.description || 'Configurable credit facility'}</p>

                {isEditing ? (
                  <div className="mt-3 space-y-2 pt-3 border-t border-slate-700">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400">Annual Rate (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.annual_interest_rate}
                          onChange={e => setFormData({ ...formData, annual_interest_rate: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400">Method</label>
                        <select
                          value={formData.interest_calculation_method}
                          onChange={e => setFormData({ ...formData, interest_calculation_method: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                        >
                          <option value="Diminishing Balance">Diminishing Balance</option>
                          <option value="Flat Rate">Flat Rate</option>
                          <option value="Simple Interest">Simple Interest</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400">Frequency</label>
                        <select
                          value={formData.payment_frequency}
                          onChange={e => setFormData({ ...formData, payment_frequency: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                        >
                          <option value="Daily">Daily</option>
                          <option value="Weekly">Weekly</option>
                          <option value="Semi-monthly">Semi-monthly</option>
                          <option value="Monthly">Monthly</option>
                          <option value="Quarterly">Quarterly</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400">Term (Mo)</label>
                        <input
                          type="number"
                          value={formData.default_term_months}
                          onChange={e => setFormData({ ...formData, default_term_months: parseInt(e.target.value) || 12 })}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 pt-2">
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-2 py-1 bg-slate-700 text-slate-300 text-[11px] rounded"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleUpdate(p.id)}
                        className="px-3 py-1 bg-emerald-600 text-white font-semibold text-[11px] rounded"
                      >
                        Save & Bump Version
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-700/60 text-xs">
                    <div>
                      <span className="text-slate-400">Interest Rate:</span>{' '}
                      <span className="font-semibold text-emerald-400">{p.annual_interest_rate}% p.a.</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Method:</span>{' '}
                      <span className="font-semibold text-slate-200">{p.interest_calculation_method}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Frequency:</span>{' '}
                      <span className="font-semibold text-slate-200">{p.payment_frequency}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Term:</span>{' '}
                      <span className="font-semibold text-slate-200">{p.default_term_months} Months</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Range:</span>{' '}
                      <span className="text-[11px] font-semibold text-slate-300">
                        ₱{p.min_amount?.toLocaleString()} - ₱{p.max_amount?.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Proc. Fee:</span>{' '}
                      <span className="font-semibold text-slate-200">{p.processing_fee_percentage}%</span>
                    </div>
                  </div>
                )}
              </div>

              {!isEditing && (
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-700/60">
                  <span className="text-[10px] text-slate-400">Effective: {p.effective_from || 'Active'}</span>
                  <button
                    id={`btn-edit-loan-prod-${p.id}`}
                    onClick={() => {
                      setEditingId(p.id);
                      setFormData({
                        code: p.code,
                        name: p.name,
                        description: p.description,
                        min_amount: p.min_amount,
                        max_amount: p.max_amount,
                        annual_interest_rate: p.annual_interest_rate,
                        interest_calculation_method: p.interest_calculation_method,
                        default_term_months: p.default_term_months,
                        payment_frequency: p.payment_frequency,
                        grace_period_days: p.grace_period_days,
                        processing_fee_percentage: p.processing_fee_percentage,
                        service_fee_fixed: p.service_fee_fixed,
                        debit_account_id: p.debit_account_id
                      });
                    }}
                    className="flex items-center space-x-1 text-xs text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Rate / Terms</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==========================================
// SUB-PANEL: DYNAMIC CHART OF ACCOUNTS
// ==========================================
function ChartOfAccountsConfig({
  accounts,
  currentUser,
  onRefresh,
  showNotice
}: {
  accounts: Account[];
  currentUser: User;
  onRefresh: () => void;
  showNotice: (type: 'success' | 'error', msg: string) => void;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [filterType, setFilterType] = useState('All');
  const [newAcc, setNewAcc] = useState({
    code: '',
    name: '',
    type: 'Asset',
    category: 'Current Assets',
    normal_balance: 'Debit',
    parent_id: '',
    is_control: false,
    has_subsidiary: false
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAccount({
        ...newAcc,
        changed_by: currentUser.name,
        reason: 'New account created in Chart of Accounts'
      });
      setIsAdding(false);
      showNotice('success', `Account ${newAcc.code} - ${newAcc.name} added.`);
      onRefresh();
    } catch (err: any) {
      showNotice('error', err.message);
    }
  };

  const filtered = filterType === 'All' ? accounts : accounts.filter(a => a.type === filterType);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">Dynamic Chart of Accounts</h2>
          <p className="text-xs text-slate-400">
            Configure GL accounts, parent hierarchies, normal balance, and subsidiary tracking (Req #3, Test #5).
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="bg-slate-800 text-xs text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 cursor-pointer"
          >
            <option value="All">All Types</option>
            <option value="Asset">Assets</option>
            <option value="Liability">Liabilities</option>
            <option value="Equity">Equity</option>
            <option value="Income">Income</option>
            <option value="Expense">Expense</option>
          </select>
          <button
            id="btn-add-coa-account"
            onClick={() => setIsAdding(true)}
            className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add GL Account</span>
          </button>
        </div>
      </div>

      {isAdding && (
        <form onSubmit={handleCreate} className="bg-slate-800/80 rounded-xl p-4 border border-slate-700 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2">
            <h3 className="text-sm font-bold text-emerald-400">New Chart of Accounts Entry</h3>
            <button type="button" onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-slate-300 font-medium">Account Code</label>
              <input
                type="text"
                required
                placeholder="e.g. 1130"
                value={newAcc.code}
                onChange={e => setNewAcc({ ...newAcc, code: e.target.value })}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 font-medium">Account Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Marketable Securities"
                value={newAcc.name}
                onChange={e => setNewAcc({ ...newAcc, name: e.target.value })}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 font-medium">Account Type</label>
              <select
                value={newAcc.type}
                onChange={e => setNewAcc({
                  ...newAcc,
                  type: e.target.value as any,
                  normal_balance: (e.target.value === 'Asset' || e.target.value === 'Expense') ? 'Debit' : 'Credit',
                  category: e.target.value === 'Asset' ? 'Current Assets' : e.target.value === 'Liability' ? 'Current Liabilities' : e.target.value
                })}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white cursor-pointer"
              >
                <option value="Asset">Asset</option>
                <option value="Liability">Liability</option>
                <option value="Equity">Equity</option>
                <option value="Income">Income</option>
                <option value="Expense">Expense</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-300 font-medium">Normal Balance</label>
              <select
                value={newAcc.normal_balance}
                onChange={e => setNewAcc({ ...newAcc, normal_balance: e.target.value as any })}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white cursor-pointer"
              >
                <option value="Debit">Debit</option>
                <option value="Credit">Credit</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 bg-slate-700 text-slate-300 rounded text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded text-xs cursor-pointer"
            >
              Save to Database
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-800 text-slate-400 font-semibold border-b border-slate-700">
            <tr>
              <th className="py-2.5 px-3">Code</th>
              <th className="py-2.5 px-3">Account Title</th>
              <th className="py-2.5 px-3">Type</th>
              <th className="py-2.5 px-3">Category</th>
              <th className="py-2.5 px-3">Normal Balance</th>
              <th className="py-2.5 px-3">Subsidiary</th>
              <th className="py-2.5 px-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {filtered.map(a => (
              <tr key={a.id} className="hover:bg-slate-800/50 transition">
                <td className="py-2.5 px-3 font-mono font-bold text-white">{a.code}</td>
                <td className="py-2.5 px-3 font-medium text-slate-200">{a.name}</td>
                <td className="py-2.5 px-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                    a.type === 'Asset' ? 'bg-blue-500/20 text-blue-400' :
                    a.type === 'Liability' ? 'bg-amber-500/20 text-amber-400' :
                    a.type === 'Equity' ? 'bg-purple-500/20 text-purple-400' :
                    a.type === 'Income' ? 'bg-emerald-500/20 text-emerald-400' :
                    'bg-rose-500/20 text-rose-400'
                  }`}>
                    {a.type}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-slate-400">{a.category}</td>
                <td className="py-2.5 px-3 text-slate-300">{a.normal_balance}</td>
                <td className="py-2.5 px-3 text-slate-400">{a.has_subsidiary ? 'Yes (Member/Loan)' : 'No'}</td>
                <td className="py-2.5 px-3 text-right">
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-medium">
                    Active
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==========================================
// SUB-PANEL: DYNAMIC ACCOUNTING MAPPINGS
// ==========================================
function AccountingMappingsConfig({
  mappings,
  accounts,
  currentUser,
  onRefresh,
  showNotice
}: {
  mappings: AccountingMapping[];
  accounts: Account[];
  currentUser: User;
  onRefresh: () => void;
  showNotice: (type: 'success' | 'error', msg: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDebit, setEditDebit] = useState('');
  const [editCredit, setEditCredit] = useState('');

  const handleSave = async (m: AccountingMapping) => {
    try {
      await api.updateMapping(m.id, {
        debit_account_id: editDebit,
        credit_account_id: editCredit,
        changed_by: currentUser.name,
        reason: 'Adjusted dynamic accounting mapping'
      });
      setEditingId(null);
      showNotice('success', `Mapping for ${m.name} successfully updated.`);
      onRefresh();
    } catch (err: any) {
      showNotice('error', err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white">Dynamic Transaction Accounting Mappings</h2>
        <p className="text-xs text-slate-400">
          Map operational events (Loan release, repayment, savings, share capital) to debit and credit GL accounts (Req #4, #26, Test #6).
        </p>
      </div>

      <div className="space-y-3">
        {mappings.map(m => {
          const isEditing = editingId === m.id;
          const drAcc = accounts.find(a => a.id === (isEditing ? editDebit : m.debit_account_id));
          const crAcc = accounts.find(a => a.id === (isEditing ? editCredit : m.credit_account_id));

          return (
            <div key={m.id} className="bg-slate-800/60 rounded-xl p-4 border border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="md:w-1/3">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-white">{m.name}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                    {m.transaction_type}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">{m.description}</p>
              </div>

              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Debit Account */}
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-700/80">
                  <span className="text-[10px] uppercase font-bold text-emerald-400">Debit (Dr)</span>
                  {isEditing ? (
                    <select
                      value={editDebit}
                      onChange={e => setEditDebit(e.target.value)}
                      className="w-full mt-1 bg-slate-800 text-xs text-white border border-slate-700 rounded p-1"
                    >
                      {accounts.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.code} - {a.name} ({a.type})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-xs font-semibold text-slate-200 mt-0.5">
                      {drAcc ? `${drAcc.code} - ${drAcc.name}` : m.debit_account_id}
                    </div>
                  )}
                </div>

                {/* Credit Account */}
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-700/80">
                  <span className="text-[10px] uppercase font-bold text-blue-400">Credit (Cr)</span>
                  {isEditing ? (
                    <select
                      value={editCredit}
                      onChange={e => setEditCredit(e.target.value)}
                      className="w-full mt-1 bg-slate-800 text-xs text-white border border-slate-700 rounded p-1"
                    >
                      {accounts.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.code} - {a.name} ({a.type})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-xs font-semibold text-slate-200 mt-0.5">
                      {crAcc ? `${crAcc.code} - ${crAcc.name}` : m.credit_account_id}
                    </div>
                  )}
                </div>
              </div>

              <div className="shrink-0 flex items-center justify-end">
                {isEditing ? (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-2.5 py-1 bg-slate-700 text-xs text-slate-300 rounded cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSave(m)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white rounded cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <button
                    id={`btn-edit-mapping-${m.id}`}
                    onClick={() => {
                      setEditingId(m.id);
                      setEditDebit(m.debit_account_id);
                      setEditCredit(m.credit_account_id);
                    }}
                    className="flex items-center space-x-1 text-xs text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Change Mapping</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==========================================
// SUB-PANEL: INTEREST ENGINE SANDBOX (Req 6)
// ==========================================
function InterestEngineSandbox({ products }: { products: LoanProduct[] }) {
  const [principal, setPrincipal] = useState(50000);
  const [rate, setRate] = useState(10.0);
  const [term, setTerm] = useState(12);
  const [freq, setFreq] = useState('Monthly');
  const [method, setMethod] = useState('Diminishing Balance');
  const [scheduleData, setScheduleData] = useState<any>(null);

  const calculate = async () => {
    try {
      const res = await api.calculateSchedule({
        principal,
        annual_rate: rate,
        term_months: term,
        frequency: freq,
        method,
        start_date: new Date().toISOString().split('T')[0]
      });
      setScheduleData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  React.useEffect(() => {
    calculate();
  }, [principal, rate, term, freq, method]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white">Dynamic Interest Calculation Sandbox</h2>
        <p className="text-xs text-slate-400">
          Independent InterestCalculationService engine supporting Flat Rate, Diminishing Balance, and Simple Interest across customizable frequencies (Req #6).
        </p>
      </div>

      {/* Control sliders & selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3 bg-slate-800/80 p-4 rounded-xl border border-slate-700">
        <div>
          <label className="text-xs text-slate-300 font-medium">Principal (₱)</label>
          <input
            type="number"
            value={principal}
            onChange={e => setPrincipal(parseFloat(e.target.value) || 0)}
            className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-white"
          />
        </div>
        <div>
          <label className="text-xs text-slate-300 font-medium">Annual Rate (%)</label>
          <input
            type="number"
            step="0.5"
            value={rate}
            onChange={e => setRate(parseFloat(e.target.value) || 0)}
            className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-white"
          />
        </div>
        <div>
          <label className="text-xs text-slate-300 font-medium">Term (Months)</label>
          <input
            type="number"
            value={term}
            onChange={e => setTerm(parseInt(e.target.value) || 1)}
            className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-white"
          />
        </div>
        <div>
          <label className="text-xs text-slate-300 font-medium">Calculation Method</label>
          <select
            value={method}
            onChange={e => setMethod(e.target.value)}
            className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-white cursor-pointer"
          >
            <option value="Diminishing Balance">Diminishing Balance</option>
            <option value="Flat Rate">Flat Rate</option>
            <option value="Simple Interest">Simple Interest</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-300 font-medium">Payment Frequency</label>
          <select
            value={freq}
            onChange={e => setFreq(e.target.value)}
            className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-white cursor-pointer"
          >
            <option value="Daily">Daily</option>
            <option value="Weekly">Weekly</option>
            <option value="Bi-weekly">Bi-weekly</option>
            <option value="Semi-monthly">Semi-monthly</option>
            <option value="Monthly">Monthly</option>
            <option value="Quarterly">Quarterly</option>
          </select>
        </div>
      </div>

      {scheduleData && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
              <span className="text-[10px] uppercase text-slate-400 font-semibold">Total Principal</span>
              <div className="text-lg font-bold text-white mt-0.5">₱{scheduleData.total_principal?.toLocaleString()}</div>
            </div>
            <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
              <span className="text-[10px] uppercase text-slate-400 font-semibold">Total Interest</span>
              <div className="text-lg font-bold text-emerald-400 mt-0.5">₱{scheduleData.total_interest?.toLocaleString()}</div>
            </div>
            <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
              <span className="text-[10px] uppercase text-slate-400 font-semibold">Total Repayment</span>
              <div className="text-lg font-bold text-blue-400 mt-0.5">₱{scheduleData.total_repayment?.toLocaleString()}</div>
            </div>
            <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
              <span className="text-[10px] uppercase text-slate-400 font-semibold">Installment Amount</span>
              <div className="text-lg font-bold text-amber-400 mt-0.5">₱{scheduleData.installment_amount?.toLocaleString()}</div>
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800 text-slate-400 sticky top-0">
                <tr>
                  <th className="p-2.5">No.</th>
                  <th className="p-2.5">Due Date</th>
                  <th className="p-2.5">Principal</th>
                  <th className="p-2.5">Interest</th>
                  <th className="p-2.5">Total Installment</th>
                  <th className="p-2.5">Remaining Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {scheduleData.schedule?.map((item: any) => (
                  <tr key={item.installment_no} className="hover:bg-slate-800/40">
                    <td className="p-2.5 font-bold text-white">#{item.installment_no}</td>
                    <td className="p-2.5 text-slate-400">{item.due_date}</td>
                    <td className="p-2.5">₱{item.principal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="p-2.5 text-emerald-400">₱{item.interest.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="p-2.5 font-semibold text-white">₱{item.total_installment.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="p-2.5 text-slate-400">₱{item.principal_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// SUB-PANEL: FEES & PENALTY RULES (Req 9, 10, Test 3)
// ==========================================
function FeesAndPenaltiesConfig({
  fees,
  penalties,
  accounts,
  currentUser,
  onRefresh,
  showNotice
}: {
  fees: Fee[];
  penalties: PenaltyRule[];
  accounts: Account[];
  currentUser: User;
  onRefresh: () => void;
  showNotice: (type: 'success' | 'error', msg: string) => void;
}) {
  const [isAddingFee, setIsAddingFee] = useState(false);
  const [newFee, setNewFee] = useState({
    name: '',
    code: '',
    calculation_type: 'Fixed',
    fixed_amount: 250,
    percentage: 0,
    min_amount: 250,
    max_amount: 250,
    applicable_module: 'Loans',
    accounting_account_id: 'acc_4120'
  });

  const handleCreateFee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createFee({
        ...newFee,
        changed_by: currentUser.name,
        reason: 'Created new fee rule via Admin'
      });
      setIsAddingFee(false);
      showNotice('success', `Created fee "${newFee.name}".`);
      onRefresh();
    } catch (err: any) {
      showNotice('error', err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Dynamic Fees & Penalty Engine</h2>
          <p className="text-xs text-slate-400">
            Configure fee calculation models (Fixed, Percentage of Loan, Min/Max) and automated penalty rules (Req #9, #10, Test #3).
          </p>
        </div>
        <button
          id="btn-add-fee"
          onClick={() => setIsAddingFee(true)}
          className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Fee Rule</span>
        </button>
      </div>

      {isAddingFee && (
        <form onSubmit={handleCreateFee} className="bg-slate-800/80 rounded-xl p-4 border border-slate-700 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2">
            <h3 className="text-sm font-bold text-emerald-400">Add New Fee</h3>
            <button type="button" onClick={() => setIsAddingFee(false)} className="text-slate-400 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-300 font-medium">Fee Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Legal & Notarial Fee"
                value={newFee.name}
                onChange={e => setNewFee({ ...newFee, name: e.target.value })}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 font-medium">Calculation Model</label>
              <select
                value={newFee.calculation_type}
                onChange={e => setNewFee({ ...newFee, calculation_type: e.target.value })}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white cursor-pointer"
              >
                <option value="Fixed">Fixed Amount</option>
                <option value="Percentage of Loan">Percentage of Loan</option>
                <option value="Percentage of Principal">Percentage of Principal</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-300 font-medium">
                {newFee.calculation_type === 'Fixed' ? 'Fixed Amount (₱)' : 'Rate Percentage (%)'}
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={newFee.calculation_type === 'Fixed' ? newFee.fixed_amount : newFee.percentage}
                onChange={e => {
                  const v = parseFloat(e.target.value) || 0;
                  if (newFee.calculation_type === 'Fixed') {
                    setNewFee({ ...newFee, fixed_amount: v, min_amount: v, max_amount: v });
                  } else {
                    setNewFee({ ...newFee, percentage: v });
                  }
                }}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 font-medium">Applicable GL Account</label>
              <select
                value={newFee.accounting_account_id}
                onChange={e => setNewFee({ ...newFee, accounting_account_id: e.target.value })}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white cursor-pointer"
              >
                {accounts.filter(a => a.type === 'Income').map(a => (
                  <option key={a.id} value={a.id}>
                    {a.code} - {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingFee(false)}
              className="px-3 py-1.5 bg-slate-700 text-slate-300 rounded text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded text-xs cursor-pointer"
            >
              Save Fee Rule
            </button>
          </div>
        </form>
      )}

      {/* Fee List */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Configured Fee Schedule</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {fees.map(f => (
            <div key={f.id} className="bg-slate-800/60 rounded-xl p-3.5 border border-slate-700 flex justify-between items-start">
              <div>
                <div className="text-xs font-bold text-white">{f.name}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Model: {f.calculation_type}</div>
                <div className="text-xs font-semibold text-emerald-400 mt-1">
                  {f.calculation_type === 'Fixed' ? `₱${f.fixed_amount.toLocaleString()}` : `${f.percentage}% of principal`}
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                {f.code}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Penalty Rules */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Configured Penalty Rules</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {penalties.map(p => (
            <div key={p.id} className="bg-slate-800/60 rounded-xl p-3.5 border border-slate-700">
              <div className="text-xs font-bold text-white">{p.name}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Type: {p.calculation_type}</div>
              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-700/60 text-xs">
                <div>
                  <span className="text-slate-400">Grace Period:</span>{' '}
                  <span className="text-slate-200 font-semibold">{p.grace_period_days} Days</span>
                </div>
                <div>
                  <span className="text-slate-400">Rate:</span>{' '}
                  <span className="text-emerald-400 font-semibold">{p.rate}% / {p.calculation_frequency}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// SUB-PANEL: PAYMENT ALLOCATION RULES (Req 8)
// ==========================================
function PaymentAllocationsConfig({
  rules,
  currentUser,
  onRefresh,
  showNotice
}: {
  rules: PaymentAllocationRule[];
  currentUser: User;
  onRefresh: () => void;
  showNotice: (type: 'success' | 'error', msg: string) => void;
}) {
  const activeRule = rules.find(r => r.is_default) || rules[0];
  const [priorities, setPriorities] = useState(activeRule?.priorities || []);

  const moveUp = (index: number) => {
    if (index === 0) return;
    const copy = [...priorities];
    const temp = copy[index - 1];
    copy[index - 1] = copy[index];
    copy[index] = temp;
    // Re-assign priority indices 1..4
    copy.forEach((item, idx) => {
      item.priority = idx + 1;
    });
    setPriorities(copy);
  };

  const moveDown = (index: number) => {
    if (index === priorities.length - 1) return;
    const copy = [...priorities];
    const temp = copy[index + 1];
    copy[index + 1] = copy[index];
    copy[index] = temp;
    copy.forEach((item, idx) => {
      item.priority = idx + 1;
    });
    setPriorities(copy);
  };

  const handleSavePriorities = async () => {
    if (!activeRule) return;
    try {
      await api.updatePaymentAllocationRule(activeRule.id, priorities);
      showNotice('success', 'Payment allocation priority re-ordered in database.');
      onRefresh();
    } catch (err: any) {
      showNotice('error', err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white">Dynamic Payment Allocation Order</h2>
        <p className="text-xs text-slate-400">
          Re-order which loan repayment component is settled first (Penalty, Interest, Fees, or Principal) without code changes (Req #8).
        </p>
      </div>

      <div className="bg-slate-800/80 rounded-xl p-5 border border-slate-700 max-w-lg space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
          Active Settlement Priority Order
        </h3>
        <p className="text-[11px] text-slate-400">
          Every loan payment received will systematically cascade across these buckets in the sequence defined below:
        </p>

        <div className="space-y-2">
          {priorities.map((item, idx) => (
            <div
              key={item.component}
              className="flex items-center justify-between bg-slate-900 px-3.5 py-2.5 rounded-lg border border-slate-700"
            >
              <div className="flex items-center space-x-3">
                <span className="w-6 h-6 rounded-full bg-emerald-600/30 text-emerald-300 flex items-center justify-center text-xs font-bold">
                  {idx + 1}
                </span>
                <span className="text-xs font-semibold text-white">
                  {item.label || item.component}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => moveUp(idx)}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-xs text-slate-300 rounded cursor-pointer"
                >
                  ▲ Up
                </button>
                <button
                  type="button"
                  disabled={idx === priorities.length - 1}
                  onClick={() => moveDown(idx)}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-xs text-slate-300 rounded cursor-pointer"
                >
                  ▼ Down
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          id="btn-save-payment-allocation"
          onClick={handleSavePriorities}
          className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg text-xs font-semibold cursor-pointer transition"
        >
          Save Allocation Rule to Database
        </button>
      </div>
    </div>
  );
}

// ==========================================
// SUB-PANEL: APPROVAL WORKFLOWS & RULES (Req 1, 11, Test 7)
// ==========================================
function ApprovalsConfig({
  workflows,
  rules,
  currentUser,
  onRefresh,
  showNotice
}: {
  workflows: ApprovalWorkflow[];
  rules: ApprovalRule[];
  currentUser: User;
  onRefresh: () => void;
  showNotice: (type: 'success' | 'error', msg: string) => void;
}) {
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [thresholdMax, setThresholdMax] = useState(50000);
  const [thresholdRole, setThresholdRole] = useState('Loan Officer');

  const handleUpdateRule = async (ruleId: string) => {
    try {
      await api.updateApprovalRule(ruleId, {
        maximum_amount: thresholdMax,
        required_role: thresholdRole,
        changed_by: currentUser.name,
        reason: 'Approval limit threshold modified by Administrator'
      });
      setEditingRuleId(null);
      showNotice('success', `Approval rule limit updated to ₱${thresholdMax.toLocaleString()} without code deployment! (Req #1)`);
      onRefresh();
    } catch (err: any) {
      showNotice('error', err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white">Dynamic Approval Workflows & Threshold Rules</h2>
        <p className="text-xs text-slate-400">
          Strictly eliminate hardcoded business rules (e.g. change ₱50,000 threshold to ₱100,000 without code deployment - Req #1, #11, Test #7).
        </p>
      </div>

      <div className="space-y-4">
        {rules.map(r => {
          const isEditing = editingRuleId === r.id;
          return (
            <div key={r.id} className="bg-slate-800/60 rounded-xl p-4 border border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-white">{r.level_name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-semibold">
                    Tier #{r.order}
                  </span>
                </div>
                <div className="text-xs text-slate-300 mt-1">
                  Threshold: <strong>₱{r.minimum_amount?.toLocaleString()}</strong> to{' '}
                  <strong className="text-emerald-400">₱{r.maximum_amount?.toLocaleString()}</strong>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Required Role: <span className="text-slate-200 font-semibold">{r.required_role}</span> ({r.required_approvals} sign-off)
                </div>
              </div>

              {isEditing ? (
                <div className="flex items-center space-x-2 bg-slate-900 p-2 rounded-lg border border-slate-700">
                  <div>
                    <label className="text-[10px] text-slate-400 block">Max Limit (₱)</label>
                    <input
                      type="number"
                      value={thresholdMax}
                      onChange={e => setThresholdMax(parseFloat(e.target.value) || 0)}
                      className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white w-28"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block">Required Role</label>
                    <select
                      value={thresholdRole}
                      onChange={e => setThresholdRole(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white cursor-pointer"
                    >
                      <option value="Loan Officer">Loan Officer</option>
                      <option value="Branch Manager">Branch Manager</option>
                      <option value="Credit Committee">Credit Committee</option>
                      <option value="Board of Directors">Board of Directors</option>
                    </select>
                  </div>
                  <div className="flex items-end space-x-1 pt-3">
                    <button
                      onClick={() => setEditingRuleId(null)}
                      className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded"
                    >
                      Cancel
                    </button>
                    <button
                      id="btn-save-approval-threshold"
                      onClick={() => handleUpdateRule(r.id)}
                      className="px-3 py-1 bg-emerald-600 text-white font-semibold text-xs rounded"
                    >
                      Save Rule
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  id={`btn-edit-rule-${r.id}`}
                  onClick={() => {
                    setEditingRuleId(r.id);
                    setThresholdMax(r.maximum_amount);
                    setThresholdRole(r.required_role);
                  }}
                  className="flex items-center space-x-1 text-xs text-blue-400 hover:text-blue-300 font-medium cursor-pointer shrink-0"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Adjust Threshold</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==========================================
// SUB-PANEL: MEMBER CUSTOM FIELDS & TYPES (Req 13, 14, Test 8)
// ==========================================
function CustomFieldsConfig({
  fields,
  memberTypes,
  currentUser,
  onRefresh,
  showNotice
}: {
  fields: CustomField[];
  memberTypes: MemberType[];
  currentUser: User;
  onRefresh: () => void;
  showNotice: (type: 'success' | 'error', msg: string) => void;
}) {
  const [isAddingField, setIsAddingField] = useState(false);
  const [newField, setNewField] = useState({
    field_label: '',
    field_name: '',
    field_type: 'Text' as any,
    required: false,
    options_text: ''
  });

  const handleCreateField = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const options = newField.options_text ? newField.options_text.split(',').map(s => s.trim()) : [];
      await api.createCustomField({
        entity: 'Member',
        field_label: newField.field_label,
        field_name: newField.field_label.toLowerCase().replace(/\s+/g, '_'),
        field_type: newField.field_type,
        options,
        required: newField.required,
        changed_by: currentUser.name,
        reason: 'Added dynamic custom field'
      });
      setIsAddingField(false);
      showNotice('success', `Created custom member attribute "${newField.field_label}".`);
      onRefresh();
    } catch (err: any) {
      showNotice('error', err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Member Custom Fields & Member Types</h2>
          <p className="text-xs text-slate-400">
            Define cooperative-specific member attributes and membership classifications dynamically (Req #13, #14, Test #8).
          </p>
        </div>
        <button
          id="btn-add-custom-field"
          onClick={() => setIsAddingField(true)}
          className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Custom Field</span>
        </button>
      </div>

      {isAddingField && (
        <form onSubmit={handleCreateField} className="bg-slate-800/80 rounded-xl p-4 border border-slate-700 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2">
            <h3 className="text-sm font-bold text-emerald-400">Add Member Custom Field</h3>
            <button type="button" onClick={() => setIsAddingField(false)} className="text-slate-400 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-300 font-medium">Field Label</label>
              <input
                type="text"
                required
                placeholder="e.g. Barangay & Sitio"
                value={newField.field_label}
                onChange={e => setNewField({ ...newField, field_label: e.target.value })}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 font-medium">Input Type</label>
              <select
                value={newField.field_type}
                onChange={e => setNewField({ ...newField, field_type: e.target.value as any })}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white cursor-pointer"
              >
                <option value="Text">Text</option>
                <option value="Number">Number</option>
                <option value="Date">Date</option>
                <option value="Dropdown">Dropdown</option>
                <option value="Currency">Currency</option>
                <option value="Phone">Phone</option>
                <option value="Email">Email</option>
              </select>
            </div>
            {newField.field_type === 'Dropdown' && (
              <div>
                <label className="text-xs text-slate-300 font-medium">Dropdown Options (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="Farmer, Teacher, Driver, Employee"
                  value={newField.options_text}
                  onChange={e => setNewField({ ...newField, options_text: e.target.value })}
                  className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
                />
              </div>
            )}
            <div className="flex items-center space-x-2 pt-6">
              <input
                type="checkbox"
                id="chk-field-required"
                checked={newField.required}
                onChange={e => setNewField({ ...newField, required: e.target.checked })}
                className="rounded border-slate-700 text-emerald-600 focus:ring-0"
              />
              <label htmlFor="chk-field-required" className="text-xs text-slate-300 font-medium cursor-pointer">
                Mandatory Field
              </label>
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingField(false)}
              className="px-3 py-1.5 bg-slate-700 text-slate-300 rounded text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded text-xs cursor-pointer"
            >
              Save Custom Field
            </button>
          </div>
        </form>
      )}

      {/* Field List */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Configured Custom Form Attributes</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {fields.map(f => (
            <div key={f.id} className="bg-slate-800/60 rounded-xl p-3.5 border border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{f.field_label}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 font-mono">
                  {f.field_type}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-1">field_name: {f.field_name}</div>
              <div className="flex items-center space-x-2 mt-2 pt-2 border-t border-slate-700/60 text-[11px]">
                <span className={`px-1.5 py-0.2 rounded font-medium ${f.required ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-700 text-slate-400'}`}>
                  {f.required ? 'Required' : 'Optional'}
                </span>
                {f.options && f.options.length > 0 && (
                  <span className="text-slate-400">{f.options.length} options</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Member Types */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Configured Member Classifications</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {memberTypes.map(mt => (
            <div key={mt.id} className="bg-slate-800/60 rounded-xl p-4 border border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{mt.name}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-700 text-slate-300">{mt.code}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">{mt.description}</p>
              <div className="mt-3 pt-2 border-t border-slate-700/60 space-y-1 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Membership Fee:</span>
                  <span className="font-semibold">₱{mt.membership_fee?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Min Share Capital:</span>
                  <span className="font-semibold">₱{mt.min_share_capital?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Loan Eligibility:</span>
                  <span className={`font-semibold ${mt.loan_eligibility ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {mt.loan_eligibility ? 'Eligible' : 'Ineligible'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// SUB-PANEL: SAVINGS & SHARE CAPITAL (Req 15, 16, Test 9)
// ==========================================
function SavingsAndCbuConfig({
  savingsProducts,
  shareCapitalSettings,
  accounts,
  currentUser,
  onRefresh,
  showNotice
}: {
  savingsProducts: SavingsProduct[];
  shareCapitalSettings: any[];
  accounts: Account[];
  currentUser: User;
  onRefresh: () => void;
  showNotice: (type: 'success' | 'error', msg: string) => void;
}) {
  const [isAddingSavings, setIsAddingSavings] = useState(false);
  const [newSavings, setNewSavings] = useState({
    code: '',
    name: '',
    min_balance_to_earn_interest: 1000,
    annual_interest_rate: 2.5,
    interest_calculation_method: 'Average Daily Balance',
    withdrawal_limit_per_day: 50000,
    debit_account_id: 'acc_2110'
  });

  const handleCreateSavings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createSavingsProduct({
        ...newSavings,
        changed_by: currentUser.name,
        reason: 'Created new savings product'
      });
      setIsAddingSavings(false);
      showNotice('success', `Created savings product "${newSavings.name}".`);
      onRefresh();
    } catch (err: any) {
      showNotice('error', err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Dynamic Savings Products & Share Capital</h2>
          <p className="text-xs text-slate-400">
            Define savings facilities, deposit interest rates, and cooperative capital build-up (CBU) settings (Req #15, #16, Test #9).
          </p>
        </div>
        <button
          id="btn-add-savings-prod"
          onClick={() => setIsAddingSavings(true)}
          className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create Savings Product</span>
        </button>
      </div>

      {isAddingSavings && (
        <form onSubmit={handleCreateSavings} className="bg-slate-800/80 rounded-xl p-4 border border-slate-700 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2">
            <h3 className="text-sm font-bold text-emerald-400">Create New Savings Product</h3>
            <button type="button" onClick={() => setIsAddingSavings(false)} className="text-slate-400 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-300 font-medium">Product Code</label>
              <input
                type="text"
                required
                placeholder="SAV-GOLD"
                value={newSavings.code}
                onChange={e => setNewSavings({ ...newSavings, code: e.target.value })}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 font-medium">Product Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Special Senior High-Yield"
                value={newSavings.name}
                onChange={e => setNewSavings({ ...newSavings, name: e.target.value })}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 font-medium">Annual Interest Rate (%)</label>
              <input
                type="number"
                step="0.1"
                required
                value={newSavings.annual_interest_rate}
                onChange={e => setNewSavings({ ...newSavings, annual_interest_rate: parseFloat(e.target.value) || 0 })}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 font-medium">Min Balance to Earn Interest (₱)</label>
              <input
                type="number"
                value={newSavings.min_balance_to_earn_interest}
                onChange={e => setNewSavings({ ...newSavings, min_balance_to_earn_interest: parseFloat(e.target.value) || 0 })}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 font-medium">Calculation Method</label>
              <select
                value={newSavings.interest_calculation_method}
                onChange={e => setNewSavings({ ...newSavings, interest_calculation_method: e.target.value })}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white cursor-pointer"
              >
                <option value="Average Daily Balance">Average Daily Balance</option>
                <option value="Monthly Minimum Balance">Monthly Minimum Balance</option>
                <option value="Fixed Term Maturity">Fixed Term Maturity</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingSavings(false)}
              className="px-3 py-1.5 bg-slate-700 text-slate-300 rounded text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded text-xs cursor-pointer"
            >
              Save Savings Product
            </button>
          </div>
        </form>
      )}

      {/* Savings Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {savingsProducts.map(sp => (
          <div key={sp.id} className="bg-slate-800/60 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">{sp.name}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-700 text-slate-300">{sp.code}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-700/60 text-xs">
              <div>
                <span className="text-slate-400">Interest Rate:</span>{' '}
                <span className="font-semibold text-emerald-400">{sp.annual_interest_rate}% p.a.</span>
              </div>
              <div>
                <span className="text-slate-400">Calculation:</span>{' '}
                <span className="text-slate-200">{sp.interest_calculation_method}</span>
              </div>
              <div>
                <span className="text-slate-400">Min Balance:</span>{' '}
                <span className="text-slate-200">₱{sp.min_balance_to_earn_interest?.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-400">Daily Limit:</span>{' '}
                <span className="text-slate-200">₱{sp.withdrawal_limit_per_day?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// SUB-PANEL: CASH & BANK ACCOUNTS (Req 17, Test 4)
// ==========================================
function CashAccountsConfig({
  cashAccounts,
  branches,
  accounts,
  currentUser,
  onRefresh,
  showNotice
}: {
  cashAccounts: CashAccount[];
  branches: Branch[];
  accounts: Account[];
  currentUser: User;
  onRefresh: () => void;
  showNotice: (type: 'success' | 'error', msg: string) => void;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [newCash, setNewCash] = useState({
    name: '',
    account_number: '',
    bank_name: '',
    branch_id: 'branch_tar',
    gl_account_id: 'acc_1110',
    opening_balance: 10000
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCashAccount({
        ...newCash,
        changed_by: currentUser.name,
        reason: 'Created new cash/bank account'
      });
      setIsAdding(false);
      showNotice('success', `Created cash account "${newCash.name}".`);
      onRefresh();
    } catch (err: any) {
      showNotice('error', err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Dynamic Cash & Bank Accounts</h2>
          <p className="text-xs text-slate-400">
            Configure unlimited cash drawers, vaults, bank accounts, and digital clearing wallets with GL mappings (Req #17, Test #4).
          </p>
        </div>
        <button
          id="btn-add-cash-account"
          onClick={() => setIsAdding(true)}
          className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Open Cash/Bank Account</span>
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleCreate} className="bg-slate-800/80 rounded-xl p-4 border border-slate-700 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2">
            <h3 className="text-sm font-bold text-emerald-400">New Cash / Bank Depository</h3>
            <button type="button" onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-300 font-medium">Account Description</label>
              <input
                type="text"
                required
                placeholder="e.g. Maya Digital Wallet"
                value={newCash.name}
                onChange={e => setNewCash({ ...newCash, name: e.target.value })}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 font-medium">Bank / Institution</label>
              <input
                type="text"
                placeholder="e.g. Land Bank / Cash Vault"
                value={newCash.bank_name}
                onChange={e => setNewCash({ ...newCash, bank_name: e.target.value })}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 font-medium">Assigned Branch</label>
              <select
                value={newCash.branch_id}
                onChange={e => setNewCash({ ...newCash, branch_id: e.target.value })}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white cursor-pointer"
              >
                {branches.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-300 font-medium">Mapped GL Account</label>
              <select
                value={newCash.gl_account_id}
                onChange={e => setNewCash({ ...newCash, gl_account_id: e.target.value })}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white cursor-pointer"
              >
                {accounts.filter(a => a.type === 'Asset').map(a => (
                  <option key={a.id} value={a.id}>
                    {a.code} - {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-300 font-medium">Opening Balance (₱)</label>
              <input
                type="number"
                value={newCash.opening_balance}
                onChange={e => setNewCash({ ...newCash, opening_balance: parseFloat(e.target.value) || 0 })}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 bg-slate-700 text-slate-300 rounded text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded text-xs cursor-pointer"
            >
              Save Account
            </button>
          </div>
        </form>
      )}

      {/* Cash Accounts List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cashAccounts.map(c => {
          const gl = accounts.find(a => a.id === c.gl_account_id);
          const br = branches.find(b => b.id === c.branch_id);
          return (
            <div key={c.id} className="bg-slate-800/60 rounded-xl p-4 border border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{c.name}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                  {c.account_number}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">{c.bank_name}</p>
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-700/60 text-xs">
                <div>
                  <span className="text-slate-400">Current Balance:</span>{' '}
                  <div className="font-bold text-emerald-400 text-sm mt-0.5">
                    ₱{c.current_balance?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">GL Account:</span>{' '}
                  <div className="text-slate-200 font-semibold mt-0.5">
                    {gl ? `${gl.code} - ${gl.name}` : c.gl_account_id}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==========================================
// SUB-PANEL: NUMBERING FORMATS (Req 19, Test 10)
// ==========================================
function NumberingConfig({
  formats,
  currentUser,
  onRefresh,
  showNotice
}: {
  formats: NumberingFormat[];
  currentUser: User;
  onRefresh: () => void;
  showNotice: (type: 'success' | 'error', msg: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pattern, setPattern] = useState('');
  const [length, setLength] = useState(6);

  const handleSave = async (id: string) => {
    try {
      await api.updateNumberingFormat(id, {
        pattern,
        length,
        changed_by: currentUser.name,
        reason: 'Adjusted document sequence numbering pattern'
      });
      setEditingId(null);
      showNotice('success', 'Document numbering format updated without code deployment! (Req #19)');
      onRefresh();
    } catch (err: any) {
      showNotice('error', err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white">Dynamic Document Numbering Formats</h2>
        <p className="text-xs text-slate-400">
          Configure voucher and document number templates: {'{BRANCH}'}, {'{YEAR}'}, {'{MONTH}'}, {'{NUMBER}'} (Req #19, Test #10).
        </p>
      </div>

      <div className="space-y-3">
        {formats.map(f => {
          const isEditing = editingId === f.id;
          return (
            <div key={f.id} className="bg-slate-800/60 rounded-xl p-4 border border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-white">{f.module}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-bold">
                    Prefix: {f.prefix}
                  </span>
                </div>
                <div className="text-xs text-slate-300 font-mono mt-1">
                  Pattern: <strong className="text-emerald-400">{f.pattern}</strong>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Seq: #{f.current_seq} (Padded to {f.length} digits)
                </div>
              </div>

              {isEditing ? (
                <div className="flex items-center space-x-2 bg-slate-900 p-2 rounded-lg border border-slate-700">
                  <div>
                    <label className="text-[10px] text-slate-400 block">Template Pattern</label>
                    <input
                      type="text"
                      value={pattern}
                      onChange={e => setPattern(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white w-48 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block">Length</label>
                    <input
                      type="number"
                      value={length}
                      onChange={e => setLength(parseInt(e.target.value) || 6)}
                      className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white w-16"
                    />
                  </div>
                  <div className="flex items-end space-x-1 pt-3">
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded"
                    >
                      Cancel
                    </button>
                    <button
                      id="btn-save-numbering-pattern"
                      onClick={() => handleSave(f.id)}
                      className="px-3 py-1 bg-emerald-600 text-white font-semibold text-xs rounded"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  id={`btn-edit-num-${f.id}`}
                  onClick={() => {
                    setEditingId(f.id);
                    setPattern(f.pattern);
                    setLength(f.length);
                  }}
                  className="flex items-center space-x-1 text-xs text-blue-400 hover:text-blue-300 font-medium cursor-pointer shrink-0"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Pattern</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==========================================
// SUB-PANEL: BRANCH NETWORK (Req 20, Test 11)
// ==========================================
function BranchesConfig({
  branches,
  currentUser,
  onRefresh,
  showNotice
}: {
  branches: Branch[];
  currentUser: User;
  onRefresh: () => void;
  showNotice: (type: 'success' | 'error', msg: string) => void;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [newBranch, setNewBranch] = useState({
    code: '',
    name: '',
    address: '',
    phone: '',
    manager_name: ''
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createBranch({
        ...newBranch,
        changed_by: currentUser.name,
        reason: 'Added new cooperative branch'
      });
      setIsAdding(false);
      showNotice('success', `Branch "${newBranch.name}" created with automatic local cash vault.`);
      onRefresh();
    } catch (err: any) {
      showNotice('error', err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Multi-Branch Network</h2>
          <p className="text-xs text-slate-400">
            Expand cooperative locations and isolate branch-specific transaction records (Req #20, Test #11).
          </p>
        </div>
        <button
          id="btn-add-branch"
          onClick={() => setIsAdding(true)}
          className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Register New Branch</span>
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleCreate} className="bg-slate-800/80 rounded-xl p-4 border border-slate-700 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2">
            <h3 className="text-sm font-bold text-emerald-400">New Branch Office</h3>
            <button type="button" onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-300 font-medium">Branch Code (3-4 Letters)</label>
              <input
                type="text"
                required
                placeholder="e.g. BAG"
                value={newBranch.code}
                onChange={e => setNewBranch({ ...newBranch, code: e.target.value.toUpperCase() })}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 font-medium">Branch Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Baguio Highland Branch"
                value={newBranch.name}
                onChange={e => setNewBranch({ ...newBranch, name: e.target.value })}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 font-medium">Branch Manager</label>
              <input
                type="text"
                placeholder="e.g. Felipe Dizon"
                value={newBranch.manager_name}
                onChange={e => setNewBranch({ ...newBranch, manager_name: e.target.value })}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-300 font-medium">Office Physical Address</label>
              <input
                type="text"
                placeholder="e.g. Session Road, Baguio City"
                value={newBranch.address}
                onChange={e => setNewBranch({ ...newBranch, address: e.target.value })}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 font-medium">Contact Number</label>
              <input
                type="text"
                placeholder="+63 (074) 442-9981"
                value={newBranch.phone}
                onChange={e => setNewBranch({ ...newBranch, phone: e.target.value })}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 bg-slate-700 text-slate-300 rounded text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded text-xs cursor-pointer"
            >
              Save Branch
            </button>
          </div>
        </form>
      )}

      {/* Branches List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {branches.map(b => (
          <div key={b.id} className="bg-slate-800/60 rounded-xl p-4 border border-slate-700 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{b.name}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                  {b.code}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">{b.address}</p>
              <div className="mt-3 pt-2 border-t border-slate-700/60 text-xs space-y-1">
                <div className="text-slate-400">
                  Manager: <span className="text-slate-200 font-medium">{b.manager_name || 'Assigned'}</span>
                </div>
                <div className="text-slate-400">
                  Phone: <span className="text-slate-200 font-medium">{b.phone || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// SUB-PANEL: ACCOUNTING PERIODS (Req 29, Test 15)
// ==========================================
function AccountingPeriodsConfig({
  periods,
  currentUser,
  onRefresh,
  showNotice
}: {
  periods: AccountingPeriod[];
  currentUser: User;
  onRefresh: () => void;
  showNotice: (type: 'success' | 'error', msg: string) => void;
}) {
  const handleTogglePeriod = async (p: AccountingPeriod) => {
    try {
      if (p.status === 'Open') {
        await api.closeAccountingPeriod(p.id, currentUser.name);
        showNotice('success', `Accounting period "${p.name}" is now CLOSED. Unauthorized postings into this period will be blocked.`);
      } else {
        await api.reopenAccountingPeriod(p.id, currentUser.name);
        showNotice('success', `Accounting period "${p.name}" is now REOPENED.`);
      }
      onRefresh();
    } catch (err: any) {
      showNotice('error', err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white">Fiscal Accounting Periods & Cutoff Protection</h2>
        <p className="text-xs text-slate-400">
          Close or reopen accounting periods. Once closed, the Accounting Engine strictly blocks any operational transaction posting into that period (Req #29, Test #15).
        </p>
      </div>

      <div className="space-y-3">
        {periods.map(p => (
          <div key={p.id} className="bg-slate-800/60 rounded-xl p-4 border border-slate-700 flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-white">{p.name}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                  p.status === 'Closed' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {p.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {p.start_date} through {p.end_date}
              </p>
              {p.closed_at && (
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Closed on {new Date(p.closed_at).toLocaleDateString()} by {p.closed_by}
                </p>
              )}
            </div>

            <button
              id={`btn-toggle-period-${p.id}`}
              onClick={() => handleTogglePeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                p.status === 'Open'
                  ? 'bg-rose-600/80 hover:bg-rose-600 text-white'
                  : 'bg-emerald-600/80 hover:bg-emerald-600 text-white'
              }`}
            >
              {p.status === 'Open' ? 'Close Period' : 'Reopen Period'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// SUB-PANEL: FEATURE TOGGLES (Req 46, Test 12)
// ==========================================
function FeatureTogglesConfig({
  toggles,
  currentUser,
  onRefresh,
  showNotice
}: {
  toggles: FeatureToggle[];
  currentUser: User;
  onRefresh: () => void;
  showNotice: (type: 'success' | 'error', msg: string) => void;
}) {
  const handleToggle = async (t: FeatureToggle) => {
    try {
      await api.toggleFeature(t.key, !t.enabled, currentUser.name, 'Administrator toggled module');
      showNotice('success', `Feature "${t.name}" is now ${!t.enabled ? 'ENABLED' : 'DISABLED'}. Navigation updated.`);
      onRefresh();
    } catch (err: any) {
      showNotice('error', err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white">Dynamic Feature Toggle System</h2>
        <p className="text-xs text-slate-400">
          Enable or disable entire functional modules on the fly without touching code (Req #46, Test #12).
        </p>
      </div>

      <div className="space-y-3">
        {toggles.map(t => (
          <div key={t.id} className="bg-slate-800/60 rounded-xl p-4 border border-slate-700 flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-white">{t.name}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                  {t.key}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">{t.description}</p>
            </div>

            <button
              id={`btn-toggle-feature-${t.key}`}
              onClick={() => handleToggle(t)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                t.enabled
                  ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {t.enabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// SUB-PANEL: COOPERATIVE PROFILE & PARAMS
// ==========================================
function CooperativeProfileConfig({
  cooperatives,
  settings,
  currentUser,
  onRefresh,
  showNotice
}: {
  cooperatives: any[];
  settings: SystemSetting[];
  currentUser: User;
  onRefresh: () => void;
  showNotice: (type: 'success' | 'error', msg: string) => void;
}) {
  const coop = cooperatives[0] || {};
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white">Cooperative Organization Profile</h2>
        <p className="text-xs text-slate-400">
          Institutional identity, tax credentials, base reporting currency, and fiscal year rules (Req #2, #30, #47).
        </p>
      </div>

      <div className="bg-slate-800/60 rounded-xl p-5 border border-slate-700 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-400">Cooperative Name:</span>
            <div className="font-bold text-white text-sm mt-0.5">{coop.name}</div>
          </div>
          <div>
            <span className="text-slate-400">CDA Registration No:</span>
            <div className="font-mono text-emerald-400 font-semibold mt-0.5">{coop.registration_no}</div>
          </div>
          <div>
            <span className="text-slate-400">Tax Identification No (TIN):</span>
            <div className="font-mono text-slate-200 mt-0.5">{coop.tax_identification_number}</div>
          </div>
          <div>
            <span className="text-slate-400">Base Currency & Symbol:</span>
            <div className="font-semibold text-slate-200 mt-0.5">{coop.currency} ({coop.currency_symbol}) - 2 Decimals</div>
          </div>
          <div className="sm:col-span-2">
            <span className="text-slate-400">Headquarters Address:</span>
            <div className="text-slate-200 mt-0.5">{coop.address}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// SUB-PANEL: CONFIGURATION AUDIT TRAIL (Req 36)
// ==========================================
function AuditTrailConfig({ auditTrails }: { auditTrails: ConfigurationAuditTrail[] }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white">Configuration Change Audit Trail</h2>
        <p className="text-xs text-slate-400">
          Complete, tamper-evident log of who changed which setting, old value, new value, timestamp, and justification (Req #36).
        </p>
      </div>

      <div className="max-h-96 overflow-y-auto border border-slate-800 rounded-xl">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-800 text-slate-400 sticky top-0">
            <tr>
              <th className="p-2.5">Date & Time</th>
              <th className="p-2.5">Setting / Rule</th>
              <th className="p-2.5">Old Value</th>
              <th className="p-2.5">New Value</th>
              <th className="p-2.5">Changed By</th>
              <th className="p-2.5">Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {auditTrails.slice().reverse().map(a => (
              <tr key={a.id} className="hover:bg-slate-800/40">
                <td className="p-2.5 text-slate-400 whitespace-nowrap">
                  {new Date(a.created_at).toLocaleString()}
                </td>
                <td className="p-2.5 font-bold text-white">{a.setting}</td>
                <td className="p-2.5 text-slate-400 truncate max-w-xs">{a.old_value || 'None'}</td>
                <td className="p-2.5 text-emerald-400 font-medium truncate max-w-xs">{a.new_value}</td>
                <td className="p-2.5 text-blue-300">{a.changed_by}</td>
                <td className="p-2.5 text-slate-400">{a.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
