import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Wand2,
  Trash2,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Building2,
  BookOpen,
  Users,
  Coins,
  Receipt,
  PieChart,
  ArrowRight,
  ArrowLeft,
  ShieldAlert,
  HelpCircle,
  ExternalLink,
  RefreshCw,
  Play,
  Landmark,
  Check,
  ShieldCheck,
  Activity
} from 'lucide-react';
import { api } from '../../services/api';

interface SetupWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: string) => void;
  onRefreshData?: () => void;
}

interface SetupStatusData {
  is_fully_configured: boolean;
  completion_percentage: number;
  completed_count: number;
  total_count: number;
  requirements: Array<{
    id: string;
    step: number;
    name: string;
    status: 'completed' | 'pending';
    summary: string;
    details: string;
  }>;
  stats: {
    cooperative_name: string;
    branches_count: number;
    accounts_count: number;
    members_count: number;
    loans_count: number;
    vault_cash_total: number;
    is_gl_balanced: boolean;
    gl_discrepancy: number;
  };
}

export const SetupWizardModal: React.FC<SetupWizardModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onRefreshData
}) => {
  const [activeView, setActiveView] = useState<'guide' | 'reset'>('guide');
  const [currentStep, setCurrentStep] = useState(0);
  const [setupStatus, setSetupStatus] = useState<SetupStatusData | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);

  // Reset tool state
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchStatus = useCallback(async () => {
    setIsLoadingStatus(true);
    try {
      const res = await api.getSetupStatus();
      if (res && res.success && res.data) {
        setSetupStatus(res.data);
      }
    } catch (err) {
      console.error('Failed to load setup status:', err);
    } finally {
      setIsLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      setStatusMessage(null);
    }
  }, [isOpen, fetchStatus]);

  if (!isOpen) return null;

  // Complete all requirements with 1-click
  const handleCompleteAll = async () => {
    setIsProcessing(true);
    setStatusMessage(null);
    try {
      const res = await api.completeAllSetup();
      if (res && res.success) {
        setStatusMessage({
          type: 'success',
          text: 'Setup Wizard successfully completed all requirements! Initial capital, cash vaults, founding members, and balanced GL are verified.'
        });
        await fetchStatus();
        if (onRefreshData) onRefreshData();
        window.dispatchEvent(new CustomEvent('coop:data-changed'));
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to complete setup requirements.' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Run individual step
  const handleRunStep = async (stepNumber: number) => {
    setIsProcessing(true);
    setStatusMessage(null);
    try {
      const res = await api.runSetupStep(stepNumber);
      if (res && res.success) {
        setStatusMessage({
          type: 'success',
          text: `Step ${stepNumber} completed: ${res.message}`
        });
        await fetchStatus();
        if (onRefreshData) onRefreshData();
        window.dispatchEvent(new CustomEvent('coop:data-changed'));
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || `Failed to execute step ${stepNumber}.` });
    } finally {
      setIsProcessing(false);
    }
  };

  // Purge all operational data to clean scratch
  const handlePurgeToScratch = async () => {
    if (resetConfirmText.toUpperCase() !== 'RESET') {
      setStatusMessage({ type: 'error', text: 'Please type "RESET" into the confirmation field to proceed.' });
      return;
    }

    setIsProcessing(true);
    setStatusMessage(null);
    try {
      const res = await api.resetToScratch();
      setStatusMessage({
        type: 'success',
        text: res.message || 'All operational records purged. System is at clean scratch baseline.'
      });
      setResetConfirmText('');
      await fetchStatus();
      if (onRefreshData) onRefreshData();
      window.dispatchEvent(new CustomEvent('coop:data-changed'));
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to purge operational data.' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Factory reset
  const handleFactoryReset = async () => {
    if (resetConfirmText.toUpperCase() !== 'RESET') {
      setStatusMessage({ type: 'error', text: 'Please type "RESET" into the confirmation field to proceed.' });
      return;
    }

    setIsProcessing(true);
    setStatusMessage(null);
    try {
      await api.resetToSeed();
      setStatusMessage({
        type: 'success',
        text: 'Complete factory reset completed! Chart of Accounts, branches, and CDA seeds restored.'
      });
      setResetConfirmText('');
      await fetchStatus();
      if (onRefreshData) onRefreshData();
      window.dispatchEvent(new CustomEvent('coop:data-changed'));
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to reset system.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const steps = [
    {
      step: 1,
      id: 'step_profile',
      title: 'Cooperative Profile & Branch Topology',
      shortTitle: 'Profile & Branches',
      icon: Building2,
      badge: 'Requirement 1 of 6',
      description: 'Establish institutional identity, CDA registration, and geographic branches.',
      actionTab: 'configuration',
      actionLabel: 'Open Configuration Center',
      content: (
        <div className="space-y-3 text-xs text-slate-300">
          <p>
            Verify your cooperative's official institutional profile, CDA Registration Number, and branch topology.
            CoopFlex supports multi-branch operations with both consolidated and branch-isolated reporting.
          </p>
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="font-semibold text-emerald-400 flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Established Topology:
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li><strong className="text-white">Main Branch (Tarlac):</strong> Primary administrative clearing hub and main vault.</li>
              <li><strong className="text-white">Urdaneta Branch:</strong> Northern agricultural services center.</li>
              <li><strong className="text-white">San Fernando Branch:</strong> Regional credit extension office.</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      step: 2,
      id: 'step_coa',
      title: 'CDA Standard Chart of Accounts & GL Mapping',
      shortTitle: 'Chart of Accounts',
      icon: BookOpen,
      badge: 'Requirement 2 of 6',
      description: 'Pre-mapped CDA standard accounts with automated double-entry postings.',
      actionTab: 'accounting',
      actionLabel: 'View Chart of Accounts & Ledger',
      content: (
        <div className="space-y-3 text-xs text-slate-300">
          <p>
            Every financial event (loan release, cash deposit, share capital contribution, fees) triggers an automated
            balanced Journal Voucher (JV) posted to the General Ledger adhering to CDA accounting guidelines.
          </p>
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="font-semibold text-emerald-400 flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> CDA Account Categories:
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 font-mono">
              <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                <strong className="text-emerald-300 block">100 Assets</strong>
                1110 Cash on Hand, 1120 Bank, 1210 Loans Receivable
              </div>
              <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                <strong className="text-blue-300 block">200 Liabilities</strong>
                2110 Savings Deposits, 2120 Time Deposits
              </div>
              <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                <strong className="text-purple-300 block">300 Equity</strong>
                3110 Paid-up Share Capital, 3210 Reserve Fund
              </div>
              <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                <strong className="text-amber-300 block">400 & 500 P&L</strong>
                4100 Interest Income, 5110 Interest Expense
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      step: 3,
      id: 'step_liquidity',
      title: 'Cash Vault Liquidity & Opening Capitalization',
      shortTitle: 'Vault & Capital',
      icon: Landmark,
      badge: 'Requirement 3 of 6',
      description: 'Allocate cash float to branch vaults and post balanced opening capital.',
      actionTab: 'cash',
      actionLabel: 'Manage Cash Vaults & Drawers',
      content: (
        <div className="space-y-3 text-xs text-slate-300">
          <p>
            To fund initial loans and daily teller drawer operations, the cooperative must establish initial liquidity.
            The setup wizard automatically posts a balanced Journal Voucher (JV-2026-00001):
          </p>
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="font-semibold text-emerald-400 flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Initial Capitalization Voucher:
            </div>
            <div className="text-[11px] font-mono space-y-1 text-slate-300">
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span className="text-emerald-400">Dr 1110 Cash on Hand (Tellers & Vaults)</span>
                <span>₱500,000.00</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span className="text-emerald-400">Dr 1120 Cash in Bank (Land Bank)</span>
                <span>₱500,000.00</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-blue-400">Cr 3110 Paid-up Share Capital - Common</span>
                <span>₱1,000,000.00</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 italic">
              Result: Zero variance trial balance with ₱1,000,000 operating cash immediately available for disbursements.
            </p>
          </div>
        </div>
      )
    },
    {
      step: 4,
      id: 'step_members',
      title: 'Member Onboarding & Capital Build-Up (CBU)',
      shortTitle: 'Members & CBU',
      icon: Users,
      badge: 'Requirement 4 of 6',
      description: 'Onboard founding members with active Savings and Share Capital ledgers.',
      actionTab: 'members',
      actionLabel: 'Go to Members Registry',
      content: (
        <div className="space-y-3 text-xs text-slate-300">
          <p>
            Every member onboarded receives a unique sequential Member ID (e.g. MB-2026-0001), an active Savings Account,
            and a Capital Build-Up (CBU) share capital ledger with subscribed and paid-up shares.
          </p>
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="font-semibold text-emerald-400 flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Automated Founding Roster:
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li><strong className="text-white">Juan Dela Cruz (MB-2026-0001):</strong> Rice & Corn farmer, 3.5 ha, Regular Member.</li>
              <li><strong className="text-white">Maria Santos Reyes (MB-2026-0002):</strong> Organic vegetable grower, Regular Member.</li>
              <li><strong className="text-white">Rodrigo Mendoza (MB-2026-0003):</strong> Agri-farm supplies owner, Associate Member.</li>
              <li><strong className="text-white">Elena Rostro (MB-2026-0004):</strong> Sugarcane grower, Regular Member.</li>
            </ul>
            <p className="text-[11px] text-slate-400">
              Each member is funded with ₱5,000 savings balance and ₱5,000 paid-up share capital with balanced journal lines.
            </p>
          </div>
        </div>
      )
    },
    {
      step: 5,
      id: 'step_products',
      title: 'Loan Products, Credit Scoring & Amortization',
      shortTitle: 'Loan & Savings Products',
      icon: Coins,
      badge: 'Requirement 5 of 6',
      description: 'Configure agricultural and micro-credit financing products with diminishing balance calculation.',
      actionTab: 'loans',
      actionLabel: 'Go to Loans Module',
      content: (
        <div className="space-y-3 text-xs text-slate-300">
          <p>
            Loan origination enforces CBU share-capital multiplier limits (e.g., max 300% of paid-up capital),
            interest rates (diminishing balance or flat), and required loan document checklists.
          </p>
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="font-semibold text-emerald-400 flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Pre-Configured Facilities:
            </div>
            <div className="space-y-1 text-slate-400">
              <div>• <strong className="text-white">Regular Multi-Purpose Loan:</strong> 10% annual diminishing balance, up to ₱300,000.</div>
              <div>• <strong className="text-white">Emergency Instant Relief:</strong> 6% flat interest, up to ₱30,000, fast approval.</div>
              <div>• <strong className="text-white">Agricultural Crop Production:</strong> 8% simple interest, flexible harvest amortizations.</div>
            </div>
          </div>
        </div>
      )
    },
    {
      step: 6,
      id: 'step_compliance',
      title: 'Financial Statements, CDA Statutory & Period Closing',
      shortTitle: 'CDA Compliance & GL',
      icon: PieChart,
      badge: 'Requirement 6 of 6',
      description: 'Real-time Trial Balance, Balance Sheet, Income Statement, and CDA Statutory Allocation.',
      actionTab: 'reports',
      actionLabel: 'View Financial Statements',
      content: (
        <div className="space-y-3 text-xs text-slate-300">
          <p>
            Generate authoritative financial reports in seconds with zero calculation discrepancies.
            Includes automatic calculation of CDA Net Surplus Distribution:
          </p>
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="font-semibold text-emerald-400 flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Mandatory CDA Statutory Reserves:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-300">
              <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-emerald-400 font-bold block">10%</span>
                General Reserve Fund
              </div>
              <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-blue-400 font-bold block">5%</span>
                Coop Education Fund (CETF)
              </div>
              <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-purple-400 font-bold block">3%</span>
                Community Dev. Fund
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const currentStepData = steps[currentStep];
  const StepIcon = currentStepData.icon;
  const currentReqStatus = setupStatus?.requirements?.find(r => r.step === currentStepData.step);
  const isStepCompleted = currentReqStatus?.status === 'completed';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 p-6 border-b border-slate-800 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
              <Wand2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white tracking-tight">Cooperative Setup Wizard</h2>
                {setupStatus && (
                  <span
                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold border flex items-center space-x-1 ${
                      setupStatus.is_fully_configured
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    {setupStatus.is_fully_configured ? (
                      <>
                        <ShieldCheck className="w-3 h-3 mr-1" />
                        <span>100% Operational (6/6 Complete)</span>
                      </>
                    ) : (
                      <>
                        <Activity className="w-3 h-3 mr-1" />
                        <span>Setup Required ({setupStatus.completed_count}/{setupStatus.total_count} Complete)</span>
                      </>
                    )}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Onboarding wizard to complete all requirements and establish a clean, balanced operational baseline
              </p>
            </div>
          </div>

          {/* Top Mode Tabs */}
          <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800/80 mt-5">
            <button
              onClick={() => {
                setActiveView('guide');
                setStatusMessage(null);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition cursor-pointer ${
                activeView === 'guide'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Interactive Setup Wizard</span>
            </button>
            <button
              onClick={() => {
                setActiveView('reset');
                setStatusMessage(null);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition cursor-pointer ${
                activeView === 'reset'
                  ? 'bg-red-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset & Clean System Data</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {statusMessage && (
            <div
              className={`p-4 rounded-2xl text-xs flex items-center space-x-2.5 animate-in fade-in ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-950/70 border border-emerald-500/50 text-emerald-300'
                  : 'bg-red-950/70 border border-red-500/50 text-red-300'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span className="font-medium">{statusMessage.text}</span>
            </div>
          )}

          {activeView === 'guide' ? (
            <div className="space-y-6">
              {/* Quick Action Banner */}
              <div
                className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  setupStatus?.is_fully_configured
                    ? 'bg-emerald-950/40 border-emerald-500/30'
                    : 'bg-gradient-to-r from-emerald-950/70 to-slate-900 border-emerald-500/40'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-sm font-bold text-white">
                      {setupStatus?.is_fully_configured
                        ? 'Cooperative System Fully Functional'
                        : 'Complete All Requirements in One Click'}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-300 max-w-xl">
                    {setupStatus?.is_fully_configured
                      ? 'All CDA accounts, branch cash vaults, founding members with active CBU ledgers, and zero-variance GL double-entries are active and verified.'
                      : 'Executes the complete setup workflow: configures CDA accounts, initializes ₱1M opening capital, seeds cash float in vaults, and onboards founding members.'}
                  </p>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    id="complete-all-setup-btn"
                    onClick={handleCompleteAll}
                    disabled={isProcessing}
                    className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg transition cursor-pointer disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Configuring...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Complete All Requirements</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Progress Summary Card */}
              {setupStatus && (
                <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Operational Readiness</span>
                    <span className="text-emerald-400 font-bold font-mono">
                      {setupStatus.completion_percentage}% ({setupStatus.completed_count}/{setupStatus.total_count} Requirements Met)
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-500"
                      style={{ width: `${setupStatus.completion_percentage}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Step Navigation Pill Indicator */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                {steps.map((s, idx) => {
                  const Icon = s.icon;
                  const isActive = currentStep === idx;
                  const req = setupStatus?.requirements?.find(r => r.step === s.step);
                  const isDone = req?.status === 'completed';

                  return (
                    <button
                      key={s.step}
                      onClick={() => setCurrentStep(idx)}
                      className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center space-y-1 relative ${
                        isActive
                          ? 'bg-emerald-600/20 border-emerald-500 text-white shadow'
                          : isDone
                          ? 'bg-slate-800/80 border-slate-700 text-emerald-400 hover:bg-slate-800'
                          : 'bg-slate-950/60 border-slate-800 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {isDone && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
                      )}
                      <Icon className="w-4 h-4" />
                      <span className="text-[10px] font-semibold truncate w-full">
                        {idx + 1}. {s.shortTitle}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active Step Card */}
              <div className="bg-slate-950/80 rounded-2xl p-6 border border-slate-800 space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-800/80 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                      <StepIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
                          {currentStepData.badge}
                        </span>
                        {isStepCompleted ? (
                          <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30 flex items-center space-x-1">
                            <Check className="w-2.5 h-2.5 mr-0.5" /> Complete
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-400 font-semibold border border-amber-500/30">
                            Pending
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-white tracking-tight">
                        {currentStepData.title}
                      </h3>
                      <p className="text-xs text-slate-400">{currentStepData.description}</p>
                    </div>
                  </div>

                  {/* Step Action Button */}
                  <div className="flex items-center space-x-2 self-end sm:self-auto">
                    <button
                      onClick={() => handleRunStep(currentStepData.step)}
                      disabled={isProcessing}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer disabled:opacity-50"
                    >
                      <Play className="w-3 h-3 text-emerald-400" />
                      <span>{isStepCompleted ? 'Re-Verify Step' : 'Execute Step'}</span>
                    </button>
                  </div>
                </div>

                {/* Step Live Status Note if available */}
                {currentReqStatus && (
                  <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-xs flex items-center justify-between">
                    <span className="text-slate-400">Live Status:</span>
                    <span className="font-medium text-slate-200">{currentReqStatus.details}</span>
                  </div>
                )}

                <div className="pt-2">{currentStepData.content}</div>

                {/* Quick Link to Feature */}
                {currentStepData.actionTab && onNavigateTab && (
                  <div className="pt-3 border-t border-slate-800/80 flex justify-end">
                    <button
                      onClick={() => {
                        onNavigateTab(currentStepData.actionTab);
                        onClose();
                      }}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold transition cursor-pointer border border-emerald-500/30"
                    >
                      <span>{currentStepData.actionLabel}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Live System Health Grid */}
              {setupStatus?.stats && (
                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                    <span>Live Cooperative Operational State</span>
                    <button
                      onClick={fetchStatus}
                      disabled={isLoadingStatus}
                      className="text-slate-400 hover:text-emerald-400 flex items-center space-x-1 transition cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoadingStatus ? 'animate-spin' : ''}`} />
                      <span>Refresh</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800/80">
                      <span className="text-slate-400 block text-[11px]">Active Branches</span>
                      <span className="text-white font-bold text-sm">{setupStatus.stats.branches_count}</span>
                    </div>
                    <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800/80">
                      <span className="text-slate-400 block text-[11px]">Chart of Accounts</span>
                      <span className="text-white font-bold text-sm">{setupStatus.stats.accounts_count} CDA Accts</span>
                    </div>
                    <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800/80">
                      <span className="text-slate-400 block text-[11px]">Cash in Vaults & Banks</span>
                      <span className="text-emerald-400 font-bold text-sm font-mono">
                        ₱{setupStatus.stats.vault_cash_total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800/80">
                      <span className="text-slate-400 block text-[11px]">Trial Balance Variance</span>
                      <span className={`font-bold text-sm font-mono ${setupStatus.stats.is_gl_balanced ? 'text-emerald-400' : 'text-red-400'}`}>
                        {setupStatus.stats.is_gl_balanced ? '₱0.00 (Balanced)' : `₱${setupStatus.stats.gl_discrepancy.toFixed(2)}`}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Reset & Clean Data Center */
            <div className="space-y-6">
              <div className="bg-red-950/30 border border-red-500/30 rounded-2xl p-5 text-xs text-slate-300 space-y-3">
                <div className="flex items-center space-x-2 text-red-400 font-bold text-sm">
                  <ShieldAlert className="w-4 h-4" />
                  <span>System Data Purge & Baseline Management</span>
                </div>
                <p>
                  Use this tool to either <strong>remove all operational data and start from scratch</strong>,
                  or restore a factory-fresh database state. Once purged, you can use the Setup Wizard
                  to complete all requirements from scratch.
                </p>
              </div>

              {/* Three Options Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Option 1: Clean Operational Slate */}
                <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                      <Trash2 className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-white">Start From Scratch</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Purges all members, loans, savings, cash balances, and vouchers. Resets system to a clean 0% baseline.
                    </p>
                  </div>
                  <div className="text-[10px] text-amber-400 font-mono">Purges Operational Data</div>
                </div>

                {/* Option 2: 1-Click Setup Execution */}
                <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-white">Execute Full Setup</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Fulfills all 6 requirements: initial capital, cash float, founding members, CBU ledgers, and balanced GL.
                    </p>
                  </div>
                  <button
                    onClick={handleCompleteAll}
                    disabled={isProcessing}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                  >
                    Complete All Now
                  </button>
                </div>

                {/* Option 3: Factory Master Reset */}
                <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="w-9 h-9 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 flex items-center justify-center">
                      <RotateCcw className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-white">Factory Master Reset</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Reloads default CDA factory schema seeds, including standard 30 accounts, branch mappings, and users.
                    </p>
                  </div>
                  <div className="text-[10px] text-red-400 font-mono">Full Factory Re-seed</div>
                </div>
              </div>

              {/* Safety Confirmation Box */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                <label className="block text-xs font-medium text-slate-300">
                  Confirmation Required: Type <span className="text-red-400 font-mono font-bold">RESET</span> to confirm operational purge or factory reset:
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    id="setup-reset-confirm-input"
                    type="text"
                    value={resetConfirmText}
                    onChange={e => setResetConfirmText(e.target.value)}
                    placeholder="Type RESET here..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 uppercase font-mono"
                  />
                  <div className="flex gap-2">
                    <button
                      id="confirm-purge-btn"
                      onClick={handlePurgeToScratch}
                      disabled={isProcessing || resetConfirmText.toUpperCase() !== 'RESET'}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-40"
                    >
                      Start From Scratch
                    </button>
                    <button
                      id="confirm-factory-reset-btn"
                      onClick={handleFactoryReset}
                      disabled={isProcessing || resetConfirmText.toUpperCase() !== 'RESET'}
                      className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-40"
                    >
                      Factory Reset
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 border-t border-slate-800 p-4 px-6 flex items-center justify-between shrink-0">
          {activeView === 'guide' ? (
            <>
              <button
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className="flex items-center space-x-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl font-medium transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous Step</span>
              </button>

              <div className="text-xs text-slate-500 font-mono">
                Requirement {currentStep + 1} of {steps.length}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    if (currentStep < steps.length - 1) {
                      setCurrentStep(currentStep + 1);
                    } else {
                      onClose();
                    }
                  }}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-xl font-semibold shadow transition cursor-pointer"
                >
                  <span>{currentStep < steps.length - 1 ? 'Next Requirement' : 'Close Wizard'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          ) : (
            <div className="w-full flex justify-between items-center">
              <button
                onClick={() => setActiveView('guide')}
                className="text-xs text-emerald-400 hover:text-emerald-300 transition"
              >
                ← Return to Setup Guide
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl font-medium transition cursor-pointer"
              >
                Close Window
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
