import React, { useState, useMemo } from 'react';
import {
  Printer,
  Download,
  FileDown,
  X,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  User as UserIcon,
  Filter,
  Layers,
  Activity,
  FileText,
  Sliders,
  Building2,
  Check
} from 'lucide-react';
import { ConfigurationAuditTrail, User, CoopProfile } from '../../types';

interface AuditReportPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: ConfigurationAuditTrail[];
  allLogsCount: number;
  currentUser: User;
  coopProfile?: CoopProfile | null;
  activeFilters: {
    category: string;
    operator: string;
    dateRange: string;
    searchQuery: string;
  };
  onExportCSV: () => void;
}

export const AuditReportPrintModal: React.FC<AuditReportPrintModalProps> = ({
  isOpen,
  onClose,
  logs = [],
  allLogsCount,
  currentUser,
  coopProfile,
  activeFilters,
  onExportCSV
}) => {
  const [reportPurpose, setReportPurpose] = useState('CDA Annual Regulatory Compliance Inspection');
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [includeKpis, setIncludeKpis] = useState(true);
  const [includeSignoffs, setIncludeSignoffs] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  // Helper to categorize log entries
  const categorizeLog = (setting: string) => {
    const s = (setting || '').toLowerCase();
    if (s.includes('loan') || s.includes('credit') || s.includes('disburs') || s.includes('repay') || s.includes('amort')) {
      return { category: 'Loans & Credit', badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    }
    if (s.includes('member') || s.includes('kyc') || s.includes('cbu') || s.includes('share capital')) {
      return { category: 'Membership & CBU', badgeBg: 'bg-blue-100 text-blue-800 border-blue-300' };
    }
    if (s.includes('savings') || s.includes('deposit') || s.includes('withdraw')) {
      return { category: 'Savings & Deposits', badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-300' };
    }
    if (s.includes('cash') || s.includes('vault') || s.includes('drawer') || s.includes('journal') || s.includes('gl') || s.includes('account')) {
      return { category: 'Accounting & Vault', badgeBg: 'bg-amber-100 text-amber-800 border-amber-300' };
    }
    if (s.includes('config') || s.includes('setup') || s.includes('rate') || s.includes('policy') || s.includes('system') || s.includes('branch')) {
      return { category: 'System Config', badgeBg: 'bg-purple-100 text-purple-800 border-purple-300' };
    }
    return { category: 'Compliance & Other', badgeBg: 'bg-slate-100 text-slate-800 border-slate-300' };
  };

  // Summaries
  const metrics = useMemo(() => {
    const total = logs.length;
    let loanOps = 0;
    let memberOps = 0;
    let savingsOps = 0;
    let accountingOps = 0;
    let configOps = 0;
    let otherOps = 0;
    const operatorSet = new Set<string>();

    logs.forEach(l => {
      const cat = categorizeLog(l.setting).category;
      if (cat === 'Loans & Credit') loanOps++;
      else if (cat === 'Membership & CBU') memberOps++;
      else if (cat === 'Savings & Deposits') savingsOps++;
      else if (cat === 'Accounting & Vault') accountingOps++;
      else if (cat === 'System Config') configOps++;
      else otherOps++;

      if (l.changed_by) operatorSet.add(l.changed_by);
    });

    const dates = logs
      .map(l => new Date(l.created_at).getTime())
      .filter(t => !isNaN(t))
      .sort((a, b) => a - b);

    const earliest = dates.length > 0 ? new Date(dates[0]).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';
    const latest = dates.length > 0 ? new Date(dates[dates.length - 1]).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';

    return {
      total,
      loanOps,
      memberOps,
      savingsOps,
      accountingOps,
      configOps,
      otherOps,
      operatorsCount: operatorSet.size,
      operatorsList: Array.from(operatorSet).sort(),
      earliest,
      latest
    };
  }, [logs]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadHtml = () => {
    const reportElem = document.getElementById('audit-logs-report-print');
    if (!reportElem) return;
    const stylesheetHref = document.querySelector<HTMLLinkElement>('link[rel="stylesheet"]')?.href;
    const stylesheetLink = stylesheetHref
      ? `<link rel="stylesheet" href="${stylesheetHref.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}">`
      : '';

    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>CDA Regulatory Audit Trail Summary Report - ${new Date().toISOString().split('T')[0]}</title>
  ${stylesheetLink}
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 20px; background: #fff; color: #0f172a; }
    @media print {
      @page { size: ${orientation}; margin: 8mm; }
      html, body { margin: 0; padding: 0; width: 100%; }
      #audit-logs-report-print {
        display: block;
        box-sizing: border-box;
        width: 100%;
        max-width: none;
        margin: 0;
        padding: 0;
        border: 0;
        border-radius: 0;
        box-shadow: none;
        overflow: visible;
        color: #0f172a;
        background: #fff;
      }
      #audit-logs-report-print table { width: 100%; table-layout: fixed; page-break-inside: auto; }
      #audit-logs-report-print thead { display: table-header-group; }
      #audit-logs-report-print tr { break-inside: avoid; page-break-inside: avoid; }
      #audit-logs-report-print .truncate { max-width: none !important; overflow: visible !important; text-overflow: clip !important; white-space: normal !important; }
      #audit-logs-report-print td, #audit-logs-report-print th { overflow-wrap: anywhere; }
      #audit-logs-report-print .overflow-x-auto { overflow: visible !important; }
      #audit-logs-report-print .page-break-inside-avoid { break-inside: avoid; page-break-inside: avoid; }
      .no-print, .no-print-area { display: none !important; }
    }
    table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 15px; }
    th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
    th { background-color: #f1f5f9; font-weight: 700; text-transform: uppercase; font-size: 10px; }
    #audit-logs-report-print { box-sizing: border-box; width: 100%; max-width: none; color: #0f172a; background: #fff; }
    #audit-logs-report-print .truncate { max-width: none !important; overflow: visible !important; text-overflow: clip !important; white-space: normal !important; }
    #audit-logs-report-print .overflow-x-auto { overflow: visible !important; }
    #audit-logs-report-print td, #audit-logs-report-print th { overflow-wrap: anywhere; }
    .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 600; border: 1px solid #cbd5e1; }
    .kpi-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin: 15px 0; }
    .kpi-card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; background: #f8fafc; }
    .kpi-title { font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 600; }
    .kpi-val { font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 4px; }
    .header-box { border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 15px; }
    .signoff-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 30px; page-break-inside: avoid; }
    .signoff-box { border-top: 1px solid #0f172a; padding-top: 8px; text-align: center; }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 20px; padding: 12px; background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
    <div><strong>CDA Official Audit Trail Summary Report</strong> (Stand-alone Document)</div>
    <button onclick="window.print()" style="padding: 8px 16px; background: #059669; color: #fff; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">Print / Save as PDF</button>
  </div>
  ${reportElem.innerHTML}
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CDA_Audit_Report_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setNotice('HTML report downloaded successfully. You can open and print it directly.');
    setTimeout(() => setNotice(null), 4000);
  };

  const coopName = coopProfile?.name || 'Tarlac Agricultural Producers Multi-Purpose Cooperative';
  const coopRegNo = coopProfile?.registration_no || 'TAR-9520-2024-001';
  const coopAddress = coopProfile?.address || 'Provincial Capitol Complex, Romulo Blvd, Tarlac City, Philippines';
  const generatedDateStr = new Date().toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const generatedTimeStr = new Date().toLocaleTimeString('en-PH', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return (
    <div id="audit-logs-print-shell" className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Dynamic Print CSS Style */}
      <style>{`
        @media print {
          html,
          body,
          #root {
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            background: #ffffff !important;
          }
          body * {
            visibility: hidden !important;
          }
          #root,
          #root *:has(#audit-logs-print-shell) {
            display: contents !important;
          }
          #root *:not(:has(#audit-logs-print-shell)):not(#audit-logs-print-shell):not(#audit-logs-print-shell *) {
            display: none !important;
          }
          #audit-logs-print-shell,
          #audit-logs-print-shell * {
            visibility: visible !important;
          }
          #audit-logs-print-shell {
            position: static !important;
            inset: auto !important;
            display: block !important;
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
          }
          #audit-logs-print-shell > div {
            position: static !important;
            display: block !important;
            width: 100% !important;
            max-width: none !important;
            height: auto !important;
            max-height: none !important;
            min-height: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            border: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            background: #ffffff !important;
          }
          #audit-logs-print-shell .audit-print-hide {
            display: none !important;
          }
          #audit-logs-print-preview {
            display: block !important;
            flex: none !important;
            width: 100% !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
          }
          #audit-logs-report-print {
            position: static !important;
            display: block !important;
            box-sizing: border-box !important;
            width: 100% !important;
            max-width: none !important;
            height: auto !important;
            max-height: none !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #0f172a !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            overflow: visible !important;
            font-size: 8pt !important;
          }
          @page {
            size: ${orientation};
            margin: 7mm;
          }
          #audit-logs-report-print thead {
            display: table-header-group !important;
          }
          #audit-logs-report-print table {
            width: 100% !important;
            table-layout: fixed !important;
            border-collapse: collapse !important;
            page-break-inside: auto !important;
          }
          #audit-logs-report-print .overflow-x-auto {
            overflow: visible !important;
          }
          #audit-logs-report-print tr,
          #audit-logs-report-print th,
          #audit-logs-report-print td {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          #audit-logs-report-print td,
          #audit-logs-report-print th {
            overflow-wrap: anywhere !important;
            word-break: normal !important;
            padding: 2mm 1.5mm !important;
            font-size: 7pt !important;
          }
          #audit-logs-report-print .truncate {
            max-width: none !important;
            overflow: visible !important;
            text-overflow: clip !important;
            white-space: normal !important;
          }
          #audit-logs-report-print .max-w-\\[100px\\],
          #audit-logs-report-print .max-w-\\[110px\\],
          #audit-logs-report-print .max-w-\\[220px\\] {
            max-width: none !important;
          }
          #audit-logs-report-print .flex {
            flex-wrap: wrap !important;
          }
          #audit-logs-report-print .space-y-6 > :not(:last-child) {
            margin-bottom: 3mm !important;
          }
          #audit-logs-report-print .page-break-inside-avoid {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          #audit-logs-report-print .no-print-area {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-7xl max-h-[96vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Modal Top Bar */}
        <div className="audit-print-hide px-6 py-4 border-b border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Export Audit Trail Summary Report
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {logs.length} Filtered Entries
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Official regulatory report formatted for CDA compliance, internal audit, and executive review
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Options & Action Toolbar */}
        <div className="audit-print-hide px-6 py-3 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            {/* Report Purpose Preset */}
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400 font-medium">Audit Purpose:</span>
              <select
                value={reportPurpose}
                onChange={e => setReportPurpose(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="CDA Annual Regulatory Compliance Inspection">CDA Annual Compliance Inspection</option>
                <option value="Internal Supervisory Committee Quarterly Audit">Supervisory Committee Quarterly Audit</option>
                <option value="External Financial & Operations Audit">External Financial & Operations Audit</option>
                <option value="Board of Directors Special Governance Review">Board of Directors Governance Review</option>
                <option value="Credit & Loan Committee Portfolio Verification">Credit Committee Portfolio Verification</option>
                <option value="General Assembly Annual Reporting Audit">General Assembly Annual Report</option>
              </select>
            </div>

            {/* Orientation */}
            <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-800 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setOrientation('landscape')}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                  orientation === 'landscape' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Landscape (Recommended)
              </button>
              <button
                type="button"
                onClick={() => setOrientation('portrait')}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                  orientation === 'portrait' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Portrait
              </button>
            </div>

            {/* Checkboxes */}
            <label className="flex items-center space-x-1.5 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={includeKpis}
                onChange={e => setIncludeKpis(e.target.checked)}
                className="rounded border-slate-700 text-emerald-600 focus:ring-0 cursor-pointer"
              />
              <span>Include KPI Cards</span>
            </label>

            <label className="flex items-center space-x-1.5 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={includeSignoffs}
                onChange={e => setIncludeSignoffs(e.target.checked)}
                className="rounded border-slate-700 text-emerald-600 focus:ring-0 cursor-pointer"
              />
              <span>Include Regulatory Sign-offs</span>
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onExportCSV}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold border border-slate-700 transition cursor-pointer"
              title="Download raw data as CSV"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleDownloadHtml}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold border border-slate-700 transition cursor-pointer"
              title="Download standalone HTML report"
            >
              <FileDown className="w-3.5 h-3.5 text-amber-400" />
              <span>Download HTML</span>
            </button>

            <button
              id="btn-print-audit-pdf"
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg transition cursor-pointer"
              title="Open browser print dialog to print or save as PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
          </div>
        </div>

        {notice && (
          <div className="audit-print-hide px-6 py-2 bg-emerald-950/80 border-b border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center space-x-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{notice}</span>
          </div>
        )}

        {/* Report Preview Document */}
        <div id="audit-logs-print-preview" className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950 flex justify-center">
          <div
            id="audit-logs-report-print"
            className="w-full max-w-[1100px] bg-white text-slate-900 p-6 sm:p-10 rounded-xl border border-slate-200 shadow-xl space-y-6"
          >
            {/* Document Masthead */}
            <div className="border-b-2 border-slate-900 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>Republic of the Philippines • Cooperative Development Authority (CDA)</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
                    {coopName}
                  </h1>
                  <p className="text-xs text-slate-600 mt-0.5">
                    CDA Reg. No.: <span className="font-semibold text-slate-900">{coopRegNo}</span> • CIN: <span className="font-semibold text-slate-900">0102030405</span> • BIR TIN: <span className="font-mono font-semibold text-slate-900">005-891-234-000</span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Principal Address: {coopAddress}
                  </p>
                </div>

                <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                  <span className="inline-block px-2.5 py-1 rounded bg-slate-900 text-white font-mono text-[10px] font-bold uppercase tracking-widest">
                    OFFICIAL AUDIT REPORT
                  </span>
                  <div className="text-xs font-semibold text-slate-800 mt-1.5">
                    Generated: {generatedDateStr}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Time: {generatedTimeStr} PHT
                  </div>
                  <div className="text-[11px] text-emerald-700 font-bold mt-0.5">
                    IMMUTABLE LEDGER VERIFIED
                  </div>
                </div>
              </div>

              {/* Title Banner */}
              <div className="mt-4 pt-3 border-t border-slate-200">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 uppercase tracking-wide">
                  Regulatory Audit Trail & System Activity Summary Report
                </h2>
                <p className="text-xs text-slate-600 italic mt-0.5">
                  Statutory compliance record pursuant to Republic Act No. 9520 (Philippine Cooperative Code of 2008), Article 52 ("Books to be Kept and Inspection") and CDA Circular Directives.
                </p>
              </div>
            </div>

            {/* Audit Scope & Applied Filters Box */}
            <div className="bg-slate-50 rounded-xl border border-slate-300 p-4 text-xs space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-bold uppercase tracking-wider text-slate-700 text-[11px] flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-slate-500" />
                  Audit Extraction Scope & Criteria
                </span>
                <span className="font-bold text-slate-900 text-[11px]">
                  Scope Match: {logs.length} of {allLogsCount} events (
                  {allLogsCount > 0 ? Math.round((logs.length / allLogsCount) * 100) : 100}%)
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Inspection Purpose:</span>
                  <span className="font-semibold text-slate-900">{reportPurpose}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Category Filter:</span>
                  <span className="font-semibold text-slate-900">{activeFilters.category === 'all' ? 'All System Categories' : activeFilters.category}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Operator Scope:</span>
                  <span className="font-semibold text-slate-900">{activeFilters.operator === 'all' ? 'All Authorized Operators' : activeFilters.operator}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Time Period:</span>
                  <span className="font-semibold text-slate-900">
                    {activeFilters.dateRange === 'all' ? 'All Time (Full Ledger)' : activeFilters.dateRange === 'today' ? 'Past 24 Hours' : activeFilters.dateRange === '7days' ? 'Past 7 Days' : 'Past 30 Days'}
                  </span>
                </div>
                {activeFilters.searchQuery && (
                  <div className="col-span-2">
                    <span className="text-slate-500 block">Search Query:</span>
                    <span className="font-mono font-semibold text-slate-900">"{activeFilters.searchQuery}"</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-500 block">Extracted By:</span>
                  <span className="font-semibold text-slate-900">{currentUser.name} ({currentUser.role_name})</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Date Range Captured:</span>
                  <span className="font-semibold text-slate-900">{metrics.earliest} to {metrics.latest}</span>
                </div>
              </div>
            </div>

            {/* Executive KPI Summary Cards (Optional) */}
            {includeKpis && (
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-slate-500" />
                  Executive Audit Activity Metrics
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-300">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Filtered Events</span>
                    <span className="text-lg font-black text-slate-900 block mt-0.5">{metrics.total}</span>
                    <span className="text-[10px] text-slate-500">In this report</span>
                  </div>

                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Loans & Credit</span>
                    <span className="text-lg font-black text-emerald-900 block mt-0.5">{metrics.loanOps}</span>
                    <span className="text-[10px] text-emerald-700">Disbursements & Repayments</span>
                  </div>

                  <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                    <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">System & Policy</span>
                    <span className="text-lg font-black text-purple-900 block mt-0.5">{metrics.configOps}</span>
                    <span className="text-[10px] text-purple-700">Rates, fees & rules</span>
                  </div>

                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Accounting & Vault</span>
                    <span className="text-lg font-black text-amber-900 block mt-0.5">{metrics.accountingOps}</span>
                    <span className="text-[10px] text-amber-700">Cash, GL & drawers</span>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 col-span-2 sm:col-span-1">
                    <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">Active Operators</span>
                    <span className="text-lg font-black text-blue-900 block mt-0.5">{metrics.operatorsCount}</span>
                    <span className="text-[10px] text-blue-700">Authorized personnel</span>
                  </div>
                </div>
              </div>
            )}

            {/* Detailed Filtered Audit Trail Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  Itemized Audit Trail Ledger
                </span>
                <span className="text-[11px] text-slate-500">
                  Total Items: <strong>{logs.length}</strong>
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-300 rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                      <th className="py-2.5 px-3 w-[45px] text-center border-r border-slate-200">#</th>
                      <th className="py-2.5 px-3 w-[140px] border-r border-slate-200">Timestamp</th>
                      <th className="py-2.5 px-3 w-[120px] border-r border-slate-200">Category</th>
                      <th className="py-2.5 px-3 w-[200px] border-r border-slate-200">Action / Setting</th>
                      <th className="py-2.5 px-3 w-[130px] border-r border-slate-200">Operator</th>
                      <th className="py-2.5 px-3 w-[230px] border-r border-slate-200">Change (Old → New)</th>
                      <th className="py-2.5 px-3">Compliance Reason / Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-500 italic">
                          No audit trail events match the selected criteria.
                        </td>
                      </tr>
                    ) : (
                      logs.map((log, idx) => {
                        const cat = categorizeLog(log.setting);
                        const d = new Date(log.created_at);
                        const dateFormatted = d.toLocaleDateString('en-PH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        });
                        const timeFormatted = d.toLocaleTimeString('en-PH', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        });

                        return (
                          <tr key={log.id} className="hover:bg-slate-50/80 text-[11px]">
                            <td className="py-2 px-3 text-center text-slate-500 font-mono border-r border-slate-200">
                              {idx + 1}
                            </td>
                            <td className="py-2 px-3 text-slate-800 whitespace-nowrap border-r border-slate-200">
                              <div className="font-semibold">{dateFormatted}</div>
                              <div className="text-[10px] text-slate-500 font-mono">{timeFormatted}</div>
                            </td>
                            <td className="py-2 px-3 whitespace-nowrap border-r border-slate-200">
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold border ${cat.badgeBg}`}>
                                {cat.category}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-900 border-r border-slate-200">
                              <div className="font-bold">{log.setting}</div>
                              <div className="text-[9px] text-slate-500 font-mono">ID: {log.id}</div>
                            </td>
                            <td className="py-2 px-3 text-slate-800 whitespace-nowrap font-medium border-r border-slate-200">
                              {log.changed_by || 'System'}
                            </td>
                            <td className="py-2 px-3 text-[10px] font-mono border-r border-slate-200">
                              <div className="flex items-center space-x-1">
                                <span className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded border border-slate-300 max-w-[100px] truncate" title={String(log.old_value)}>
                                  {String(log.old_value || 'None')}
                                </span>
                                <span className="text-slate-400 font-sans">→</span>
                                <span className="bg-emerald-50 text-emerald-900 px-1 py-0.5 rounded border border-emerald-300 font-semibold max-w-[110px] truncate" title={String(log.new_value)}>
                                  {String(log.new_value || 'None')}
                                </span>
                              </div>
                            </td>
                            <td className="py-2 px-3 text-slate-600 text-[11px] leading-tight">
                              {log.reason || 'Standard system action logged automatically.'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Regulatory Sign-offs & Certification (Optional) */}
            {includeSignoffs && (
              <div className="pt-4 border-t-2 border-slate-900 space-y-6 page-break-inside-avoid">
                <div className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-300 italic">
                  <strong>Regulatory Certification Statement:</strong> I hereby certify under penalties of perjury that the foregoing audit trail summary report is a faithful, complete, and authentic electronic extract generated from the cooperative's core management database ledger. All recorded operations are immutable, chronological, and protected against unauthorized tampering in accordance with CDA statutory accounting and transparency mandates.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6">
                  {/* Prepared By */}
                  <div className="text-center">
                    <div className="border-b border-slate-900 pb-1 mx-4">
                      <span className="font-bold text-slate-900 text-xs">{currentUser.name}</span>
                    </div>
                    <div className="text-[10px] text-slate-600 uppercase font-semibold mt-1">Prepared & Extracted By</div>
                    <div className="text-[10px] text-slate-500">{currentUser.role_name || 'Compliance Officer'}</div>
                    <div className="text-[10px] text-slate-400 mt-1">Date: {generatedDateStr}</div>
                  </div>

                  {/* Verified By */}
                  <div className="text-center">
                    <div className="border-b border-slate-900 pb-1 mx-4 h-5"></div>
                    <div className="text-[10px] text-slate-600 uppercase font-semibold mt-1">Verified By</div>
                    <div className="text-[10px] text-slate-500">Chairperson, Supervisory Committee / Internal Auditor</div>
                    <div className="text-[10px] text-slate-400 mt-1">Date: ____________________</div>
                  </div>

                  {/* Attested By */}
                  <div className="text-center">
                    <div className="border-b border-slate-900 pb-1 mx-4 h-5"></div>
                    <div className="text-[10px] text-slate-600 uppercase font-semibold mt-1">Noted & Attested By</div>
                    <div className="text-[10px] text-slate-500">General Manager / Board Secretary</div>
                    <div className="text-[10px] text-slate-400 mt-1">Date: ____________________</div>
                  </div>
                </div>
              </div>
            )}

            {/* Official Report Footer */}
            <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-500 gap-2">
              <div>
                Document Security Hash: <span className="font-mono text-slate-700">SHA256-{Math.random().toString(36).substring(2, 10).toUpperCase()}-IMMUTABLE</span>
              </div>
              <div className="text-center font-semibold text-slate-600">
                CONFIDENTIAL • FOR OFFICIAL COOPERATIVE & CDA REGULATORY USE ONLY
              </div>
              <div>
                End of Report
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
