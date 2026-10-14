import React from 'react';
import { X, Printer, Download, FileText, Building2, Calendar, UserCheck, ShieldCheck, CreditCard, PiggyBank, Landmark } from 'lucide-react';
import { CoopProfile, User } from '../../types';

export interface SubsidiaryLedgerAccount {
  id: string;
  account_number: string;
  ledger_type: 'loan' | 'savings' | 'share_capital' | string;
  member_id: string;
  member_no: string;
  member_name: string;
  member_address?: string;
  member_contact?: string;
  branch_id?: string;
  branch_name?: string;
  product_name: string;
  product_code?: string;
  interest_rate?: number;
  terms_months?: number;
  disbursement_date?: string;
  maturity_date?: string;
  status: string;
  original_principal?: number;
  current_balance: number;
  total_principal_paid?: number;
  total_interest_paid?: number;
  total_penalty_paid?: number;
  total_fees_paid?: number;
  total_deposits?: number;
  total_withdrawals?: number;
  subscribed_shares?: number;
  subscribed_amount?: number;
  entries_count: number;
  entries: SubsidiaryLedgerEntry[];
}

export interface SubsidiaryLedgerEntry {
  id: string;
  account_id: string;
  account_number: string;
  ledger_type: string;
  member_id: string;
  member_name: string;
  member_no: string;
  date: string;
  ref_no: string;
  description: string;
  type: string;
  debit: number;
  credit: number;
  principal_paid?: number;
  interest_paid?: number;
  penalty_paid?: number;
  fee_paid?: number;
  running_balance: number;
  running_shares?: number;
}

interface PrintableSubsidiaryLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  coopProfile?: CoopProfile;
  currentUser?: User;
  periodName: string;
  startDate?: string;
  endDate?: string;
  branchName: string;
  ledgerTypeFilter: string;
  selectedAccount?: SubsidiaryLedgerAccount | null;
  accounts: SubsidiaryLedgerAccount[];
  summary: {
    total_loans_disbursed: number;
    total_principal_collected: number;
    total_interest_collected: number;
    total_penalty_collected: number;
    total_outstanding_loans: number;
    total_savings_balance: number;
    total_savings_deposits: number;
    total_savings_withdrawals: number;
    total_share_capital_balance: number;
    total_shares_count: number;
    accounts_count: number;
    entries_count: number;
  };
}

