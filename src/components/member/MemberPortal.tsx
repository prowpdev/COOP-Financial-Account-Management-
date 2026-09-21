import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  CreditCard,
  PiggyBank,
  Wallet,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  TrendingUp,
  FileText,
  Printer,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Download,
  Filter,
  Search,
  LogOut,
  RefreshCw,
  Building2,
  FileSpreadsheet,
  X,
  Sprout,
  ArrowRight,
  Award,
  BookOpen
} from 'lucide-react';
import { api } from '../../services/api';
import { Member, AuthSession } from '../../types';

interface MemberPortalProps {
  member: Member;
  onLogout: () => void;
  onSwitchToStaff?: () => void;
}

export const MemberPortal: React.FC<MemberPortalProps> = ({
  member,
  onLogout,
  onSwitchToStaff
}) => {
  const [activeTab, setActiveTab] = useState<'transactions' | 'loans' | 'savings' | 'cbu' | 'profile'>('transactions');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Transaction filter
  const [txFilterCategory, setTxFilterCategory] = useState<string>('all');
  const [txSearchTerm, setTxSearchTerm] = useState('');

  // Loan expanded state
  const [expandedLoanId, setExpandedLoanId] = useState<string | null>(null);

  // Modals
  const [showApplyLoanModal, setShowApplyLoanModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showCbuModal, setShowCbuModal] = useState(false);
  const [showPayLoanModal, setShowPayLoanModal] = useState(false);
  const [selectedLoanForPayment, setSelectedLoanForPayment] = useState<any>(null);
  const [showPrintStatementModal, setShowPrintStatementModal] = useState(false);

  // Form states
  const [loanProducts, setLoanProducts] = useState<any[]>([]);
  const [applyProductId, setApplyProductId] = useState('');
  const [applyPrincipal, setApplyPrincipal] = useState(30000);
  const [applyTerm, setApplyTerm] = useState(12);
  const [applyNotes, setApplyNotes] = useState('Farm inputs & fertilizer support');

  const [depositAmount, setDepositAmount] = useState(1000);
  const [cbuAmount, setCbuAmount] = useState(2500);
  const [loanPayAmount, setLoanPayAmount] = useState(0);

  const [actionLoading, setActionLoading] = useState(false);

  // Fetch Member Dashboard Data
  const loadDashboard = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await api.getMemberPortalDashboard(member.id);
      if (res.success && res.data) {
        setDashboardData(res.data);
        if (res.data.loans && res.data.loans.length > 0 && !expandedLoanId) {
          setExpandedLoanId(res.data.loans[0].id);
        }
      } else {
        setErrorMessage(res.message || 'Failed to load member financial records.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error fetching member portal dashboard.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    // Load loan products for application
    api.getLoanProducts().then((res) => {
      if (res.data && res.data.length > 0) {
        setLoanProducts(res.data);
        setApplyProductId(res.data[0].id);
      }
    });
  }, [member.id]);

  // Actions
  const handleApplyLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await api.memberApplyLoan(member.id, {
        loan_product_id: applyProductId,
        principal_amount: Number(applyPrincipal),
        term_months: Number(applyTerm),
        notes: applyNotes
      });
      if (res.success) {
        setSuccessMessage(res.message || 'Loan application approved and disbursed!');
        setShowApplyLoanModal(false);
        await loadDashboard();
        setActiveTab('loans');
      } else {
        setErrorMessage(res.message || 'Loan application failed.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error applying for loan.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDepositSavings = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const targetAccId = dashboardData?.savings_accounts?.[0]?.id;
      const res = await api.memberDepositSavings(member.id, {
        savings_account_id: targetAccId,
        amount: Number(depositAmount),
        notes: 'Deposit via Online Member Portal'
      });
      if (res.success) {
        setSuccessMessage(res.message || 'Deposit processed successfully!');
        setShowDepositModal(false);
        await loadDashboard();
        setActiveTab('savings');
      } else {
        setErrorMessage(res.message || 'Deposit failed.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error processing deposit.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePayCbu = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await api.memberPayShareCapital(member.id, {
        amount: Number(cbuAmount),
        notes: 'Share capital contribution via Online Member Portal'
      });
      if (res.success) {
        setSuccessMessage(res.message || 'Share capital contribution recorded!');
        setShowCbuModal(false);
        await loadDashboard();
        setActiveTab('cbu');
      } else {
        setErrorMessage(res.message || 'Contribution failed.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error contributing share capital.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePayLoanInstallment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoanForPayment) return;
    setActionLoading(true);
    try {
      const res = await api.memberMakeLoanPayment(member.id, {
        loan_id: selectedLoanForPayment.id,
        amount: Number(loanPayAmount),
        notes: `Online installment repayment for ${selectedLoanForPayment.loan_account_no}`
      });
      if (res.success) {
        setSuccessMessage(res.message || 'Loan installment paid successfully!');
        setShowPayLoanModal(false);
        await loadDashboard();
        setActiveTab('loans');
      } else {
        setErrorMessage(res.message || 'Repayment failed.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error processing repayment.');
    } finally {
      setActionLoading(false);
    }
  };

  const openLoanPayment = (loan: any) => {
    setSelectedLoanForPayment(loan);
    const nextSched = (loan.amortization_schedule || []).find((s: any) => s.status !== 'Paid');
    setLoanPayAmount(nextSched ? nextSched.total_installment : loan.current_balance);
    setShowPayLoanModal(true);
  };

  // Filter transactions
  const allTx = dashboardData?.all_transactions || [];
  const filteredTransactions = allTx.filter((t: any) => {
    const matchesCategory =
      txFilterCategory === 'all' ||
      (txFilterCategory === 'loans' && (t.category === 'Loans' || t.type.includes('Loan'))) ||
      (txFilterCategory === 'savings' && (t.category === 'Savings' || t.type.includes('Savings'))) ||
      (txFilterCategory === 'cbu' && (t.category === 'Share Capital' || t.type.includes('Share'))) ||
      (txFilterCategory === 'jv' && (t.category === 'Journal Vouchers' || t.type.includes('Journal')));

    const q = txSearchTerm.toLowerCase();
    const matchesSearch =
      !q ||
      String(t.reference || '').toLowerCase().includes(q) ||
      String(t.description || '').toLowerCase().includes(q) ||
      String(t.type || '').toLowerCase().includes(q) ||
      String(t.notes || '').toLowerCase().includes(q);

    return matchesCategory && matchesSearch;
  });

  const memberSummary = dashboardData?.summary || {
    share_capital_paid: 0,
    share_capital_subscribed: 0,
    total_shares_owned: 0,
    savings_balance: 0,
    total_loan_balance: 0,
    total_loan_borrowed: 0,
    total_payments_made: 0,
    next_payment_due: null
  };

  const memberRecord = dashboardData?.member || member;

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Top Cooperative Member Bar */}
      <header className="sticky top-0 z-30 w-full border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md px-4 sm:px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-950/40 border border-emerald-400/20">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">
                  Mayap Care Agriculture Coop.
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Member Portal
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {memberRecord.first_name} {memberRecord.last_name} •{' '}
                <span className="font-mono text-emerald-400 font-semibold">{memberRecord.member_no}</span> •{' '}
                {memberRecord.branch_name || 'Tarlac Main Branch'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              id="btn-print-statement"
              onClick={() => setShowPrintStatementModal(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Statement of Account</span>
            </button>

            {onSwitchToStaff && (
              <button
                id="btn-switch-to-staff"
                onClick={onSwitchToStaff}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition flex items-center space-x-1.5 cursor-pointer"
                title="Switch view to Staff Core Management"
              >
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">Staff View</span>
              </button>
            )}

            <button
              id="btn-member-logout"
              onClick={onLogout}
              className="px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-xs font-semibold text-rose-300 hover:text-rose-100 transition flex items-center space-x-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Feedback banners */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs flex items-center justify-between animate-in fade-in">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage('')} className="text-rose-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-xs flex items-center justify-between animate-in fade-in">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage('')} className="text-emerald-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Member Profile Banner & Quick Actions */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/40 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-start sm:items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-emerald-950/60 border border-emerald-400/30">
                {memberRecord.first_name?.[0]}
                {memberRecord.last_name?.[0]}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                    {memberRecord.first_name} {memberRecord.middle_name ? `${memberRecord.middle_name} ` : ''}
                    {memberRecord.last_name}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center space-x-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Member in Good Standing (MIGS)</span>
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mt-1">
                  <span>
                    Member ID: <strong className="text-slate-200 font-mono">{memberRecord.member_no}</strong>
                  </span>
                  <span>•</span>
                  <span>{memberRecord.member_type_name || 'Regular Agricultural Member'}</span>
                  <span>•</span>
                  <span>{memberRecord.branch_name || 'Tarlac Main Branch'}</span>
                  {memberRecord.custom_field_values?.farm_hectares && (
                    <>
                      <span>•</span>
                      <span>
                        Farm: <strong className="text-emerald-400">{memberRecord.custom_field_values.farm_hectares} Ha</strong> ({memberRecord.custom_field_values.primary_crop || 'Palay/Corn'})
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
              <button
                id="btn-action-apply-loan"
                onClick={() => setShowApplyLoanModal(true)}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-md shadow-emerald-950/40 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Apply for Loan</span>
              </button>

              <button
                id="btn-action-deposit"
                onClick={() => setShowDepositModal(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition flex items-center space-x-1.5 cursor-pointer"
              >
                <PiggyBank className="w-3.5 h-3.5 text-teal-400" />
                <span>Deposit Savings</span>
              </button>

              <button
                id="btn-action-cbu"
                onClick={() => setShowCbuModal(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Wallet className="w-3.5 h-3.5 text-purple-400" />
                <span>Add Share Capital</span>
              </button>

              <button
                id="btn-action-refresh"
                onClick={loadDashboard}
                disabled={isLoading}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                title="Refresh financial data"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* 4 Executive Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Share Capital */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <Wallet className="w-4 h-4 text-purple-400" />
                <span>Share Capital (CBU)</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                ₱100/share
              </span>
            </div>
            <div className="text-2xl font-black text-white">
              ₱{Number(memberSummary.share_capital_paid || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
              <span>{memberSummary.total_shares_owned || 0} Paid-up Shares</span>
              <span>Subscribed: ₱{Number(memberSummary.share_capital_subscribed || 0).toLocaleString()}</span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-purple-500 h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    ((memberSummary.share_capital_paid || 0) / (memberSummary.share_capital_subscribed || 10000)) * 100
                  )}%`
                }}
              ></div>
            </div>
          </div>

          {/* Card 2: Savings Deposits */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <PiggyBank className="w-4 h-4 text-teal-400" />
                <span>Savings Balance</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                Passbook
              </span>
            </div>
            <div className="text-2xl font-black text-white">
              ₱{Number(memberSummary.savings_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
              <span>Available for Withdrawal</span>
              <span>{dashboardData?.savings_accounts?.length || 1} Account(s)</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-teal-500 h-full rounded-full w-full"></div>
            </div>
          </div>

          {/* Card 3: Active Loans */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>Loan Outstanding</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {memberSummary.active_loans_count || 0} Active
              </span>
            </div>
            <div className="text-2xl font-black text-white">
              ₱{Number(memberSummary.total_loan_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
              <span>Total Borrowed: ₱{Number(memberSummary.total_loan_borrowed || 0).toLocaleString()}</span>
              <span>Repaid: {memberSummary.total_loan_borrowed ? Math.round(((memberSummary.total_loan_borrowed - memberSummary.total_loan_balance) / memberSummary.total_loan_borrowed) * 100) : 0}%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all"
                style={{
                  width: `${
                    memberSummary.total_loan_borrowed
                      ? Math.min(
                          100,
                          ((memberSummary.total_loan_borrowed - memberSummary.total_loan_balance) /
                            memberSummary.total_loan_borrowed) *
                            100
                        )
                      : 0
                  }%`
                }}
              ></div>
            </div>
          </div>

          {/* Card 4: Next Amortization Due */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>Next Payment Due</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {memberSummary.next_payment_due ? `Inst. #${memberSummary.next_payment_due.installment_no}` : 'Up to Date'}
              </span>
            </div>
            {memberSummary.next_payment_due ? (
              <>
                <div className="text-2xl font-black text-amber-400">
                  ₱{Number(memberSummary.next_payment_due.amount_due || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
                  <span>Due on {memberSummary.next_payment_due.due_date}</span>
                  <button
                    onClick={() => {
                      const l = (dashboardData?.loans || []).find((x: any) => x.loan_account_no === memberSummary.next_payment_due.loan_no);
                      if (l) openLoanPayment(l);
                    }}
                    className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
                  >
                    Pay Now →
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-2xl font-black text-slate-400">₱0.00</div>
                <div className="text-xs text-emerald-400 mt-1 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>No overdue or pending installments</span>
                </div>
              </>
            )}
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full w-full"></div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 overflow-x-auto">
          <button
            id="member-tab-transactions"
            onClick={() => setActiveTab('transactions')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'transactions'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>All Transactions ({allTx.length})</span>
          </button>

          <button
            id="member-tab-loans"
            onClick={() => setActiveTab('loans')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'loans'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Loans & Amortization Schedules ({dashboardData?.loans?.length || 0})</span>
          </button>

          <button
            id="member-tab-savings"
            onClick={() => setActiveTab('savings')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'savings'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <PiggyBank className="w-4 h-4" />
            <span>Savings Deposits & Passbook</span>
          </button>

          <button
            id="member-tab-cbu"
            onClick={() => setActiveTab('cbu')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'cbu'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Share Capital (CBU)</span>
          </button>

          <button
            id="member-tab-profile"
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Membership Record</span>
          </button>
        </div>

        {/* ---------------------------------------------------- */}
        {/* TAB 1: ALL MEMBER TRANSACTIONS FEED */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'transactions' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
                  <span>Consolidated Member Transaction Ledger</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Complete historical record of all loans released, loan payments, savings deposits/withdrawals, and share capital contributions.
                </p>
              </div>

              {/* Filter controls */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={txSearchTerm}
                    onChange={(e) => setTxSearchTerm(e.target.value)}
                    placeholder="Search OR#, ref, note..."
                    className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                  {['all', 'loans', 'savings', 'cbu', 'jv'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setTxFilterCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg font-medium capitalize transition cursor-pointer ${
                        txFilterCategory === cat
                          ? 'bg-slate-800 text-white font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {cat === 'cbu' ? 'Share Capital' : cat === 'jv' ? 'JVs' : cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Transaction / Facility</th>
                    <th className="py-3 px-4">Reference / OR#</th>
                    <th className="py-3 px-4">Description & Details</th>
                    <th className="py-3 px-4 text-right">Debit / Outflow</th>
                    <th className="py-3 px-4 text-right">Credit / Payment</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((tx: any) => (
                      <tr key={tx.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 whitespace-nowrap text-slate-300 font-mono">
                          {tx.date}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              tx.category === 'Loans'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : tx.category === 'Savings'
                                ? 'bg-teal-500/20 text-teal-300'
                                : tx.category === 'Share Capital'
                                ? 'bg-purple-500/20 text-purple-300'
                                : 'bg-blue-500/20 text-blue-300'
                            }`}
                          >
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-200 font-bold whitespace-nowrap">
                          {tx.reference || '-'}
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          <p>{tx.description}</p>
                          {tx.notes && <p className="text-[11px] text-slate-400 mt-0.5">{tx.notes}</p>}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-rose-400 whitespace-nowrap">
                          {tx.debit > 0
                            ? `₱${Number(tx.debit).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                            : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-400 font-bold whitespace-nowrap">
                          {tx.credit > 0
                            ? `₱${Number(tx.credit).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                            : '-'}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                            {tx.status || 'Completed'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        No transactions found matching the selected filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 2: LOANS & AMORTIZATION SCHEDULES */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'loans' && (
          <div className="space-y-6">
            {(dashboardData?.loans || []).length > 0 ? (
              (dashboardData.loans || []).map((loan: any) => {
                const isExpanded = expandedLoanId === loan.id;
                const paidSchedCount = (loan.amortization_schedule || []).filter((s: any) => s.status === 'Paid').length;
                const totalSchedCount = (loan.amortization_schedule || []).length;

                return (
                  <div
                    key={loan.id}
                    className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl"
                  >
                    {/* Loan Header Card */}
                    <div className="p-5 sm:p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 to-slate-800/40">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                              {loan.product_name}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                              {loan.loan_account_no}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                loan.status === 'Active'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              }`}
                            >
                              {loan.status}
                            </span>
                          </div>
                          <div className="text-xl sm:text-2xl font-black text-white mt-1">
                            ₱{Number(loan.principal_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            <span className="text-xs font-normal text-slate-400 ml-2">
                              Principal Borrowed • Outstanding Balance:{' '}
                              <strong className="text-emerald-400 font-mono">
                                ₱{Number(loan.current_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </strong>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {loan.current_balance > 0 && (
                            <button
                              id={`btn-pay-loan-${loan.id}`}
                              onClick={() => openLoanPayment(loan)}
                              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-md cursor-pointer"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              <span>Make Payment</span>
                            </button>
                          )}

                          <button
                            onClick={() => setExpandedLoanId(isExpanded ? null : loan.id)}
                            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition flex items-center space-x-1 cursor-pointer"
                          >
                            <span>{isExpanded ? 'Hide Schedule' : 'View Schedule & Payments'}</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Loan Key Parameters */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800/80 text-xs">
                        <div>
                          <p className="text-slate-500 font-medium">Interest Rate</p>
                          <p className="text-slate-200 font-semibold mt-0.5">
                            {loan.annual_interest_rate}% p.a. ({loan.interest_calculation_method})
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500 font-medium">Term & Frequency</p>
                          <p className="text-slate-200 font-semibold mt-0.5">
                            {loan.term_months} Months ({loan.payment_frequency})
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500 font-medium">Disbursed On</p>
                          <p className="text-slate-200 font-semibold mt-0.5">{loan.disbursement_date}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 font-medium">Installment Progress</p>
                          <p className="text-emerald-400 font-semibold mt-0.5">
                            {paidSchedCount} of {totalSchedCount} Paid
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Schedule & Payment Records */}
                    {isExpanded && (
                      <div className="p-5 sm:p-6 space-y-6">
                        {/* 1. Amortization Schedule Table */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-extrabold text-white flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-emerald-400" />
                              <span>Official Loan Amortization Schedule</span>
                            </h4>
                            <span className="text-xs text-slate-400">
                              {totalSchedCount} monthly installments computed via {loan.interest_calculation_method}
                            </span>
                          </div>

                          <div className="overflow-x-auto rounded-2xl border border-slate-800">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                                <tr>
                                  <th className="py-2.5 px-3.5 text-center">Inst. #</th>
                                  <th className="py-2.5 px-3.5">Due Date</th>
                                  <th className="py-2.5 px-3.5 text-right">Principal</th>
                                  <th className="py-2.5 px-3.5 text-right">Interest</th>
                                  <th className="py-2.5 px-3.5 text-right">Total Installment</th>
                                  <th className="py-2.5 px-3.5 text-right">Remaining Balance</th>
                                  <th className="py-2.5 px-3.5 text-center">Status</th>
                                  <th className="py-2.5 px-3.5 text-center">Paid Date</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/60 font-mono">
                                {(loan.amortization_schedule || []).map((item: any) => {
                                  const isPaid = item.status === 'Paid';
                                  const isDue = item.status === 'Due';

                                  return (
                                    <tr
                                      key={item.id || item.installment_no}
                                      className={`hover:bg-slate-800/40 transition ${
                                        isDue ? 'bg-amber-950/20' : ''
                                      }`}
                                    >
                                      <td className="py-2.5 px-3.5 text-center font-bold text-slate-300">
                                        {item.installment_no}
                                      </td>
                                      <td className="py-2.5 px-3.5 text-slate-300">{item.due_date}</td>
                                      <td className="py-2.5 px-3.5 text-right text-slate-200">
                                        ₱{Number(item.principal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                      </td>
                                      <td className="py-2.5 px-3.5 text-right text-slate-400">
                                        ₱{Number(item.interest || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                      </td>
                                      <td className="py-2.5 px-3.5 text-right font-bold text-white">
                                        ₱{Number(item.total_installment || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                      </td>
                                      <td className="py-2.5 px-3.5 text-right text-slate-400">
                                        ₱{Number(item.principal_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                      </td>
                                      <td className="py-2.5 px-3.5 text-center">
                                        <span
                                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                            isPaid
                                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                              : isDue
                                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                                          }`}
                                        >
                                          {item.status}
                                        </span>
                                      </td>
                                      <td className="py-2.5 px-3.5 text-center text-slate-400">
                                        {item.paid_date || '-'}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* 2. Payments History for this Loan */}
                        <div>
                          <h4 className="text-sm font-extrabold text-white mb-3 flex items-center space-x-2">
                            <CheckCircle2 className="w-4 h-4 text-teal-400" />
                            <span>Payment Receipts for this Loan ({loan.payments?.length || 0})</span>
                          </h4>

                          {loan.payments && loan.payments.length > 0 ? (
                            <div className="overflow-x-auto rounded-2xl border border-slate-800">
                              <table className="w-full text-left text-xs font-mono">
                                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                                  <tr>
                                    <th className="py-2.5 px-3.5">Payment Date</th>
                                    <th className="py-2.5 px-3.5">Official Receipt (OR#)</th>
                                    <th className="py-2.5 px-3.5 text-right">Total Paid</th>
                                    <th className="py-2.5 px-3.5 text-right">Applied to Principal</th>
                                    <th className="py-2.5 px-3.5 text-right">Applied to Interest</th>
                                    <th className="py-2.5 px-3.5">Collector / Notes</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60 font-medium">
                                  {loan.payments.map((p: any) => (
                                    <tr key={p.id} className="hover:bg-slate-800/40 transition">
                                      <td className="py-2.5 px-3.5 text-slate-300">{p.payment_date}</td>
                                      <td className="py-2.5 px-3.5 text-emerald-400 font-bold">{p.receipt_no}</td>
                                      <td className="py-2.5 px-3.5 text-right text-white font-bold">
                                        ₱{Number(p.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                      </td>
                                      <td className="py-2.5 px-3.5 text-right text-slate-300">
                                        ₱{Number(p.principal_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                      </td>
                                      <td className="py-2.5 px-3.5 text-right text-slate-400">
                                        ₱{Number(p.interest_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                      </td>
                                      <td className="py-2.5 px-3.5 text-slate-400 font-sans text-[11px]">
                                        {p.notes || `Received by ${p.received_by || 'Teller'}`}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500 italic p-3 bg-slate-950 rounded-xl border border-slate-800">
                              No payments recorded yet for this loan.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 text-center space-y-3">
                <CreditCard className="w-12 h-12 text-slate-600 mx-auto" />
                <h3 className="text-base font-bold text-white">No Active Loans</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  You do not currently have an active credit facility with Mayap Care Agriculture Cooperative.
                </p>
                <button
                  onClick={() => setShowApplyLoanModal(true)}
                  className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition inline-flex items-center space-x-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Submit Loan Application</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 3: SAVINGS DEPOSITS & PASSBOOK */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'savings' && (
          <div className="space-y-6">
            {(dashboardData?.savings_accounts || []).map((sa: any) => (
              <div
                key={sa.id}
                className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
                        {sa.product_name || 'Regular Savings Deposit'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 font-mono">
                        {sa.account_number}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                        {sa.status || 'Active'}
                      </span>
                    </div>
                    <div className="text-2xl font-black text-white mt-1">
                      ₱{Number(sa.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      <span className="text-xs font-normal text-slate-400 ml-2">Current Passbook Balance</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowDepositModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-md self-start sm:self-auto cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Make a Deposit</span>
                  </button>
                </div>

                {/* Savings Transactions Passbook */}
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-2">
                    <BookOpen className="w-4 h-4 text-teal-400" />
                    <span>Passbook Transaction Entries</span>
                  </h4>

                  <div className="overflow-x-auto rounded-2xl border border-slate-800">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                        <tr>
                          <th className="py-2.5 px-3.5">Date</th>
                          <th className="py-2.5 px-3.5">Transaction #</th>
                          <th className="py-2.5 px-3.5">Type</th>
                          <th className="py-2.5 px-3.5 text-right">Amount</th>
                          <th className="py-2.5 px-3.5 text-right">Running Balance</th>
                          <th className="py-2.5 px-3.5 font-sans">Notes / Teller</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-medium">
                        {(sa.transactions || []).length > 0 ? (
                          (sa.transactions || []).map((st: any) => {
                            const isWithdrawal = st.type === 'Withdrawal' || st.type === 'WITHDRAWAL';
                            return (
                              <tr key={st.id} className="hover:bg-slate-800/40 transition">
                                <td className="py-2.5 px-3.5 text-slate-300">{st.transaction_date}</td>
                                <td className="py-2.5 px-3.5 text-slate-400">{st.transaction_no}</td>
                                <td className="py-2.5 px-3.5">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      isWithdrawal
                                        ? 'bg-rose-500/20 text-rose-300'
                                        : 'bg-teal-500/20 text-teal-300'
                                    }`}
                                  >
                                    {st.type}
                                  </span>
                                </td>
                                <td
                                  className={`py-2.5 px-3.5 text-right font-bold ${
                                    isWithdrawal ? 'text-rose-400' : 'text-emerald-400'
                                  }`}
                                >
                                  {isWithdrawal ? '-' : '+'}₱
                                  {Number(st.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                                <td className="py-2.5 px-3.5 text-right text-white font-bold">
                                  ₱{Number(st.balance_after || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                                <td className="py-2.5 px-3.5 text-slate-400 font-sans text-[11px]">
                                  {st.notes || 'Counter transaction'}
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={6} className="py-6 text-center text-slate-500 font-sans">
                              No savings transactions yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 4: SHARE CAPITAL (CBU) */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'cbu' && (
          <div className="space-y-6">
            {(dashboardData?.share_capital?.accounts || []).map((sca: any) => (
              <div
                key={sca.id}
                className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                        Capital Build-Up (CBU) Certificate
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 font-mono">
                        {sca.account_number}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        Full Voting Member
                      </span>
                    </div>
                    <div className="text-2xl font-black text-white mt-1">
                      ₱{Number(sca.paid_up_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      <span className="text-xs font-normal text-slate-400 ml-2">
                        Paid-Up Capital ({sca.paid_up_shares || 0} Shares @ ₱{sca.par_value || 100} par value)
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowCbuModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-md self-start sm:self-auto cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Contribute to CBU</span>
                  </button>
                </div>

                {/* CBU Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs">
                  <div>
                    <p className="text-slate-500">Subscribed Amount</p>
                    <p className="text-slate-200 font-bold mt-0.5 font-mono">
                      ₱{Number(sca.subscribed_amount || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Subscribed Shares</p>
                    <p className="text-slate-200 font-bold mt-0.5 font-mono">{sca.subscribed_shares || 0} Shares</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Paid-Up Shares</p>
                    <p className="text-purple-400 font-bold mt-0.5 font-mono">{sca.paid_up_shares || 0} Shares</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Annual Dividend Eligibility</p>
                    <p className="text-emerald-400 font-bold mt-0.5">Qualified (100%)</p>
                  </div>
                </div>

                {/* CBU Transactions Table */}
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-2">
                    <Wallet className="w-4 h-4 text-purple-400" />
                    <span>Share Capital Contribution History</span>
                  </h4>

                  <div className="overflow-x-auto rounded-2xl border border-slate-800">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                        <tr>
                          <th className="py-2.5 px-3.5">Date</th>
                          <th className="py-2.5 px-3.5">Official Receipt (OR#)</th>
                          <th className="py-2.5 px-3.5">Type</th>
                          <th className="py-2.5 px-3.5 text-right">Shares Acquired</th>
                          <th className="py-2.5 px-3.5 text-right">Amount Paid</th>
                          <th className="py-2.5 px-3.5 font-sans">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-medium">
                        {(dashboardData?.share_capital?.transactions || []).length > 0 ? (
                          (dashboardData.share_capital.transactions || []).map((sct: any) => (
                            <tr key={sct.id} className="hover:bg-slate-800/40 transition">
                              <td className="py-2.5 px-3.5 text-slate-300">{sct.transaction_date}</td>
                              <td className="py-2.5 px-3.5 text-purple-400 font-bold">{sct.receipt_no}</td>
                              <td className="py-2.5 px-3.5 font-sans text-slate-300">{sct.type}</td>
                              <td className="py-2.5 px-3.5 text-right text-slate-200">+{sct.shares || 0}</td>
                              <td className="py-2.5 px-3.5 text-right text-emerald-400 font-bold">
                                ₱{Number(sct.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-2.5 px-3.5 text-slate-400 font-sans text-[11px]">
                                {sct.notes || 'CBU contribution'}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="py-6 text-center text-slate-500 font-sans">
                              No CBU transactions recorded.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 5: MEMBERSHIP PROFILE RECORD */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'profile' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
                <Users className="w-5 h-5 text-emerald-400" />
                <span>Official Cooperative Membership Certificate & Profile</span>
              </h3>
              <p className="text-xs text-slate-400">
                Registered under the Cooperative Development Authority (CDA) of the Republic of the Philippines.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <p className="text-slate-500 font-medium">Permanent Member Number</p>
                <p className="text-base font-black text-emerald-400 font-mono">{memberRecord.member_no}</p>
                <p className="text-[11px] text-slate-400">Issued by Mayap Care Registry</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <p className="text-slate-500 font-medium">Membership Classification</p>
                <p className="text-sm font-bold text-white">{memberRecord.member_type_name || 'Regular Agricultural Member'}</p>
                <p className="text-[11px] text-slate-400">Full voting rights & patronage refund eligible</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <p className="text-slate-500 font-medium">Branch Assignment</p>
                <p className="text-sm font-bold text-white">{memberRecord.branch_name || 'Tarlac Main Branch'}</p>
                <p className="text-[11px] text-slate-400">Servicing branch for loan releases</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <p className="text-slate-500 font-medium">Contact Phone</p>
                <p className="text-sm font-bold text-slate-200">{memberRecord.phone || '-'}</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <p className="text-slate-500 font-medium">Email Address</p>
                <p className="text-sm font-bold text-slate-200">{memberRecord.email || '-'}</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <p className="text-slate-500 font-medium">Date Joined</p>
                <p className="text-sm font-bold text-slate-200 font-mono">{memberRecord.joined_date || '2026-01-01'}</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1 sm:col-span-2">
                <p className="text-slate-500 font-medium">Registered Residential Address</p>
                <p className="text-sm font-semibold text-slate-200">{memberRecord.address || 'Tarlac, Philippines'}</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <p className="text-slate-500 font-medium">Agricultural Land Holdings</p>
                <p className="text-sm font-bold text-emerald-400">
                  {memberRecord.custom_field_values?.farm_hectares ? `${memberRecord.custom_field_values.farm_hectares} Hectares` : '2.5 Hectares'}
                </p>
                <p className="text-[11px] text-slate-400">
                  Crops: {memberRecord.custom_field_values?.primary_crop || 'Palay / Corn'}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ---------------------------------------------------- */}
      {/* MODAL: APPLY FOR LOAN */}
      {/* ---------------------------------------------------- */}
      {showApplyLoanModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
                  <CreditCard className="w-5 h-5 text-emerald-400" />
                  <span>Member Loan Self-Application</span>
                </h3>
                <p className="text-xs text-slate-400">Automated schedule calculation and instant approval</p>
              </div>
              <button onClick={() => setShowApplyLoanModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyLoan} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Loan Product</label>
                <select
                  value={applyProductId}
                  onChange={(e) => setApplyProductId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  {loanProducts.map((p) => (
                    <option key={p.id} value={p.id} className="bg-slate-900">
                      {p.name} ({p.annual_interest_rate}% p.a. • max ₱{p.max_amount?.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Principal Amount (₱)</label>
                  <input
                    type="number"
                    step="1000"
                    min="5000"
                    max="500000"
                    value={applyPrincipal}
                    onChange={(e) => setApplyPrincipal(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Term (Months)</label>
                  <select
                    value={applyTerm}
                    onChange={(e) => setApplyTerm(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value={6}>6 Months</option>
                    <option value={12}>12 Months (1 Year)</option>
                    <option value={24}>24 Months (2 Years)</option>
                    <option value={36}>36 Months (3 Years)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Purpose / Notes</label>
                <textarea
                  rows={2}
                  value={applyNotes}
                  onChange={(e) => setApplyNotes(e.target.value)}
                  placeholder="e.g. Purchase of seeds, fertilizers, and equipment maintenance"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-[11px] space-y-1">
                <p className="font-bold text-emerald-300">Amortization Preview</p>
                <p>
                  Estimated Monthly Installment:{' '}
                  <strong className="font-mono text-white">
                    ₱{Math.round((applyPrincipal / applyTerm) + (applyPrincipal * 0.1 / 12)).toLocaleString()}
                  </strong>
                </p>
                <p className="text-slate-400">Processing & service fees will be deducted automatically from net proceeds.</p>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApplyLoanModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: DEPOSIT SAVINGS */}
      {/* ---------------------------------------------------- */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
                  <PiggyBank className="w-5 h-5 text-teal-400" />
                  <span>Deposit into Savings Passbook</span>
                </h3>
                <p className="text-xs text-slate-400">Member savings deposit credit</p>
              </div>
              <button onClick={() => setShowDepositModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDepositSavings} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Deposit Amount (₱)</label>
                <input
                  type="number"
                  step="100"
                  min="100"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(Number(e.target.value))}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-base focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Confirm Deposit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: CONTRIBUTE TO SHARE CAPITAL (CBU) */}
      {/* ---------------------------------------------------- */}
      {showCbuModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
                  <Wallet className="w-5 h-5 text-purple-400" />
                  <span>Contribute to Share Capital (CBU)</span>
                </h3>
                <p className="text-xs text-slate-400">₱100.00 par value per common share</p>
              </div>
              <button onClick={() => setShowCbuModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePayCbu} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Contribution Amount (₱)</label>
                <input
                  type="number"
                  step="100"
                  min="100"
                  value={cbuAmount}
                  onChange={(e) => setCbuAmount(Number(e.target.value))}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-base focus:outline-none focus:border-purple-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  This contribution adds <strong className="text-purple-300 font-mono">+{Math.floor(cbuAmount / 100)}</strong> shares to your ownership in the cooperative.
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCbuModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Confirm Contribution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: PAY LOAN INSTALLMENT */}
      {/* ---------------------------------------------------- */}
      {showPayLoanModal && selectedLoanForPayment && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  <span>Repay Loan Installment</span>
                </h3>
                <p className="text-xs text-slate-400 font-mono">{selectedLoanForPayment.loan_account_no} • {selectedLoanForPayment.product_name}</p>
              </div>
              <button onClick={() => setShowPayLoanModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePayLoanInstallment} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Repayment Amount (₱)</label>
                <input
                  type="number"
                  step="0.01"
                  min="10"
                  max={selectedLoanForPayment.current_balance}
                  value={loanPayAmount}
                  onChange={(e) => setLoanPayAmount(Number(e.target.value))}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-base focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Remaining loan balance: <strong className="text-white font-mono">₱{Number(selectedLoanForPayment.current_balance).toLocaleString()}</strong>
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayLoanModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: STATEMENT OF ACCOUNT (PRINTABLE) */}
      {/* ---------------------------------------------------- */}
      {showPrintStatementModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl p-6 space-y-5 shadow-2xl animate-in zoom-in-95 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
                  <Printer className="w-5 h-5 text-emerald-400" />
                  <span>Official Member Statement of Account</span>
                </h3>
                <p className="text-xs text-slate-400">CDA-Standard Cooperative Financial Summary</p>
              </div>
              <button onClick={() => setShowPrintStatementModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Document Box */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-xs space-y-5 text-slate-200 font-sans">
              {/* Coop Header */}
              <div className="text-center pb-4 border-b border-slate-800 space-y-1">
                <h2 className="text-base font-black tracking-tight text-white uppercase">
                  Mayap Care Agriculture Cooperative
                </h2>
                <p className="text-[11px] text-slate-400">CDA Registration No. CDA-REG-9502-100234 • CIN: 0102030405</p>
                <p className="text-[11px] text-slate-400">Tarlac Main Branch • Victoria / Gerona Service Area, Tarlac</p>
                <p className="text-xs font-bold text-emerald-400 pt-1">MEMBER STATEMENT OF ACCOUNT (SOA)</p>
                <p className="text-[10px] text-slate-500">As of {new Date().toLocaleDateString('en-PH', { dateStyle: 'long' })}</p>
              </div>

              {/* Member Particulars */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-900 p-3.5 rounded-xl border border-slate-800/80">
                <div>
                  <p><span className="text-slate-400">Member Name:</span> <strong className="text-white">{memberRecord.first_name} {memberRecord.last_name}</strong></p>
                  <p><span className="text-slate-400">Member No:</span> <strong className="text-emerald-400 font-mono">{memberRecord.member_no}</strong></p>
                  <p><span className="text-slate-400">Membership:</span> {memberRecord.member_type_name || 'Regular Agricultural Member'}</p>
                </div>
                <div>
                  <p><span className="text-slate-400">Branch:</span> {memberRecord.branch_name || 'Tarlac Main Branch'}</p>
                  <p><span className="text-slate-400">Phone:</span> {memberRecord.phone || '-'}</p>
                  <p><span className="text-slate-400">Address:</span> {memberRecord.address || 'Tarlac, Philippines'}</p>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">Financial Standing Summary</h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <p className="text-slate-400 text-[10px]">Paid-Up Share Capital</p>
                    <p className="text-sm font-black text-purple-400 font-mono mt-0.5">₱{Number(memberSummary.share_capital_paid).toLocaleString()}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <p className="text-slate-400 text-[10px]">Savings Deposit Balance</p>
                    <p className="text-sm font-black text-teal-400 font-mono mt-0.5">₱{Number(memberSummary.savings_balance).toLocaleString()}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <p className="text-slate-400 text-[10px]">Outstanding Loans</p>
                    <p className="text-sm font-black text-rose-400 font-mono mt-0.5">₱{Number(memberSummary.total_loan_balance).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">Recent Transaction Ledger</h4>
                <div className="border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-[11px] font-mono">
                    <thead className="bg-slate-900 text-slate-400">
                      <tr>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">Ref/OR#</th>
                        <th className="py-2 px-3 font-sans">Type</th>
                        <th className="py-2 px-3 text-right">Debit</th>
                        <th className="py-2 px-3 text-right">Credit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {allTx.slice(0, 8).map((t: any) => (
                        <tr key={t.id}>
                          <td className="py-1.5 px-3">{t.date}</td>
                          <td className="py-1.5 px-3 text-emerald-400 font-bold">{t.reference}</td>
                          <td className="py-1.5 px-3 font-sans">{t.type}</td>
                          <td className="py-1.5 px-3 text-right text-rose-400">{t.debit > 0 ? `₱${Number(t.debit).toLocaleString()}` : '-'}</td>
                          <td className="py-1.5 px-3 text-right text-emerald-400">{t.credit > 0 ? `₱${Number(t.credit).toLocaleString()}` : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-6 grid grid-cols-2 gap-8 text-center text-[11px] text-slate-400">
                <div className="border-t border-slate-700 pt-1">
                  <p className="font-bold text-slate-200">Elena Rostro</p>
                  <p>Certified Public Accountant / Auditor</p>
                </div>
                <div className="border-t border-slate-700 pt-1">
                  <p className="font-bold text-slate-200">{memberRecord.first_name} {memberRecord.last_name}</p>
                  <p>Member Conformé</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Document</span>
              </button>
              <button
                onClick={() => setShowPrintStatementModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
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
