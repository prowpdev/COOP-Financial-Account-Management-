import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  Percent,
  Calendar,
  FileText,
  DollarSign,
  Shield,
  Layers,
  Building2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Tag,
  Clock,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ListFilter,
  Check
} from 'lucide-react';
import { Account, Branch, CashAccount, LoanProduct, User, PenaltyRule, ApprovalWorkflow } from '../../types';
import { api } from '../../services/api';

export interface LoanProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: LoanProduct | null;
  accounts?: Account[];
  branches?: Branch[];
  cashAccounts?: CashAccount[];
  approvalWorkflows?: ApprovalWorkflow[];
  penaltyRules?: PenaltyRule[];
  currentUser: User;
  onSaved: (product: LoanProduct) => void;
}

const COMMON_DOCUMENT_PRESETS = [
  'Valid Government ID',
  'Payslip / Income Proof',
  'Co-maker Agreement',
  'Barangay Clearance',
  'Proof of Billing',
  'Land Title / Tenancy Agreement',
  'Business Permit / DTI',
  'Collateral Appraisal Report',
  'Hospital / Emergency Slip',
  'Enrollment Form / School Assessment'
];

export const LoanProductModal: React.FC<LoanProductModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  accounts = [],
  branches = [],
  cashAccounts = [],
  approvalWorkflows: initialWorkflows = [],
  penaltyRules: initialPenaltyRules = [],
  currentUser,
  onSaved
}) => {
  const isEditing = Boolean(productToEdit);

  // Dynamic reference lists
  const [availableAccounts, setAvailableAccounts] = useState<Account[]>(accounts);
  const [availableBranches, setAvailableBranches] = useState<Branch[]>(branches);
  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>(initialWorkflows);
  const [penaltyRules, setPenaltyRules] = useState<PenaltyRule[]>(initialPenaltyRules);
  const [isLoadingRefs, setIsLoadingRefs] = useState(false);

  // Active form section tab ('all' allows continuous scrolling through all sections)
  const [activeTab, setActiveTab] = useState<'basic' | 'terms' | 'interest' | 'fees' | 'requirements' | 'accounting' | 'dates' | 'all'>('basic');

  // Form State covering all 30 database columns
  const [formData, setFormData] = useState({
    // Basic Information (5)
    id: '',
    code: '',
    name: '',
    description: '',
    version: 1,

    // Loan Amount and Terms (5)
    min_amount: 10000,
    max_amount: 250000,
    min_term_months: 1,
    max_term_months: 12,
    default_term_months: 12,

    // Interest and Payment (4)
    annual_interest_rate: 10.0,
    interest_calculation_method: 'Diminishing Balance',
    payment_frequency: 'Monthly',
    grace_period_days: 5,

    // Fees and Penalties (5)
    processing_fee_percentage: 2.0,
    service_fee_fixed: 200,
    other_fee: 100,
    penalty_rule_id: 'pen_standard',
    penalty_rate_percentage: 2.0,

    // Requirements and Approval (4)
    collateral_required: false,
    guarantor_required: true,
    required_documents: ['Valid Government ID', 'Payslip / Income Proof'] as string[],
    approval_workflow_id: 'wf_loan_standard',

    // Accounting and Funding (3)
    debit_account_id: 'acc_1210',
    gl_receivable_account_id: 'acc_1210',
    gl_interest_income_account_id: 'acc_4110',

    // Effective Dates and Status (4)
    effective_from: new Date().toISOString().split('T')[0],
    effective_until: '',
    active: true,
    branch_id: ''
  });

  const [newDocInput, setNewDocInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Keep internal reference lists synced with props
  useEffect(() => {
    if (accounts.length > 0) setAvailableAccounts(accounts);
  }, [accounts]);

  useEffect(() => {
    if (branches.length > 0) setAvailableBranches(branches);
  }, [branches]);

  useEffect(() => {
    if (initialWorkflows.length > 0) setWorkflows(initialWorkflows);
  }, [initialWorkflows]);

  useEffect(() => {
    if (initialPenaltyRules.length > 0) setPenaltyRules(initialPenaltyRules);
  }, [initialPenaltyRules]);

  // Load missing reference data dynamically if not provided in props
  useEffect(() => {
    if (!isOpen) return;

    const loadMissingRefs = async () => {
      setIsLoadingRefs(true);
      try {
        if (availableAccounts.length === 0) {
          const accRes = await api.getAccounts().catch(() => ({ data: [] }));
          if (accRes.data && accRes.data.length > 0) setAvailableAccounts(accRes.data);
        }
        if (availableBranches.length === 0) {
          const brRes = await api.getBranches().catch(() => ({ data: [] }));
          if (brRes.data && brRes.data.length > 0) setAvailableBranches(brRes.data);
        }
        if (workflows.length === 0) {
          const wfRes = await api.getApprovalWorkflows().catch(() => ({ data: [] }));
          if (wfRes.data && wfRes.data.length > 0) setWorkflows(wfRes.data);
          else {
            const allCfg = await api.getConfig().catch(() => ({ data: null }));
            if (allCfg.data?.approval_workflows) setWorkflows(allCfg.data.approval_workflows);
          }
        }
        if (penaltyRules.length === 0) {
          const penRes = await api.getPenaltyRules().catch(() => ({ data: [] }));
          if (penRes.data && penRes.data.length > 0) setPenaltyRules(penRes.data);
          else {
            const allCfg = await api.getConfig().catch(() => ({ data: null }));
            if (allCfg.data?.penalty_rules) setPenaltyRules(allCfg.data.penalty_rules);
          }
        }
      } catch (err) {
        console.error('Failed to load reference rules for loan products:', err);
      } finally {
        setIsLoadingRefs(false);
      }
    };

    loadMissingRefs();
  }, [isOpen]);

  // Populate form with productToEdit or defaults
  useEffect(() => {
    if (!isOpen) return;

    if (productToEdit) {
      let docs: string[] = ['Valid Government ID'];
      if (Array.isArray(productToEdit.required_documents)) {
        docs = productToEdit.required_documents;
      } else if (typeof productToEdit.required_documents === 'string') {
        try {
          const parsed = JSON.parse(productToEdit.required_documents);
          docs = Array.isArray(parsed) ? parsed : [productToEdit.required_documents];
        } catch {
          docs = String(productToEdit.required_documents).split(',').map(d => d.trim()).filter(Boolean);
        }
      }

      setFormData({
        id: productToEdit.id || '',
        code: productToEdit.code || '',
        name: productToEdit.name || '',
        description: productToEdit.description || '',
        version: productToEdit.version || 1,
        min_amount: Number(productToEdit.min_amount) || 10000,
        max_amount: Number(productToEdit.max_amount) || 250000,
        min_term_months: Number(productToEdit.min_term_months ?? 1),
        max_term_months: Number(productToEdit.max_term_months ?? 12),
        default_term_months: Number(productToEdit.default_term_months ?? 12),
        annual_interest_rate: Number(productToEdit.annual_interest_rate ?? 10.0),
        interest_calculation_method: productToEdit.interest_calculation_method || 'Diminishing Balance',
        payment_frequency: productToEdit.payment_frequency || 'Monthly',
        grace_period_days: Number(productToEdit.grace_period_days ?? 0),
        processing_fee_percentage: Number(productToEdit.processing_fee_percentage ?? 0),
        service_fee_fixed: Number(productToEdit.service_fee_fixed ?? 0),
        other_fee: Number(productToEdit.other_fee ?? productToEdit.other_fees ?? 0),
        penalty_rule_id: productToEdit.penalty_rule_id || 'pen_standard',
        penalty_rate_percentage: Number(productToEdit.penalty_rate_percentage ?? 2.0),
        collateral_required: Boolean(productToEdit.collateral_required),
        guarantor_required: Boolean(productToEdit.guarantor_required),
        required_documents: docs,
        approval_workflow_id: productToEdit.approval_workflow_id || 'wf_loan_standard',
        debit_account_id: productToEdit.debit_account_id || 'acc_1210',
        gl_receivable_account_id: productToEdit.gl_receivable_account_id || productToEdit.debit_account_id || 'acc_1210',
        gl_interest_income_account_id: productToEdit.gl_interest_income_account_id || 'acc_4110',
        effective_from: productToEdit.effective_from || new Date().toISOString().split('T')[0],
        effective_until: productToEdit.effective_until || '',
        active: productToEdit.active !== undefined ? Boolean(productToEdit.active) : true,
        branch_id: productToEdit.branch_id || ''
      });
    } else {
      // New product defaults
      const isStaffWithBranch = !currentUser.is_super_admin && currentUser.role_id !== 'role_superadmin' && currentUser.branch_id;
      setFormData({
        id: '',
        code: `LP-${Math.floor(100 + Math.random() * 900)}`,
        name: '',
        description: '',
        version: 1,
        min_amount: 10000,
        max_amount: 300000,
        min_term_months: 1,
        max_term_months: 12,
        default_term_months: 12,
        annual_interest_rate: 10.0,
        interest_calculation_method: 'Diminishing Balance',
        payment_frequency: 'Monthly',
        grace_period_days: 5,
        processing_fee_percentage: 2.0,
        service_fee_fixed: 200,
        other_fee: 100,
        penalty_rule_id: penaltyRules[0]?.id || 'pen_standard',
        penalty_rate_percentage: 2.0,
        collateral_required: false,
        guarantor_required: true,
        required_documents: ['Valid Government ID', 'Payslip / Income Proof'],
        approval_workflow_id: workflows[0]?.id || 'wf_loan_standard',
        debit_account_id: availableAccounts.find(a => a.code === '1210' || a.account_code === '1210')?.id || availableAccounts[0]?.id || 'acc_1210',
        gl_receivable_account_id: availableAccounts.find(a => a.code === '1210' || a.account_code === '1210')?.id || availableAccounts[0]?.id || 'acc_1210',
        gl_interest_income_account_id: availableAccounts.find(a => a.code === '4110' || a.account_code === '4110')?.id || availableAccounts[0]?.id || 'acc_4110',
        effective_from: new Date().toISOString().split('T')[0],
        effective_until: '',
        active: true,
        branch_id: isStaffWithBranch ? currentUser.branch_id! : ''
      });
    }

    setErrorMsg(null);
    setActiveTab('basic');
  }, [isOpen, productToEdit]);

  if (!isOpen) return null;

  // Document tags handlers
  const handleAddDocument = (docName: string) => {
    const trimmed = docName.trim();
    if (!trimmed) return;
    if (formData.required_documents.includes(trimmed)) return;
    setFormData(prev => ({
      ...prev,
      required_documents: [...prev.required_documents, trimmed]
    }));
    setNewDocInput('');
  };

  const handleRemoveDocument = (docName: string) => {
    setFormData(prev => ({
      ...prev,
      required_documents: prev.required_documents.filter(d => d !== docName)
    }));
  };

  // Filter accounts by type for selects
  const receivableAccounts = availableAccounts.filter(a => {
    const code = a.code || a.account_code || '';
    const name = (a.name || '').toLowerCase();
    const type = (a.type || a.category || '').toLowerCase();
    return code.startsWith('12') || name.includes('receivable') || name.includes('loan') || type === 'asset';
  });

  const interestIncomeAccounts = availableAccounts.filter(a => {
    const code = a.code || a.account_code || '';
    const name = (a.name || '').toLowerCase();
    const type = (a.type || a.category || '').toLowerCase();
    return code.startsWith('41') || name.includes('interest') || name.includes('income') || type === 'revenue' || type === 'income';
  });

  const disbursementAccounts = [
    ...availableAccounts.filter(a => {
      const code = a.code || a.account_code || '';
      const name = (a.name || '').toLowerCase();
      return code.startsWith('11') || code.startsWith('12') || name.includes('cash') || name.includes('bank') || name.includes('disbursement');
    })
  ];

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validation
    if (!formData.code.trim()) {
      setErrorMsg('Product code is required.');
      if (activeTab !== 'all') setActiveTab('basic');
      return;
    }
    if (!formData.name.trim()) {
      setErrorMsg('Product name is required.');
      if (activeTab !== 'all') setActiveTab('basic');
      return;
    }
    if (formData.min_amount <= 0) {
      setErrorMsg('Minimum loan amount must be greater than zero.');
      if (activeTab !== 'all') setActiveTab('terms');
      return;
    }
    if (formData.max_amount <= 0) {
      setErrorMsg('Maximum loan amount must be greater than zero.');
      if (activeTab !== 'all') setActiveTab('terms');
      return;
    }
    if (formData.max_amount < formData.min_amount) {
      setErrorMsg('Maximum amount cannot be less than minimum amount.');
      if (activeTab !== 'all') setActiveTab('terms');
      return;
    }
    if (formData.min_term_months <= 0) {
      setErrorMsg('Minimum term must be at least 1 month.');
      if (activeTab !== 'all') setActiveTab('terms');
      return;
    }
    if (formData.max_term_months < formData.min_term_months) {
      setErrorMsg('Maximum term cannot be less than minimum term.');
      if (activeTab !== 'all') setActiveTab('terms');
      return;
    }
    if (formData.default_term_months < formData.min_term_months || formData.default_term_months > formData.max_term_months) {
      setErrorMsg(`Default term (${formData.default_term_months} mos) must fall within minimum (${formData.min_term_months} mos) and maximum (${formData.max_term_months} mos).`);
      if (activeTab !== 'all') setActiveTab('terms');
      return;
    }
    if (formData.annual_interest_rate < 0) {
      setErrorMsg('Annual interest rate cannot be negative.');
      if (activeTab !== 'all') setActiveTab('interest');
      return;
    }
    if (!formData.gl_receivable_account_id) {
      setErrorMsg('GL Loan Receivable Account is required.');
      if (activeTab !== 'all') setActiveTab('accounting');
      return;
    }
    if (!formData.gl_interest_income_account_id) {
      setErrorMsg('GL Interest Income Account is required.');
      if (activeTab !== 'all') setActiveTab('accounting');
      return;
    }
    if (formData.effective_from && formData.effective_until && new Date(formData.effective_from) > new Date(formData.effective_until)) {
      setErrorMsg('Effective From date cannot be later than Effective Until date.');
      if (activeTab !== 'all') setActiveTab('dates');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        code: formData.code.trim(),
        name: formData.name.trim(),
        description: formData.description.trim() ? formData.description.trim() : null,
        min_amount: Number(formData.min_amount),
        max_amount: Number(formData.max_amount),
        min_term_months: Number(formData.min_term_months),
        max_term_months: Number(formData.max_term_months),
        default_term_months: Number(formData.default_term_months),
        annual_interest_rate: Number(formData.annual_interest_rate),
        interest_calculation_method: formData.interest_calculation_method,
        payment_frequency: formData.payment_frequency,
        grace_period_days: Number(formData.grace_period_days || 0),
        processing_fee_percentage: Number(formData.processing_fee_percentage || 0),
        service_fee_fixed: Number(formData.service_fee_fixed || 0),
        other_fee: Number(formData.other_fee || 0),
        penalty_rule_id: formData.penalty_rule_id,
        penalty_rate_percentage: Number(formData.penalty_rate_percentage || 0),
        collateral_required: Boolean(formData.collateral_required),
        guarantor_required: Boolean(formData.guarantor_required),
        required_documents: formData.required_documents,
        approval_workflow_id: formData.approval_workflow_id,
        debit_account_id: formData.debit_account_id || formData.gl_receivable_account_id,
        gl_receivable_account_id: formData.gl_receivable_account_id,
        gl_interest_income_account_id: formData.gl_interest_income_account_id,
        effective_from: formData.effective_from || null,
        effective_until: formData.effective_until ? formData.effective_until : null,
        active: Boolean(formData.active),
        branch_id: formData.branch_id === 'all' || !formData.branch_id ? null : formData.branch_id,
        changed_by: currentUser.name || 'Admin',
        reason: isEditing
          ? `Updated loan product ${formData.name} to version ${formData.version + 1}`
          : `Created loan product ${formData.name}`
      };

      let res;
      if (isEditing && productToEdit) {
        res = await api.updateLoanProduct(productToEdit.id, payload);
      } else {
        res = await api.createLoanProduct(payload);
      }

      if (res.success && res.data) {
        onSaved(res.data);
        onClose();
      } else {
        throw new Error((res as any).error || (res as any).message || 'Failed to save loan product');
      }
    } catch (err: any) {
      console.error('Failed to save loan product:', err);
      setErrorMsg(err.message || 'Server error occurred while saving loan product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs = [
    { id: 'basic', label: '1. Basic Info', icon: CreditCard },
    { id: 'terms', label: '2. Amount & Terms', icon: DollarSign },
    { id: 'interest', label: '3. Interest & Payment', icon: Percent },
    { id: 'fees', label: '4. Fees & Penalties', icon: Tag },
    { id: 'requirements', label: '5. Requirements & Approval', icon: Shield },
    { id: 'accounting', label: '6. GL Accounting', icon: Layers },
    { id: 'dates', label: '7. Dates & Branch', icon: Calendar },
    { id: 'all', label: 'All 7 Sections', icon: ListFilter }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {isEditing ? `Version ${formData.version} (Will Bump to v${formData.version + 1})` : 'New Credit Facility'}
                </span>
                <span className="text-slate-500 text-xs">•</span>
                <span className="text-slate-400 text-xs font-mono">30 Database Columns</span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight mt-0.5">
                {isEditing ? `Edit Loan Product: ${productToEdit?.name}` : 'Create New Loan Product'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section Navigation Tabs */}
        <div className="px-6 bg-slate-950/90 border-b border-slate-800 flex items-center space-x-1 overflow-x-auto no-scrollbar py-2">
          {tabs.map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id as any)}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form id="loan-product-form" onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto space-y-6">
          {/* 1. BASIC INFORMATION */}
          {(activeTab === 'basic' || activeTab === 'all') && (
            <div className="space-y-4 bg-slate-950/40 p-4 rounded-2xl border border-slate-800/70">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span>Section 1: Basic Information</span>
                </h3>
                <span className="text-[11px] text-slate-400">id, code, name, description, version</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* ID (System-generated) */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    System Identifier <span className="text-slate-500 font-normal">(id)</span>
                  </label>
                  <input
                    type="text"
                    disabled
                    value={formData.id || '(System Generated upon Save)'}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-400 cursor-not-allowed"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Managed by backend system engine</span>
                </div>

                {/* Code */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Product Code <span className="text-emerald-400">*</span> <span className="text-slate-500 font-normal">(code)</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. LP-REG, LP-EMERG"
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500 uppercase"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Unique identification code</span>
                </div>

                {/* Version */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Version Number <span className="text-slate-500 font-normal">(version)</span>
                  </label>
                  <div className="flex items-center space-x-2">
                    <span className="bg-blue-500/10 text-blue-300 border border-blue-500/30 px-3 py-1.5 rounded-xl text-xs font-mono font-bold">
                      v{formData.version} {isEditing ? `→ v${formData.version + 1} on update` : '(Baseline)'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Protects historical loans with version snapshots</span>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Product Name <span className="text-emerald-400">*</span> <span className="text-slate-500 font-normal">(name)</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Regular Multi-Purpose Loan, Calamity Relief Micro-Loan"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Product Description <span className="text-slate-500 font-normal">(description)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Outline the purpose, member eligibility requirements, and guidelines for this credit facility..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* 2. LOAN AMOUNT AND TERMS */}
          {(activeTab === 'terms' || activeTab === 'all') && (
            <div className="space-y-4 bg-slate-950/40 p-4 rounded-2xl border border-slate-800/70">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>Section 2: Loan Amount and Terms</span>
                </h3>
                <span className="text-[11px] text-slate-400">min_amount, max_amount, min_term_months, max_term_months, default_term_months</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Min Amount */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Minimum Loan Amount (₱) <span className="text-emerald-400">*</span> <span className="text-slate-500 font-normal">(min_amount)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-mono text-slate-400">₱</span>
                    <input
                      type="number"
                      required
                      min={100}
                      step={500}
                      value={formData.min_amount}
                      onChange={e => setFormData({ ...formData, min_amount: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Minimum principal allowable per application</span>
                </div>

                {/* Max Amount */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Maximum Loan Amount (₱) <span className="text-emerald-400">*</span> <span className="text-slate-500 font-normal">(max_amount)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-mono text-slate-400">₱</span>
                    <input
                      type="number"
                      required
                      min={formData.min_amount || 100}
                      step={1000}
                      value={formData.max_amount}
                      onChange={e => setFormData({ ...formData, max_amount: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Credit ceiling per borrower for this product</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                {/* Min Term Months */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Min Term (Months) <span className="text-slate-500 font-normal">(min_term_months)</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={formData.min_term_months}
                    onChange={e => setFormData({ ...formData, min_term_months: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">e.g. 1 month</span>
                </div>

                {/* Max Term Months */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Max Term (Months) <span className="text-slate-500 font-normal">(max_term_months)</span>
                  </label>
                  <input
                    type="number"
                    min={formData.min_term_months || 1}
                    max={120}
                    value={formData.max_term_months}
                    onChange={e => setFormData({ ...formData, max_term_months: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">e.g. 24 or 36 months</span>
                </div>

                {/* Default Term Months */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Default Term (Months) <span className="text-slate-500 font-normal">(default_term_months)</span>
                  </label>
                  <input
                    type="number"
                    min={formData.min_term_months || 1}
                    max={formData.max_term_months || 120}
                    value={formData.default_term_months}
                    onChange={e => setFormData({ ...formData, default_term_months: parseInt(e.target.value) || 12 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Pre-filled default in loan application form</span>
                </div>
              </div>
            </div>
          )}

          {/* 3. INTEREST AND PAYMENT */}
          {(activeTab === 'interest' || activeTab === 'all') && (
            <div className="space-y-4 bg-slate-950/40 p-4 rounded-2xl border border-slate-800/70">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Percent className="w-4 h-4 text-emerald-400" />
                  <span>Section 3: Interest and Payment</span>
                </h3>
                <span className="text-[11px] text-slate-400">annual_interest_rate, interest_calculation_method, payment_frequency, grace_period_days</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Annual Interest Rate */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Annual Interest Rate (% p.a.) <span className="text-emerald-400">*</span> <span className="text-slate-500 font-normal">(annual_interest_rate)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={0}
                      step={0.01}
                      value={formData.annual_interest_rate}
                      onChange={e => setFormData({ ...formData, annual_interest_rate: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3 pr-8 py-2 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                    />
                    <span className="absolute right-3 top-2 text-xs font-mono text-slate-400">%</span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Nominal annual percentage rate</span>
                </div>

                {/* Interest Calculation Method */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Interest Calculation Method <span className="text-emerald-400">*</span> <span className="text-slate-500 font-normal">(interest_calculation_method)</span>
                  </label>
                  <select
                    value={formData.interest_calculation_method}
                    onChange={e => setFormData({ ...formData, interest_calculation_method: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Diminishing Balance">Diminishing Balance (Declining Principal)</option>
                    <option value="Flat Rate">Flat Rate (Fixed Total Interest on Original Principal)</option>
                    <option value="Equal Amortization">Equal Amortization (Fixed Monthly Installment)</option>
                    <option value="Simple Interest">Simple Interest (Seasonal / Single Repayment)</option>
                  </select>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Governs schedule amortization formula</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Payment Frequency */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Payment Frequency <span className="text-emerald-400">*</span> <span className="text-slate-500 font-normal">(payment_frequency)</span>
                  </label>
                  <select
                    value={formData.payment_frequency}
                    onChange={e => setFormData({ ...formData, payment_frequency: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Monthly">Monthly (12 installments/yr)</option>
                    <option value="Semi-monthly">Semi-monthly (24 installments/yr / 15th & 30th)</option>
                    <option value="Weekly">Weekly (52 installments/yr / Micro-credit)</option>
                    <option value="Quarterly">Quarterly (Seasonal Agri)</option>
                    <option value="Lump Sum">Lump Sum (Single Balloon Repayment at Maturity)</option>
                  </select>
                </div>

                {/* Grace Period Days */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Grace Period (Days) <span className="text-slate-500 font-normal">(grace_period_days)</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={90}
                    value={formData.grace_period_days}
                    onChange={e => setFormData({ ...formData, grace_period_days: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Days before late penalty applies after due date</span>
                </div>
              </div>
            </div>
          )}

          {/* 4. FEES AND PENALTIES */}
          {(activeTab === 'fees' || activeTab === 'all') && (
            <div className="space-y-4 bg-slate-950/40 p-4 rounded-2xl border border-slate-800/70">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Tag className="w-4 h-4 text-emerald-400" />
                  <span>Section 4: Fees and Penalties</span>
                </h3>
                <span className="text-[11px] text-slate-400">processing_fee_percentage, service_fee_fixed, other_fee, penalty_rule_id, penalty_rate_percentage</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Processing Fee Percentage */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Processing Fee (%) <span className="text-slate-500 font-normal">(processing_fee_percentage)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      max={100}
                      value={formData.processing_fee_percentage}
                      onChange={e => setFormData({ ...formData, processing_fee_percentage: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3 pr-8 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                    />
                    <span className="absolute right-3 top-2 text-xs font-mono text-slate-400">%</span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Deducted from disbursed net proceeds</span>
                </div>

                {/* Fixed Loan Services Fee */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Service Fee Fixed (₱) <span className="text-slate-500 font-normal">(service_fee_fixed)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-mono text-slate-400">₱</span>
                    <input
                      type="number"
                      min={0}
                      step={10}
                      value={formData.service_fee_fixed}
                      onChange={e => setFormData({ ...formData, service_fee_fixed: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Fixed documentation & service charge</span>
                </div>

                {/* Other Regulatory / Document Fee */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Other Fee (₱) <span className="text-slate-500 font-normal">(other_fee)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-mono text-slate-400">₱</span>
                    <input
                      type="number"
                      min={0}
                      step={10}
                      value={formData.other_fee}
                      onChange={e => setFormData({ ...formData, other_fee: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Notarial, insurance, or DST stamp fee</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Penalty Rate Percentage */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Penalty Rate (%) <span className="text-slate-500 font-normal">(penalty_rate_percentage)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      step={0.1}
                      max={100}
                      value={formData.penalty_rate_percentage}
                      onChange={e => setFormData({ ...formData, penalty_rate_percentage: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3 pr-8 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                    />
                    <span className="absolute right-3 top-2 text-xs font-mono text-slate-400">%</span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Default penalty percentage (default 2.00%)</span>
                </div>

                {/* Penalty Rule ID */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Penalty Rule <span className="text-slate-500 font-normal">(penalty_rule_id)</span>
                  </label>
                  <select
                    value={formData.penalty_rule_id}
                    onChange={e => setFormData({ ...formData, penalty_rule_id: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {penaltyRules.length > 0 ? (
                      penaltyRules.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.name || r.id} ({r.rate || r.penalty_rate || 2}%)
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="pen_standard">Standard Cooperative Penalty (2.0%)</option>
                        <option value="pen_lenient">Lenient Agri Penalty (1.0%)</option>
                        <option value="pen_strict">Commercial Micro Penalty (3.0%)</option>
                      </>
                    )}
                  </select>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Referenced from penalty_rules table</span>
                </div>
              </div>
            </div>
          )}

          {/* 5. REQUIREMENTS AND APPROVAL */}
          {(activeTab === 'requirements' || activeTab === 'all') && (
            <div className="space-y-4 bg-slate-950/40 p-4 rounded-2xl border border-slate-800/70">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>Section 5: Requirements and Approval</span>
                </h3>
                <span className="text-[11px] text-slate-400">collateral_required, guarantor_required, required_documents, approval_workflow_id</span>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex items-start space-x-3 p-3.5 bg-slate-950 rounded-2xl border border-slate-800 cursor-pointer hover:border-slate-700 transition">
                  <input
                    type="checkbox"
                    checked={formData.collateral_required}
                    onChange={e => setFormData({ ...formData, collateral_required: e.target.checked })}
                    className="mt-0.5 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">Collateral Required (collateral_required)</span>
                    <span className="text-[11px] text-slate-400">Borrower must pledge chattel, land, or deposit holdout</span>
                  </div>
                </label>

                <label className="flex items-start space-x-3 p-3.5 bg-slate-950 rounded-2xl border border-slate-800 cursor-pointer hover:border-slate-700 transition">
                  <input
                    type="checkbox"
                    checked={formData.guarantor_required}
                    onChange={e => setFormData({ ...formData, guarantor_required: e.target.checked })}
                    className="mt-0.5 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">Guarantor Required (guarantor_required)</span>
                    <span className="text-[11px] text-slate-400">Requires co-signature by eligible cooperative member</span>
                  </div>
                </label>
              </div>

              {/* Approval Workflow */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Approval Workflow <span className="text-slate-500 font-normal">(approval_workflow_id)</span>
                </label>
                <select
                  value={formData.approval_workflow_id}
                  onChange={e => setFormData({ ...formData, approval_workflow_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {workflows.length > 0 ? (
                    workflows.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.module || 'Loans'})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="wf_loan_standard">Standard Loan Approval Matrix (Tiered Officer - Board)</option>
                      <option value="wf_loan_express">Express Micro-Credit Approval (Credit Officer Only)</option>
                    </>
                  )}
                </select>
                <span className="text-[10px] text-slate-500 mt-0.5 block">Controls credit committee and board approval thresholds</span>
              </div>

              {/* Required Documents (Stored as JSON array) */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-semibold text-slate-300 block">
                  Required Documents Checklist <span className="text-slate-500 font-normal">(required_documents, JSON array)</span>
                </label>

                {/* Selected Documents */}
                <div className="flex flex-wrap gap-2 p-3 bg-slate-950 rounded-2xl border border-slate-800 min-h-[50px] items-center">
                  {formData.required_documents.map((doc, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-medium"
                    >
                      <FileText className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{doc}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDocument(doc)}
                        className="text-emerald-400/60 hover:text-rose-400 transition ml-1 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {formData.required_documents.length === 0 && (
                    <span className="text-xs text-slate-500 italic">No required documents added yet.</span>
                  )}
                </div>

                {/* Add Custom Document */}
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Type custom required document name..."
                    value={newDocInput}
                    onChange={e => setNewDocInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddDocument(newDocInput);
                      }
                    }}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddDocument(newDocInput)}
                    className="flex items-center space-x-1 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold cursor-pointer transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Document</span>
                  </button>
                </div>

                {/* Presets */}
                <div className="pt-1">
                  <span className="text-[10px] text-slate-400 block mb-1">Click to quick-add standard cooperative document requirements:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {COMMON_DOCUMENT_PRESETS.map((preset, idx) => {
                      const isAdded = formData.required_documents.includes(preset);
                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={isAdded}
                          onClick={() => handleAddDocument(preset)}
                          className={`text-[11px] px-2 py-0.5 rounded-lg border transition cursor-pointer ${
                            isAdded
                              ? 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
                              : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-emerald-500/40 hover:text-white'
                          }`}
                        >
                          + {preset}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 6. ACCOUNTING AND FUNDING */}
          {(activeTab === 'accounting' || activeTab === 'all') && (
            <div className="space-y-4 bg-slate-950/40 p-4 rounded-2xl border border-slate-800/70">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <span>Section 6: Accounting and Funding</span>
                </h3>
                <span className="text-[11px] text-slate-400">debit_account_id, gl_receivable_account_id, gl_interest_income_account_id</span>
              </div>

              <div className="space-y-4">
                {/* GL Receivable Account */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    GL Loan Receivable Account <span className="text-emerald-400">*</span> <span className="text-slate-500 font-normal">(gl_receivable_account_id)</span>
                  </label>
                  <select
                    required
                    value={formData.gl_receivable_account_id}
                    onChange={e => setFormData({ ...formData, gl_receivable_account_id: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {receivableAccounts.length > 0 ? (
                      receivableAccounts.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.code || a.account_code} - {a.name} ({a.type || a.category || 'Asset'})
                        </option>
                      ))
                    ) : (
                      availableAccounts.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.code || a.account_code} - {a.name} ({a.type || a.category})
                        </option>
                      ))
                    )}
                  </select>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Asset account debited upon loan release and credited on principal payments</span>
                </div>

                {/* GL Interest Income Account */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    GL Interest Income Account <span className="text-emerald-400">*</span> <span className="text-slate-500 font-normal">(gl_interest_income_account_id)</span>
                  </label>
                  <select
                    required
                    value={formData.gl_interest_income_account_id}
                    onChange={e => setFormData({ ...formData, gl_interest_income_account_id: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {interestIncomeAccounts.length > 0 ? (
                      interestIncomeAccounts.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.code || a.account_code} - {a.name} ({a.type || a.category || 'Revenue'})
                        </option>
                      ))
                    ) : (
                      availableAccounts.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.code || a.account_code} - {a.name} ({a.type || a.category})
                        </option>
                      ))
                    )}
                  </select>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Revenue account credited when members make scheduled interest payments</span>
                </div>

                {/* Disbursement Account */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Disbursement Debit Account <span className="text-slate-500 font-normal">(debit_account_id)</span>
                  </label>
                  <select
                    value={formData.debit_account_id}
                    onChange={e => setFormData({ ...formData, debit_account_id: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {disbursementAccounts.length > 0 ? (
                      disbursementAccounts.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.code || a.account_code} - {a.name}
                        </option>
                      ))
                    ) : (
                      availableAccounts.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.code || a.account_code} - {a.name}
                        </option>
                      ))
                    )}
                  </select>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Disbursement funding account credited upon releasing loan cash</span>
                </div>
              </div>
            </div>
          )}

          {/* 7. EFFECTIVE DATES AND STATUS */}
          {(activeTab === 'dates' || activeTab === 'all') && (
            <div className="space-y-4 bg-slate-950/40 p-4 rounded-2xl border border-slate-800/70">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <span>Section 7: Effective Dates and Status</span>
                </h3>
                <span className="text-[11px] text-slate-400">effective_from, effective_until, active, branch_id</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Effective From */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Effective From Date <span className="text-slate-500 font-normal">(effective_from)</span>
                  </label>
                  <input
                    type="date"
                    value={formData.effective_from}
                    onChange={e => setFormData({ ...formData, effective_from: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Date loan product becomes available for applications</span>
                </div>

                {/* Effective Until */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Effective Until Date <span className="text-slate-500 font-normal">(effective_until, optional)</span>
                  </label>
                  <input
                    type="date"
                    value={formData.effective_until}
                    onChange={e => setFormData({ ...formData, effective_until: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Leave empty for indefinite / permanent credit facilities</span>
                </div>
              </div>

              {/* Branch Isolation / Assignment */}
              <div className="pt-2">
                <label className="text-xs font-semibold text-slate-300 block mb-1 flex items-center space-x-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Authorized Branch Scope <span className="text-slate-500 font-normal">(branch_id)</span></span>
                </label>
                <select
                  disabled={!currentUser.is_super_admin && currentUser.role_id !== 'role_superadmin' && Boolean(currentUser.branch_id)}
                  value={formData.branch_id || 'all'}
                  onChange={e => setFormData({ ...formData, branch_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer disabled:opacity-60"
                >
                  <option value="all">🌐 All Branches (Cooperative-wide Credit Facility)</option>
                  {availableBranches.map(b => (
                    <option key={b.id} value={b.id}>
                      🏢 {b.name} ({b.code})
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-500 mt-0.5 block">Restrict this product to a specific branch or make available across the network</span>
              </div>

              {/* Active Toggle */}
              <div className="pt-2">
                <label className="flex items-start space-x-3 p-4 bg-slate-950 rounded-2xl border border-slate-800 cursor-pointer hover:border-slate-700 transition">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={e => setFormData({ ...formData, active: e.target.checked })}
                    className="mt-0.5 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">Product Active (active)</span>
                    <span className="text-[11px] text-slate-400">
                      When checked, members and staff can originate loans under this product. When unchecked, product is disabled for new loans.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}
        </form>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {activeTab !== 'all' ? (
              <span className="text-xs text-slate-500">
                Section {tabs.findIndex(t => t.id === activeTab) + 1} of 7
              </span>
            ) : (
              <span className="text-xs text-emerald-400 font-semibold">
                Viewing all 7 sections (30 columns)
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
            >
              Cancel
            </button>

            {/* Previous tab button */}
            {activeTab !== 'basic' && activeTab !== 'all' && (
              <button
                type="button"
                onClick={() => {
                  const idx = tabs.findIndex(t => t.id === activeTab);
                  if (idx > 0) setActiveTab(tabs[idx - 1].id as any);
                }}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
            )}

            {/* Next tab button */}
            {activeTab !== 'dates' && activeTab !== 'all' && (
              <button
                type="button"
                onClick={() => {
                  const idx = tabs.findIndex(t => t.id === activeTab);
                  if (idx < 6) setActiveTab(tabs[idx + 1].id as any);
                }}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-emerald-400 hover:bg-slate-800/80 transition cursor-pointer"
              >
                <span>Next Section</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-semibold shadow transition cursor-pointer ${
                isSubmitting
                  ? 'bg-emerald-700 text-emerald-200 cursor-wait'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isEditing ? 'Save Changes & Bump Version' : 'Create Loan Product'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
