import React from 'react';
import { X, Printer, Download, FileText, CheckCircle2, Building2, Calendar, ShieldCheck } from 'lucide-react';
import { CoopProfile, User } from '../../types';

interface PrintableReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  coopProfile?: CoopProfile;
  currentUser?: User;
  periodName: string;
  startDate: string;
  endDate: string;
  branchName: string;
  activeSheet: 'gl' | 'member';
  selectedGlAccountsCount: number;
  totalGlAccountsCount: number;
  selectedMemberName?: string;
  glLines: any[];
  memberTransactions: any[];
  totals: {
    totalDebit: number;
    totalCredit: number;
    netBalance?: number;
    rowCount: number;
  };
}

export const PrintableReportModal: React.FC<PrintableReportModalProps> = ({
  isOpen,
  onClose,
  coopProfile,
  currentUser,
  periodName,
  startDate,
  endDate,
  branchName,
  activeSheet,
  selectedGlAccountsCount,
  totalGlAccountsCount,
  selectedMemberName,
  glLines,
  memberTransactions,
  totals
}) => {
  if (!isOpen) return null;

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val || 0);

  const handlePrint = () => {
    window.print();
  };

  const coopName = coopProfile?.name || 'Mayap Care Agriculture Cooperative';
  const regNo = coopProfile?.registration_no || 'CDA Reg. 9502-100234';
  const address = coopProfile?.address || 'Poblacion Plaza, Tarlac City, Philippines';
  const contact = coopProfile?.phone || coopProfile?.contact_phone || '+63 (045) 982-1200';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[95vh] print:max-h-none print:h-auto print:border-none print:shadow-none print:bg-white print:text-black">
        {/* Header Controls (Hidden on Print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 print:hidden bg-slate-950/40 rounded-t-2xl">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold text-white">Audit & Regulatory Printable Report Preview</h2>
            <span className="text-xs text-slate-400">· {periodName}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Content */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 print:p-6 print:overflow-visible print:text-black print:bg-white">
          <style dangerouslySetInnerHTML={{
            __html: `
              @media print {
                body {
                  background-color: white !important;
                  color: black !important;
                }
                nav, header, aside, .print\\:hidden {
                  display: none !important;
                }
                .print\\:text-black {
                  color: black !important;
                }
                .print\\:border-black {
                  border-color: #333 !important;
                }
                table {
                  border-collapse: collapse !important;
                  width: 100% !important;
                }
                th, td {
                  border: 1px solid #ccc !important;
                  padding: 4px 6px !important;
                  font-size: 10px !important;
                }
              }
            `
          }} />

          {/* Letterhead */}
          <div className="text-center pb-6 border-b border-slate-700 print:border-black">
            <div className="flex justify-center mb-1">
              <span className="text-xs font-bold tracking-widest uppercase text-emerald-400 print:text-gray-700">
                Cooperative Development Authority (CDA) Standard Audit Filing
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white print:text-black tracking-tight">
              {coopName}
            </h1>
            <p className="text-xs text-slate-300 print:text-gray-700 mt-0.5">
              {regNo} · {address} · Tel: {contact}
            </p>
            <h2 className="text-sm font-bold text-emerald-400 print:text-black mt-3 uppercase tracking-wider">
              {activeSheet === 'gl' ? 'General Ledger Transaction Journal' : 'Member Subsidiary Ledger Report'}
            </h2>
            <div className="flex flex-wrap justify-center items-center gap-3 text-xs text-slate-400 print:text-gray-600 mt-1">
              <span><strong>Period:</strong> {periodName} ({startDate} to {endDate})</span>
              <span>·</span>
              <span><strong>Branch:</strong> {branchName}</span>
              <span>·</span>
              <span><strong>GL Scope:</strong> {selectedGlAccountsCount} of {totalGlAccountsCount} Accounts</span>
              {selectedMemberName && (
                <>
                  <span>·</span>
                  <span><strong>Member:</strong> {selectedMemberName}</span>
                </>
              )}
            </div>
          </div>

          {/* Key Summary Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5 p-3 rounded-xl bg-slate-950/60 border border-slate-800 print:bg-gray-50 print:border-gray-300 print:text-black text-xs">
            <div>
              <span className="text-slate-400 print:text-gray-600 block text-[10px] uppercase">Total Transactions</span>
              <span className="font-mono font-bold text-white print:text-black text-sm">{totals.rowCount} Lines</span>
            </div>
            <div>
              <span className="text-slate-400 print:text-gray-600 block text-[10px] uppercase">Total Debit</span>
              <span className="font-mono font-bold text-emerald-400 print:text-black text-sm">
                {formatCurrency(totals.totalDebit)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 print:text-gray-600 block text-[10px] uppercase">Total Credit</span>
              <span className="font-mono font-bold text-blue-400 print:text-black text-sm">
                {formatCurrency(totals.totalCredit)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 print:text-gray-600 block text-[10px] uppercase">Net / Variance</span>
              <span className="font-mono font-bold text-white print:text-black text-sm">
                {formatCurrency(totals.netBalance || (totals.totalDebit - totals.totalCredit))}
              </span>
            </div>
          </div>

          {/* Table Data */}
          {activeSheet === 'gl' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-800 print:border-gray-300">
                <thead className="bg-slate-950 text-slate-300 print:bg-gray-100 print:text-black border-b border-slate-800 print:border-gray-300 font-semibold">
                  <tr>
                    <th className="py-2 px-2.5">Date</th>
                    <th className="py-2 px-2.5">Voucher #</th>
                    <th className="py-2 px-2.5">GL Code</th>
                    <th className="py-2 px-2.5">Account Title</th>
                    <th className="py-2 px-2.5">Description / Memo</th>
                    <th className="py-2 px-2.5 text-right">Debit (₱)</th>
                    <th className="py-2 px-2.5 text-right">Credit (₱)</th>
                    <th className="py-2 px-2.5 text-right">Balance (₱)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 print:divide-gray-200 text-slate-200 print:text-black">
                  {glLines.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-6 text-slate-400 print:text-gray-500">
                        No transactions found for the selected period and GL accounts.
                      </td>
                    </tr>
                  ) : (
                    glLines.map((row, idx) => (
                      <tr key={row.id || idx} className="hover:bg-slate-800/40 print:hover:bg-transparent">
                        <td className="py-1.5 px-2.5 font-mono text-[11px] whitespace-nowrap">{row.posting_date}</td>
                        <td className="py-1.5 px-2.5 font-mono text-[11px] font-semibold text-emerald-400 print:text-black">{row.voucher_number}</td>
                        <td className="py-1.5 px-2.5 font-mono text-[11px] text-slate-400 print:text-black">{row.account_code}</td>
                        <td className="py-1.5 px-2.5 font-medium">{row.account_name}</td>
                        <td className="py-1.5 px-2.5 max-w-xs truncate text-slate-400 print:text-gray-700">
                          {row.description}
                          {row.member_name && <span className="text-emerald-400 print:text-black ml-1">({row.member_name})</span>}
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-mono tabular-nums">
                          {row.debit > 0 ? Number(row.debit).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-mono tabular-nums">
                          {row.credit > 0 ? Number(row.credit).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-mono tabular-nums font-semibold">
                          {Number(row.running_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="bg-slate-950/80 font-bold border-t-2 border-slate-700 print:border-black print:bg-gray-100">
                  <tr>
                    <td colSpan={5} className="py-2 px-2.5 uppercase tracking-wider text-right">
                      Grand Totals ({glLines.length} Entries)
                    </td>
                    <td className="py-2 px-2.5 text-right font-mono tabular-nums text-emerald-400 print:text-black">
                      {formatCurrency(totals.totalDebit)}
                    </td>
                    <td className="py-2 px-2.5 text-right font-mono tabular-nums text-blue-400 print:text-black">
                      {formatCurrency(totals.totalCredit)}
                    </td>
                    <td className="py-2 px-2.5 text-right font-mono tabular-nums">
                      {formatCurrency(totals.netBalance || (totals.totalDebit - totals.totalCredit))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-800 print:border-gray-300">
                <thead className="bg-slate-950 text-slate-300 print:bg-gray-100 print:text-black border-b border-slate-800 print:border-gray-300 font-semibold">
                  <tr>
                    <th className="py-2 px-2.5">Date</th>
                    <th className="py-2 px-2.5">Member #</th>
                    <th className="py-2 px-2.5">Member Name</th>
                    <th className="py-2 px-2.5">Type</th>
                    <th className="py-2 px-2.5">Reference / OR</th>
                    <th className="py-2 px-2.5">GL Code</th>
                    <th className="py-2 px-2.5 text-right">Debit / Out (₱)</th>
                    <th className="py-2 px-2.5 text-right">Credit / In (₱)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 print:divide-gray-200 text-slate-200 print:text-black">
                  {memberTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-6 text-slate-400 print:text-gray-500">
                        No member transactions found for this period.
                      </td>
                    </tr>
                  ) : (
                    memberTransactions.map((row, idx) => (
                      <tr key={row.id || idx} className="hover:bg-slate-800/40 print:hover:bg-transparent">
                        <td className="py-1.5 px-2.5 font-mono text-[11px] whitespace-nowrap">{row.date}</td>
                        <td className="py-1.5 px-2.5 font-mono text-[11px] font-semibold text-emerald-400 print:text-black">{row.member_no}</td>
                        <td className="py-1.5 px-2.5 font-medium">{row.member_name}</td>
                        <td className="py-1.5 px-2.5 text-slate-300 print:text-black">{row.product_type}</td>
                        <td className="py-1.5 px-2.5 font-mono text-[11px] text-slate-400 print:text-black">{row.reference_no}</td>
                        <td className="py-1.5 px-2.5 font-mono text-[11px]">{row.gl_code}</td>
                        <td className="py-1.5 px-2.5 text-right font-mono tabular-nums">
                          {row.debit > 0 ? Number(row.debit).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-mono tabular-nums">
                          {row.credit > 0 ? Number(row.credit).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="bg-slate-950/80 font-bold border-t-2 border-slate-700 print:border-black print:bg-gray-100">
                  <tr>
                    <td colSpan={6} className="py-2 px-2.5 uppercase tracking-wider text-right">
                      Grand Totals ({memberTransactions.length} Transactions)
                    </td>
                    <td className="py-2 px-2.5 text-right font-mono tabular-nums text-emerald-400 print:text-black">
                      {formatCurrency(totals.totalDebit)}
                    </td>
                    <td className="py-2 px-2.5 text-right font-mono tabular-nums text-blue-400 print:text-black">
                      {formatCurrency(totals.totalCredit)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Audit & Compliance Signature Block */}
          <div className="mt-10 pt-6 border-t border-slate-700 print:border-gray-400 grid grid-cols-3 gap-6 text-center text-xs print:text-black">
            <div>
              <p className="font-bold text-white print:text-black">{currentUser?.name || 'Chief Accountant'}</p>
              <p className="text-[11px] text-slate-400 print:text-gray-600">{currentUser?.role_name || 'Senior Accountant'}</p>
              <div className="w-3/4 mx-auto border-t border-slate-600 print:border-black mt-8 pt-1 text-[10px] uppercase text-slate-400 print:text-gray-600">
                Prepared By
              </div>
            </div>
            <div>
              <p className="font-bold text-white print:text-black">Internal Audit Committee</p>
              <p className="text-[11px] text-slate-400 print:text-gray-600">Audit & Supervisory Committee</p>
              <div className="w-3/4 mx-auto border-t border-slate-600 print:border-black mt-8 pt-1 text-[10px] uppercase text-slate-400 print:text-gray-600">
                Verified & Reconciled By
              </div>
            </div>
            <div>
              <p className="font-bold text-white print:text-black">Board Chairperson / General Manager</p>
              <p className="text-[11px] text-slate-400 print:text-gray-600">Executive Management</p>
              <div className="w-3/4 mx-auto border-t border-slate-600 print:border-black mt-8 pt-1 text-[10px] uppercase text-slate-400 print:text-gray-600">
                Approved By
              </div>
            </div>
          </div>

          <div className="mt-8 text-center text-[10px] text-slate-500 print:text-gray-500">
            System Timestamp: {new Date().toISOString()} · Authenticated Cooperative Ledger Session
          </div>
        </div>
      </div>
    </div>
  );
};
