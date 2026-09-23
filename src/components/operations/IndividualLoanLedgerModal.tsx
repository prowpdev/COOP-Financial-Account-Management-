import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  X,
  Printer,
  Download,
  Building2,
  User,
  Calendar,
  DollarSign,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  FileText,
  BadgePercent
} from 'lucide-react';
import { api } from '../../services/api';
import { Loan } from '../../types';

interface IndividualLoanLedgerModalProps {
  loan: Loan;
  onClose: () => void;
  onRepay?: () => void;
}

export const IndividualLoanLedgerModal: React.FC<IndividualLoanLedgerModalProps> = ({
  loan,
  onClose,
  onRepay
}) => {
  const [activeTab, setActiveTab] = useState<'ledger' | 'schedule' | 'payments'>('ledger');
  const [ledgerData, setLedgerData] = useState<any[]>([]);
  const [scheduleData, setScheduleData] = useState<any[]>([]);
  const [paymentsData, setPaymentsData] = useState<any[]>([]);
  const [loanDetails, setLoanDetails] = useState<any>(loan);
  const [isLoading, setIsLoading] = useState(true);

  const loadLedger = async () => {
    setIsLoading(true);
    try {
      const res = await api.getLoanLedger(loan.id);
      if (res.data) {
        setLoanDetails(res.data.loan || loan);
        setLedgerData(Array.isArray(res.data.ledger) ? res.data.ledger : []);
        setScheduleData(Array.isArray(res.data.schedule) ? res.data.schedule : []);
        setPaymentsData(Array.isArray(res.data.payments) ? res.data.payments : []);
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
      (l.debit_principal || 0).toFixed(2),
      (l.credit_principal || 0).toFixed(2),
      (l.interest_applied || 0).toFixed(2),
      (l.penalty_applied || 0).toFixed(2),
      (l.principal_balance || 0).toFixed(2),
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

  const principal = Number(loanDetails.principal_amount) || 0;
  const currentBalance = Number(loanDetails.current_balance) || 0;
  const principalPaid = Number(loanDetails.total_principal_paid) || Math.max(0, principal - currentBalance);
  const interestPaid = Number(loanDetails.total_interest_paid) || 0;
  const interestRate = Number(loanDetails.annual_interest_rate) || 0;
  const termMonths = Number(loanDetails.term_months) || 12;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-5xl w-full shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header Bar */}
        <div className="p-6 border-b border-slate-800/80 bg-slate-950/60 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase tracking-wider">
                Individual Borrower Loan Ledger
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
            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Principal Repaid</span>
            <div className="text-base font-bold text-emerald-300 mt-0.5">{formatMoney(principalPaid)}</div>
            <span className="text-[11px] text-emerald-400 font-medium">
              {principal > 0 ? ((principalPaid / principal) * 100).toFixed(1) : 0}% Amortized
            </span>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Outstanding Balance</span>
            <div className="text-base font-bold text-amber-300 mt-0.5">{formatMoney(currentBalance)}</div>
            <span className="text-[11px] text-slate-400 font-medium">Due by {loanDetails.maturity_date || '-'}</span>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">Interest Paid To-Date</span>
            <div className="text-base font-bold text-purple-300 mt-0.5">{formatMoney(interestPaid)}</div>
            <span className="text-[11px] text-slate-400 font-medium">Earned cooperative income</span>
          </div>
        </div>

        {/* Tab Navigator */}
        <div className="flex items-center space-x-2 px-6 pt-4 border-b border-slate-800 bg-slate-950/30">
          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'ledger'
                ? 'bg-slate-800 text-white border-t-2 border-blue-500'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
            <span>Running Loan Ledger</span>
          </button>

          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'schedule'
                ? 'bg-slate-800 text-white border-t-2 border-blue-500'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>Amortization Schedule ({scheduleData.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'payments'
                ? 'bg-slate-800 text-white border-t-2 border-blue-500'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Official Receipts Issued ({paymentsData.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading loan records and history...</div>
          ) : activeTab === 'ledger' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-400">
                  Itemized chronological debit (disbursements) and credit (amortization collections) running balance statement.
                </div>
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
                          {row.debit_principal > 0 ? `₱${Number(row.debit_principal).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right text-emerald-400 font-semibold">
                          {row.credit_principal > 0 ? `₱${Number(row.credit_principal).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right text-purple-300">
                          {row.interest_applied > 0 ? `₱${Number(row.interest_applied).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                        </td>
                        <td className="py-2.5 px-4 text-right text-amber-300 font-bold bg-slate-950/40">
                          ₱{Number(row.principal_balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
                Official amortization payment schedule generated using {loanDetails.interest_calculation_method || 'Diminishing Balance'} method.
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
                        <td className="py-2.5 px-3 text-right text-slate-200">{formatMoney(item.principal)}</td>
                        <td className="py-2.5 px-3 text-right text-slate-400">{formatMoney(item.interest)}</td>
                        <td className="py-2.5 px-3 text-right text-white font-bold">
                          {formatMoney((Number(item.principal) || 0) + (Number(item.interest) || 0))}
                        </td>
                        <td className="py-2.5 px-3 text-right text-emerald-400">{formatMoney(item.paid_principal || 0)}</td>
                        <td className="py-2.5 px-3 text-right text-purple-300">{formatMoney(item.paid_interest || 0)}</td>
                        <td className="py-2.5 px-3 text-center font-sans">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            item.status === 'Paid' ? 'bg-emerald-500/20 text-emerald-400' :
                            item.status === 'Partial' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {item.status || 'Pending'}
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
              <div className="text-xs text-slate-400">
                Official receipts (OR) issued for loan amortization collections.
              </div>
              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3">Receipt / OR #</th>
                      <th className="py-3 px-3 text-right text-emerald-400">Amount Paid (₱)</th>
                      <th className="py-3 px-3 text-right">Principal</th>
                      <th className="py-3 px-3 text-right">Interest</th>
                      <th className="py-3 px-3 text-right">Penalty</th>
                      <th className="py-3 px-3">Cash Account</th>
                      <th className="py-3 px-3">Received By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 bg-slate-900/50 font-mono">
                    {paymentsData.map((p, idx) => (
                      <tr key={p.id || idx} className="hover:bg-slate-800/40 transition">
                        <td className="py-2.5 px-3 font-sans text-slate-300">{p.payment_date}</td>
                        <td className="py-2.5 px-3 text-emerald-300 font-bold">{p.receipt_number || p.id}</td>
                        <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">
                          ₱{Number(p.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-200">{formatMoney(p.principal_paid || 0)}</td>
                        <td className="py-2.5 px-3 text-right text-purple-300">{formatMoney(p.interest_paid || 0)}</td>
                        <td className="py-2.5 px-3 text-right text-amber-300">{formatMoney(p.penalty_paid || 0)}</td>
                        <td className="py-2.5 px-3 font-sans text-slate-400">{p.cash_account_id}</td>
                        <td className="py-2.5 px-3 font-sans text-slate-400">{p.received_by}</td>
                      </tr>
                    ))}
                    {paymentsData.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-500 font-sans">
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
    </div>
  );
};
