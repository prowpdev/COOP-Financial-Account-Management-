import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  CreditCard,
  Percent,
  CheckCheck,
  RefreshCw,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Coins,
  CheckCircle2,
  X,
  PlusCircle,
  FileText
} from 'lucide-react';
import { api } from '../../services/api';
import { TabKey } from '../Sidebar';

export interface NotificationItem {
  id: string;
  type: 'loan_application' | 'interest_received';
  category: 'loans' | 'interest';
  sub_type?: 'savings_interest' | 'loan_interest';
  status?: string;
  title: string;
  message: string;
  amount?: number;
  member_name?: string;
  member_no?: string;
  member_id?: string;
  timestamp: string;
  read: boolean;
  data?: any;
}

interface NotificationBellProps {
  onNavigateTab?: (tab: TabKey) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ onNavigateTab }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'loans' | 'interest'>('all');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loanCount, setLoanCount] = useState(0);
  const [interestCount, setInterestCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isPostingInterest, setIsPostingInterest] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async (quiet = false) => {
    if (!quiet) setIsLoading(true);
    try {
      const res = await api.getNotifications();
      if (res && res.success) {
        const items = Array.isArray(res.data) ? res.data : [];
        setNotifications(items);
        setUnreadCount(res.unread_count ?? items.filter(n => !n.read).length);
        setLoanCount(res.loan_applications_count ?? items.filter(n => n.category === 'loans' && !n.read).length);
        setInterestCount(res.interest_notifications_count ?? items.filter(n => n.category === 'interest' && !n.read).length);
      }
    } catch (err) {
      console.warn('Failed to load notifications:', err);
    } finally {
      if (!quiet) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Auto-refresh when data changes in the app
    const handleDataChanged = () => {
      fetchNotifications(true);
    };

    window.addEventListener('coop:data-changed', handleDataChanged);
    const interval = setInterval(() => fetchNotifications(true), 15000);

    return () => {
      window.removeEventListener('coop:data-changed', handleDataChanged);
      clearInterval(interval);
    };
  }, []);

  // Close dropdown on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (id?: string) => {
    try {
      await api.markNotificationRead(id, !id);
      if (id) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        setUnreadCount(c => Math.max(0, c - 1));
      } else {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
        setLoanCount(0);
        setInterestCount(0);
      }
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const handlePostSavingsInterest = async () => {
    if (isPostingInterest) return;
    setIsPostingInterest(true);
    setFeedbackNotice(null);
    try {
      const res = await api.postSavingsInterestBatch({
        period_months: 1,
        performed_by: 'System Administrator'
      });
      if (res && res.success) {
        setFeedbackNotice(`Credited ₱${Number(res.total_credited || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} across ${res.accounts_credited || 0} savings accounts.`);
        window.dispatchEvent(new Event('coop:data-changed'));
        await fetchNotifications(true);
        setTimeout(() => setFeedbackNotice(null), 5000);
      }
    } catch (err: any) {
      setFeedbackNotice(`Error: ${err.message || 'Failed to post interest'}`);
      setTimeout(() => setFeedbackNotice(null), 5000);
    } finally {
      setIsPostingInterest(false);
    }
  };

  const filteredNotifications = notifications.filter(item => {
    if (activeFilter === 'loans') return item.category === 'loans';
    if (activeFilter === 'interest') return item.category === 'interest';
    return true;
  });

  const formatTimestamp = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell Trigger Button */}
      <button
        id="btn-header-notifications"
        onClick={() => setIsOpen(!isOpen)}
        title="View Notifications: Loan Applications & Interest Alerts"
        aria-label="View notifications"
        className={`relative p-2 rounded-xl transition cursor-pointer flex items-center justify-center border ${
          isOpen
            ? 'bg-slate-700/90 text-white border-emerald-500/50 shadow-md shadow-emerald-950/40'
            : unreadCount > 0
            ? 'bg-slate-800/90 text-amber-300 hover:text-white border-amber-500/40 hover:bg-slate-700'
            : 'bg-slate-800/90 text-slate-300 hover:text-white border-slate-700 hover:bg-slate-700'
        }`}
      >
        <Bell className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${unreadCount > 0 ? 'animate-bounce duration-1000' : ''}`} />
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-[10px] font-black rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center shadow-lg border-2 border-slate-900 animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div
          id="popover-header-notifications"
          className="fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-[420px] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[580px] animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-xl"
        >
          {/* Popover Header */}
          <div className="p-3.5 sm:p-4 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-bold text-white tracking-tight">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">Loan applications & interest receipts</p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => fetchNotifications()}
                title="Refresh notifications"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
              </button>

              {unreadCount > 0 && (
                <button
                  onClick={() => handleMarkAsRead()}
                  title="Mark all as read"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-slate-800 transition cursor-pointer flex items-center space-x-1 text-xs"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                </button>
              )}

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer sm:hidden"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="px-3 pt-2.5 pb-2 bg-slate-900/90 border-b border-slate-800/80 flex items-center space-x-1 text-xs overflow-x-auto">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer flex items-center space-x-1.5 shrink-0 ${
                activeFilter === 'all'
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <span>All Alerts</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeFilter === 'all' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
              }`}>
                {notifications.length}
              </span>
            </button>

            <button
              onClick={() => setActiveFilter('loans')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer flex items-center space-x-1.5 shrink-0 ${
                activeFilter === 'loans'
                  ? 'bg-slate-800 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-amber-200 hover:bg-slate-800/50'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5 text-amber-400" />
              <span>Loan Applications</span>
              {loanCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {loanCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveFilter('interest')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer flex items-center space-x-1.5 shrink-0 ${
                activeFilter === 'interest'
                  ? 'bg-slate-800 text-purple-300 border border-purple-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-purple-200 hover:bg-slate-800/50'
              }`}
            >
              <Percent className="w-3.5 h-3.5 text-purple-400" />
              <span>Interest Alerts</span>
              {interestCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {interestCount}
                </span>
              )}
            </button>
          </div>

          {/* Feedback banner */}
          {feedbackNotice && (
            <div className="px-4 py-2 bg-emerald-950/80 border-b border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between animate-in fade-in">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">{feedbackNotice}</span>
              </div>
              <button onClick={() => setFeedbackNotice(null)} className="text-emerald-400 hover:text-white ml-2">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80 max-h-[360px] overscroll-contain">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 px-6 text-center space-y-2.5">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 text-slate-400 mx-auto flex items-center justify-center">
                  <Bell className="w-6 h-6 opacity-40" />
                </div>
                <p className="text-xs font-semibold text-slate-300">No notifications found</p>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  {activeFilter === 'loans'
                    ? 'No loan applications found matching this filter.'
                    : activeFilter === 'interest'
                    ? 'No interest received transactions found yet.'
                    : 'All loan applications and interest postings are up to date.'}
                </p>
              </div>
            ) : (
              filteredNotifications.map(item => {
                const isLoan = item.category === 'loans';
                const isSavingsInterest = item.sub_type === 'savings_interest';
                const isLoanInterest = item.sub_type === 'loan_interest';

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 hover:bg-slate-800/60 transition flex items-start space-x-3 relative group ${
                      !item.read ? 'bg-slate-800/30' : ''
                    }`}
                  >
                    {/* Unread indicator dot */}
                    {!item.read && (
                      <span className="absolute top-4 left-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    )}

                    {/* Icon */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        isLoan
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : isSavingsInterest
                          ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}
                    >
                      {isLoan ? (
                        <FileText className="w-4 h-4" />
                      ) : isSavingsInterest ? (
                        <Sparkles className="w-4 h-4" />
                      ) : (
                        <Coins className="w-4 h-4" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                            isLoan
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : isSavingsInterest
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          }`}
                        >
                          {isLoan
                            ? item.status || 'Loan Application'
                            : isSavingsInterest
                            ? 'Savings Interest'
                            : 'Loan Interest Payment'}
                        </span>
                        <span className="text-[10px] text-slate-400 flex items-center space-x-1 shrink-0">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimestamp(item.timestamp)}</span>
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-white tracking-tight truncate">
                        {item.title}
                      </h4>

                      <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>

                      {/* Action buttons */}
                      <div className="flex items-center space-x-2 mt-2 pt-1 border-t border-slate-800/60">
                        {isLoan && onNavigateTab && (
                          <button
                            onClick={() => {
                              onNavigateTab('loans');
                              setIsOpen(false);
                            }}
                            className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center space-x-1 cursor-pointer transition"
                          >
                            <span>Review in Loans Module</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}

                        {!isLoan && onNavigateTab && (
                          <button
                            onClick={() => {
                              onNavigateTab(isSavingsInterest ? 'savings' : 'accounting');
                              setIsOpen(false);
                            }}
                            className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 cursor-pointer transition"
                          >
                            <span>{isSavingsInterest ? 'View in Savings Ledger' : 'View in General Ledger'}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}

                        {!item.read && (
                          <button
                            onClick={() => handleMarkAsRead(item.id)}
                            className="ml-auto text-[10px] text-slate-400 hover:text-slate-200 transition cursor-pointer"
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Action Footer */}
          <div className="p-3 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between gap-2 text-xs">
            <button
              onClick={handlePostSavingsInterest}
              disabled={isPostingInterest}
              title="Calculate & credit CDA interest on all active savings accounts"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-700/80 to-indigo-700/80 hover:from-purple-600 hover:to-indigo-600 text-white font-semibold text-[11px] shadow-sm transition cursor-pointer disabled:opacity-50"
            >
              <Percent className={`w-3.5 h-3.5 text-purple-200 ${isPostingInterest ? 'animate-spin' : ''}`} />
              <span>{isPostingInterest ? 'Posting Interest...' : 'Post Savings Interest (Batch)'}</span>
            </button>

            {unreadCount > 0 && (
              <button
                onClick={() => handleMarkAsRead()}
                className="text-[11px] text-slate-400 hover:text-white transition cursor-pointer font-medium"
              >
                Mark all read
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
