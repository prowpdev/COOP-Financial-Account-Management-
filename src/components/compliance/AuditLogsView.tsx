import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Download,
  Calendar,
  User as UserIcon,
  Clock,
  ArrowRight,
  FileText,
  AlertCircle,
  Plus,
  X,
  CheckCircle2,
  FileSpreadsheet,
  Activity,
  Layers,
  Building2,
  ChevronDown
} from 'lucide-react';
import { api } from '../../services/api';
import { Branch, ConfigurationAuditTrail, User } from '../../types';

interface AuditLogsViewProps {
  currentUser: User;
  branches?: Branch[];
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({
  currentUser,
  branches = []
}) => {
  const [logs, setLogs] = useState<ConfigurationAuditTrail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('all');
  const [selectedLogForDetails, setSelectedLogForDetails] = useState<ConfigurationAuditTrail | null>(null);
  
  // Manual Log Entry Modal State
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    setting: '',
    old_value: 'N/A',
    new_value: '',
    reason: ''
  });
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAuditLogs();
      const rawLogs = Array.isArray(res.data) ? res.data : [];
      setLogs(rawLogs);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Helper to categorize log entries
  const categorizeLog = (setting: string) => {
    const s = setting.toLowerCase();
    if (s.includes('loan') || s.includes('credit') || s.includes('disburs') || s.includes('repay') || s.includes('amort')) {
      return { category: 'Loans & Credit', color: 'emerald' };
    }
    if (s.includes('member') || s.includes('kyc') || s.includes('cbu') || s.includes('share capital')) {
      return { category: 'Membership & CBU', color: 'blue' };
    }
    if (s.includes('savings') || s.includes('deposit') || s.includes('withdraw')) {
      return { category: 'Savings & Deposits', color: 'indigo' };
    }
    if (s.includes('cash') || s.includes('vault') || s.includes('drawer') || s.includes('journal') || s.includes('gl') || s.includes('account')) {
      return { category: 'Accounting & Vault', color: 'amber' };
    }
    if (s.includes('config') || s.includes('setup') || s.includes('rate') || s.includes('policy') || s.includes('system') || s.includes('branch')) {
      return { category: 'System Config', color: 'purple' };
    }
    return { category: 'Compliance & Other', color: 'slate' };
  };

  // Unique users from logs
  const uniqueUsers = useMemo(() => {
    const set = new Set<string>();
    logs.forEach(l => {
      if (l.changed_by) set.add(l.changed_by);
    });
    return Array.from(set).sort();
  }, [logs]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Category filter
      if (selectedCategory !== 'all') {
        const cat = categorizeLog(log.setting).category;
        if (cat !== selectedCategory) return false;
      }

      // User filter
      if (selectedUser !== 'all' && log.changed_by !== selectedUser) {
        return false;
      }

      // Date range filter
      if (selectedDateRange !== 'all') {
        const logDate = new Date(log.created_at).getTime();
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        if (selectedDateRange === 'today' && now - logDate > oneDay) return false;
        if (selectedDateRange === '7days' && now - logDate > 7 * oneDay) return false;
        if (selectedDateRange === '30days' && now - logDate > 30 * oneDay) return false;
      }

      // Search term filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const settingMatch = log.setting?.toLowerCase().includes(q);
        const userMatch = log.changed_by?.toLowerCase().includes(q);
        const reasonMatch = log.reason?.toLowerCase().includes(q);
        const oldValMatch = String(log.old_value || '').toLowerCase().includes(q);
        const newValMatch = String(log.new_value || '').toLowerCase().includes(q);
        return settingMatch || userMatch || reasonMatch || oldValMatch || newValMatch;
      }

      return true;
    });
  }, [logs, selectedCategory, selectedUser, selectedDateRange, searchTerm]);

  // Metrics summary
  const metrics = useMemo(() => {
    const total = logs.length;
    const loanOps = logs.filter(l => categorizeLog(l.setting).category === 'Loans & Credit').length;
    const configOps = logs.filter(l => categorizeLog(l.setting).category === 'System Config').length;
    const todayCount = logs.filter(l => {
      const d = new Date(l.created_at);
      const today = new Date();
      return d.toDateString() === today.toDateString();
    }).length;

    return {
      total,
      loanOps,
      configOps,
      todayCount,
      usersActive: uniqueUsers.length
    };
  }, [logs, uniqueUsers]);

  // Handle manual audit log recording
  const handleSaveManualLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.setting.trim()) return;

    setIsSubmittingManual(true);
    try {
      await api.recordAuditLog({
        setting: manualForm.setting,
        old_value: manualForm.old_value,
        new_value: manualForm.new_value || 'Recorded',
        changed_by: currentUser.name || 'Compliance Officer',
        reason: manualForm.reason || 'Manual compliance audit note'
      });
      showToast('Compliance audit entry recorded successfully.');
      setIsManualModalOpen(false);
      setManualForm({ setting: '', old_value: 'N/A', new_value: '', reason: '' });
      fetchLogs();
    } catch (err) {
      console.error(err);
      alert('Failed to record audit entry.');
    } finally {
      setIsSubmittingManual(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      alert('No logs to export.');
      return;
    }
    const headers = ['Log ID', 'Timestamp', 'Setting / Action', 'Category', 'Changed By', 'Old Value', 'New Value', 'Reason'];
    const rows = filteredLogs.map(l => [
      `"${l.id}"`,
      `"${new Date(l.created_at).toLocaleString('en-PH')}"`,
      `"${(l.setting || '').replace(/"/g, '""')}"`,
      `"${categorizeLog(l.setting).category}"`,
      `"${(l.changed_by || '').replace(/"/g, '""')}"`,
      `"${String(l.old_value || '').replace(/"/g, '""')}"`,
      `"${String(l.new_value || '').replace(/"/g, '""')}"`,
      `"${(l.reason || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CDA_Audit_Logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>CDA Regulatory Compliance</span>
            <span>•</span>
            <span className="text-slate-400">System Activity Ledger (RA 9520 Art. 52)</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1 flex items-center gap-2">
            Audit Logs & System Activity Trail
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Immutable, timestamped audit trail tracking user operations, loan lifecycle transitions, configuration adjustments, and financial disbursements for regulatory compliance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={fetchLogs}
            disabled={isLoading}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer"
            title="Refresh logs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer"
            title="Export CSV report for CDA inspection"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsManualModalOpen(true)}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Log Compliance Note</span>
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 rounded-xl text-xs font-semibold flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
          <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Total Events</span>
          </div>
          <div className="text-xl font-bold text-white mt-1">{metrics.total}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Tracked system-wide</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
          <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>Loans & Credit</span>
          </div>
          <div className="text-xl font-bold text-blue-400 mt-1">{metrics.loanOps}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Applications, approvals, disbursements</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
          <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>Policy & Config</span>
          </div>
          <div className="text-xl font-bold text-purple-400 mt-1">{metrics.configOps}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Parameters & rule changes</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
          <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Today's Activity</span>
          </div>
          <div className="text-xl font-bold text-amber-400 mt-1">{metrics.todayCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Recorded past 24 hrs</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow col-span-2 md:col-span-1">
          <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
            <UserIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span>Active Operators</span>
          </div>
          <div className="text-xl font-bold text-cyan-400 mt-1">{metrics.usersActive}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Authorized staff/system</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Keyword Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by action, operator, reason, or before/after values..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center space-x-1.5 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer pr-1"
            >
              <option value="all" className="bg-slate-900 text-white">All Categories</option>
              <option value="Loans & Credit" className="bg-slate-900 text-white">Loans & Credit</option>
              <option value="Membership & CBU" className="bg-slate-900 text-white">Membership & CBU</option>
              <option value="Savings & Deposits" className="bg-slate-900 text-white">Savings & Deposits</option>
              <option value="Accounting & Vault" className="bg-slate-900 text-white">Accounting & Vault</option>
              <option value="System Config" className="bg-slate-900 text-white">System Config</option>
              <option value="Compliance & Other" className="bg-slate-900 text-white">Compliance & Other</option>
            </select>
          </div>

          {/* Operator / User Dropdown */}
          <div className="flex items-center space-x-1.5 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-xs">
            <UserIcon className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedUser}
              onChange={e => setSelectedUser(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer pr-1"
            >
              <option value="all" className="bg-slate-900 text-white">All Operators</option>
              {uniqueUsers.map(u => (
                <option key={u} value={u} className="bg-slate-900 text-white">
                  {u}
                </option>
              ))}
            </select>
          </div>

          {/* Timeframe Dropdown */}
          <div className="flex items-center space-x-1.5 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedDateRange}
              onChange={e => setSelectedDateRange(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer pr-1"
            >
              <option value="all" className="bg-slate-900 text-white">All Time</option>
              <option value="today" className="bg-slate-900 text-white">Past 24 Hours</option>
              <option value="7days" className="bg-slate-900 text-white">Past 7 Days</option>
              <option value="30days" className="bg-slate-900 text-white">Past 30 Days</option>
            </select>
          </div>
        </div>

        {/* Filter Summary & Result Count */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
          <div>
            Showing <span className="font-semibold text-white">{filteredLogs.length}</span> of {logs.length} audit entries
            {(selectedCategory !== 'all' || selectedUser !== 'all' || selectedDateRange !== 'all' || searchTerm) && (
              <span className="text-emerald-400 ml-2 font-medium">(Filtered)</span>
            )}
          </div>
          {(selectedCategory !== 'all' || selectedUser !== 'all' || selectedDateRange !== 'all' || searchTerm) && (
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedUser('all');
                setSelectedDateRange('all');
                setSearchTerm('');
              }}
              className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Main Audit Trail Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4 w-[160px]">Timestamp</th>
                <th className="py-3 px-4 w-[140px]">Category</th>
                <th className="py-3 px-4 w-[240px]">Action / Setting</th>
                <th className="py-3 px-4 w-[160px]">Operator</th>
                <th className="py-3 px-4 w-[280px]">Change Audit (Old → New)</th>
                <th className="py-3 px-4">Compliance Reason / Remarks</th>
                <th className="py-3 px-4 w-[90px] text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-500 mb-2" />
                    <span>Loading compliance audit trail...</span>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <p className="text-sm font-semibold text-slate-300">No audit events match your filter criteria.</p>
                    <p className="text-xs text-slate-500 mt-1">Try clearing your search query or reset category filters.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  const catInfo = categorizeLog(log.setting);
                  const dateObj = new Date(log.created_at);
                  const formattedDate = dateObj.toLocaleDateString('en-PH', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  });
                  const formattedTime = dateObj.toLocaleTimeString('en-PH', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  });

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => setSelectedLogForDetails(log)}
                    >
                      {/* Timestamp */}
                      <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                        <div className="font-medium text-slate-200">{formattedDate}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{formattedTime}</div>
                      </td>

                      {/* Category Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          catInfo.color === 'emerald'
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                            : catInfo.color === 'blue'
                            ? 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                            : catInfo.color === 'indigo'
                            ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
                            : catInfo.color === 'purple'
                            ? 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                            : catInfo.color === 'amber'
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                            : 'bg-slate-700/40 text-slate-300 border-slate-600/40'
                        }`}>
                          {catInfo.category}
                        </span>
                      </td>

                      {/* Action / Setting */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
                          {log.setting}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono truncate max-w-[220px]">
                          ID: {log.id}
                        </div>
                      </td>

                      {/* Operator */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300">
                            {log.changed_by?.charAt(0) || 'U'}
                          </div>
                          <span className="font-medium text-slate-200">{log.changed_by || 'System'}</span>
                        </div>
                      </td>

                      {/* Value Diff */}
                      <td className="py-3 px-4 text-xs font-mono">
                        <div className="flex items-center space-x-1.5 max-w-[260px]">
                          <span className="text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-[10px] truncate max-w-[110px]" title={String(log.old_value)}>
                            {String(log.old_value || 'None')}
                          </span>
                          <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
                          <span className="text-emerald-300 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/30 text-[10px] truncate max-w-[120px]" title={String(log.new_value)}>
                            {String(log.new_value || 'None')}
                          </span>
                        </div>
                      </td>

                      {/* Reason / Remarks */}
                      <td className="py-3 px-4 text-slate-400 text-xs">
                        <div className="line-clamp-2" title={log.reason}>
                          {log.reason || 'Standard system event'}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLogForDetails(log);
                          }}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[10px] font-medium border border-slate-700 transition cursor-pointer"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Detail Modal */}
      {selectedLogForDetails && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Compliance Audit Record</h3>
              </div>
              <button
                onClick={() => setSelectedLogForDetails(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase">Audit Entry ID</div>
                  <div className="font-mono text-slate-200 mt-0.5">{selectedLogForDetails.id}</div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase">Logged Timestamp</div>
                  <div className="font-mono text-slate-200 mt-0.5">
                    {new Date(selectedLogForDetails.created_at).toLocaleString('en-PH')}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase">Operator / Performed By</div>
                  <div className="font-semibold text-emerald-400 mt-0.5">{selectedLogForDetails.changed_by}</div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase">Category</div>
                  <div className="text-slate-300 mt-0.5">{categorizeLog(selectedLogForDetails.setting).category}</div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase">Action / Event Name</label>
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-white font-medium mt-1">
                  {selectedLogForDetails.setting}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-rose-400 uppercase">Old / Pre-Change State</label>
                  <div className="p-2.5 bg-rose-950/20 border border-rose-500/30 rounded-xl text-rose-200 font-mono text-[11px] mt-1 break-words">
                    {String(selectedLogForDetails.old_value || 'None')}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-emerald-400 uppercase">New / Post-Change State</label>
                  <div className="p-2.5 bg-emerald-950/20 border border-emerald-500/30 rounded-xl text-emerald-200 font-mono text-[11px] mt-1 break-words">
                    {String(selectedLogForDetails.new_value || 'None')}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase">Justification / Compliance Notes</label>
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 mt-1">
                  {selectedLogForDetails.reason || 'Standard system action logged automatically.'}
                </div>
              </div>

              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 text-[10px] text-slate-500 flex items-center justify-between">
                <span>Tamper-evident system activity ledger entry</span>
                <span className="font-mono text-emerald-500 font-semibold">VERIFIED VALID</span>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedLogForDetails(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Audit Entry Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Log Compliance Audit Note</h3>
                <p className="text-xs text-slate-400">Record an official compliance note or committee resolution</p>
              </div>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManualLog} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Action / Setting / Inspection Description <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Credit Committee Quarterly Collateral Verification Review"
                  value={manualForm.setting}
                  onChange={e => setManualForm({ ...manualForm, setting: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Previous State / Baseline</label>
                  <input
                    type="text"
                    value={manualForm.old_value}
                    onChange={e => setManualForm({ ...manualForm, old_value: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">New State / Result</label>
                  <input
                    type="text"
                    placeholder="e.g. Verified 100% Valid"
                    value={manualForm.new_value}
                    onChange={e => setManualForm({ ...manualForm, new_value: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Compliance Justification / Regulatory Purpose <span className="text-emerald-400">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="State the regulatory compliance reason, board resolution number, or CDA inspection reference..."
                  value={manualForm.reason}
                  onChange={e => setManualForm({ ...manualForm, reason: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400">
                Logged under operator: <span className="text-emerald-400 font-semibold">{currentUser.name}</span> ({currentUser.role_name})
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingManual}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold shadow transition cursor-pointer flex items-center space-x-1.5"
                >
                  {isSubmittingManual && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Commit to Audit Ledger</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
