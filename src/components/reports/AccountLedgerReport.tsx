import React, { useEffect, useMemo, useState } from 'react';
import { Download, Printer } from 'lucide-react';
import { Account, Branch, JournalEntry } from '../../types';

interface AccountLedgerReportProps {
  accounts: Account[];
  journals: JournalEntry[];
  branches: Branch[];
  selectedBranch: string;
}

type LedgerRow = {
  id: string;
  date: string;
  voucher: string;
  source: string;
  particulars: string;
  branch: string;
  debit: number;
  credit: number;
  balance: number;
};

const money = (value: number) => new Intl.NumberFormat('en-PH', {
  style: 'currency', currency: 'PHP'
}).format(value || 0);

const csvCell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;

export const AccountLedgerReport: React.FC<AccountLedgerReportProps> = ({
  accounts, journals, branches, selectedBranch
}) => {
  const [accountId, setAccountId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const account = accounts.find(item => item.id === accountId);

  // Start on an account that has posted entries. The old first account was a
  // control account (1100), which legitimately has no direct journal lines.
  useEffect(() => {
    if (accountId || !accounts.length) return;
    const accountWithEntries = accounts.find(item => journals.some(journal =>
      (journal.lines || []).some(line => line.account_id === item.id)
    ));
    setAccountId(accountWithEntries?.id || accounts[0].id);
  }, [accountId, accounts, journals]);

  const sourceRows = useMemo(() => journals.flatMap(journal =>
    (journal.lines || [])
      .filter(line => line.account_id === accountId)
      .map((line, index) => ({
        id: `${journal.id}-${line.id || index}`,
        date: journal.posting_date,
        voucher: journal.voucher_number,
        source: journal.reference_type,
        particulars: journal.description,
        branch: branches.find(branch => branch.id === journal.branch_id)?.name || 'Main Branch',
        branchId: journal.branch_id,
        debit: Number(line.debit) || 0,
        credit: Number(line.credit) || 0
      }))
  ).filter(row => selectedBranch === 'all' || row.branchId === selectedBranch)
    .sort((a, b) => a.date.localeCompare(b.date) || a.voucher.localeCompare(b.voucher)),
    [journals, accountId, branches, selectedBranch]);

  const normalMultiplier = account?.normal_balance === 'Credit' ? -1 : 1;
  const openingBalance = sourceRows
    .filter(row => !fromDate || row.date < fromDate)
    .reduce((sum, row) => sum + (row.debit - row.credit) * normalMultiplier, 0);

  const rows = useMemo(() => {
    let balance = openingBalance;
    return sourceRows
      .filter(row => (!fromDate || row.date >= fromDate) && (!toDate || row.date <= toDate))
      .map(row => {
        balance += (row.debit - row.credit) * normalMultiplier;
        return { ...row, balance } as LedgerRow;
      });
  }, [sourceRows, fromDate, toDate, openingBalance, normalMultiplier]);

  const totals = rows.reduce((sum, row) => ({ debit: sum.debit + row.debit, credit: sum.credit + row.credit }), { debit: 0, credit: 0 });
  const branchLabel = selectedBranch === 'all' ? 'All Branches' : branches.find(branch => branch.id === selectedBranch)?.name || 'Branch';
  const periodLabel = `${fromDate || 'Beginning'} to ${toDate || 'Present'}`;

  const exportCsv = () => {
    if (!account) return;
    const lines = [
      [account.code, account.name, `Branch: ${branchLabel}`, `Period: ${periodLabel}`],
      ['Date', 'Voucher No.', 'Source', 'Particulars', 'Branch', 'Debit', 'Credit', 'Running Balance'],
      ['Opening balance', '', '', '', '', '', '', openingBalance],
      ...rows.map(row => [row.date, row.voucher, row.source, row.particulars, row.branch, row.debit, row.credit, row.balance]),
      ['Totals', '', '', '', '', totals.debit, totals.credit, rows.at(-1)?.balance ?? openingBalance]
    ].map(row => row.map(csvCell).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([lines], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `account_ledger_${account.code}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="space-y-4">
      <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-end gap-3">
          <div className="flex-1 min-w-56">
            <label className="block text-xs font-semibold text-slate-300 mb-1">General Ledger Account</label>
            <select value={accountId} onChange={event => setAccountId(event.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white">
              {accounts.map(item => <option key={item.id} value={item.id}>{item.account_code} — {item.name} </option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">From</label>
            <input type="date" value={fromDate} onChange={event => setFromDate(event.target.value)} className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">To</label>
            <input type="date" value={toDate} onChange={event => setToDate(event.target.value)} className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white" />
          </div>
          <button onClick={exportCsv} className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-700"><Download className="w-3.5 h-3.5" />Export CSV</button>
          <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 rounded-xl text-xs font-semibold text-white hover:bg-emerald-500"><Printer className="w-3.5 h-3.5" />Print / Save PDF</button>
        </div>
      </div>

      <div id="account-ledger-print" className="bg-slate-900 rounded-2xl border border-slate-800 p-6 print:bg-white print:text-black print:border-0 print:p-0">
        <header className="border-b border-slate-700 pb-4 mb-4 print:border-slate-300">
          <p className="text-xs uppercase tracking-wider font-bold text-emerald-400 print:text-slate-700">General Ledger Account Report</p>
          <h2 className="text-xl font-bold text-white mt-1 print:text-black">{account ? `${account.account_code} — ${account.name}` : 'Select an account'}</h2>
          <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-xs text-slate-400 print:text-slate-600">
            <span>Classification: {account?.type || '—'}</span><span>Normal balance: {account?.normal_balance || '—'}</span><span>Scope: {branchLabel}</span><span>Period: {periodLabel}</span>
          </div>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs print:text-[10px]">
            <thead className="bg-slate-800 text-slate-300 uppercase tracking-wide print:bg-slate-100 print:text-black">
              <tr><th className="p-2">Date</th><th className="p-2">Voucher</th><th className="p-2">Source</th><th className="p-2">Particulars</th><th className="p-2">Branch</th><th className="p-2 text-right">Debit</th><th className="p-2 text-right">Credit</th><th className="p-2 text-right">Balance</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-800 print:divide-slate-200">
              <tr className="bg-slate-950/60 font-semibold text-slate-200 print:bg-slate-50 print:text-black"><td className="p-2" colSpan={7}>Opening balance</td><td className="p-2 text-right">{money(openingBalance)}</td></tr>
              {rows.map(row => <tr key={row.id} className="text-slate-300 print:text-black"><td className="p-2 whitespace-nowrap">{row.date}</td><td className="p-2 font-mono">{row.voucher}</td><td className="p-2">{row.source}</td><td className="p-2 min-w-52">{row.particulars}</td><td className="p-2">{row.branch}</td><td className="p-2 text-right">{row.debit ? money(row.debit) : '—'}</td><td className="p-2 text-right">{row.credit ? money(row.credit) : '—'}</td><td className="p-2 text-right font-semibold">{money(row.balance)}</td></tr>)}
              {!rows.length && <tr><td colSpan={8} className="p-8 text-center text-slate-400">No posted transactions match this account and period.</td></tr>}
            </tbody>
            <tfoot className="bg-slate-800 font-bold text-white print:bg-slate-100 print:text-black"><tr><td className="p-2" colSpan={5}>Period totals</td><td className="p-2 text-right">{money(totals.debit)}</td><td className="p-2 text-right">{money(totals.credit)}</td><td className="p-2 text-right">{money(rows.at(-1)?.balance ?? openingBalance)}</td></tr></tfoot>
          </table>
        </div>
        <p className="mt-4 text-[10px] text-slate-500 print:text-slate-500">Generated {new Date().toLocaleString()} • Includes all posted journal lines for the selected account within the selected scope.</p>
      </div>
      <style>{`@media print { body * { visibility: hidden; } #account-ledger-print, #account-ledger-print * { visibility: visible; } #account-ledger-print { position: absolute; left: 0; top: 0; width: 100%; } @page { size: landscape; margin: 12mm; } }`}</style>
    </section>
  );
};
