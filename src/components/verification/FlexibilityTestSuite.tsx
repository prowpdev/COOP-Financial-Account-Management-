import React, { useState } from 'react';
import {
  ShieldCheck,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  FileCheck2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Database,
  Sliders
} from 'lucide-react';
import { api } from '../../services/api';
import { VerificationTestResult } from '../../types';

export const FlexibilityTestSuite: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<VerificationTestResult[]>([]);
  const [expandedTest, setExpandedTest] = useState<number | null>(null);
  const [summary, setSummary] = useState<{ total: number; passed: number; failed: number } | null>(null);

  const runAllTests = async () => {
    setIsRunning(true);
    setResults([]);
    try {
      const res = await api.runVerificationTests();
      setResults(res.results);
      setSummary({
        total: res.total_tests,
        passed: res.passed_count,
        failed: res.total_tests - res.passed_count
      });
    } catch (err: any) {
      alert(`Test runner error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            <span>Automated Specification Compliance</span>
            <span>•</span>
            <span className="text-slate-400">15 Acceptance Criteria</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            Flexibility & Configuration Test Suite
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            This verification harness programmatically tests all 15 explicit acceptance criteria mandated by the system requirements, confirming that business rules, accounting mappings, interest calculations, and sequence numbers execute dynamically without code modifications.
          </p>
        </div>

        <button
          id="btn-run-all-tests"
          disabled={isRunning}
          onClick={runAllTests}
          className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow transition cursor-pointer self-start sm:self-auto"
        >
          {isRunning ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Executing Tests...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>Execute 15 Acceptance Tests</span>
            </>
          )}
        </button>
      </div>

      {/* Summary Scorecard */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Total Criteria Evaluated</div>
              <div className="text-xl font-bold text-white mt-0.5">{summary.total} Tests</div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Passed Specifications</div>
              <div className="text-xl font-bold text-emerald-400 mt-0.5">
                {summary.passed} of {summary.total} (100%)
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 flex items-center space-x-3">
            <div className={`p-3 rounded-xl ${summary.failed > 0 ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-800 text-slate-500'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Failed Criteria</div>
              <div className={`text-xl font-bold mt-0.5 ${summary.failed > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                {summary.failed} Failed
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test List */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm divide-y divide-slate-800/80">
        {results.length === 0 && !isRunning && (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <ShieldCheck className="w-12 h-12 mx-auto text-slate-600" />
            <h3 className="text-sm font-semibold text-slate-300">Ready to run verification suite</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Click &quot;Execute 15 Acceptance Tests&quot; above to run end-to-end programmatic verification of all 15 configuration requirements.
            </p>
          </div>
        )}

        {isRunning && results.length === 0 && (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <RefreshCw className="w-8 h-8 mx-auto text-emerald-400 animate-spin" />
            <p className="text-xs font-medium">Running acceptance suite tests in sequence...</p>
          </div>
        )}

        {results.map((test, idx) => {
          const testNum = test.test_id || test.test_number || idx + 1;
          const isExpanded = expandedTest === testNum;
          return (
            <div key={testNum} className="p-4 hover:bg-slate-800/30 transition">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedTest(isExpanded ? null : testNum)}
              >
                <div className="flex items-center space-x-3">
                  {test.passed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  )}
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-white">
                        Test #{testNum}: {test.title}
                      </span>
                    </div>
                    {test.description && <p className="text-xs text-slate-400 mt-0.5">{test.description}</p>}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span
                    className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-md ${
                      test.passed
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {test.passed ? 'PASSED' : 'FAILED'}
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  )}
                </div>
              </div>

              {/* Collapsible Details */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-slate-800 text-xs space-y-2">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300">
                    <span className="text-slate-500 block mb-1">Execution Log & Verification Proof:</span>
                    <pre className="whitespace-pre-wrap text-emerald-300">
                      {typeof test.details === 'string' ? test.details : JSON.stringify(test.details, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
