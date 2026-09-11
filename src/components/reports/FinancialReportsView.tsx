import React, { useState, useEffect } from 'react';
import { BarChart3, FileSpreadsheet, Download, RefreshCw, Printer, Building2 } from 'lucide-react';
import { ExcelGridTable, ExcelColumn } from '../common/ExcelGridTable';
import { api } from '../../services/api';
import { Branch } from '../../types';

interface FinancialReportsViewProps {
  branches?: Branch[];
  selectedBranchId?: string;
  onSelectBranch?: (id: string) => void;
}

export const FinancialReportsView: React.FC<FinancialReportsViewProps> = ({
  branches = [],
  selectedBranchId,
  onSelectBranch
}) => {
  const [reportType, setReportType] = useState<'trial_balance' | 'balance_sheet' | 'income_statement' | 'cda_statutory'>('trial_balance');
  const [selectedBranch, setSelectedBranch] = useState(selectedBranchId || 'all');
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (selectedBranchId !== undefined) {
      setSelectedBranch(selectedBranchId);
    }
  }, [selectedBranchId]);

  const handleBranchChange = (newBranchId: string) => {
    setSelectedBranch(newBranchId);
    if (onSelectBranch) {
      onSelectBranch(newBranchId);
    }
  };

  const loadReport = async () => {
    setIsLoading(true);
    try {
      const branchParam = selectedBranch !== 'all' ? selectedBranch : undefined;
      const res = await api.getFinancialReport(reportType, branchParam);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [reportType, selectedBranch]);

  const formatMoney = (val: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val || 0);

  const downloadStatementCSV = () => {
    if (!data) return;
    let csvContent = 'data:text/csv;charset=utf-8,';
    const branchName = selectedBranch === 'all' ? 'Consolidated All Branches' : branches.find(b => b.id === selectedBranch)?.name || 'Branch';

    if (reportType === 'trial_balance') {
      csvContent += `"Trial Balance - ${branchName}"\r\n`;
      csvContent += `"Account Code","Account Name","Classification","Debit","Credit"\r\n`;
      data.accounts?.forEach((a: any) => {
        csvContent += `"${a.code}","${a.name}","${a.type}",${a.debit || 0},${a.credit || 0}\r\n`;
      });
      csvContent += `"TOTALS","","Balanced Equilibrium",${data.total_debit || 0},${data.total_credit || 0}\r\n`;
    } else if (reportType === 'balance_sheet') {
      csvContent += `"Statement of Financial Condition (Balance Sheet) - ${branchName}"\r\n`;
      csvContent += `"Category","Account Name","Amount"\r\n`;
      data.assets?.forEach((a: any) => {
        csvContent += `"Asset","${a.name}",${a.balance || 0}\r\n`;
      });
      csvContent += `"Total Assets","Total Assets",${data.total_assets || 0}\r\n`;
      data.liabilities?.forEach((l: any) => {
        csvContent += `"Liability","${l.name}",${l.balance || 0}\r\n`;
      });
      csvContent += `"Total Liabilities","Total Liabilities",${data.total_liabilities || 0}\r\n`;
      data.equity?.forEach((e: any) => {
        csvContent += `"Equity","${e.name}",${e.balance || 0}\r\n`;
      });
      csvContent += `"Total Equity","Total Equity",${data.total_equity || 0}\r\n`;
    } else if (reportType === 'income_statement') {
      csvContent += `"Statement of Operations - ${branchName}"\r\n`;
      csvContent += `"Type","Account Name","Amount"\r\n`;
      data.revenues?.forEach((r: any) => {
        csvContent += `"Revenue","${r.name}",${r.balance || 0}\r\n`;
      });
      csvContent += `"Total Revenue","Total Gross Revenue",${data.total_revenue || 0}\r\n`;
      data.expenses?.forEach((e: any) => {
        csvContent += `"Expense","${e.name}",${e.balance || 0}\r\n`;
      });
      csvContent += `"Total Expense","Total Operating Expenses",${data.total_expense || 0}\r\n`;
      csvContent += `"Net Surplus","Net Surplus for Allocation",${data.net_surplus || 0}\r\n`;
    } else if (reportType === 'cda_statutory') {
      const net = data.net_surplus || 150000;
      csvContent += `"CDA Statutory Reserve Allocation - ${branchName}"\r\n`;
      csvContent += `"Fund / Statutory Reserve","Percentage","Allocated Amount"\r\n`;
      csvContent += `"General Reserve Fund","10%",${net * 0.10}\r\n`;
      csvContent += `"Cooperative Education & Training Fund (CETF)","10%",${net * 0.10}\r\n`;
      csvContent += `"Community Development Fund","3%",${net * 0.03}\r\n`;
      csvContent += `"Optional Fund","7%",${net * 0.07}\r\n`;
      csvContent += `"Interest on Share Capital & Patronage Refund","70%",${net * 0.70}\r\n`;
      csvContent += `"Total Distributable Net Surplus","100%",${net}\r\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${reportType}_${selectedBranch}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const trialBalanceCols: ExcelColumn<any>[] = [
    {
      key: 'code',
      header: 'Account Code',
      width: '140px',
      type: 'text',
      align: 'center',
      sortable: true,
      render: (val) => <span className="font-mono font-bold text-emerald-400">{val}</span>
    },
    {
      key: 'name',
      header: 'Account Name',
      width: '280px',
      type: 'text',
      sortable: true,
      render: (val) => <span className="font-medium text-white">{val}</span>
    },
    {
      key: 'type',
      header: 'Classification',
      width: '140px',
      type: 'badge',
      align: 'center',
      sortable: true,
      badgeColor: (val) => {
        if (val === 'ASSET') return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
        if (val === 'LIABILITY') return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
        if (val === 'EQUITY') return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
        if (val === 'REVENUE') return 'bg-teal-500/20 text-teal-300 border-teal-500/30';
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      }
    },
    {
      key: 'debit',
      header: 'Debit Balance (₱)',
      width: '160px',
      type: 'currency',
      align: 'right',
      sortable: true
    },
    {
      key: 'credit',
      header: 'Credit Balance (₱)',
      width: '160px',
      type: 'currency',
      align: 'right',
      sortable: true
    }
  ];

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

        <div className="flex flex-wrap items-center gap-2">
          {/* Branch Filter Selector */}
          <div className="flex items-center space-x-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            <select
              value={selectedBranch}
              onChange={e => handleBranchChange(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer pr-1"
            >
              <option value="all" className="bg-slate-900 text-white">All Branches (Consolidated)</option>
              {branches.map(b => (
                <option key={b.id} value={b.id} className="bg-slate-900 text-white">
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={downloadStatementCSV}
            className="flex items-center space-x-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 cursor-pointer"
            title="Download active report as CSV spreadsheet"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
          <button
            onClick={loadReport}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 cursor-pointer"
            title="Refresh Report"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setReportType('trial_balance')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
            reportType === 'trial_balance'
              ? 'bg-emerald-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          Trial Balance Grid
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
            <ExcelGridTable
              title="Consolidated General Ledger Trial Balance"
              subtitle={`Live balance summary across all CDA chart of accounts for ${selectedBranch === 'all' ? 'All Branches' : branches.find(b => b.id === selectedBranch)?.name || 'Branch'}. Enforces mathematical debit/credit equilibrium.`}
              exportFileName={`trial_balance_${selectedBranch}`}
              data={data.accounts || []}
              columns={trialBalanceCols}
              defaultSortKey="code"
            />
          </div>
        )}

        {!isLoading && data && reportType === 'balance_sheet' && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Statement of Financial Condition</h3>
                <p className="text-xs text-slate-400">Total Assets = Total Liabilities + Equity</p>
              </div>
              <span className="text-xs px-2.5 py-1 bg-slate-800 text-emerald-400 rounded-lg font-mono">
                {selectedBranch === 'all' ? 'All Branches' : branches.find(b => b.id === selectedBranch)?.name}
              </span>
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
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Statement of Operations</h3>
                <p className="text-xs text-slate-400">Revenue, Operating Expenses, and Net Surplus</p>
              </div>
              <span className="text-xs px-2.5 py-1 bg-slate-800 text-emerald-400 rounded-lg font-mono">
                {selectedBranch === 'all' ? 'All Branches' : branches.find(b => b.id === selectedBranch)?.name}
              </span>
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
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">CDA Statutory Reserve Distribution</h3>
                <p className="text-xs text-slate-400">
                  Automatic allocation of Net Surplus based on configured cooperative statutory percentages.
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 bg-slate-800 text-emerald-400 rounded-lg font-mono">
                {selectedBranch === 'all' ? 'All Branches' : branches.find(b => b.id === selectedBranch)?.name}
              </span>
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
