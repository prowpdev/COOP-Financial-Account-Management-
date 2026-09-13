import React, { useEffect, useMemo, useState } from 'react';
import { Download, Printer, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import { Member } from '../../types';

interface Props { members: Member[]; }
const money = (n: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(n || 0);
const cell = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;

export const MemberTransactionReport: React.FC<Props> = ({ members = [] }) => {
  const safeMembers = Array.isArray(members) ? members : [];
  const [memberId, setMemberId] = useState(safeMembers[0]?.id || '');
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => {
    if (!memberId && safeMembers.length > 0) {
      setMemberId(safeMembers[0].id);
    }
  }, [safeMembers, memberId]);

  const load = async () => {
    if (!memberId) return;
    setLoading(true);
    try { setReport((await api.getMemberReport(memberId)).data); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [memberId]);
  useEffect(() => {
    const refreshReport = () => load();
    window.addEventListener('coop:data-changed', refreshReport);
    return () => window.removeEventListener('coop:data-changed', refreshReport);
  }, [memberId]);
  const rows = useMemo(() => (report?.transactions || []).filter((row: any) => (!from || row.date >= from) && (!to || row.date <= to)), [report, from, to]);
  const member = report?.member || safeMembers.find(item => item.id === memberId);
  const exportCsv = () => {
    const csv = [['Member transaction report', `${member?.first_name || ''} ${member?.last_name || ''}`], ['Date', 'Type', 'Reference', 'Description', 'Accounts', 'Debit', 'Credit', 'Amount'], ...rows.map((row: any) => [row.date, row.type, row.reference, row.description, row.accounts || '', row.debit, row.credit, row.amount])].map(row => row.map(cell).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a'); link.href = url; link.download = `member_report_${member?.member_no || 'report'}.csv`; link.click(); URL.revokeObjectURL(url);
  };

  if (!safeMembers || safeMembers.length === 0) {
    return (
      <div className="bg-slate-900 rounded-2xl p-12 border border-slate-800 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
          <Printer className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">No Members Available for Reporting</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            The member registry currently has no enrolled cooperative members. Register a member in the registry to generate individual account statements and transaction histories.
          </p>
        </div>
      </div>
    );
  }
  return <section className="space-y-4">
    <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 print:hidden flex flex-col lg:flex-row lg:items-end gap-3">
      <div className="flex-1"><label className="block text-xs font-semibold text-slate-300 mb-1">Member / Organization</label><select value={memberId} onChange={e => setMemberId(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white">{safeMembers.map(m => <option key={m.id} value={m.id}>{m.member_no} — {m.first_name} {m.last_name}</option>)}</select></div>
      <div><label className="block text-xs text-slate-300 mb-1">From</label><input type="date" value={from} onChange={e => setFrom(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white" /></div>
      <div><label className="block text-xs text-slate-300 mb-1">To</label><input type="date" value={to} onChange={e => setTo(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white" /></div>
      <button onClick={load} className="p-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button><button onClick={exportCsv} className="flex gap-1 px-3 py-2 bg-slate-800 rounded-xl text-xs text-white"><Download className="w-3.5 h-3.5" />CSV</button><button onClick={() => window.print()} className="flex gap-1 px-3 py-2 bg-emerald-600 rounded-xl text-xs text-white"><Printer className="w-3.5 h-3.5" />Print / PDF</button>
    </div>
    <div id="member-report-print" className="bg-slate-900 rounded-2xl p-6 border border-slate-800 print:bg-white print:text-black print:border-0 print:p-0">
      <header className="border-b border-slate-700 pb-4 mb-4 print:border-slate-300"><p className="text-xs font-bold uppercase tracking-wider text-emerald-400 print:text-slate-700">Member Transaction Report</p><h2 className="text-xl font-bold text-white print:text-black">{member ? `${member.first_name} ${member.middle_name || ''} ${member.last_name}` : 'Select a member'}</h2><p className="text-xs text-slate-400 print:text-slate-600">Member no. {member?.member_no || '—'} · {member?.branch_name || '—'} · {from || 'Beginning'} to {to || 'Present'}</p></header>
      <div className="grid grid-cols-3 gap-3 mb-5 text-xs"><div className="p-3 bg-slate-800 rounded-lg print:bg-slate-100">Outstanding loans <strong className="block text-white print:text-black mt-1">{money(report?.summary?.loan_balance)}</strong></div><div className="p-3 bg-slate-800 rounded-lg print:bg-slate-100">Savings balance <strong className="block text-white print:text-black mt-1">{money(report?.summary?.savings_balance)}</strong></div><div className="p-3 bg-slate-800 rounded-lg print:bg-slate-100">Paid-up shares <strong className="block text-white print:text-black mt-1">{money(report?.summary?.share_capital)}</strong></div></div>
      <div className="overflow-x-auto"><table className="w-full text-left text-xs print:text-[10px]"><thead className="bg-slate-800 text-slate-300 print:bg-slate-100 print:text-black"><tr><th className="p-2">Date</th><th className="p-2">Transaction</th><th className="p-2">Reference</th><th className="p-2">Description / Accounts</th><th className="p-2 text-right">Debit</th><th className="p-2 text-right">Credit</th><th className="p-2 text-right">Amount</th></tr></thead><tbody className="divide-y divide-slate-800 print:divide-slate-200">{rows.map((row: any) => <tr key={row.id} className="text-slate-300 print:text-black"><td className="p-2 whitespace-nowrap">{row.date}</td><td className="p-2">{row.type}</td><td className="p-2 font-mono">{row.reference}</td><td className="p-2">{row.description}{row.accounts && <small className="block text-slate-500">{row.accounts}</small>}</td><td className="p-2 text-right">{row.debit ? money(row.debit) : '—'}</td><td className="p-2 text-right">{row.credit ? money(row.credit) : '—'}</td><td className="p-2 text-right font-semibold">{money(row.amount)}</td></tr>)}{!loading && !rows.length && <tr><td colSpan={7} className="p-8 text-center text-slate-400">No transactions recorded for this member in the selected period.</td></tr>}</tbody></table></div>
      <p className="mt-4 text-[10px] text-slate-500">Generated {new Date().toLocaleString()} · Includes loan releases and payments, savings, share-capital, and linked accounting postings.</p>
    </div><style>{`@media print { body * { visibility:hidden } #member-report-print,#member-report-print * { visibility:visible } #member-report-print { position:absolute; left:0; top:0; width:100% } @page { size:landscape; margin:12mm } }`}</style>
  </section>;
};
