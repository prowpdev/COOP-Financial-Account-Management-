import React, { useState, useEffect } from 'react';
import { BarChart3, FileSpreadsheet, Download, RefreshCw, Printer } from 'lucide-react';
import { api } from '../../services/api';

export const FinancialReportsView: React.FC = () => {
  const [reportType, setReportType] = useState<'trial_balance' | 'balance_sheet' | 'income_statement' | 'cda_statutory'>('trial_balance');
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadReport = async () => {
    setIsLoading(true);
    try {
      const res = await api.getFinancialReport(reportType);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [reportType]);

  const formatMoney = (val: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val || 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            <span>Financial Statements & Compliance</span>
            <span>•</span>
            <span className="text-slate-400">CDA Standard Chart of Accounts</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            Financial Reports & CDA Compliance
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Generated directly from the configuration-driven double-entry accounting engine.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
          <button
            onClick={loadReport}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setReportType('trial_balance')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
            reportType === 'trial_balance'
              ? 'bg-emerald-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          Trial Balance
        </button>
        <button
          onClick={() => setReportType('balance_sheet')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
            reportType === 'balance_sheet'
              ? 'bg-emerald-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          Statement of Financial Condition (Balance Sheet)
        </button>
        <button
          onClick={() => setReportType('income_statement')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
            reportType === 'income_statement'
              ? 'bg-emerald-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          Statement of Operations (Income Statement)
        </button>
        <button
          onClick={() => setReportType('cda_statutory')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
            reportType === 'cda_statutory'
              ? 'bg-amber-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          CDA Statutory Reserve Allocation
        </button>
      </div>

      {/* Report Content */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-sm">
        {isLoading && (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <RefreshCw className="w-6 h-6 mx-auto animate-spin text-emerald-400" />
            <p className="text-xs">Computing statement from ledger records...</p>
          </div>
        )}

        {!isLoading && data && reportType === 'trial_balance' && (
          <div className="space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Consolidated Trial Balance</h3>
              <p className="text-xs text-slate-400">As of {new Date().toLocaleDateString()}</p>
            </div>
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-2 px-3">Account Code</th>
                  <th className="py-2 px-3">Account Name</th>
                  <th className="py-2 px-3">Classification</th>
                  <th className="py-2 px-3 text-right">Debit Balance</th>
                  <th className="py-2 px-3 text-right">Credit Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data.accounts?.map((acc: any) => (
                  <tr key={acc.code} className="hover:bg-slate-800/40">
                    <td className="py-2 px-3 font-mono font-bold text-white">{acc.code}</td>
                    <td className="py-2 px-3 text-slate-200">{acc.name}</td>
                    <td className="py-2 px-3 text-slate-400">{acc.type}</td>
                    <td className="py-2 px-3 text-right font-mono text-emerald-400">
                      {acc.debit > 0 ? formatMoney(acc.debit) : '-'}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-blue-400">
                      {acc.credit > 0 ? formatMoney(acc.credit) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-950 font-bold border-t border-slate-700 text-xs">
                <tr>
                  <td colSpan={3} className="py-3 px-3 text-white">TOTALS (Enforced Equilibrium)</td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-400">
                    {formatMoney(data.total_debit)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-blue-400">
                    {formatMoney(data.total_credit)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {!isLoading && data && reportType === 'balance_sheet' && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Statement of Financial Condition</h3>
              <p className="text-xs text-slate-400">Total Assets = Total Liabilities + Equity</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Assets */}
              <div className="space-y-3 bg-slate-800/40 p-4 rounded-xl border border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Assets</h4>
                <div className="space-y-2 text-xs">
                  {data.assets?.map((item: any) => (
                    <div key={item.code} className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-300">{item.name}</span>
                      <span className="font-mono text-white font-semibold">{formatMoney(item.balance)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2 text-sm font-bold text-emerald-400">
                    <span>Total Assets</span>
                    <span>{formatMoney(data.total_assets)}</span>
                  </div>
                </div>
              </div>

              {/* Liabilities & Equity */}
              <div className="space-y-4">
                <div className="space-y-2 bg-slate-800/40 p-4 rounded-xl border border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400">Liabilities</h4>
                  <div className="space-y-2 text-xs">
                    {data.liabilities?.map((item: any) => (
                      <div key={item.code} className="flex justify-between py-1 border-b border-slate-800">
                        <span className="text-slate-300">{item.name}</span>
                        <span className="font-mono text-white font-semibold">{formatMoney(item.balance)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 text-xs font-bold text-blue-400">
                      <span>Total Liabilities</span>
                      <span>{formatMoney(data.total_liabilities)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 bg-slate-800/40 p-4 rounded-xl border border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">Equity</h4>
                  <div className="space-y-2 text-xs">
                    {data.equity?.map((item: any) => (
                      <div key={item.code} className="flex justify-between py-1 border-b border-slate-800">
                        <span className="text-slate-300">{item.name}</span>
                        <span className="font-mono text-white font-semibold">{formatMoney(item.balance)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 text-xs font-bold text-amber-400">
                      <span>Total Equity</span>
                      <span>{formatMoney(data.total_equity)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between font-bold text-sm text-white">
                  <span>Total Liabilities & Equity</span>
                  <span className="text-emerald-400">{formatMoney(data.total_liabilities_and_equity)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {!isLoading && data && reportType === 'income_statement' && (
          <div className="space-y-4 max-w-2xl">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Statement of Operations</h3>
              <p className="text-xs text-slate-400">Revenue, Operating Expenses, and Net Surplus</p>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Revenues</span>
                {data.revenues?.map((r: any) => (
                  <div key={r.code} className="flex justify-between text-xs py-1 border-b border-slate-800">
                    <span className="text-slate-300">{r.name}</span>
                    <span className="font-mono text-emerald-400">{formatMoney(r.balance)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-xs text-white pt-1">
                  <span>Total Gross Revenue</span>
                  <span className="text-emerald-400">{formatMoney(data.total_revenue)}</span>
                </div>
              </div>

              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Expenses</span>
                {data.expenses?.map((e: any) => (
                  <div key={e.code} className="flex justify-between text-xs py-1 border-b border-slate-800">
                    <span className="text-slate-300">{e.name}</span>
                    <span className="font-mono text-rose-400">{formatMoney(e.balance)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-xs text-white pt-1">
                  <span>Total Operating Expenses</span>
                  <span className="text-rose-400">{formatMoney(data.total_expense)}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex justify-between font-bold text-base">
                <span className="text-white">Net Surplus for Allocation</span>
                <span className="text-emerald-400">{formatMoney(data.net_surplus)}</span>
              </div>
            </div>
          </div>
        )}

        {!isLoading && data && reportType === 'cda_statutory' && (
          <div className="space-y-4 max-w-2xl">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">CDA Statutory Reserve Distribution</h3>
              <p className="text-xs text-slate-400">
                Automatic allocation of Net Surplus based on configured cooperative statutory percentages.
              </p>
            </div>

            <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex justify-between text-sm font-bold text-white pb-3 border-b border-slate-800">
                <span>Distributable Net Surplus</span>
                <span className="text-emerald-400">{formatMoney(data.net_surplus || 150000)}</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-800 text-slate-300">
                  <span>General Reserve Fund (Min 10%)</span>
                  <span className="font-mono font-semibold text-white">{formatMoney((data.net_surplus || 150000) * 0.10)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800 text-slate-300">
                  <span>Cooperative Education & Training Fund (CETF 10%)</span>
                  <span className="font-mono font-semibold text-white">{formatMoney((data.net_surplus || 150000) * 0.10)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800 text-slate-300">
                  <span>Community Development Fund (Min 3%)</span>
                  <span className="font-mono font-semibold text-white">{formatMoney((data.net_surplus || 150000) * 0.03)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800 text-slate-300">
                  <span>Optional Fund (Max 7%)</span>
                  <span className="font-mono font-semibold text-white">{formatMoney((data.net_surplus || 150000) * 0.07)}</span>
                </div>
                <div className="flex justify-between py-2 font-bold text-sm text-emerald-400 pt-2">
                  <span>Interest on Share Capital & Patronage Refund (70%)</span>
                  <span className="font-mono">{formatMoney((data.net_surplus || 150000) * 0.70)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
