import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Building2,
  DollarSign,
  AlertCircle,
  Eye,
  Check,
  X,
  CreditCard,
  User as UserIcon,
  Calendar,
  Layers,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { api } from '../../services/api';
import { Branch, CashAccount, LoanApplication, LoanProduct, Member, User } from '../../types';

interface LoanApplicationsViewProps {
  branches: Branch[];
  loanProducts: LoanProduct[];
  cashAccounts: CashAccount[];
  currentUser: User;
  selectedBranchId?: string;
  onSelectBranch?: (id: string) => void;
  onLoanOriginated?: () => void;
  onSwitchToActiveLoans?: () => void;
}

export const LoanApplicationsView: React.FC<LoanApplicationsViewProps> = ({
  branches = [],
  loanProducts = [],
  cashAccounts = [],
  currentUser,
  selectedBranchId,
  onSelectBranch,
  onLoanOriginated,
  onSwitchToActiveLoans
}) => {
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState(selectedBranchId || 'all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  // Modals state
  const [isNewAppModalOpen, setIsNewAppModalOpen] = useState(false);
  const [selectedAppForApprove, setSelectedAppForApprove] = useState<LoanApplication | null>(null);
  const [selectedAppForReject, setSelectedAppForReject] = useState<LoanApplication | null>(null);
  const [selectedAppForOriginate, setSelectedAppForOriginate] = useState<LoanApplication | null>(null);
  const [selectedAppForDetails, setSelectedAppForDetails] = useState<LoanApplication | null>(null);

  // Forms state
  const [newAppForm, setNewAppForm] = useState({
    member_id: '',
    loan_product_id: '',
    branch_id: '',
    applied_amount: 30000,
    term_months: 12,
    purpose: ''
  });
  const [approveForm, setApproveForm] = useState({
    approved_amount: 0,
    reviewed_by: '',
    reviewed_date: new Date().toISOString().split('T')[0],
    remarks: ''
  });
  const [rejectForm, setRejectForm] = useState({
    reviewed_by: '',
    remarks: ''
  });
  const [originateForm, setOriginateForm] = useState({
    cash_account_id: '',
    disbursement_date: new Date().toISOString().split('T')[0],
    first_due_date: '',
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 5000);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [appRes, memRes] = await Promise.all([
        api.getLoanApplications(),
        api.getMembers()
      ]);
      setApplications(Array.isArray(appRes.data) ? appRes.data : []);
      setMembers(Array.isArray(memRes.data) ? memRes.data : []);
    } catch (err) {
      console.error('Failed to load loan applications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedBranchId !== undefined) {
      setSelectedBranch(selectedBranchId);
    }
  }, [selectedBranchId]);

  // Sync new app form defaults
  useEffect(() => {
    if (loanProducts.length > 0 && !newAppForm.loan_product_id) {
      const defaultProd = loanProducts.find(p => p.active) || loanProducts[0];
      setNewAppForm(prev => ({
        ...prev,
        loan_product_id: defaultProd.id,
        term_months: defaultProd.default_term_months || 12,
        applied_amount: defaultProd.min_amount || 30000
      }));
    }
  }, [loanProducts]);

  useEffect(() => {
    if (members.length > 0 && !newAppForm.member_id) {
      setNewAppForm(prev => ({
        ...prev,
        member_id: members[0].id,
        branch_id: members[0].branch_id || branches[0]?.id || ''
      }));
    }
  }, [members, branches]);

  // When opening approve modal
  const handleOpenApproveModal = (app: LoanApplication) => {
    setSelectedAppForApprove(app);
    setApproveForm({
      approved_amount: Number(app.applied_amount || 0),
      reviewed_by: currentUser.name || 'Credit Committee',
      reviewed_date: new Date().toISOString().split('T')[0],
      remarks: 'Approved by Credit Committee after collateral & capacity assessment.'
    });
    setFormError(null);
  };

  // When opening reject modal
  const handleOpenRejectModal = (app: LoanApplication) => {
    setSelectedAppForReject(app);
    setRejectForm({
      reviewed_by: currentUser.name || 'Credit Committee',
      remarks: ''
    });
    setFormError(null);
  };

  // When opening originate modal
  const handleOpenOriginateModal = (app: LoanApplication) => {
    setSelectedAppForOriginate(app);
    const today = new Date();
    const firstDue = new Date(today);
    firstDue.setMonth(firstDue.getMonth() + 1);

    // Pick cash account matching app branch or first cash account
    const appBranch = app.branch_id;
    const defaultCash = cashAccounts.find(c => c.branch_id === appBranch) || cashAccounts[0];

    setOriginateForm({
      cash_account_id: defaultCash ? defaultCash.id : '',
      disbursement_date: today.toISOString().split('T')[0],
      first_due_date: firstDue.toISOString().split('T')[0],
      notes: `Originated from approved application ${app.application_no}`
    });
    setFormError(null);
  };

  // Submit Approval
  const handleSubmitApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppForApprove) return;
    if (approveForm.approved_amount <= 0) {
      setFormError('Approved amount must be greater than zero.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      const res = await api.approveLoanApplication({
        application_id: selectedAppForApprove.id,
        approved_amount: approveForm.approved_amount,
        reviewed_by: approveForm.reviewed_by,
        reviewed_date: approveForm.reviewed_date,
        remarks: approveForm.remarks,
        performed_by: currentUser.name || 'Credit Committee'
      });

      if (res.data?.success === false) {
        setFormError(res.data.error || 'Failed to approve application.');
        return;
      }

      showNotice(`Loan Application ${selectedAppForApprove.application_no} has been APPROVED for ₱${Number(approveForm.approved_amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}.`);
      setSelectedAppForApprove(null);
      await loadData();
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data?.error || err.message || 'Approval failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Rejection
  const handleSubmitReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppForReject) return;
    if (!rejectForm.remarks.trim()) {
      setFormError('Rejection remarks/reason are required for compliance.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      const res = await api.rejectLoanApplication({
        application_id: selectedAppForReject.id,
        reviewed_by: rejectForm.reviewed_by,
        remarks: rejectForm.remarks
      });

      if (res.data?.success === false) {
        setFormError(res.data.error || 'Failed to reject application.');
        return;
      }

      showNotice(`Loan Application ${selectedAppForReject.application_no} was rejected.`);
      setSelectedAppForReject(null);
      await loadData();
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data?.error || err.message || 'Rejection failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Origination (Approved Application -> Loans Table)
  const handleSubmitOriginate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppForOriginate) return;
    if (!originateForm.cash_account_id) {
      setFormError('Disbursement cash account is required.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      const res = await api.originateApprovedLoan({
        application_id: selectedAppForOriginate.id,
        cash_account_id: originateForm.cash_account_id,
        disbursement_date: originateForm.disbursement_date,
        first_due_date: originateForm.first_due_date
      });

      if (res.data?.success === false) {
        setFormError(res.data.error || 'Failed to originate loan.');
        return;
      }

      const disbursedLoanNo = res.data?.data?.loan_account_no || 'New Loan';
      showNotice(`Success! Application ${selectedAppForOriginate.application_no} has been disbursed and originated as active loan account: ${disbursedLoanNo}.`);
      setSelectedAppForOriginate(null);
      await loadData();

      if (onLoanOriginated) {
        onLoanOriginated();
      }
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data?.error || err.message || 'Origination failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit New Loan Application
  const handleSubmitNewApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppForm.member_id || !newAppForm.loan_product_id) {
      setFormError('Please select both a member and a loan product.');
      return;
    }
    if (newAppForm.applied_amount <= 0) {
      setFormError('Applied amount must be greater than zero.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      const res = await api.applyLoanApplication({
        member_id: newAppForm.member_id,
        loan_product_id: newAppForm.loan_product_id,
        branch_id: newAppForm.branch_id || selectedBranch !== 'all' ? selectedBranch : undefined,
        applied_amount: Number(newAppForm.applied_amount),
        term_months: Number(newAppForm.term_months),
        purpose: newAppForm.purpose
      });

      if (res.data?.success === false) {
        setFormError(res.data.error || 'Failed to submit loan application.');
        return;
      }

      const appNo = res.data?.data?.application_no || 'New Application';
      showNotice(`Loan application ${appNo} submitted successfully. Status is now PENDING Credit Committee review.`);
      setIsNewAppModalOpen(false);
      setNewAppForm({
        member_id: members[0]?.id || '',
        loan_product_id: loanProducts[0]?.id || '',
        branch_id: '',
        applied_amount: 30000,
        term_months: 12,
        purpose: ''
      });
      await loadData();
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data?.error || err.message || 'Submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered applications
  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      // Branch filter
      if (selectedBranch !== 'all' && app.branch_id && app.branch_id !== selectedBranch) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        if (app.status?.toLowerCase() !== statusFilter.toLowerCase()) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const appNoMatch = app.application_no?.toLowerCase().includes(q);
        const nameMatch = app.member_name?.toLowerCase().includes(q);
        const memberNoMatch = app.member_no?.toLowerCase().includes(q);
        const prodMatch = (app.product_name || app.loan_product_name)?.toLowerCase().includes(q);
        const purposeMatch = app.purpose?.toLowerCase().includes(q);
        return appNoMatch || nameMatch || memberNoMatch || prodMatch || purposeMatch;
      }

      return true;
    });
  }, [applications, selectedBranch, statusFilter, searchQuery]);

  // Metrics summary
  const metrics = useMemo(() => {
    const total = applications.length;
    const pending = applications.filter(a => a.status === 'Pending').length;
    const approved = applications.filter(a => a.status === 'Approved').length;
    const released = applications.filter(a => a.status === 'Released').length;
    const rejected = applications.filter(a => a.status === 'Rejected').length;
    const totalPendingVolume = applications
      .filter(a => a.status === 'Pending')
      .reduce((sum, a) => sum + Number(a.applied_amount || 0), 0);

    return { total, pending, approved, released, rejected, totalPendingVolume };
  }, [applications]);

  // Product calculation helpers for modals
  const selectedProductForOriginate = useMemo(() => {
    if (!selectedAppForOriginate) return null;
    return loanProducts.find(p => p.id === selectedAppForOriginate.loan_product_id);
  }, [selectedAppForOriginate, loanProducts]);

  const originateCalculations = useMemo(() => {
    if (!selectedAppForOriginate || !selectedProductForOriginate) return null;
    const principal = Number(selectedAppForOriginate.approved_amount || selectedAppForOriginate.applied_amount || 0);
    const procRate = Number(selectedProductForOriginate.processing_fee_percentage || 0);
    const procFee = Number(((principal * procRate) / 100).toFixed(2));
    const servFee = Number(selectedProductForOriginate.service_fee_fixed || 0);
    const netDisbursed = Math.max(0, principal - procFee - servFee);
    const interestRate = Number(selectedProductForOriginate.annual_interest_rate || 12);
    const termMonths = Number(selectedAppForOriginate.term_months || 12);

    // Simple schedule estimate preview
    const monthlyRate = interestRate / 100 / 12;
    const monthlyPrincipal = principal / termMonths;
    const firstMonthInterest = principal * monthlyRate;
    const estimatedMonthly = monthlyPrincipal + firstMonthInterest;

    return {
      principal,
      procFee,
      servFee,
      netDisbursed,
      interestRate,
      termMonths,
      estimatedMonthly
    };
  }, [selectedAppForOriginate, selectedProductForOriginate]);

  // Format currency
  const formatPHP = (val: number | string | null | undefined) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(val) || 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Credit Approval Workflow</span>
            <span>•</span>
            <span className="text-slate-400">Application Pipeline</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1 flex items-center gap-2">
            Loan Applications & Approvals
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Review submitted loan applications, conduct Credit Committee evaluations, issue approvals, and originate approved applications into active loan accounts with automated GL vouchers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Branch filter */}
          <div className="flex items-center space-x-1.5 bg-slate-950 px-2.5 py-2 rounded-xl border border-slate-800 text-xs">
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            <select
              value={selectedBranch}
              onChange={e => {
                setSelectedBranch(e.target.value);
                if (onSelectBranch) onSelectBranch(e.target.value);
              }}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer pr-1"
            >
              <option value="all" className="bg-slate-900 text-white">All Branches</option>
              {branches.map(b => (
                <option key={b.id} value={b.id} className="bg-slate-900 text-white">
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer"
            title="Refresh applications list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            <span>Refresh</span>
          </button>
{/* 
          <button
            id="btn-new-loan-application"
            onClick={() => {
              setFormError(null);
              setIsNewAppModalOpen(true);
            }}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Loan Application</span>
          </button> */}
        </div>
      </div>

      {notice && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 rounded-xl text-xs font-semibold flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
          <span>{notice}</span>
        </div>
      )}

      {/* Pipeline KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div
          onClick={() => setStatusFilter('all')}
          className={`bg-slate-900 border rounded-xl p-4 shadow cursor-pointer transition ${
            statusFilter === 'all' ? 'border-emerald-500/60 ring-1 ring-emerald-500/30' : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-300" />
            <span>Total Applications</span>
          </div>
          <div className="text-xl font-bold text-white mt-1">{metrics.total}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">All time pipeline</div>
        </div>

        <div
          onClick={() => setStatusFilter('Pending')}
          className={`bg-slate-900 border rounded-xl p-4 shadow cursor-pointer transition ${
            statusFilter === 'Pending' ? 'border-amber-500/60 ring-1 ring-amber-500/30' : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="text-[11px] font-medium text-amber-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Pending Review</span>
          </div>
          <div className="text-xl font-bold text-amber-400 mt-1">{metrics.pending}</div>
          <div className="text-[10px] text-amber-500/80 mt-0.5">
            Vol: {formatPHP(metrics.totalPendingVolume)}
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('Approved')}
          className={`bg-slate-900 border rounded-xl p-4 shadow cursor-pointer transition ${
            statusFilter === 'Approved' ? 'border-blue-500/60 ring-1 ring-blue-500/30' : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="text-[11px] font-medium text-blue-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Approved (Awaiting Release)</span>
          </div>
          <div className="text-xl font-bold text-blue-400 mt-1">{metrics.approved}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Ready for origination</div>
        </div>

        <div
          onClick={() => setStatusFilter('Released')}
          className={`bg-slate-900 border rounded-xl p-4 shadow cursor-pointer transition ${
            statusFilter === 'Released' ? 'border-purple-500/60 ring-1 ring-purple-500/30' : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="text-[11px] font-medium text-purple-400 flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-purple-400" />
            <span>Released / Active</span>
          </div>
          <div className="text-xl font-bold text-purple-400 mt-1">{metrics.released}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Disbursed to loans table</div>
        </div>

        <div
          onClick={() => setStatusFilter('Rejected')}
          className={`bg-slate-900 border rounded-xl p-4 shadow cursor-pointer transition col-span-2 md:col-span-1 ${
            statusFilter === 'Rejected' ? 'border-rose-500/60 ring-1 ring-rose-500/30' : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="text-[11px] font-medium text-rose-400 flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>Rejected</span>
          </div>
          <div className="text-xl font-bold text-rose-400 mt-1">{metrics.rejected}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Committee declined</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Status Tabs */}
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs overflow-x-auto">
            {['all', 'Pending', 'Approved', 'Released', 'Rejected'].map(status => {
              const count = status === 'all'
                ? applications.length
                : applications.filter(a => a.status?.toLowerCase() === status.toLowerCase()).length;
              const isActive = statusFilter.toLowerCase() === status.toLowerCase();

              return (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span>{status === 'all' ? 'All Applications' : status}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isActive ? 'bg-emerald-700 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by application #, borrower name, member #, or purpose..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Loan Applications Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4 w-[140px]">App No.</th>
                <th className="py-3 px-4 w-[210px]">Borrower / Member</th>
                <th className="py-3 px-4 w-[180px]">Loan Product</th>
                <th className="py-3 px-4 w-[130px] text-right">Applied (₱)</th>
                <th className="py-3 px-4 w-[100px] text-center">Term</th>
                <th className="py-3 px-4 w-[220px]">Purpose</th>
                <th className="py-3 px-4 w-[120px] text-center">Status</th>
                <th className="py-3 px-4 w-[130px]">Submitted Date</th>
                <th className="py-3 px-4 w-[220px] text-center">Workflow Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-500 mb-2" />
                    <span>Loading loan applications pipeline...</span>
                  </td>
                </tr>
              ) : filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <p className="text-sm font-semibold text-slate-300">No loan applications found.</p>
                    <p className="text-xs text-slate-500 mt-1">Submit a new application or adjust status filters.</p>
                  </td>
                </tr>
              ) : (
                filteredApplications.map(app => {
                  const status = app.status || 'Pending';
                  const prodName = app.product_name || app.loan_product_name || 'Regular Loan';

                  return (
                    <tr
                      key={app.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Application No */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30 text-[11px]">
                          {app.application_no}
                        </span>
                      </td>

                      {/* Borrower */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{app.member_name || 'Coop Member'}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{app.member_no}</div>
                      </td>

                      {/* Product */}
                      <td className="py-3 px-4">
                        <div className="text-slate-200 font-medium">{prodName}</div>
                        <div className="text-[10px] text-slate-500">{app.branch_name || 'Main Branch'}</div>
                      </td>

                      {/* Applied Amount */}
                      <td className="py-3 px-4 text-right font-mono font-semibold text-white whitespace-nowrap">
                        {formatPHP(app.applied_amount)}
                        {app.approved_amount && app.status === 'Approved' && (
                          <div className="text-[10px] text-blue-400 font-normal">
                            Apprv: {formatPHP(app.approved_amount)}
                          </div>
                        )}
                      </td>

                      {/* Term */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-300 font-medium">
                          {app.term_months} mos
                        </span>
                      </td>

                      {/* Purpose */}
                      <td className="py-3 px-4 text-slate-300 text-xs">
                        <div className="line-clamp-2" title={app.purpose}>
                          {app.purpose || 'General personal & agricultural requirements'}
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          status === 'Pending'
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            : status === 'Approved'
                            ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                            : status === 'Released'
                            ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                            : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                        }`}>
                          {status}
                        </span>
                      </td>

                      {/* Submitted Date */}
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                        <div>{app.submitted_date || (app.created_at ? new Date(app.created_at).toLocaleDateString('en-PH') : 'Recent')}</div>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1.5">
                          {status === 'Pending' && (
                            <>
                              <button
                                id={`btn-approve-app-${app.id}`}
                                onClick={() => handleOpenApproveModal(app)}
                                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow transition flex items-center space-x-1"
                                title="Approve application"
                              >
                                <Check className="w-3 h-3" />
                                <span>Approve</span>
                              </button>

                              <button
                                id={`btn-reject-app-${app.id}`}
                                onClick={() => handleOpenRejectModal(app)}
                                className="px-2.5 py-1 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-xs font-semibold cursor-pointer shadow transition flex items-center space-x-1"
                                title="Reject application"
                              >
                                <X className="w-3 h-3" />
                                <span>Reject</span>
                              </button>
                            </>
                          )}

                          {status === 'Approved' && (
                            <button
                              id={`btn-originate-app-${app.id}`}
                              onClick={() => handleOpenOriginateModal(app)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer shadow transition flex items-center space-x-1 animate-pulse"
                              title="Originate and disburse approved loan into loans table"
                            >
                              <CreditCard className="w-3 h-3" />
                              <span>Originate & Disburse</span>
                            </button>
                          )}

                          {status === 'Released' && (
                            <button
                              onClick={() => {
                                if (onSwitchToActiveLoans) {
                                  onSwitchToActiveLoans();
                                } else {
                                  setSelectedAppForDetails(app);
                                }
                              }}
                              className="px-2.5 py-1 bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-500/40 rounded-lg text-[11px] font-semibold cursor-pointer transition flex items-center space-x-1"
                              title="Loan is active in loans ledger"
                            >
                              <span>Active Loan</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedAppForDetails(app)}
                            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition cursor-pointer"
                            title="View details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: New Loan Application */}
      {isNewAppModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Submit New Loan Application</h3>
                <p className="text-xs text-slate-400">
                  Register member loan application into the Credit Committee queue
                </p>
              </div>
              <button
                onClick={() => setIsNewAppModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitNewApplication} className="space-y-4 text-xs">
              {/* Member Selection */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Applicant / Cooperative Member <span className="text-emerald-400">*</span>
                </label>
                <select
                  required
                  value={newAppForm.member_id}
                  onChange={e => {
                    const mem = members.find(m => m.id === e.target.value);
                    setNewAppForm({
                      ...newAppForm,
                      member_id: e.target.value,
                      branch_id: mem?.branch_id || newAppForm.branch_id
                    });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="">Select Borrower...</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.member_no} - {m.first_name} {m.last_name} ({m.membership_type || 'Regular'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Loan Product Selection */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Loan Product <span className="text-emerald-400">*</span>
                </label>
                <select
                  required
                  value={newAppForm.loan_product_id}
                  onChange={e => {
                    const prod = loanProducts.find(p => p.id === e.target.value);
                    setNewAppForm({
                      ...newAppForm,
                      loan_product_id: e.target.value,
                      term_months: prod?.default_term_months || newAppForm.term_months,
                      applied_amount: prod?.min_amount || newAppForm.applied_amount
                    });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                >
                  {loanProducts.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code}) — {p.annual_interest_rate}% APR, {p.interest_calculation_method}
                    </option>
                  ))}
                </select>
              </div>

              {/* Applied Amount and Term */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Applied Principal Amount (₱) <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="500"
                    required
                    value={newAppForm.applied_amount}
                    onChange={e => setNewAppForm({ ...newAppForm, applied_amount: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Repayment Term (Months) <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    required
                    value={newAppForm.term_months}
                    onChange={e => setNewAppForm({ ...newAppForm, term_months: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              {/* Purpose */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Loan Purpose / Use of Proceeds <span className="text-emerald-400">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Specify business or personal purpose (e.g. Rice harvesting fertilizer, sari-sari store expansion, medical assistance)..."
                  value={newAppForm.purpose}
                  onChange={e => setNewAppForm({ ...newAppForm, purpose: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              {/* Live Calculator Preview */}
              {(() => {
                const prod = loanProducts.find(p => p.id === newAppForm.loan_product_id);
                if (!prod) return null;
                const apr = Number(prod.annual_interest_rate || 12);
                const principal = Number(newAppForm.applied_amount || 0);
                const term = Number(newAppForm.term_months || 12);
                const estInterest = (principal * (apr / 100) * (term / 12));
                const estTotal = principal + estInterest;
                const estMonthly = term > 0 ? estTotal / term : 0;

                return (
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Estimated Amortization Preview</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500 text-[10px]">Contract Rate</span>
                        <div className="font-semibold text-white">{apr}% APR</div>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px]">Total Est. Interest</span>
                        <div className="font-semibold text-emerald-400">{formatPHP(estInterest)}</div>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px]">Approx. Monthly</span>
                        <div className="font-bold text-white">{formatPHP(estMonthly)}/mo</div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewAppModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold shadow transition cursor-pointer flex items-center space-x-1.5"
                >
                  {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Submit Application</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Approve Application */}
      {selectedAppForApprove && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-base font-bold text-white">Approve Loan Application</h3>
                  <p className="text-xs text-slate-400">Credit Committee assessment and formal approval</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAppForApprove(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                <div>
                  <span className="font-mono text-emerald-400 font-bold">{selectedAppForApprove.application_no}</span>
                  <div className="text-slate-200 font-semibold">{selectedAppForApprove.member_name}</div>
                </div>
                <div className="text-right">
                  <div className="text-slate-400">Requested Amount</div>
                  <div className="font-mono text-white font-bold">{formatPHP(selectedAppForApprove.applied_amount)}</div>
                </div>
              </div>
              <div className="text-slate-400 text-[11px]">
                <span className="text-slate-500">Purpose: </span>{selectedAppForApprove.purpose}
              </div>
            </div>

            <form onSubmit={handleSubmitApprove} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Approved Principal Amount (₱) <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="number"
                  min="1000"
                  step="500"
                  required
                  value={approveForm.approved_amount}
                  onChange={e => setApproveForm({ ...approveForm, approved_amount: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold text-sm focus:outline-none focus:border-indigo-500/60"
                />
                <span className="text-[10px] text-slate-500">
                  Credit committee may approve equal to or lower than the applied amount.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Approval Date</label>
                  <input
                    type="date"
                    required
                    value={approveForm.reviewed_date}
                    onChange={e => setApproveForm({ ...approveForm, reviewed_date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500/60"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Approved By / Committee</label>
                  <input
                    type="text"
                    required
                    value={approveForm.reviewed_by}
                    onChange={e => setApproveForm({ ...approveForm, reviewed_by: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500/60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Committee Remarks / Resolution</label>
                <textarea
                  rows={2}
                  value={approveForm.remarks}
                  onChange={e => setApproveForm({ ...approveForm, remarks: e.target.value })}
                  placeholder="Notes on collateral, CBU pledge, co-maker assessment..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60"
                />
              </div>

              <div className="p-3 bg-indigo-950/20 border border-indigo-500/30 rounded-xl text-indigo-300 text-[11px]">
                Upon approval, status will transition to <strong className="text-white">Approved</strong>. Authorized disbursing officers can then originate the loan into active accounts.
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedAppForApprove(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow transition cursor-pointer flex items-center space-x-1.5"
                >
                  {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm Approval</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reject Application */}
      {selectedAppForReject && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <XCircle className="w-5 h-5 text-rose-400" />
                <div>
                  <h3 className="text-base font-bold text-white">Reject Loan Application</h3>
                  <p className="text-xs text-slate-400">Record committee rejection for compliance</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAppForReject(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 text-xs">
              <div className="font-semibold text-white">{selectedAppForReject.member_name}</div>
              <div className="text-slate-400">
                Application: <span className="font-mono text-slate-200">{selectedAppForReject.application_no}</span> ({formatPHP(selectedAppForReject.applied_amount)})
              </div>
            </div>

            <form onSubmit={handleSubmitReject} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Reviewing Officer / Committee</label>
                <input
                  type="text"
                  required
                  value={rejectForm.reviewed_by}
                  onChange={e => setRejectForm({ ...rejectForm, reviewed_by: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500/60"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Reason for Rejection <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Specify reason (e.g. Insufficient repayment capacity, delinquency on co-maker obligation, incomplete documentation)..."
                  value={rejectForm.remarks}
                  onChange={e => setRejectForm({ ...rejectForm, remarks: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/60"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedAppForReject(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-semibold shadow transition cursor-pointer flex items-center space-x-1.5"
                >
                  {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm Rejection</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Originate & Disburse Approved Loan Application into Loans Table */}
      {selectedAppForOriginate && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-base font-bold text-white">Originate & Disburse Approved Loan</h3>
                  <p className="text-xs text-slate-400">
                    Disburses funds, creates active account in loans table, and generates amortization schedule
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAppForOriginate(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Approved Application Summary Box */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Application No</span>
                  <div className="font-mono text-emerald-400 font-bold">{selectedAppForOriginate.application_no}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Borrower</span>
                  <div className="font-semibold text-white">{selectedAppForOriginate.member_name}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{selectedAppForOriginate.member_no}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Product</span>
                  <div className="font-semibold text-slate-200">
                    {selectedAppForOriginate.product_name || selectedAppForOriginate.loan_product_name}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Approved Principal</span>
                  <div className="font-mono text-emerald-400 font-bold text-sm">
                    {formatPHP(selectedAppForOriginate.approved_amount || selectedAppForOriginate.applied_amount)}
                  </div>
                </div>
              </div>

              {selectedAppForOriginate.remarks && (
                <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                  <span className="text-slate-500 font-medium">Approval Resolution: </span>
                  {selectedAppForOriginate.remarks}
                </div>
              )}
            </div>

            <form onSubmit={handleSubmitOriginate} className="space-y-4 text-xs">
              {/* Cash Account Selection */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Disburse From Cash / Vault Account <span className="text-emerald-400">*</span>
                </label>
                <select
                  required
                  value={originateForm.cash_account_id}
                  onChange={e => setOriginateForm({ ...originateForm, cash_account_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="">Select Cash Account...</option>
                  {cashAccounts.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.type}) — Bal: {formatPHP(c.current_balance)} [{c.currency}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Disbursement Date & First Due Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Disbursement Date <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={originateForm.disbursement_date}
                    onChange={e => {
                      const d = new Date(e.target.value);
                      const f = new Date(d);
                      f.setMonth(f.getMonth() + 1);
                      setOriginateForm({
                        ...originateForm,
                        disbursement_date: e.target.value,
                        first_due_date: f.toISOString().split('T')[0]
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    First Repayment Due Date <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={originateForm.first_due_date}
                    onChange={e => setOriginateForm({ ...originateForm, first_due_date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              {/* Fee Breakdown & Net Disbursed calculation */}
              {originateCalculations && (
                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">
                    Financial Summary & Deductions
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500 text-[10px]">Gross Principal</span>
                      <div className="font-mono text-white font-semibold">
                        {formatPHP(originateCalculations.principal)}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px]">Processing Fee</span>
                      <div className="font-mono text-amber-400 font-semibold">
                        - {formatPHP(originateCalculations.procFee)}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px]">Service / Doc Fee</span>
                      <div className="font-mono text-amber-400 font-semibold">
                        - {formatPHP(originateCalculations.servFee)}
                      </div>
                    </div>
                    <div>
                      <span className="text-emerald-400 text-[10px] font-bold">Net Cash Disbursed</span>
                      <div className="font-mono text-emerald-400 font-bold text-sm">
                        {formatPHP(originateCalculations.netDisbursed)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl text-emerald-300 text-[11px] flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Confirming this form will mark application <strong className="text-white">{selectedAppForOriginate.application_no}</strong> as <strong>Released</strong>, create an active loan in the Loans Registry, decrement the cash vault, and log a CDA audit trail.
                </span>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedAppForOriginate(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow transition cursor-pointer flex items-center space-x-1.5"
                >
                  {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Originate & Disburse to Loans</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Application Details */}
      {selectedAppForDetails && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Loan Application Record</h3>
                <p className="text-xs text-slate-400">Application #{selectedAppForDetails.application_no}</p>
              </div>
              <button
                onClick={() => setSelectedAppForDetails(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Status</div>
                  <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    selectedAppForDetails.status === 'Pending'
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      : selectedAppForDetails.status === 'Approved'
                      ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                      : selectedAppForDetails.status === 'Released'
                      ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                      : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                  }`}>
                    {selectedAppForDetails.status}
                  </span>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Submitted Date</div>
                  <div className="text-slate-200 mt-1 font-mono">{selectedAppForDetails.submitted_date || 'Recent'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Borrower</div>
                  <div className="font-semibold text-white mt-1">{selectedAppForDetails.member_name}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{selectedAppForDetails.member_no}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Loan Product</div>
                  <div className="font-semibold text-slate-200 mt-1">
                    {selectedAppForDetails.product_name || selectedAppForDetails.loan_product_name}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Applied Amount</div>
                  <div className="text-base font-bold text-white font-mono mt-0.5">
                    {formatPHP(selectedAppForDetails.applied_amount)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{selectedAppForDetails.term_months} Months Term</div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Approved Amount</div>
                  <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">
                    {selectedAppForDetails.approved_amount ? formatPHP(selectedAppForDetails.approved_amount) : 'Pending'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {selectedAppForDetails.reviewed_date ? `Reviewed ${selectedAppForDetails.reviewed_date}` : 'Not yet reviewed'}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 uppercase font-semibold">Purpose</label>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 mt-1">
                  {selectedAppForDetails.purpose || 'None specified.'}
                </div>
              </div>

              {selectedAppForDetails.remarks && (
                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-semibold">Committee Resolution & Remarks</label>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 mt-1">
                    {selectedAppForDetails.remarks}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedAppForDetails(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
