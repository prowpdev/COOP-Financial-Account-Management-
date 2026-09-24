import React, { useState, useEffect } from 'react';
import {
  Calculator,
  Calendar,
  DollarSign,
  TrendingDown,
  Info,
  Clock,
  ArrowRight,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle2,
  Percent
} from 'lucide-react';
import { api } from '../../services/api';

interface LoanCalculatorProps {
  products: any[];
  memberShareCapital?: number;
  onApplyWithParameters?: (params: { productId: string; principal: number; term: number }) => void;
}

export const LoanCalculator: React.FC<LoanCalculatorProps> = ({
  products,
  memberShareCapital = 0,
  onApplyWithParameters
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [principal, setPrincipal] = useState<number>(30000);
  const [termMonths, setTermMonths] = useState<number>(12);
  const [interestMethod, setInterestMethod] = useState<string>('Diminishing Balance');
  const [interestRate, setInterestRate] = useState<number>(10.0);
  const [frequency, setFrequency] = useState<string>('Monthly');
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'schedule'>('summary');

  const [scheduleData, setScheduleData] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  // Initialize selected product when products load
  useEffect(() => {
    if (products.length > 0 && !selectedProductId) {
      const initial = products[0];
      setSelectedProductId(initial.id);
      setPrincipal(Number(initial.min_amount || 30000));
      setTermMonths(Number(initial.default_term_months || 12));
      setInterestMethod(initial.interest_calculation_method || 'Diminishing Balance');
      setInterestRate(Number(initial.annual_interest_rate || 10.0));
      setFrequency(initial.payment_frequency || 'Monthly');
    }
  }, [products]);

  // When product changes, sync parameters
  const handleProductChange = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      setPrincipal(Number(prod.min_amount || 30000));
      setTermMonths(Number(prod.default_term_months || 12));
      setInterestMethod(prod.interest_calculation_method || 'Diminishing Balance');
      setInterestRate(Number(prod.annual_interest_rate || 10.0));
      setFrequency(prod.payment_frequency || 'Monthly');
    }
  };

  // Recalculate schedule
  useEffect(() => {
    if (!principal || principal <= 0 || !termMonths || termMonths <= 0) return;

    let isMounted = true;
    setIsCalculating(true);

    api
      .calculateSchedule({
        principal: Number(principal),
        annual_rate: Number(interestRate),
        term_months: Number(termMonths),
        frequency: frequency || 'Monthly',
        method: interestMethod || 'Diminishing Balance',
        start_date: new Date().toISOString().split('T')[0]
      })
      .then((res: any) => {
        if (isMounted && res && res.data) {
          setScheduleData(res.data);
        }
      })
      .catch((err) => {
        console.error('[LoanCalculator] calculation error:', err);
      })
      .finally(() => {
        if (isMounted) setIsCalculating(false);
      });

    return () => {
      isMounted = false;
    };
  }, [principal, termMonths, interestRate, interestMethod, frequency]);

  const activeProduct = products.find((p) => p.id === selectedProductId);
  const minPrincipal = activeProduct?.min_amount || 5000;
  const maxPrincipal = activeProduct?.max_amount || 500000;
  const maxTerm = activeProduct?.max_term_months || 36;

  // CDA Cooperative Borrowing Capacity Guidance: Typical coop limit is 2x - 3x paid-up share capital
  const borrowingCapacity = memberShareCapital > 0 ? memberShareCapital * 3 : 150000;
  const isWithinGuideline = principal <= borrowingCapacity;

  // Processing & service fees calculation
  const processingFeePct = activeProduct?.processing_fee_percentage ?? 2.0;
  const fixedServiceFee = activeProduct?.service_fee_fixed ?? 200;
  const estProcessingFee = Number(((principal * processingFeePct) / 100).toFixed(2));
  const estServiceFee = Number(fixedServiceFee);
  const totalDeductions = estProcessingFee + estServiceFee;
  const netTakeHome = Math.max(0, principal - totalDeductions);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Calculator className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-black text-white">Cooperative Loan Calculator & Simulator</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulate monthly amortization, total interest, processing fees, and full payment breakdown using CDA compliant formulas.
          </p>
        </div>

        {onApplyWithParameters && (
          <button
            onClick={() =>
              onApplyWithParameters({
                productId: selectedProductId || products[0]?.id || '',
                principal: Number(principal),
                term: Number(termMonths)
              })
            }
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center space-x-2 shadow-lg shadow-emerald-950/40 cursor-pointer self-start sm:self-auto"
          >
            <span>Apply with This Simulation</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Grid: Controls on Left, Metrics & Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column (5 cols) */}
        <div className="lg:col-span-5 space-y-5 bg-slate-950/70 p-5 rounded-2xl border border-slate-800/80">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5 uppercase tracking-wider">
              1. Choose Loan Product
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => handleProductChange(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.annual_interest_rate}% p.a. • {p.interest_calculation_method})
                </option>
              ))}
            </select>
            {activeProduct?.description && (
              <p className="text-[11px] text-slate-500 mt-1.5 italic">{activeProduct.description}</p>
            )}
          </div>

          {/* Principal Amount Slider + Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                2. Principal Loan Amount
              </label>
              <span className="text-xs font-mono font-bold text-emerald-400">
                ₱{Number(principal || 0).toLocaleString()}
              </span>
            </div>
            <div className="space-y-2">
              <input
                type="range"
                min={minPrincipal}
                max={maxPrincipal}
                step={5000}
                value={principal}
                onChange={(e) => setPrincipal(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>₱{minPrincipal.toLocaleString()}</span>
                <input
                  type="number"
                  value={principal}
                  onChange={(e) => setPrincipal(Math.max(1000, Number(e.target.value)))}
                  className="w-28 text-right bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
                <span>₱{maxPrincipal.toLocaleString()}</span>
              </div>
            </div>

            {/* Capacity Banner */}
            <div className="mt-2 text-[11px] p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 flex items-start space-x-2">
              <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-slate-400">
                Coop Share Capital Reference: Paid-up <strong>₱{Number(memberShareCapital).toLocaleString()}</strong>.
                {isWithinGuideline ? (
                  <span className="text-emerald-400 ml-1">
                    ✓ Fits within 3x standard cooperative leverage capacity (₱{borrowingCapacity.toLocaleString()}).
                  </span>
                ) : (
                  <span className="text-amber-400 ml-1">
                    Note: Exceeds standard 3x share capital guideline (₱{borrowingCapacity.toLocaleString()}). May require additional co-maker or collateral.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Repayment Term Slider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                3. Repayment Term (Months)
              </label>
              <span className="text-xs font-mono font-bold text-emerald-400">{termMonths} Months</span>
            </div>
            <div className="space-y-2">
              <input
                type="range"
                min={3}
                max={maxTerm}
                step={1}
                value={termMonths}
                onChange={(e) => setTermMonths(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>3 Mos</span>
                <span className="text-slate-400">{Math.round(termMonths / 12 * 10) / 10} Years</span>
                <span>{maxTerm} Mos</span>
              </div>
            </div>
          </div>

          {/* Advanced / Custom parameters toggle */}
          <div className="pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => setIsCustomMode(!isCustomMode)}
              className="text-xs text-slate-400 hover:text-emerald-400 font-semibold flex items-center space-x-1.5 cursor-pointer"
            >
              <span>{isCustomMode ? 'Hide Advanced Rate Parameters' : 'Customize Interest & Method'}</span>
            </button>

            {isCustomMode && (
              <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-800/40 text-xs">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Interest Method</label>
                  <select
                    value={interestMethod}
                    onChange={(e) => setInterestMethod(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="Diminishing Balance">Diminishing Balance</option>
                    <option value="Flat Rate">Flat Rate</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Annual Interest Rate (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={interestRate}
                    onChange={(e) => setInterestRate(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Payment Frequency</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Semi-monthly">Semi-monthly (15th/30th)</option>
                    <option value="Weekly">Weekly</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results & Simulation Column (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Key KPI Highlight Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
              <p className="text-[11px] text-slate-400 font-medium">Est. Installment</p>
              <p className="text-lg font-black text-emerald-400 font-mono">
                {isCalculating ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
                ) : (
                  `₱${Number(
                    scheduleData?.installment_amount || scheduleData?.schedule?.[0]?.total_installment || 0
                  ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                )}
              </p>
              <p className="text-[10px] text-slate-500">per {frequency.toLowerCase()}</p>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
              <p className="text-[11px] text-slate-400 font-medium">Total Interest</p>
              <p className="text-lg font-black text-amber-400 font-mono">
                ₱{Number(scheduleData?.total_interest || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-slate-500">over {termMonths} months</p>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
              <p className="text-[11px] text-slate-400 font-medium">Net Disbursed</p>
              <p className="text-lg font-black text-teal-400 font-mono">
                ₱{netTakeHome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-slate-500">after fees (take-home)</p>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
              <p className="text-[11px] text-slate-400 font-medium">Total Repayment</p>
              <p className="text-lg font-black text-white font-mono">
                ₱{Number(scheduleData?.total_repayment || (principal + (scheduleData?.total_interest || 0))).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-slate-500">principal + interest</p>
            </div>
          </div>

          {/* Sub tabs: Cost breakdown vs Full Amortization Schedule */}
          <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5 bg-slate-900/60">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveTab('summary')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeTab === 'summary' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Deductions & Summary
                </button>
                <button
                  onClick={() => setActiveTab('schedule')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
                    activeTab === 'schedule' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Installment Schedule ({scheduleData?.schedule?.length || 0})</span>
                </button>
              </div>

              <span className="text-[11px] text-slate-400 font-mono">
                {interestMethod} • {interestRate}% p.a.
              </span>
            </div>

            {/* TAB: Summary */}
            {activeTab === 'summary' && (
              <div className="p-4 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Disbursement Deductions */}
                  <div className="space-y-2 bg-slate-900/40 p-3.5 rounded-xl border border-slate-800/60">
                    <h5 className="font-bold text-slate-300 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                      <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                      <span>Estimated Upfront Deductions</span>
                    </h5>
                    <div className="divide-y divide-slate-800/60 text-slate-300">
                      <div className="py-1.5 flex justify-between">
                        <span className="text-slate-400">Processing Fee ({processingFeePct}%)</span>
                        <span className="font-mono font-semibold">₱{estProcessingFee.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="py-1.5 flex justify-between">
                        <span className="text-slate-400">Fixed Service & Handling Fee</span>
                        <span className="font-mono font-semibold">₱{estServiceFee.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="py-1.5 flex justify-between font-bold text-white pt-2">
                        <span>Total Deductions</span>
                        <span className="font-mono text-rose-400">₱{totalDeductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="py-2 flex justify-between font-black text-emerald-400 text-sm">
                        <span>Net Loan Released</span>
                        <span className="font-mono">₱{netTakeHome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Lifetime Loan Cost */}
                  <div className="space-y-2 bg-slate-900/40 p-3.5 rounded-xl border border-slate-800/60">
                    <h5 className="font-bold text-slate-300 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                      <Percent className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Repayment Analysis</span>
                    </h5>
                    <div className="divide-y divide-slate-800/60 text-slate-300">
                      <div className="py-1.5 flex justify-between">
                        <span className="text-slate-400">Principal Borrowed</span>
                        <span className="font-mono font-semibold">₱{Number(principal).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="py-1.5 flex justify-between">
                        <span className="text-slate-400">Total Interest Payable</span>
                        <span className="font-mono font-semibold text-amber-400">
                          ₱{Number(scheduleData?.total_interest || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="py-1.5 flex justify-between">
                        <span className="text-slate-400">Effective Monthly Payment</span>
                        <span className="font-mono font-semibold text-emerald-400">
                          ₱{Number(scheduleData?.installment_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="py-2 flex justify-between font-black text-white text-sm">
                        <span>Total Outflow</span>
                        <span className="font-mono">
                          ₱{Number(scheduleData?.total_repayment || (principal + (scheduleData?.total_interest || 0))).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-900/40 flex items-center space-x-2 text-[11px] text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    No hidden balloon penalties. Pre-payments directly reduce outstanding principal balance and future interest.
                  </span>
                </div>
              </div>
            )}

            {/* TAB: Installment Schedule Table */}
            {activeTab === 'schedule' && (
              <div className="overflow-x-auto max-h-72 divide-y divide-slate-800">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-900 text-slate-400 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3 text-center">Inst. #</th>
                      <th className="py-2.5 px-3">Est. Due Date</th>
                      <th className="py-2.5 px-3 text-right">Principal</th>
                      <th className="py-2.5 px-3 text-right">Interest</th>
                      <th className="py-2.5 px-3 text-right">Total Payment</th>
                      <th className="py-2.5 px-3 text-right">Remaining Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {(scheduleData?.schedule || []).map((item: any) => (
                      <tr key={item.installment_no} className="hover:bg-slate-800/30 transition">
                        <td className="py-2 px-3 text-center text-slate-400">{item.installment_no}</td>
                        <td className="py-2 px-3 text-slate-300">{item.due_date}</td>
                        <td className="py-2 px-3 text-right text-slate-200">
                          ₱{Number(item.principal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 px-3 text-right text-amber-400/90">
                          ₱{Number(item.interest || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-white">
                          ₱{Number(item.total_installment || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-400">
                          ₱{Number(item.principal_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
