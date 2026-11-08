import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  X,
  Printer,
  Download,
  Building2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Pencil,
  Trash2,
  RefreshCw,
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';
import { api } from '../../services/api';
import { Loan, CashAccount, User } from '../../types';

interface IndividualLoanLedgerModalProps {
  loan: Loan;
  onClose: () => void;
  onRepay?: () => void;
  onLoanUpdated?: (updatedLoan: any) => void;
  cashAccounts?: CashAccount[];
  currentUser?: User;
}

export const IndividualLoanLedgerModal: React.FC<IndividualLoanLedgerModalProps> = ({
  loan,
  onClose,
  onRepay,
  onLoanUpdated,
  cashAccounts = [],
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState<'ledger' | 'schedule' | 'payments'>('ledger');
  const [ledgerData, setLedgerData] = useState<any[]>([]);
  const [scheduleData, setScheduleData] = useState<any[]>([]);
  const [paymentsData, setPaymentsData] = useState<any[]>([]);
  const [loanDetails, setLoanDetails] = useState<any>(loan);
  const [isLoading, setIsLoading] = useState(true);

  // Admin Payment Adjustment State
  const [editingPayment, setEditingPayment] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    payment_date: '',
    receipt_no: '',
    total_amount: 0,
    principal_amount: 0,
    interest_amount: 0,
    penalty_amount: 0,
    fee_amount: 0,
    cash_account_id: 'cash_01',
    notes: '',
    adjustment_reason: ''
  });
  const [isSavingAdjustment, setIsSavingAdjustment] = useState(false);
  const [adjustmentNotice, setAdjustmentNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Void Payment Confirmation State
  const [voidConfirmPayment, setVoidConfirmPayment] = useState<any | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [isVoiding, setIsVoiding] = useState(false);

  const loadLedger = async () => {
    setIsLoading(true);
    try {
      const res = await api.getLoanLedger(loan.id);
      if (res.data) {
        setLoanDetails(res.data.loan || loan);
        setLedgerData(Array.isArray(res.data.ledger) ? res.data.ledger : []);
        setScheduleData(Array.isArray(res.data.schedule) ? res.data.schedule : []);
        setPaymentsData(Array.isArray(res.data.payments) ? res.data.payments : []);
        if (onLoanUpdated && res.data.loan) {
          onLoanUpdated(res.data.loan);
        }
      }
    } catch (err) {
      console.warn('Failed to load loan ledger:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLedger();
  }, [loan.id]);

  const formatMoney = (val: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val || 0);

  const exportCSV = () => {
    const headers = [
      'Date',
      'Transaction Ref / OR No.',
      'Type',
      'Particulars',
      'Debit Principal (₱)',
      'Credit Principal (₱)',
      'Interest Collected (₱)',
      'Penalty Collected (₱)',
      'Outstanding Principal Balance (₱)',
      'Disbursing / Collecting Officer'
    ];

    const rows = ledgerData.map(l => [
      `"${l.date || ''}"`,
      `"${l.ref_no || ''}"`,
      `"${l.type || ''}"`,
      `"${(l.description || '').replace(/"/g, '""')}"`,
      (Number(l.debit_principal) || 0).toFixed(2),
      (Number(l.credit_principal) || 0).toFixed(2),
      (Number(l.interest_applied) || 0).toFixed(2),
      (Number(l.penalty_applied) || 0).toFixed(2),
      (Number(l.principal_balance) || 0).toFixed(2),
      `"${l.received_by || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Loan_Ledger_${loanDetails.loan_account_no || loan.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleStartEdit = (p: any) => {
    setEditingPayment(p);
    const total = Number(p.amount ?? p.total_amount ?? 0);
    const prin = Number(p.principal_paid ?? p.principal_amount ?? 0);
    const int = Number(p.interest_paid ?? p.interest_amount ?? 0);
    const pen = Number(p.penalty_paid ?? p.penalty_amount ?? 0);
    const fee = Number(p.fee_paid ?? p.fee_amount ?? 0);

    setEditForm({
      payment_date: p.payment_date || new Date().toISOString().split('T')[0],
      receipt_no: p.receipt_no || p.receipt_number || p.reference_id || '',
      total_amount: Number(total.toFixed(2)),
      principal_amount: Number(prin.toFixed(2)),
      interest_amount: Number(int.toFixed(2)),
      penalty_amount: Number(pen.toFixed(2)),
      fee_amount: Number(fee.toFixed(2)),
      cash_account_id: p.cash_account_id || (cashAccounts[0]?.id || 'cash_01'),
      notes: p.notes || '',
      adjustment_reason: ''
    });
    setAdjustmentNotice(null);
  };

  const handleAutoBalancePrincipal = () => {
    const total = Number(editForm.total_amount) || 0;
    const int = Number(editForm.interest_amount) || 0;
    const pen = Number(editForm.penalty_amount) || 0;
    const fee = Number(editForm.fee_amount) || 0;
    const autoPrin = Math.max(0, Number((total - int - pen - fee).toFixed(2)));
    setEditForm(prev => ({
      ...prev,
      principal_amount: autoPrin
    }));
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment) return;

    if (editForm.total_amount <= 0) {
      setAdjustmentNotice({ type: 'error', message: 'Total payment amount must be greater than zero.' });
      return;
    }

    const calculatedSum = Number((
      Number(editForm.principal_amount || 0) +
      Number(editForm.interest_amount || 0) +
      Number(editForm.penalty_amount || 0) +
      Number(editForm.fee_amount || 0)
    ).toFixed(2));

    if (Math.abs(calculatedSum - Number(editForm.total_amount)) > 0.01) {
      setAdjustmentNotice({
        type: 'error',
        message: `Allocation breakdown (₱${calculatedSum.toFixed(2)}) does not match Total Amount (₱${Number(editForm.total_amount).toFixed(2)}). Click 'Auto-Balance' or adjust fields.`
      });
      return;
    }

    setIsSavingAdjustment(true);
    setAdjustmentNotice(null);

    try {
      const res = await api.adjustLoanPayment(editingPayment.id, {
        payment_date: editForm.payment_date,
        receipt_no: editForm.receipt_no,
        total_amount: Number(editForm.total_amount),
        principal_amount: Number(editForm.principal_amount),
        interest_amount: Number(editForm.interest_amount),
        penalty_amount: Number(editForm.penalty_amount),
        fee_amount: Number(editForm.fee_amount),
        cash_account_id: editForm.cash_account_id,
        notes: editForm.notes,
        adjustment_reason: editForm.adjustment_reason || 'Payment corrected by loan administrator',
        performed_by: currentUser?.name || 'Administrator'
      });

      setAdjustmentNotice({ type: 'success', message: res.message || 'Payment successfully adjusted.' });
      await loadLedger();
      setTimeout(() => {
        setEditingPayment(null);
        setAdjustmentNotice(null);
      }, 1200);
    } catch (err: any) {
      setAdjustmentNotice({ type: 'error', message: err.message || 'Failed to adjust payment.' });
    } finally {
      setIsSavingAdjustment(false);
    }
  };

  const handleConfirmVoid = async () => {
    if (!voidConfirmPayment) return;
    setIsVoiding(true);
    try {
      await api.voidLoanPayment(voidConfirmPayment.id, {
        reason: voidReason || 'Voided by loan administrator',
        performed_by: currentUser?.name || 'Administrator'
      });
      setVoidConfirmPayment(null);
      setVoidReason('');
      await loadLedger();
    } catch (err: any) {
      alert(err.message || 'Failed to void payment.');
    } finally {
      setIsVoiding(false);
    }
  };

  const principal = Number(Number(loanDetails.principal_amount || 0).toFixed(2));
  const currentBalance = Number(Number(loanDetails.current_balance || 0).toFixed(2));
  const principalPaid = Number(Number(loanDetails.total_principal_paid || Math.max(0, principal - currentBalance)).toFixed(2));
  const interestPaid = Number(Number(loanDetails.total_interest_paid || 0).toFixed(2));
  const interestRate = Number(loanDetails.annual_interest_rate) || 0;
  const termMonths = Number(loanDetails.term_months) || 12;

  const currentAllocationSum = Number((
    Number(editForm.principal_amount || 0) +
    Number(editForm.interest_amount || 0) +
    Number(editForm.penalty_amount || 0) +
    Number(editForm.fee_amount || 0)
  ).toFixed(2));

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-5xl w-full shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header Bar */}
        <div className="p-6 border-b border-slate-800/80 bg-slate-950/60 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase tracking-wider">
                Individual Borrower Loan Subsidiary Ledger
              </span>
              <span className="text-xs font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700">
                {loanDetails.loan_account_no}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                loanDetails.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400' :
                loanDetails.status === 'Fully Paid' ? 'bg-blue-500/20 text-blue-400' :
                loanDetails.status === 'Approved' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-400'
              }`}>
                {loanDetails.status || 'Active'}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-400" />
              <span>{loanDetails.member_name || 'Borrower Member'}</span>
              <span className="text-xs text-slate-400 font-normal font-mono">({loanDetails.member_no || 'Member No.'})</span>
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                {loanDetails.branch_name || 'Main Branch'}
              </span>
              <span>•</span>
              <span>Product: <strong className="text-slate-200">{loanDetails.product_name || 'Regular Loan'}</strong></span>
              <span>•</span>
              <span>Rate: <strong className="text-amber-400">{interestRate}% p.a. ({loanDetails.interest_calculation_method || 'Diminishing'})</strong></span>
              <span>•</span>
              <span>Term: <strong className="text-slate-200">{termMonths} Months ({loanDetails.payment_frequency || 'Monthly'})</strong></span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={exportCSV}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 cursor-pointer transition"
              title="Export Loan Ledger to CSV"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => window.print()}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 cursor-pointer transition"
              title="Print Loan Ledger Statement"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-300 text-slate-400 rounded-xl border border-slate-700 cursor-pointer transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Financial Highlights */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-900/90 border-b border-slate-800">
          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Original Principal</span>
            <div className="text-base font-bold text-white mt-0.5">{formatMoney(principal)}</div>
            <span className="text-[11px] text-blue-400 font-medium">Disbursed on {loanDetails.disbursement_date || '-'}</span>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Principal Repaid</span>
            <div className="text-base font-bold text-emerald-400 mt-0.5">{formatMoney(principalPaid)}</div>
            <span className="text-[11px] text-slate-400 font-medium">
              {principal > 0 ? ((principalPaid / principal) * 100).toFixed(1) : 0}% Recovered
            </span>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Interest Collected</span>
            <div className="text-base font-bold text-purple-400 mt-0.5">{formatMoney(interestPaid)}</div>
            <span className="text-[11px] text-slate-400 font-medium">Income Earned</span>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Current Principal Balance</span>
            <div className="text-base font-bold text-amber-400 mt-0.5">{formatMoney(currentBalance)}</div>
            <span className="text-[11px] text-amber-500 font-medium">
              {currentBalance <= 0 ? 'Loan Fully Settled' : 'Unpaid Balance'}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition cursor-pointer flex items-center space-x-2 ${
                activeTab === 'ledger'
                  ? 'bg-slate-800 text-blue-400 border-t-2 border-blue-500'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Subsidiary Ledger ({ledgerData.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition cursor-pointer flex items-center space-x-2 ${
                activeTab === 'schedule'
                  ? 'bg-slate-800 text-blue-400 border-t-2 border-blue-500'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Amortization Schedule ({scheduleData.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition cursor-pointer flex items-center space-x-2 ${
                activeTab === 'payments'
                  ? 'bg-slate-800 text-blue-400 border-t-2 border-blue-500'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Payment Transactions & Adjustments ({paymentsData.length})</span>
            </button>
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-2">
            <button
              onClick={loadLedger}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition"
              title="Refresh ledger data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 max-h-[55vh]">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-2 text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
              <span className="text-xs">Computing borrower running subsidiary balance...</span>
            </div>
          ) : activeTab === 'ledger' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Running balance audit breakdown computed in chronological transaction order.</span>
                {onRepay && currentBalance > 0 && (
                  <button
                    onClick={onRepay}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Post Loan Repayment</span>
                  </button>
                )}
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3">Reference No.</th>
                      <th className="py-3 px-3">Type</th>
                      <th className="py-3 px-4">Particulars</th>
                      <th className="py-3 px-3 text-right text-rose-300">Principal Disbursed (₱)</th>
                      <th className="py-3 px-3 text-right text-emerald-400">Principal Repaid (₱)</th>
                      <th className="py-3 px-3 text-right text-purple-300">Interest (₱)</th>
                      <th className="py-3 px-4 text-right text-amber-300 font-bold">Outstanding Balance (₱)</th>
                      <th className="py-3 px-3">Officer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 bg-slate-900/50 font-mono">
                    {ledgerData.map((row, idx) => (
                      <tr key={row.id || idx} className="hover:bg-slate-800/40 transition">
                        <td className="py-2.5 px-3 font-sans text-slate-300 whitespace-nowrap">{row.date}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[11px] border ${
                            row.type === 'DISBURSEMENT'
                              ? 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                              : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                          }`}>
                            {row.ref_no}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-sans">
                          <span className={`text-[10px] uppercase font-bold ${
                            row.type === 'DISBURSEMENT' ? 'text-blue-400' : 'text-emerald-400'
                          }`}>
                            {row.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-sans text-slate-200 min-w-44">{row.description}</td>
                        <td className="py-2.5 px-3 text-right text-rose-300">
                          {row.debit_principal > 0 ? `₱${Number(row.debit_principal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right text-emerald-400 font-semibold">
                          {row.credit_principal > 0 ? `₱${Number(row.credit_principal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right text-purple-300">
                          {row.interest_applied > 0 ? `₱${Number(row.interest_applied).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                        </td>
                        <td className="py-2.5 px-4 text-right text-amber-300 font-bold bg-slate-950/40">
                          ₱{Number(row.principal_balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 font-sans text-slate-400 whitespace-nowrap">{row.received_by}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-950 font-semibold text-white border-t border-slate-800 text-xs font-mono">
                    <tr>
                      <td colSpan={4} className="py-3 px-3 uppercase tracking-wider text-slate-400 font-sans">
                        Net Loan Amortization Status
                      </td>
                      <td className="py-3 px-3 text-right text-rose-300">{formatMoney(principal)}</td>
                      <td className="py-3 px-3 text-right text-emerald-400">{formatMoney(principalPaid)}</td>
                      <td className="py-3 px-3 text-right text-purple-300">{formatMoney(interestPaid)}</td>
                      <td className="py-3 px-4 text-right text-amber-400 font-bold bg-slate-950/80">
                        {formatMoney(currentBalance)}
                      </td>
                      <td className="py-3 px-3"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ) : activeTab === 'schedule' ? (
            <div className="space-y-4">
              <div className="text-xs text-slate-400">
                Official amortization payment schedule generated using {loanDetails.interest_calculation_method || 'Diminishing Balance'} method with precise 2-decimal installment balances.
              </div>
              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-3 text-center">Inst. #</th>
                      <th className="py-3 px-3">Due Date</th>
                      <th className="py-3 px-3 text-right">Principal Due</th>
                      <th className="py-3 px-3 text-right">Interest Due</th>
                      <th className="py-3 px-3 text-right text-white">Total Installment</th>
                      <th className="py-3 px-3 text-right text-emerald-400">Paid Principal</th>
                      <th className="py-3 px-3 text-right text-purple-300">Paid Interest</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-3">Paid Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 bg-slate-900/50 font-mono">
                    {scheduleData.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-slate-800/40 transition">
                        <td className="py-2.5 px-3 text-center text-slate-400">{item.installment_no}</td>
                        <td className="py-2.5 px-3 font-sans text-slate-300">{item.due_date}</td>
                        <td className="py-2.5 px-3 text-right text-slate-200">{formatMoney(Number(item.principal))}</td>
                        <td className="py-2.5 px-3 text-right text-slate-400">{formatMoney(Number(item.interest))}</td>
                        <td className="py-2.5 px-3 text-right text-white font-bold">
                          {formatMoney((Number(item.principal) || 0) + (Number(item.interest) || 0))}
                        </td>
                        <td className="py-2.5 px-3 text-right text-emerald-400 font-semibold">{formatMoney(Number(item.paid_principal || 0))}</td>
                        <td className="py-2.5 px-3 text-right text-purple-300">{formatMoney(Number(item.paid_interest || 0))}</td>
                        <td className="py-2.5 px-3 text-center font-sans">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            item.status === 'Paid' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                            item.status === 'Partially Paid' || item.status === 'Partial' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}>
                            {item.status || 'Unpaid'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-sans text-slate-400">{item.paid_date || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-400">
                <span>Official receipts (OR) issued for loan amortization collections. Administrators can adjust or correct completed payments.</span>
                {onRepay && currentBalance > 0 && (
                  <button
                    onClick={onRepay}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow transition cursor-pointer self-start sm:self-auto"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Post New Payment</span>
                  </button>
                )}
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3">Receipt / OR #</th>
                      <th className="py-3 px-3 text-right text-emerald-400">Total Paid (₱)</th>
                      <th className="py-3 px-3 text-right text-slate-300">Principal (₱)</th>
                      <th className="py-3 px-3 text-right text-purple-300">Interest (₱)</th>
                      <th className="py-3 px-3 text-right text-amber-300">Penalty (₱)</th>
                      <th className="py-3 px-3">Cash Account</th>
                      <th className="py-3 px-3">Status / Notes</th>
                      <th className="py-3 px-3 text-center">Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 bg-slate-900/50 font-mono">
                    {paymentsData.map((p, idx) => {
                      const isVoided = p.status === 'Voided';
                      return (
                        <tr key={p.id || idx} className={`hover:bg-slate-800/40 transition ${isVoided ? 'opacity-40 bg-rose-950/10' : ''}`}>
                          <td className="py-2.5 px-3 font-sans text-slate-300 whitespace-nowrap">{p.payment_date}</td>
                          <td className="py-2.5 px-3">
                            <span className="text-emerald-300 font-bold">
                              {p.receipt_no || p.receipt_number || p.reference_id || p.id}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">
                            ₱{Number(p.amount ?? p.total_amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-200">{formatMoney(Number(p.principal_paid || 0))}</td>
                          <td className="py-2.5 px-3 text-right text-purple-300">{formatMoney(Number(p.interest_paid || 0))}</td>
                          <td className="py-2.5 px-3 text-right text-amber-300">{formatMoney(Number(p.penalty_paid || 0))}</td>
                          <td className="py-2.5 px-3 font-sans text-slate-400">{p.cash_account_id}</td>
                          <td className="py-2.5 px-3 font-sans text-slate-400 text-[11px] max-w-xs truncate">
                            {isVoided ? (
                              <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30">
                                VOIDED
                              </span>
                            ) : p.adjusted_at ? (
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-semibold border border-amber-500/30">
                                ADJUSTED
                              </span>
                            ) : (
                              <span>{p.notes || 'Repayment'}</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-sans text-center">
                            {!isVoided ? (
                              <div className="flex items-center justify-center space-x-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(p)}
                                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white font-semibold text-[11px] shadow transition cursor-pointer"
                                  title="Edit or adjust this payment allocation, OR number, or date"
                                >
                                  <Pencil className="w-3 h-3" />
                                  <span>Adjust</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setVoidConfirmPayment(p);
                                    setVoidReason('');
                                  }}
                                  className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                                  title="Void payment"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-500 italic">No actions</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {paymentsData.length === 0 && (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-slate-500 font-sans">
                          No payments recorded yet for this loan.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>Official Cooperative Member Loan Subsidiary Ledger</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium cursor-pointer transition"
          >
            Close Ledger
          </button>
        </div>
      </div>

      {/* Admin Feature: Adjust Loan Payment Modal */}
      {editingPayment && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <SlidersHorizontal className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-base font-bold text-white">Adjust Completed Loan Payment</h3>
                  <p className="text-xs text-slate-400">
                    OR / Ref: <strong className="text-emerald-400">{editingPayment.receipt_no || editingPayment.id}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingPayment(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {adjustmentNotice && (
              <div className={`p-3 rounded-xl text-xs flex items-center space-x-2 border ${
                adjustmentNotice.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}>
                {adjustmentNotice.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                )}
                <span className="flex-1">{adjustmentNotice.message}</span>
              </div>
            )}

            <form onSubmit={handleSaveAdjustment} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 font-semibold block mb-1">Payment Date</label>
                  <input
                    type="date"
                    required
                    value={editForm.payment_date}
                    onChange={e => setEditForm({ ...editForm, payment_date: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 font-semibold block mb-1">Receipt / OR Number</label>
                  <input
                    type="text"
                    required
                    value={editForm.receipt_no}
                    onChange={e => setEditForm({ ...editForm, receipt_no: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">Receiving Cash Account</label>
                <select
                  value={editForm.cash_account_id}
                  onChange={e => setEditForm({ ...editForm, cash_account_id: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {cashAccounts.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.account_code || c.id})
                    </option>
                  ))}
                  {cashAccounts.length === 0 && (
                    <option value="cash_01">Main Cash on Hand (cash_01)</option>
                  )}
                </select>
              </div>

              {/* Total Payment Amount */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-emerald-400 font-bold">Total Payment Amount (₱)</label>
                  <button
                    type="button"
                    onClick={handleAutoBalancePrincipal}
                    className="inline-flex items-center space-x-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 cursor-pointer"
                    title="Automatically set principal = Total - (Interest + Penalty + Fees)"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Auto-Balance Principal</span>
                  </button>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={editForm.total_amount}
                  onChange={e => {
                    const val = parseFloat(e.target.value) || 0;
                    setEditForm({ ...editForm, total_amount: val });
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono font-bold text-emerald-400 focus:outline-none focus:border-indigo-500"
                />

                {/* Breakdown Fields */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Principal Paid (₱)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editForm.principal_amount}
                      onChange={e => {
                        const val = parseFloat(e.target.value) || 0;
                        setEditForm({ ...editForm, principal_amount: val });
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Interest Paid (₱)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editForm.interest_amount}
                      onChange={e => {
                        const val = parseFloat(e.target.value) || 0;
                        setEditForm({ ...editForm, interest_amount: val });
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs font-mono text-purple-300 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Penalty Paid (₱)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editForm.penalty_amount}
                      onChange={e => {
                        const val = parseFloat(e.target.value) || 0;
                        setEditForm({ ...editForm, penalty_amount: val });
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs font-mono text-amber-300 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Fee Paid (₱)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editForm.fee_amount}
                      onChange={e => {
                        const val = parseFloat(e.target.value) || 0;
                        setEditForm({ ...editForm, fee_amount: val });
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs font-mono text-blue-300 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-slate-400">Sum of breakdown:</span>
                  <span className={`font-mono font-bold ${
                    Math.abs(currentAllocationSum - Number(editForm.total_amount)) <= 0.01
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                  }`}>
                    ₱{currentAllocationSum.toFixed(2)} / ₱{Number(editForm.total_amount).toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                  Reason for Adjustment / Audit Note <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Corrected interest allocation per amended amortization schedule; updated OR number."
                  value={editForm.adjustment_reason}
                  onChange={e => setEditForm({ ...editForm, adjustment_reason: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingPayment(null)}
                  disabled={isSavingAdjustment}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingAdjustment}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl cursor-pointer shadow flex items-center space-x-2"
                >
                  {isSavingAdjustment ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Recalculating Amortization...</span>
                    </>
                  ) : (
                    <span>Save Adjustment & Recalculate</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Feature: Void Confirmation Modal */}
      {voidConfirmPayment && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/30 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-2 text-rose-400 border-b border-slate-800 pb-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <h3 className="text-base font-bold text-white">Void / Reverse Loan Payment</h3>
            </div>

            <p className="text-xs text-slate-300">
              Are you sure you want to void payment <strong className="text-white">{voidConfirmPayment.receipt_no || voidConfirmPayment.id}</strong> of <strong className="text-emerald-400">₱{Number(voidConfirmPayment.amount ?? voidConfirmPayment.total_amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>?
            </p>
            <p className="text-[11px] text-slate-400">
              This will automatically restore the borrower's loan principal balance, reset amortization installments, and reverse the associated general ledger voucher.
            </p>

            <div>
              <label className="text-[11px] text-slate-400 font-semibold block mb-1">Reason for Voiding</label>
              <input
                type="text"
                required
                placeholder="e.g. Erroneous payment entry, bounced check, duplicate transaction"
                value={voidReason}
                onChange={e => setVoidReason(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setVoidConfirmPayment(null)}
                disabled={isVoiding}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmVoid}
                disabled={isVoiding}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl cursor-pointer shadow flex items-center space-x-1.5"
              >
                {isVoiding ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Reversing...</span>
                  </>
                ) : (
                  <span>Confirm Void</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