export const PrintableSubsidiaryLedgerModal: React.FC<PrintableSubsidiaryLedgerModalProps> = ({
  isOpen,
  onClose,
  coopProfile,
  currentUser,
  periodName,
  startDate,
  endDate,
  branchName,
  ledgerTypeFilter,
  selectedAccount,
  accounts,
  summary
}) => {
  if (!isOpen) return null;

  const formatCurrency = (val: number | undefined) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }).format(val || 0);

  const handlePrint = () => {
    window.print();
  };

  const coopName = coopProfile?.name || 'Mayap Care Agriculture Cooperative';
  const regNo = coopProfile?.registration_no || 'CDA Reg. 9502-100234';
  const tin = (coopProfile as any)?.tin || 'TIN: 009-876-543-000';
  const address = coopProfile?.address || 'Poblacion Plaza, Tarlac City, Philippines';
  const contact = coopProfile?.phone || coopProfile?.contact_phone || '+63 (045) 982-1200';

  const accountsToRender = selectedAccount ? [selectedAccount] : accounts;

  const getLedgerTitle = () => {
    if (selectedAccount) {
      if (selectedAccount.ledger_type === 'loan') return 'LOAN SUBSIDIARY LEDGER STATEMENT';
      if (selectedAccount.ledger_type === 'savings') return 'SAVINGS DEPOSIT SUBSIDIARY LEDGER';
      return 'SHARE CAPITAL (CBU) SUBSIDIARY LEDGER';
    }
    if (ledgerTypeFilter === 'loans' || ledgerTypeFilter === 'loan') return 'LOANS SUBSIDIARY LEDGER AUDIT REPORT';
    if (ledgerTypeFilter === 'savings') return 'SAVINGS DEPOSITS SUBSIDIARY LEDGER REPORT';
    if (ledgerTypeFilter === 'share_capital' || ledgerTypeFilter === 'cbu') return 'SHARE CAPITAL (CBU) SUBSIDIARY LEDGER REPORT';
    return 'CONSOLIDATED SUBSIDIARY LEDGERS AUDIT STATEMENT';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[96vh] print:max-h-none print:h-auto print:border-none print:shadow-none print:bg-white print:text-black">
        {/* Interactive Topbar (Hidden on Print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 print:hidden bg-slate-950/60 rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                <span>{getLedgerTitle()}</span>
                {selectedAccount && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                    #{selectedAccount.account_number}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                Official CDA Audit-Grade Cooperative Statement · {periodName}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/40 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-6 sm:p-10 overflow-y-auto flex-1 print:p-6 print:overflow-visible print:text-black print:bg-white">
          <style dangerouslySetInnerHTML={{
            __html: `
              @media print {
                body {
                  background-color: white !important;
                  color: black !important;
                  font-size: 11pt;
                }
                nav, header, aside, .print\\:hidden {
                  display: none !important;
                }
                .page-break {
                  page-break-before: always;
                }
                .avoid-break {
                  page-break-inside: avoid;
                }
                table {
                  border-collapse: collapse !important;
                  width: 100% !important;
                }
                th, td {
                  border-color: #cbd5e1 !important;
                  color: black !important;
                }
                .print\\:text-black {
                  color: black !important;
                }
                .print\\:bg-slate-50 {
                  background-color: #f8fafc !important;
                }
              }
            `
          }} />

          {/* Official Cooperative Letterhead */}
          <div className="text-center pb-6 border-b-2 border-slate-700 print:border-black avoid-break">
            <div className="text-[10px] tracking-widest text-slate-400 print:text-slate-600 uppercase font-bold">
              Republic of the Philippines · Cooperative Development Authority
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white print:text-black tracking-tight mt-1">
              {coopName}
            </h1>
            <p className="text-xs text-slate-300 print:text-slate-700 mt-1">
              {address} · Contact: {contact}
            </p>
            <p className="text-[11px] font-mono text-emerald-400 print:text-slate-800 font-semibold mt-0.5">
              {regNo} · {tin}
            </p>

            <div className="mt-4 pt-3 border-t border-slate-800 print:border-slate-300">
              <h2 className="text-base sm:text-lg font-bold tracking-wide uppercase text-white print:text-black">
                {getLedgerTitle()}
              </h2>
              <div className="flex flex-wrap items-center justify-center gap-x-4 text-xs text-slate-400 print:text-slate-700 mt-1 font-mono">
                <span>Branch: <strong className="text-slate-200 print:text-black">{branchName}</strong></span>
                <span>·</span>
                <span>Period: <strong className="text-slate-200 print:text-black">{startDate && endDate ? `${startDate} to ${endDate}` : periodName}</strong></span>
                <span>·</span>
                <span>Generated: <strong className="text-slate-200 print:text-black">{new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong></span>
              </div>
            </div>
          </div>

          {/* If Single Account Selected: Individual Profile Card */}
          {selectedAccount && (
            <div className="my-6 p-4 rounded-xl border border-slate-700 print:border-slate-300 bg-slate-950/40 print:bg-slate-50 avoid-break">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-[10px] uppercase text-slate-400 print:text-slate-600 font-bold block">Member Name & ID</span>
                  <p className="font-bold text-white print:text-black text-sm">{selectedAccount.member_name}</p>
                  <p className="font-mono text-slate-400 print:text-slate-600">{selectedAccount.member_no}</p>
                </div>

                <div>
                  <span className="text-[10px] uppercase text-slate-400 print:text-slate-600 font-bold block">Account Number & Type</span>
                  <p className="font-mono font-bold text-emerald-400 print:text-emerald-700 text-sm">#{selectedAccount.account_number}</p>
                  <p className="text-slate-300 print:text-slate-700">{selectedAccount.product_name}</p>
                </div>

                <div>
                  <span className="text-[10px] uppercase text-slate-400 print:text-slate-600 font-bold block">
                    {selectedAccount.ledger_type === 'loan' ? 'Terms & Interest' : 'Account Details'}
                  </span>
                  {selectedAccount.ledger_type === 'loan' ? (
                    <>
                      <p className="font-medium text-slate-200 print:text-black">
                        {selectedAccount.terms_months} mos. @ {selectedAccount.interest_rate}% p.a.
                      </p>
                      <p className="text-slate-400 print:text-slate-600 text-[11px]">
                        Maturity: {selectedAccount.maturity_date || 'N/A'}
                      </p>
                    </>
                  ) : selectedAccount.ledger_type === 'share_capital' ? (
                    <>
                      <p className="font-medium text-slate-200 print:text-black">
                        Subscribed: {selectedAccount.subscribed_shares || 0} shares
                      </p>
                      <p className="text-slate-400 print:text-slate-600 text-[11px]">
                        Target: {formatCurrency(selectedAccount.subscribed_amount)}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium text-slate-200 print:text-black">
                        Rate: {selectedAccount.interest_rate || 0}% p.a.
                      </p>
                      <p className="text-slate-400 print:text-slate-600 text-[11px]">
                        Total Deposits: {formatCurrency(selectedAccount.total_deposits)}
                      </p>
                    </>
                  )}
                </div>

                <div>
                  <span className="text-[10px] uppercase text-slate-400 print:text-slate-600 font-bold block">
                    {selectedAccount.ledger_type === 'loan' ? 'Outstanding Principal Balance' : 'Current Book Balance'}
                  </span>
                  <p className="font-mono font-black text-base text-emerald-400 print:text-emerald-800">
                    {formatCurrency(selectedAccount.current_balance)}
                  </p>
                  <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 print:bg-slate-200 text-slate-200 print:text-slate-800">
                    Status: {selectedAccount.status}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Macro Summary KPI Strip (If multiple accounts) */}
          {!selectedAccount && (
            <div className="my-6 grid grid-cols-2 sm:grid-cols-4 gap-3 avoid-break">
              {['all', 'loans', 'loan'].includes(ledgerTypeFilter) && (
                <>
                  <div className="p-3 rounded-xl border border-slate-800 print:border-slate-300 bg-slate-950/40 print:bg-slate-50">
                    <span className="text-[10px] text-slate-400 print:text-slate-600 uppercase font-bold block">Total Disbursed</span>
                    <p className="text-sm sm:text-base font-bold font-mono text-white print:text-black">
                      {formatCurrency(summary.total_loans_disbursed)}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-800 print:border-slate-300 bg-slate-950/40 print:bg-slate-50">
                    <span className="text-[10px] text-slate-400 print:text-slate-600 uppercase font-bold block">Outstanding Loans</span>
                    <p className="text-sm sm:text-base font-bold font-mono text-emerald-400 print:text-emerald-700">
                      {formatCurrency(summary.total_outstanding_loans)}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-800 print:border-slate-300 bg-slate-950/40 print:bg-slate-50">
                    <span className="text-[10px] text-slate-400 print:text-slate-600 uppercase font-bold block">Principal Collected</span>
                    <p className="text-sm sm:text-base font-bold font-mono text-slate-200 print:text-black">
                      {formatCurrency(summary.total_principal_collected)}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-800 print:border-slate-300 bg-slate-950/40 print:bg-slate-50">
                    <span className="text-[10px] text-slate-400 print:text-slate-600 uppercase font-bold block">Interest & Fees</span>
                    <p className="text-sm sm:text-base font-bold font-mono text-amber-400 print:text-amber-800">
                      {formatCurrency(summary.total_interest_collected + summary.total_penalty_collected)}
                    </p>
                  </div>
                </>
              )}

              {['all', 'savings'].includes(ledgerTypeFilter) && (
                <div className="p-3 rounded-xl border border-slate-800 print:border-slate-300 bg-slate-950/40 print:bg-slate-50">
                  <span className="text-[10px] text-slate-400 print:text-slate-600 uppercase font-bold block">Total Savings Balance</span>
                  <p className="text-sm sm:text-base font-bold font-mono text-teal-400 print:text-teal-700">
                    {formatCurrency(summary.total_savings_balance)}
                  </p>
                </div>
              )}

              {['all', 'share_capital', 'cbu'].includes(ledgerTypeFilter) && (
                <div className="p-3 rounded-xl border border-slate-800 print:border-slate-300 bg-slate-950/40 print:bg-slate-50">
                  <span className="text-[10px] text-slate-400 print:text-slate-600 uppercase font-bold block">Paid-Up Share Capital</span>
                  <p className="text-sm sm:text-base font-bold font-mono text-indigo-400 print:text-indigo-700">
                    {formatCurrency(summary.total_share_capital_balance)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Account Statements Loop */}
          {accountsToRender.length === 0 ? (
            <div className="text-center py-12 text-slate-400 print:text-slate-600 font-mono text-xs border border-dashed border-slate-700 print:border-slate-300 rounded-xl my-6">
              No subsidiary ledger movements recorded for the selected parameters.
            </div>
          ) : (
            accountsToRender.map((acc, accIdx) => (
              <div
                key={acc.id}
                className={`my-6 border border-slate-700 print:border-slate-400 rounded-xl overflow-hidden avoid-break ${accIdx > 0 && selectedAccount ? 'page-break' : ''}`}
              >
                {/* Account Mini-Header Bar */}
                <div className="bg-slate-800/80 print:bg-slate-100 px-4 py-2.5 border-b border-slate-700 print:border-slate-300 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-emerald-400 print:text-black">
                      #{acc.account_number}
                    </span>
                    <span className="text-slate-400 print:text-slate-500">|</span>
                    <span className="text-xs font-bold text-white print:text-black">
                      {acc.member_name} ({acc.member_no})
                    </span>
                    <span className="text-slate-400 print:text-slate-500">·</span>
                    <span className="text-xs text-slate-300 print:text-slate-700">
                      {acc.product_name}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 text-xs">
                    {acc.ledger_type === 'loan' && (
                      <span className="text-slate-300 print:text-slate-700">
                        Disbursed: <strong className="font-mono text-white print:text-black">{formatCurrency(acc.original_principal)}</strong>
                      </span>
                    )}
                    <span className="text-slate-300 print:text-slate-700">
                      Balance: <strong className="font-mono text-emerald-400 print:text-black">{formatCurrency(acc.current_balance)}</strong>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 print:bg-white border border-slate-700 print:border-slate-300 font-bold uppercase text-slate-300 print:text-slate-800">
                      {acc.status}
                    </span>
                  </div>
                </div>

                {/* Ledger Movement Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-950/60 print:bg-slate-200 text-slate-300 print:text-black border-b border-slate-700 print:border-slate-300">
                        <th className="py-2 px-3 font-semibold w-24">Date</th>
                        <th className="py-2 px-3 font-semibold w-28">Ref / OR #</th>
                        <th className="py-2 px-3 font-semibold">Transaction Particulars</th>
                        <th className="py-2 px-3 font-semibold text-right w-24">Debit (₱)</th>
                        <th className="py-2 px-3 font-semibold text-right w-24">Credit (₱)</th>
                        {acc.ledger_type === 'loan' && (
                          <>
                            <th className="py-2 px-3 font-semibold text-right w-24">Principal (₱)</th>
                            <th className="py-2 px-3 font-semibold text-right w-24">Interest (₱)</th>
                          </>
                        )}
                        <th className="py-2 px-3 font-semibold text-right w-28">Balance (₱)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 print:divide-slate-200">
                      {acc.entries.length === 0 ? (
                        <tr>
                          <td colSpan={acc.ledger_type === 'loan' ? 8 : 6} className="py-4 text-center text-slate-400 print:text-slate-500 italic">
                            No ledger movements recorded in this period.
                          </td>
                        </tr>
                      ) : (
                        acc.entries.map((entry) => (
                          <tr key={entry.id} className="hover:bg-slate-800/40 print:hover:bg-transparent">
                            <td className="py-1.5 px-3 font-mono text-[11px] text-slate-300 print:text-black whitespace-nowrap">
                              {entry.date}
                            </td>
                            <td className="py-1.5 px-3 font-mono text-[11px] text-slate-400 print:text-black whitespace-nowrap">
                              {entry.ref_no}
                            </td>
                            <td className="py-1.5 px-3 text-slate-200 print:text-black">
                              <span className="font-medium">{entry.description}</span>
                            </td>
                            <td className="py-1.5 px-3 font-mono text-right text-slate-300 print:text-black whitespace-nowrap">
                              {entry.debit > 0 ? entry.debit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                            </td>
                            <td className="py-1.5 px-3 font-mono text-right text-slate-300 print:text-black whitespace-nowrap">
                              {entry.credit > 0 ? entry.credit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                            </td>
                            {acc.ledger_type === 'loan' && (
                              <>
                                <td className="py-1.5 px-3 font-mono text-right text-emerald-400 print:text-black whitespace-nowrap">
                                  {entry.principal_paid && entry.principal_paid > 0 ? entry.principal_paid.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                                </td>
                                <td className="py-1.5 px-3 font-mono text-right text-amber-400 print:text-black whitespace-nowrap">
                                  {entry.interest_paid && entry.interest_paid > 0 ? entry.interest_paid.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                                </td>
                              </>
                            )}
                            <td className="py-1.5 px-3 font-mono font-bold text-right text-white print:text-black whitespace-nowrap">
                              {entry.running_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot className="bg-slate-950/80 print:bg-slate-100 font-bold border-t border-slate-700 print:border-slate-300">
                      <tr>
                        <td colSpan={3} className="py-2 px-3 text-right uppercase text-[10px] text-slate-400 print:text-slate-700">
                          Account Closing Balance
                        </td>
                        <td className="py-2 px-3 font-mono text-right text-slate-300 print:text-black">
                          {acc.entries.reduce((s, e) => s + (e.debit || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 px-3 font-mono text-right text-slate-300 print:text-black">
                          {acc.entries.reduce((s, e) => s + (e.credit || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        {acc.ledger_type === 'loan' && (
                          <>
                            <td className="py-2 px-3 font-mono text-right text-emerald-400 print:text-black">
                              {(acc.total_principal_paid || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2 px-3 font-mono text-right text-amber-400 print:text-black">
                              {(acc.total_interest_paid || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                          </>
                        )}
                        <td className="py-2 px-3 font-mono font-black text-right text-emerald-400 print:text-black text-xs">
                          {acc.current_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ))
          )}

          {/* Audit Verification & Certification Sign-Off Block */}
          <div className="mt-12 pt-6 border-t-2 border-slate-700 print:border-black avoid-break">
            <p className="text-[10px] text-slate-400 print:text-slate-600 mb-6 italic">
              Certification: I hereby certify that the individual subsidiary ledger entries above represent genuine, authenticated cooperative transactions reconciled with official receipts, disbursement vouchers, and general ledger accounts in accordance with CDA Financial Reporting Framework.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center text-xs">
              <div>
                <div className="border-b border-slate-600 print:border-black pb-1 mb-1 font-semibold text-slate-200 print:text-black">
                  {currentUser?.name || 'Authorized Bookkeeper'}
                </div>
                <span className="text-[11px] text-slate-400 print:text-slate-600 uppercase font-medium">Prepared by / Bookkeeper</span>
              </div>

              <div>
                <div className="border-b border-slate-600 print:border-black pb-1 mb-1 font-semibold text-slate-200 print:text-black">
                  CPA / Audit & Inventory Committee
                </div>
                <span className="text-[11px] text-slate-400 print:text-slate-600 uppercase font-medium">Verified by / Internal Auditor</span>
              </div>

              <div>
                <div className="border-b border-slate-600 print:border-black pb-1 mb-1 font-semibold text-slate-200 print:text-black">
                  {coopProfile?.manager_name || 'General Manager'}
                </div>
                <span className="text-[11px] text-slate-400 print:text-slate-600 uppercase font-medium">Approved by / General Manager</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
