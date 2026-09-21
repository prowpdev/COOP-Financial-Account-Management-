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
  Search,
  Coins
} from 'lucide-react';
import { api } from '../../services/api';
import { ExcelWorkbench } from './ExcelWorkbench';
import { AccountingMappingsView } from './AccountingMappingsView';
import { CashAccountsConfigView } from './CashAccountsConfigView';
import { ShareCapitalSettingsView } from './ShareCapitalSettingsView';
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
  | 'share_capital_settings'
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

  const fetchFullConfig = async (retryCount = 2) => {
    try {
      setIsLoading(true);
      const res = await api.getConfig();
      if (res && res.data) {
        setInternalData(res.data);
        if (notification?.type === 'error') {
          setNotification(null);
        }
      }
    } catch (err: any) {
      if (retryCount > 0) {
        setTimeout(() => {
          fetchFullConfig(retryCount - 1);
        }, 500);
        return;
      }
      console.error('Failed to load configuration:', err);
      showNotice('error', `Failed to load configuration: ${err.message || err}`);
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
        { id: 'share_capital_settings' as ConfigSection, label: 'Share Capital (CBU) Settings', icon: Coins, count: configData.share_capital_settings?.length || 1 },
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
          <div className="flex items-center space-x-2">
            {notification.type === 'error' && (
              <button
                type="button"
                onClick={() => fetchFullConfig()}
                className="px-2.5 py-1 bg-rose-800 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold transition cursor-pointer"
              >
                Retry
              </button>
            )}
            <button onClick={() => setNotification(null)} className="cursor-pointer p-1 text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
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

              {activeSection === 'share_capital_settings' && (
                <ShareCapitalSettingsView
                  settings={configData.share_capital_settings}
                  accounts={configData.chart_of_accounts}
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
                <CashAccountsConfigView
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
    min_term_months: 1,
    max_term_months: 12,
    annual_interest_rate: 10.0,
    interest_calculation_method: 'Diminishing Balance',
    default_term_months: 12,
    payment_frequency: 'Monthly',
    grace_period_days: 5,
    penalty_rate_percentage: 2.0,
    gl_receivable_account_id: 'acc_1210',
    gl_interest_income_account_id: 'acc_4110'
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

  const handleDelete = async (product: LoanProduct) => {
    if (!window.confirm(`Delete loan product "${product.name}"?`)) return;
    try {
      await api.deleteLoanProduct(product.id, currentUser.name);
      showNotice('success', `Loan product "${product.name}" deleted.`);
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
              min_term_months: 1,
              max_term_months: 12,
              annual_interest_rate: 10.0,
              interest_calculation_method: 'Diminishing Balance',
              default_term_months: 12,
              payment_frequency: 'Monthly',
              grace_period_days: 5,
              penalty_rate_percentage: 2.0,
              gl_receivable_account_id: 'acc_1210',
              gl_interest_income_account_id: 'acc_4110'
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
                <option value="Equal Amortization">Equal Amortization</option>
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
                <option value="Weekly">Weekly</option>
                <option value="Semi-monthly">Semi-monthly</option>
                <option value="Monthly">Monthly</option>
                <option value="Lump Sum">Lump Sum</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-300 font-medium">Minimum Term (Months)</label>
              <input
                type="number"
                required
                value={formData.min_term_months}
                onChange={e => setFormData({ ...formData, min_term_months: parseInt(e.target.value) || 1 })}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 font-medium">Maximum Term (Months)</label>
              <input
                type="number"
                required
                value={formData.max_term_months}
                onChange={e => setFormData({ ...formData, max_term_months: parseInt(e.target.value) || 1 })}
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
              <label className="text-xs text-slate-300 font-medium">Penalty Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={formData.penalty_rate_percentage}
                onChange={e => setFormData({ ...formData, penalty_rate_percentage: parseFloat(e.target.value) || 0 })}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 font-medium">GL Receivable Account</label>
              <select
                value={formData.gl_receivable_account_id}
                onChange={e => setFormData({ ...formData, gl_receivable_account_id: e.target.value })}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white cursor-pointer"
              >
                {accounts.map(account => <option key={account.id} value={account.id}>{account.code || account.account_code} - {account.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-300 font-medium">GL Interest Income Account</label>
              <select
                value={formData.gl_interest_income_account_id}
                onChange={e => setFormData({ ...formData, gl_interest_income_account_id: e.target.value })}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white cursor-pointer"
              >
                {accounts.map(account => <option key={account.id} value={account.id}>{account.code || account.account_code} - {account.name}</option>)}
              </select>
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
                          <option value="Equal Amortization">Equal Amortization</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400">Frequency</label>
                        <select
                          value={formData.payment_frequency}
                          onChange={e => setFormData({ ...formData, payment_frequency: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                        >
                          <option value="Weekly">Weekly</option>
                          <option value="Semi-monthly">Semi-monthly</option>
                          <option value="Monthly">Monthly</option>
                          <option value="Lump Sum">Lump Sum</option>
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
                        min_term_months: p.min_term_months || 1,
                        max_term_months: p.max_term_months || p.default_term_months || 12,
                        default_term_months: p.default_term_months || p.max_term_months || 12,
                        payment_frequency: p.payment_frequency,
                        grace_period_days: p.grace_period_days,
                        penalty_rate_percentage: p.penalty_rate_percentage || 2,
                        gl_receivable_account_id: p.gl_receivable_account_id || p.debit_account_id || 'acc_1210',
                        gl_interest_income_account_id: p.gl_interest_income_account_id || 'acc_4110'
                      });
                    }}
                    className="flex items-center space-x-1 text-xs text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Product</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(p)}
                    className="flex items-center space-x-1 text-xs text-rose-400 hover:text-rose-300 font-medium cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
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
    account_code: '',
    name: '',
    category: 'Asset',
    report_group: 'Current Assets',
    normal_balance: 'Debit' as 'Debit' | 'Credit',
    parent_account_id: '',
    description: '',
    is_active: true
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const code = newAcc.account_code.trim();
      await api.createAccount({
        account_code: code,
        code,
        name: newAcc.name.trim(),
        category: newAcc.category,
        type: newAcc.category === 'Revenue' ? 'Income' : newAcc.category,
        report_group: newAcc.report_group.trim() || (newAcc.category === 'Asset' ? 'Current Assets' : newAcc.category === 'Liability' ? 'Current Liabilities' : newAcc.category),
        normal_balance: newAcc.normal_balance,
        parent_account_id: newAcc.parent_account_id || null,
        parent_id: newAcc.parent_account_id || null,
        description: newAcc.description.trim() || null,
        is_active: newAcc.is_active,
        active: newAcc.is_active,
        changed_by: currentUser.name,
        reason: 'New account created in Chart of Accounts (CDA aligned)'
      });
      setIsAdding(false);
      setNewAcc({
        account_code: '',
        name: '',
        category: 'Asset',
        report_group: 'Current Assets',
        normal_balance: 'Debit',
        parent_account_id: '',
        description: '',
        is_active: true
      });
      showNotice('success', `Account ${code} - ${newAcc.name} added.`);
      onRefresh();
    } catch (err: any) {
      showNotice('error', err.message);
    }
  };

  const filtered = filterType === 'All'
    ? accounts
    : accounts.filter(a => {
        const cat = a.category || a.type;
        if (filterType === 'Revenue') return cat === 'Revenue' || cat === 'Income';
        return cat === filterType;
      });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">Chart of Accounts (CDA Standard COA)</h2>
          <p className="text-xs text-slate-400">
            Database schema: account_code, name, category, report_group, normal_balance, parent_account_id, description, is_active.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="bg-slate-800 text-xs text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 cursor-pointer"
          >
            <option value="All">All Categories</option>
            <option value="Asset">Asset</option>
            <option value="Liability">Liability</option>
            <option value="Equity">Equity</option>
            <option value="Revenue">Revenue</option>
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
            <h3 className="text-sm font-bold text-emerald-400">New Chart of Accounts Entry (SQL Aligned)</h3>
            <button type="button" onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-slate-300 font-medium">Account Code (account_code)</label>
              <input
                type="text"
                required
                placeholder="e.g. 1130"
                value={newAcc.account_code}
                onChange={e => setNewAcc({ ...newAcc, account_code: e.target.value })}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 font-medium">Account Name (name)</label>
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
              <label className="text-xs text-slate-300 font-medium">Category (category)</label>
              <select
                value={newAcc.category}
                onChange={e => {
                  const cat = e.target.value;
                  const defaultGroup =
                    cat === 'Asset' ? 'Current Assets' :
                    cat === 'Liability' ? 'Deposit Liabilities' :
                    cat === 'Equity' ? 'Share Capital' :
                    cat === 'Revenue' ? 'Operating Revenue' : 'Administrative Expenses';
                  const defaultBal: 'Debit' | 'Credit' = (cat === 'Asset' || cat === 'Expense') ? 'Debit' : 'Credit';
                  setNewAcc({
                    ...newAcc,
                    category: cat,
                    report_group: defaultGroup,
                    normal_balance: defaultBal
                  });
                }}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white cursor-pointer"
              >
                <option value="Asset">Asset</option>
                <option value="Liability">Liability</option>
                <option value="Equity">Equity</option>
                <option value="Revenue">Revenue</option>
                <option value="Expense">Expense</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-300 font-medium">Report Group (report_group)</label>
              <input
                type="text"
                required
                placeholder="e.g. Current Assets"
                value={newAcc.report_group}
                onChange={e => setNewAcc({ ...newAcc, report_group: e.target.value })}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-slate-300 font-medium">Normal Balance (normal_balance)</label>
              <select
                value={newAcc.normal_balance}
                onChange={e => setNewAcc({ ...newAcc, normal_balance: e.target.value as 'Debit' | 'Credit' })}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white cursor-pointer"
              >
                <option value="Debit">Debit</option>
                <option value="Credit">Credit</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-300 font-medium">Parent Account (parent_account_id)</label>
              <select
                value={newAcc.parent_account_id}
                onChange={e => setNewAcc({ ...newAcc, parent_account_id: e.target.value })}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white cursor-pointer"
              >
                <option value="">None (Top-Level)</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.account_code || acc.code} - {acc.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-300 font-medium">Description (description)</label>
              <input
                type="text"
                placeholder="Account purpose or explanatory remarks"
                value={newAcc.description}
                onChange={e => setNewAcc({ ...newAcc, description: e.target.value })}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
              />
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={newAcc.is_active}
                onChange={e => setNewAcc({ ...newAcc, is_active: e.target.checked })}
                className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-400"
              />
              <span>Is Active (is_active)</span>
            </label>
            <div className="flex space-x-2">
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
                Save Account to DB
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60 shadow-md">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-800/90 text-slate-300 font-semibold border-b border-slate-700">
            <tr>
              <th className="py-2.5 px-3 whitespace-nowrap">Account Code</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Account Name</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Category</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Report Group</th>
              <th className="py-2.5 px-3 whitespace-nowrap text-center">Normal Bal</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Parent Account</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Description</th>
              <th className="py-2.5 px-3 whitespace-nowrap text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {filtered.map(a => {
              const parent = accounts.find(acc => acc.id === (a.parent_account_id || a.parent_id));
              const category = a.category || a.type || 'Asset';
              const isActive = a.is_active !== undefined ? a.is_active : a.active !== false;
              return (
                <tr key={a.id} className="hover:bg-slate-800/50 transition">
                  <td className="py-2.5 px-3 font-mono font-bold text-white whitespace-nowrap">
                    {a.account_code || a.code}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-200">
                    {a.name}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      category === 'Asset' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                      category === 'Liability' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      category === 'Equity' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                      (category === 'Revenue' || category === 'Income') ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}>
                      {category}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">
                    {a.report_group || a.category}
                  </td>
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    <span className={`font-mono text-xs font-semibold ${
                      a.normal_balance === 'Debit' ? 'text-blue-400' : 'text-purple-400'
                    }`}>
                      {a.normal_balance}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                    {parent ? `${parent.account_code || parent.code} - ${parent.name}` : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 max-w-[240px] truncate" title={a.description || ''}>
                    {a.description || '—'}
                  </td>
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-medium border ${
                      isActive
                        ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                        : 'text-slate-400 bg-slate-500/10 border-slate-500/20'
                    }`}>
                      {isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              );
            })}
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
  const [editingFee, setEditingFee] = useState<Fee | null>(null);

  const revenueAccounts = accounts.filter(
    a => a.category === 'Revenue' || a.category === 'Income' || a.type === 'Income' || a.type === 'Revenue'
  );
  const defaultGlId = revenueAccounts[0]?.id || 'acc_4120';

  const [newFee, setNewFee] = useState({
    name: '',
    code: '',
    calculation_type: 'Fixed',
    fixed_amount: 250,
    percentage: 0,
    min_amount: 250,
    max_amount: 250,
    applies_to: 'Loans',
    gl_account_id: defaultGlId,
    active: true
  });

  const handleCreateFee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isFixed = newFee.calculation_type === 'Fixed';
      const feeData = {
        name: newFee.name.trim(),
        code: newFee.code.trim() || `FEE-${Date.now().toString().slice(-4)}`,
        calculation_type: newFee.calculation_type,
        fixed_amount: isFixed ? Number(newFee.fixed_amount) || 0 : 0,
        amount: isFixed ? Number(newFee.fixed_amount) || 0 : Number(newFee.percentage) || 0,
        percentage: isFixed ? 0 : Number(newFee.percentage) || 0,
        rate: isFixed ? 0 : Number(newFee.percentage) || 0,
        min_amount: Number(newFee.min_amount) || 0,
        max_amount: Number(newFee.max_amount) || 0,
        applies_to: newFee.applies_to,
        applicable_module: newFee.applies_to,
        gl_account_id: newFee.gl_account_id || defaultGlId,
        accounting_account_id: newFee.gl_account_id || defaultGlId,
        active: newFee.active,
        changed_by: currentUser.name,
        reason: 'Created new fee rule via Admin'
      };

      await api.createFee(feeData);
      setIsAddingFee(false);
      setNewFee({
        name: '',
        code: '',
        calculation_type: 'Fixed',
        fixed_amount: 250,
        percentage: 0,
        min_amount: 250,
        max_amount: 250,
        applies_to: 'Loans',
        gl_account_id: defaultGlId,
        active: true
      });
      showNotice('success', `Created fee "${feeData.name}".`);
      onRefresh();
    } catch (err: any) {
      showNotice('error', err.message);
    }
  };

  const handleUpdateFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFee) return;
    try {
      const isFixed = editingFee.calculation_type === 'Fixed';
      const fixedAmt = Number(editingFee.fixed_amount ?? editingFee.amount ?? 0);
      const pct = Number(editingFee.percentage ?? editingFee.rate ?? 0);
      const feeData = {
        name: editingFee.name.trim(),
        code: editingFee.code.trim(),
        calculation_type: editingFee.calculation_type,
        fixed_amount: isFixed ? fixedAmt : 0,
        amount: isFixed ? fixedAmt : pct,
        percentage: isFixed ? 0 : pct,
        rate: isFixed ? 0 : pct,
        min_amount: Number(editingFee.min_amount) || 0,
        max_amount: Number(editingFee.max_amount) || 0,
        applies_to: editingFee.applies_to || editingFee.applicable_module || 'Loans',
        applicable_module: editingFee.applies_to || editingFee.applicable_module || 'Loans',
        gl_account_id: editingFee.gl_account_id || editingFee.accounting_account_id || defaultGlId,
        accounting_account_id: editingFee.gl_account_id || editingFee.accounting_account_id || defaultGlId,
        active: editingFee.active !== undefined ? editingFee.active : true,
        changed_by: currentUser.name,
        reason: 'Updated fee rule via Admin'
      };

      await api.updateFee(editingFee.id, feeData);
      setEditingFee(null);
      showNotice('success', `Updated fee "${feeData.name}".`);
      onRefresh();
    } catch (err: any) {
      showNotice('error', err.message);
    }
  };

  const handleDeleteFee = async (fee: Fee) => {
    if (!window.confirm(`Are you sure you want to delete fee rule "${fee.name}" (${fee.code})?`)) {
      return;
    }
    try {
      await api.deleteFee(fee.id, currentUser.name);
      showNotice('success', `Fee "${fee.name}" deleted successfully.`);
      onRefresh();
    } catch (err: any) {
      showNotice('error', err.message);
    }
  };

  const handleToggleActive = async (fee: Fee) => {
    try {
      const newStatus = !(fee.active !== false);
      await api.updateFee(fee.id, {
        ...fee,
        active: newStatus,
        changed_by: currentUser.name,
        reason: `Toggled fee status to ${newStatus ? 'active' : 'inactive'}`
      });
      showNotice('success', `Fee "${fee.name}" marked as ${newStatus ? 'active' : 'inactive'}.`);
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
            Configure fee calculation models (Fixed, Percentage of Loan, Min/Max) and automated penalty rules with general ledger integration.
          </p>
        </div>
        <button
          id="btn-add-fee"
          onClick={() => {
            setEditingFee(null);
            setIsAddingFee(true);
          }}
          className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Fee Rule</span>
        </button>
      </div>

      {/* Add Fee Form */}
      {isAddingFee && (
        <form onSubmit={handleCreateFee} className="bg-slate-800/90 rounded-xl p-4 border border-slate-700 space-y-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2">
            <h3 className="text-sm font-bold text-emerald-400">Add New Fee Rule</h3>
            <button type="button" onClick={() => setIsAddingFee(false)} className="text-slate-400 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-300 font-medium">Fee Code</label>
              <input
                type="text"
                placeholder="e.g. FEE-NOTARIAL (or leave blank)"
                value={newFee.code}
                onChange={e => setNewFee({ ...newFee, code: e.target.value })}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-300 font-medium">Fee Name / Description *</label>
              <input
                type="text"
                required
                placeholder="e.g. Legal & Notarial Documentation Fee"
                value={newFee.name}
                onChange={e => setNewFee({ ...newFee, name: e.target.value })}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 font-medium">Calculation Model</label>
              <select
                value={newFee.calculation_type}
                onChange={e => {
                  const type = e.target.value;
                  const isFixed = type === 'Fixed';
                  setNewFee({
                    ...newFee,
                    calculation_type: type,
                    fixed_amount: isFixed ? (newFee.fixed_amount || 250) : 0,
                    percentage: !isFixed ? (newFee.percentage || 2) : 0
                  });
                }}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white cursor-pointer"
              >
                <option value="Fixed">Fixed Amount</option>
                <option value="Percentage">Percentage</option>
                <option value="Percentage of Loan">Percentage of Loan</option>
                <option value="Percentage of Principal">Percentage of Principal</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-300 font-medium">Applicable Module</label>
              <select
                value={newFee.applies_to}
                onChange={e => setNewFee({ ...newFee, applies_to: e.target.value })}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white cursor-pointer"
              >
                <option value="Loans">Loans</option>
                <option value="Savings">Savings</option>
                <option value="Share Capital">Share Capital</option>
                <option value="Members">Members / Membership</option>
                <option value="Accounting">Accounting</option>
                <option value="All Modules">All Modules</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-300 font-medium">
                {newFee.calculation_type === 'Fixed' ? 'Fixed Amount (₱) *' : 'Rate Percentage (%) *'}
              </label>
              <input
                type="number"
                step="0.01"
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
              <label className="text-xs text-slate-300 font-medium">Minimum Amount (₱)</label>
              <input
                type="number"
                step="0.01"
                value={newFee.min_amount}
                onChange={e => setNewFee({ ...newFee, min_amount: parseFloat(e.target.value) || 0 })}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 font-medium">Maximum Cap (₱)</label>
              <input
                type="number"
                step="0.01"
                value={newFee.max_amount}
                onChange={e => setNewFee({ ...newFee, max_amount: parseFloat(e.target.value) || 0 })}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 font-medium">Applicable Revenue GL Account *</label>
              <select
                value={newFee.gl_account_id}
                onChange={e => setNewFee({ ...newFee, gl_account_id: e.target.value })}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white cursor-pointer"
              >
                {revenueAccounts.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.account_code || a.code} - {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-between items-center pt-2">
            <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={newFee.active}
                onChange={e => setNewFee({ ...newFee, active: e.target.checked })}
                className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
              />
              <span>Set fee rule as Active immediately</span>
            </label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setIsAddingFee(false)}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded text-xs cursor-pointer flex items-center space-x-1"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Fee Rule</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Edit Fee Modal / Form */}
      {editingFee && (
        <form onSubmit={handleUpdateFee} className="bg-slate-800/95 rounded-xl p-4 border border-blue-500/50 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2">
            <h3 className="text-sm font-bold text-blue-400 flex items-center space-x-2">
              <Edit2 className="w-4 h-4" />
              <span>Edit Fee: {editingFee.name} ({editingFee.code})</span>
            </h3>
            <button type="button" onClick={() => setEditingFee(null)} className="text-slate-400 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-300 font-medium">Fee Code *</label>
              <input
                type="text"
                required
                value={editingFee.code}
                onChange={e => setEditingFee({ ...editingFee, code: e.target.value })}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-300 font-medium">Fee Name / Description *</label>
              <input
                type="text"
                required
                value={editingFee.name}
                onChange={e => setEditingFee({ ...editingFee, name: e.target.value })}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 font-medium">Calculation Model</label>
              <select
                value={editingFee.calculation_type}
                onChange={e => {
                  const type = e.target.value;
                  const isFixed = type === 'Fixed';
                  setEditingFee({
                    ...editingFee,
                    calculation_type: type,
                    fixed_amount: isFixed ? (editingFee.fixed_amount || 250) : 0,
                    percentage: !isFixed ? (editingFee.percentage || 2) : 0
                  });
                }}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white cursor-pointer"
              >
                <option value="Fixed">Fixed Amount</option>
                <option value="Percentage">Percentage</option>
                <option value="Percentage of Loan">Percentage of Loan</option>
                <option value="Percentage of Principal">Percentage of Principal</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-300 font-medium">Applicable Module</label>
              <select
                value={editingFee.applies_to || editingFee.applicable_module || 'Loans'}
                onChange={e => setEditingFee({
                  ...editingFee,
                  applies_to: e.target.value,
                  applicable_module: e.target.value
                })}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white cursor-pointer"
              >
                <option value="Loans">Loans</option>
                <option value="Savings">Savings</option>
                <option value="Share Capital">Share Capital</option>
                <option value="Members">Members / Membership</option>
                <option value="Accounting">Accounting</option>
                <option value="All Modules">All Modules</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-300 font-medium">
                {editingFee.calculation_type === 'Fixed' ? 'Fixed Amount (₱) *' : 'Rate Percentage (%) *'}
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={
                  editingFee.calculation_type === 'Fixed'
                    ? (editingFee.fixed_amount !== undefined ? editingFee.fixed_amount : (editingFee.amount || 0))
                    : (editingFee.percentage !== undefined ? editingFee.percentage : (editingFee.rate || 0))
                }
                onChange={e => {
                  const v = parseFloat(e.target.value) || 0;
                  if (editingFee.calculation_type === 'Fixed') {
                    setEditingFee({ ...editingFee, fixed_amount: v, amount: v });
                  } else {
                    setEditingFee({ ...editingFee, percentage: v, rate: v });
                  }
                }}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 font-medium">Minimum Amount (₱)</label>
              <input
                type="number"
                step="0.01"
                value={editingFee.min_amount || 0}
                onChange={e => setEditingFee({ ...editingFee, min_amount: parseFloat(e.target.value) || 0 })}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 font-medium">Maximum Cap (₱)</label>
              <input
                type="number"
                step="0.01"
                value={editingFee.max_amount || 0}
                onChange={e => setEditingFee({ ...editingFee, max_amount: parseFloat(e.target.value) || 0 })}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 font-medium">Applicable Revenue GL Account *</label>
              <select
                value={editingFee.gl_account_id || editingFee.accounting_account_id || defaultGlId}
                onChange={e => setEditingFee({
                  ...editingFee,
                  gl_account_id: e.target.value,
                  accounting_account_id: e.target.value
                })}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white cursor-pointer"
              >
                {revenueAccounts.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.account_code || a.code} - {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-between items-center pt-2">
            <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={editingFee.active !== false}
                onChange={e => setEditingFee({ ...editingFee, active: e.target.checked })}
                className="rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-blue-500"
              />
              <span>Rule is Active</span>
            </label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setEditingFee(null)}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded text-xs cursor-pointer flex items-center space-x-1"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Fee List */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Configured Fee Schedule ({fees.length} Rules)
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {fees.map(f => {
            const isPercentage = String(f.calculation_type || '').toLowerCase().includes('percent');
            const fixedAmt = f.fixed_amount !== undefined ? f.fixed_amount : (f.amount !== undefined ? f.amount : 0);
            const pct = f.percentage !== undefined ? f.percentage : (f.rate !== undefined ? f.rate : (f.amount !== undefined ? f.amount : 0));
            const glId = f.gl_account_id || f.accounting_account_id;
            const glAcc = accounts.find(a => a.id === glId);
            const moduleName = f.applies_to || f.applicable_module || 'Loans';
            const isActive = f.active !== false;

            return (
              <div
                key={f.id}
                className={`bg-slate-800/70 rounded-xl p-4 border transition-colors flex flex-col justify-between space-y-3 ${
                  isActive ? 'border-slate-700' : 'border-slate-700/40 opacity-70'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-bold text-white flex items-center space-x-2">
                        <span>{f.name}</span>
                        {!isActive && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            Inactive
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                          {f.code}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                          {moduleName}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded border ${
                            isPercentage
                              ? 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                              : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                          }`}
                        >
                          {f.calculation_type}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900/60 rounded-lg p-2.5 border border-slate-800 flex justify-between items-center">
                    <div>
                      <span className="text-[11px] text-slate-400">Charge Value:</span>
                      <div className="text-sm font-bold text-emerald-400">
                        {isPercentage
                          ? `${pct}% ${f.min_amount || f.max_amount ? `(Min: ₱${f.min_amount || 0} / Max: ₱${f.max_amount || 0})` : ''}`
                          : `₱${Number(fixedAmt || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400">General Ledger:</span>
                      <div className="text-xs font-medium text-slate-200 truncate max-w-[180px]">
                        {glAcc ? `${glAcc.account_code || glAcc.code} - ${glAcc.name}` : (glId || 'acc_4120')}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-700/60 text-xs">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(f)}
                    className="text-[11px] text-slate-400 hover:text-slate-200 cursor-pointer underline"
                  >
                    {isActive ? 'Deactivate Rule' : 'Activate Rule'}
                  </button>
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingFee(false);
                        setEditingFee(f);
                      }}
                      className="flex items-center space-x-1 px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-xs cursor-pointer font-medium"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteFee(f)}
                      className="flex items-center space-x-1 px-2 py-1 bg-rose-900/30 hover:bg-rose-900/50 text-rose-300 border border-rose-700/40 rounded text-xs cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
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
                  <span className="text-emerald-400 font-semibold">{p.penalty_rate_percentage}% / {p.grace_period_days}</span>
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
  const normalizePriorities = (items: PaymentAllocationRule['priorities']) =>
    items.map((item, index) => typeof item === 'string'
      ? { priority: index + 1, component: item, label: item }
      : item
    );
  const [priorities, setPriorities] = useState(() =>
    normalizePriorities(activeRule?.priorities || [])
  );

  useEffect(() => {
    setPriorities(normalizePriorities(activeRule?.priorities || []));
  }, [activeRule]);

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
  console.log(rules)

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
              test={item}
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
                <span className="text-xs font-bold text-white">{f.label}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 font-mono">
                  {f.field_type}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-1">field_name: {f.field_key}</div>
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
  const [activeTab, setActiveTab] = useState<'share_capital' | 'savings'>('share_capital');
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
      {/* Sub-navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('share_capital')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTab === 'share_capital'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
              : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>Share Capital (CBU) Settings</span>
        </button>
        <button
          onClick={() => setActiveTab('savings')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTab === 'savings'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
              : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
          }`}
        >
          <PiggyBank className="w-4 h-4" />
          <span>Savings Deposit Products ({savingsProducts.length})</span>
        </button>
      </div>

      {activeTab === 'share_capital' ? (
        <ShareCapitalSettingsView
          settings={shareCapitalSettings}
          accounts={accounts}
          currentUser={currentUser}
          onRefresh={onRefresh}
          showNotice={showNotice}
        />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Dynamic Savings Deposit Products</h2>
              <p className="text-xs text-slate-400">
                Define savings facilities, deposit interest rates, and withdrawal rules.
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
      )}
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
