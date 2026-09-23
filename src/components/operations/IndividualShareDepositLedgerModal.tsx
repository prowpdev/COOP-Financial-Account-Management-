import React, { useState, useEffect } from 'react';
import {
  Coins,
  X,
  Printer,
  Download,
  Building2,
  User,
  Calendar,
  DollarSign,
  ArrowDownLeft,
  CheckCircle2,
  FileSpreadsheet,
  Layers,
  FileText
} from 'lucide-react';
import { api } from '../../services/api';
import { ShareCapitalAccount } from '../../types';

interface IndividualShareDepositLedgerModalProps {
  account: ShareCapitalAccount;
  onClose: () => void;
  onNewDeposit?: () => void;
}

export const IndividualShareDepositLedgerModal: React.FC<IndividualShareDepositLedgerModalProps> = ({
  account,
  onClose,
  onNewDeposit
}) => {
  const [ledgerData, setLedgerData] = useState<any[]>([]);
  const [accountDetails, setAccountDetails] = useState<any>(account);
  const [isLoading, setIsLoading] = useState(true);

  const loadLedger = async () => {
    setIsLoading(true);
    try {
      const res = await api.getShareCapitalLedger(account.id);
      if (res.data) {
        setAccountDetails(res.data.account || account);
        setLedgerData(Array.isArray(res.data.ledger) ? res.data.ledger : []);
      }
    } catch (err) {
      console.warn('Failed to load share capital ledger:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLedger();
  }, [account.id]);

  const formatMoney = (val: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val || 0);

  const exportCSV = () => {
    const headers = [
      'Date',
      'OR / Reference No.',
      'Particulars / Description',
      'Shares Subscribed / In',
      'Shares Out',
      'Cumulative Shares',
      'Deposit Amount (₱)',
      'Withdrawal / Reduction (₱)',
      'Paid-Up Share Balance (₱)',
      'Collecting Officer'
    ];

    const rows = ledgerData.map(l => [
      `"${l.date || ''}"`,
      `"${l.reference_no || ''}"`,
      `"${(l.description || '').replace(/"/g, '""')}"`,
      l.shares_in || 0,
      l.shares_out || 0,
      l.running_shares || 0,
      (l.amount_in || 0).toFixed(2),
      (l.amount_out || 0).toFixed(2),
      (l.running_paid_up_amount || 0).toFixed(2),
      `"${l.performed_by || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Share_Deposit_Ledger_${accountDetails.account_number || account.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parValue = Number(accountDetails.par_value) || 100;
  const subscribedShares = Number(accountDetails.subscribed_shares) || 0;
  const subscribedAmount = Number(accountDetails.subscribed_amount) || (subscribedShares * parValue);
  const paidUpShares = Number(accountDetails.paid_up_shares) || 0;
  const paidUpAmount = Number(accountDetails.paid_up_amount) || (paidUpShares * parValue);
  const unpaidBalance = Math.max(0, subscribedAmount - paidUpAmount);
  const fulfillmentPct = subscribedAmount > 0 ? Math.min(100, Math.round((paidUpAmount / subscribedAmount) * 100)) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-5xl w-full shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header Bar */}
        <div className="p-6 border-b border-slate-800/80 bg-slate-950/60 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                Individual Share Deposit Ledger
              </span>
              <span className="text-xs font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700">
                {accountDetails.account_number}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                accountDetails.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
              }`}>
                {accountDetails.status || 'Active'}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-400" />
              <span>{accountDetails.member_name || 'Member Shareholder'}</span>
              <span className="text-xs text-slate-400 font-normal font-mono">({accountDetails.member_no || 'CBU Member'})</span>
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                {accountDetails.branch_name || 'Main Branch'}
              </span>
              <span>•</span>
              <span>Par Value: <strong className="text-slate-200">₱{parValue.toLocaleString()} / share</strong></span>
              <span>•</span>
              <span>Cooperative Equity GL: <strong className="text-emerald-400 font-mono">3110 (Paid-Up Share Capital)</strong></span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={exportCSV}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 cursor-pointer transition"
              title="Export Ledger to CSV"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => window.print()}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 cursor-pointer transition"
              title="Print Ledger Statement"
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

        {/* CBU Subscription & Paid-up Financial Summary Cards */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-900/90 border-b border-slate-800">
          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Subscribed Capital</span>
            <div className="text-base font-bold text-white mt-0.5">{formatMoney(subscribedAmount)}</div>
            <span className="text-[11px] text-amber-400 font-medium">{subscribedShares.toLocaleString()} shares</span>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Paid-Up Capital Balance</span>
            <div className="text-base font-bold text-emerald-300 mt-0.5">{formatMoney(paidUpAmount)}</div>
            <span className="text-[11px] text-emerald-400 font-medium">{paidUpShares.toLocaleString()} shares paid</span>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Unpaid Subscription</span>
            <div className="text-base font-bold text-rose-300 mt-0.5">{formatMoney(unpaidBalance)}</div>
            <span className="text-[11px] text-slate-400 font-medium">{Math.max(0, subscribedShares - paidUpShares).toLocaleString()} remaining shares</span>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Fulfillment</span>
              <span className="text-xs font-bold text-emerald-400">{fulfillmentPct}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mt-2">
              <div
                className={`h-full rounded-full transition-all duration-500 ${fulfillmentPct >= 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                style={{ width: `${fulfillmentPct}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              {fulfillmentPct >= 100 ? 'Fully Paid Member' : 'Active Capital Build-up'}
            </div>
          </div>
        </div>

        {/* Ledger Transaction Statement Table */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileSpreadsheet className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Itemized Share Deposit & Contribution History
              </h3>
            </div>
            {onNewDeposit && (
              <button
                onClick={onNewDeposit}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow transition cursor-pointer"
              >
                <Coins className="w-3.5 h-3.5" />
                <span>Record Share Deposit (OR)</span>
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading member share ledger records...</div>
          ) : ledgerData.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl">
              <Coins className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400 font-medium">No deposit transactions recorded yet for this member.</p>
              <p className="text-[11px] text-slate-500 mt-1">Use the "Deposit" button to post share capital contributions with Official Receipts.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">OR / Ref No.</th>
                    <th className="py-3 px-4">Particulars & Remarks</th>
                    <th className="py-3 px-3 text-right">Shares In</th>
                    <th className="py-3 px-3 text-right">Total Shares</th>
                    <th className="py-3 px-3 text-right text-emerald-400">Deposit Amount (₱)</th>
                    <th className="py-3 px-4 text-right text-white">Paid-Up Balance (₱)</th>
                    <th className="py-3 px-3">Collecting Officer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-slate-900/50 font-mono">
                  {ledgerData.map((row, idx) => (
                    <tr key={row.id || idx} className="hover:bg-slate-800/40 transition">
                      <td className="py-2.5 px-3 text-slate-300 font-sans whitespace-nowrap">{row.date}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[11px]">
                          {row.reference_no}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-sans text-slate-200 min-w-48">{row.description}</td>
                      <td className="py-2.5 px-3 text-right text-amber-300 font-semibold">
                        +{row.shares_in || 0}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-300">
                        {row.running_shares || 0} sh
                      </td>
                      <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">
                        ₱{(Number(row.amount_in) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-4 text-right text-white font-bold bg-slate-950/40">
                        ₱{(Number(row.running_paid_up_amount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-400 whitespace-nowrap">{row.performed_by}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-950 font-semibold text-white border-t border-slate-800 text-xs">
                  <tr>
                    <td colSpan={3} className="py-3 px-3 uppercase tracking-wider text-slate-400">
                      Total Verified Share Capital Paid-Up
                    </td>
                    <td className="py-3 px-3 text-right text-amber-400 font-mono">
                      {paidUpShares.toLocaleString()} sh
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400 font-mono">
                      {paidUpShares.toLocaleString()} sh
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-400 font-mono font-bold">
                      {formatMoney(paidUpAmount)}
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-400 font-mono font-bold bg-slate-950/80">
                      {formatMoney(paidUpAmount)}
                    </td>
                    <td className="py-3 px-3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>Official CDA Member Share Register Subsidiary Ledger</span>
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
