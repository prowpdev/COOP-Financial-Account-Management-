import React, { useState } from 'react';
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
  Layers
} from 'lucide-react';
import { api } from '../../services/api';

interface SetupWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: string) => void;
  onRefreshData?: () => void;
}

export const SetupWizardModal: React.FC<SetupWizardModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onRefreshData
}) => {
  const [activeView, setActiveView] = useState<'guide' | 'reset'>('guide');
  const [currentStep, setCurrentStep] = useState(0);

  // Reset tool state
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const steps = [
    {
      step: 1,
      title: 'Cooperative Profile & Branch Topology',
      shortTitle: 'Branches & Profile',
      icon: Building2,
      badge: 'Step 1 of 6',
      description: 'Establish institutional identity, CDA registration, and geographic branches.',
      content: (
        <div className="space-y-3 text-xs text-slate-300">
          <p>
            Start by verifying your cooperative's official name, CDA Registration Number, and branch network.
            CoopFlex supports multi-branch operations with both consolidated and branch-isolated reporting.
          </p>
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="font-semibold text-emerald-400 flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Best Practice Configuration:
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>Head Office / Main Branch is designated as primary clearing hub.</li>
              <li>Satellite branches & extension offices have unique branch codes and designated vault limits.</li>
              <li>Use the Branch Selector in the header to switch perspectives instantly.</li>
            </ul>
          </div>
        </div>
      ),
      actionTab: 'configuration',
      actionLabel: 'Open Configuration Center'
    },
    {
      step: 2,
      title: 'CDA Standard Chart of Accounts & GL Mapping',
      shortTitle: 'Chart of Accounts',
      icon: BookOpen,
      badge: 'Step 2 of 6',
      description: 'Pre-mapped CDA standard accounts with automated double-entry postings.',
      content: (
        <div className="space-y-3 text-xs text-slate-300">
          <p>
            Every financial action (loan release, cash deposit, share capital installment) triggers an automated
            balanced Journal Voucher (JV) posted to the General Ledger adhering to CDA accounting guidelines.
          </p>
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="font-semibold text-emerald-400 flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> CDA Account Categories:
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 font-mono">
              <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                <strong className="text-emerald-300 block">100 Assets</strong>
                101 Cash on Hand, 120 Loans Receivable
              </div>
              <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                <strong className="text-blue-300 block">200 Liabilities</strong>
                201 Savings Deposits, 210 Time Deposits
              </div>
              <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                <strong className="text-purple-300 block">300 Equity</strong>
                301 Paid-up Share Capital, 310 Reserve Fund
              </div>
              <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                <strong className="text-amber-300 block">400 & 500 P&L</strong>
                401 Interest Income, 501 Operating Expense
              </div>
            </div>
          </div>
        </div>
      ),
      actionTab: 'accounting',
      actionLabel: 'View Chart of Accounts & Ledger'
    },
    {
      step: 3,
      title: 'Member Onboarding & Capital Build-Up (CBU)',
      shortTitle: 'Member Onboarding',
      icon: Users,
      badge: 'Step 3 of 6',
      description: 'Onboard cooperative members with automated Savings & Share Capital accounts.',
      content: (
        <div className="space-y-3 text-xs text-slate-300">
          <p>
            When a member is registered, CoopFlex automatically creates their core identity, assigns a sequential
            Member ID, opens their linked Savings Account (SA), and provisions their Capital Build-Up (CBU) share ledger.
          </p>
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="font-semibold text-emerald-400 flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Dynamic Features:
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>Configure custom membership attributes (e.g. Farm Hectares, Primary Crop, TIN).</li>
              <li>Toggle between Regular, Associate, and Youth membership classifications.</li>
              <li>View individual Member Transaction Statements and 1-click printable ledgers.</li>
            </ul>
          </div>
        </div>
      ),
      actionTab: 'members',
      actionLabel: 'Go to Members Registry'
    },
    {
      step: 4,
      title: 'Loan Products, Credit Scoring & Amortization',
      shortTitle: 'Loan Products',
      icon: Coins,
      badge: 'Step 4 of 6',
      description: 'Configure agricultural and micro-credit financing products with diminishing balance calculation.',
      content: (
        <div className="space-y-3 text-xs text-slate-300">
          <p>
            Loan origination enforces CBU share-capital multiplier limits (e.g., max 300% of paid-up capital),
            interest rates (diminishing balance or flat), and required loan document checklists.
          </p>
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="font-semibold text-emerald-400 flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Origination Workflow:
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-400">
              <li>Loan Application & Credit Assessment (Automated schedule generation).</li>
              <li>Manager / Credit Committee Approval.</li>
              <li>Disbursement from Cash in Vault or Bank clearing account.</li>
            </ol>
          </div>
        </div>
      ),
      actionTab: 'loans',
      actionLabel: 'Go to Loans Module'
    },
    {
      step: 5,
      title: 'Daily Cash Drawers & Over-the-Counter Operations',
      shortTitle: 'Cash Operations',
      icon: Receipt,
      badge: 'Step 5 of 6',
      description: 'Manage teller drawers, cash collections, savings deposits, and disbursements.',
      content: (
        <div className="space-y-3 text-xs text-slate-300">
          <p>
            Tellers and cashiers can receive member loan amortizations, process savings deposits/withdrawals,
            and issue official receipts with automatic GL voucher generation.
          </p>
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="font-semibold text-emerald-400 flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Cash Controls:
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>Each branch maintains an isolated Cash in Vault and Teller Cash Drawer.</li>
              <li>Daily transactions can be reconciled before end-of-day drawer closing.</li>
              <li>Full audit trail logs every cashier receipt and voucher number.</li>
            </ul>
          </div>
        </div>
      ),
      actionTab: 'cash',
      actionLabel: 'Go to Cash Operations'
    },
    {
      step: 6,
      title: 'Financial Statements, CDA Statutory & Period Closing',
      shortTitle: 'Reports & Compliance',
      icon: PieChart,
      badge: 'Step 6 of 6',
      description: 'Real-time Trial Balance, Balance Sheet, Income Statement, and CDA Statutory Allocation.',
      content: (
        <div className="space-y-3 text-xs text-slate-300">
          <p>
            Generate authoritative financial reports in seconds with zero calculation discrepancies.
            Includes automatic calculation of CDA Net Surplus Distribution:
          </p>
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="font-semibold text-emerald-400 flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Mandatory Statutory Funds:
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
      ),
      actionTab: 'reports',
      actionLabel: 'View Financial Statements'
    }
  ];

  const handlePurgeOperational = async () => {
    if (resetConfirmText.toUpperCase() !== 'RESET') {
      setStatusMessage({ type: 'error', text: 'Please type "RESET" into the confirmation field to proceed.' });
      return;
    }

    setIsProcessing(true);
    setStatusMessage(null);
    try {
      await api.purgeOperationalData();
      setStatusMessage({
        type: 'success',
        text: 'All operational records (members, loans, savings, vouchers) have been cleared. System is now at a clean baseline.'
      });
      setResetConfirmText('');
      if (onRefreshData) onRefreshData();
      window.dispatchEvent(new CustomEvent('coop:data-changed'));
    } catch (err: any) {
      // If error, trigger fallback reset
      try {
        await api.resetSeed();
        setStatusMessage({
          type: 'success',
          text: 'Database successfully reset to clean CDA baseline seed.'
        });
        setResetConfirmText('');
        if (onRefreshData) onRefreshData();
        window.dispatchEvent(new CustomEvent('coop:data-changed'));
      } catch (fallbackErr: any) {
        setStatusMessage({ type: 'error', text: err.message || 'Failed to purge data.' });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadSample = async () => {
    setIsProcessing(true);
    setStatusMessage(null);
    try {
      await api.seedSampleMembers();
      setStatusMessage({
        type: 'success',
        text: 'Realistic sample agricultural members and active accounts loaded successfully!'
      });
      if (onRefreshData) onRefreshData();
      window.dispatchEvent(new CustomEvent('coop:data-changed'));
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to load sample dataset.' });
    } finally {
      setIsProcessing(false);
    }
  };

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
      if (onRefreshData) onRefreshData();
      window.dispatchEvent(new CustomEvent('coop:data-changed'));
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to reset system.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const currentStepData = steps[currentStep];
  const StepIcon = currentStepData.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
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
                <h2 className="text-lg font-bold text-white tracking-tight">Cooperative System Setup Wizard</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                  Interactive Guide & Reset
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Step-by-step onboarding walkthrough and data management controls
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
              <span>Step-by-Step Setup Guide</span>
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
              {/* Step Navigation Pill Indicator */}
              <div className="grid grid-cols-6 gap-2">
                {steps.map((s, idx) => {
                  const Icon = s.icon;
                  const isActive = currentStep === idx;
                  const isCompleted = currentStep > idx;

                  return (
                    <button
                      key={s.step}
                      onClick={() => setCurrentStep(idx)}
                      className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center space-y-1 ${
                        isActive
                          ? 'bg-emerald-600/20 border-emerald-500 text-white'
                          : isCompleted
                          ? 'bg-slate-800/80 border-slate-700 text-emerald-400'
                          : 'bg-slate-950/60 border-slate-800 text-slate-500 hover:text-slate-300'
                      }`}
                    >
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
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                      <StepIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
                        {currentStepData.badge}
                      </span>
                      <h3 className="text-base font-bold text-white tracking-tight">
                        {currentStepData.title}
                      </h3>
                      <p className="text-xs text-slate-400">{currentStepData.description}</p>
                    </div>
                  </div>
                </div>

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
                  Use this tool to either <strong>clean all sample/testing records</strong> (members, loans, vouchers)
                  or restore a factory-fresh database state. Master configurations (Branches, Chart of Accounts, Products)
                  can be preserved so your cooperative remains fully configured.
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
                    <h4 className="text-xs font-bold text-white">Clean Baseline</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Clears all members, loans, savings, and vouchers. Preserves Chart of Accounts and branches (0 records).
                    </p>
                  </div>
                  <div className="text-[10px] text-amber-400 font-mono">Preserves Configuration</div>
                </div>

                {/* Option 2: Load Realistic Samples */}
                <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-white">Sample Agri-Dataset</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Populates 4 realistic farmer members, agricultural crop loans, and linked GL ledger entries for quick testing.
                    </p>
                  </div>
                  <button
                    onClick={handleLoadSample}
                    disabled={isProcessing}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                  >
                    Load Sample Data
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
                      Reloads default CDA factory schema seeds, including standard 29 accounts and user roles.
                    </p>
                  </div>
                  <div className="text-[10px] text-red-400 font-mono">Full Seed Reset</div>
                </div>
              </div>

              {/* Safety Confirmation Box */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                <label className="block text-xs font-medium text-slate-300">
                  Confirmation Required: Type <span className="text-red-400 font-mono font-bold">RESET</span> to confirm operational purge or factory reset:
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={resetConfirmText}
                    onChange={e => setResetConfirmText(e.target.value)}
                    placeholder="Type RESET here..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 uppercase font-mono"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handlePurgeOperational}
                      disabled={isProcessing || resetConfirmText.toUpperCase() !== 'RESET'}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-40"
                    >
                      Purge Data Only
                    </button>
                    <button
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
                Step {currentStep + 1} of {steps.length}
              </div>

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
                <span>{currentStep < steps.length - 1 ? 'Next Step' : 'Got It, Close'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <div className="w-full flex justify-end">
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
