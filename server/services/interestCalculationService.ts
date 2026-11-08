export interface AmortizationScheduleItem {
  installment_no: number;
  due_date: string;
  principal: number;
  interest: number;
  fee: number;
  total_installment: number;
  principal_balance: number;
}

export interface InterestCalculationParams {
  principal: number;
  annual_rate: number; // in percent, e.g. 10.0 for 10%
  term_months: number;
  frequency: string; // 'Monthly' | 'Semi-monthly' | 'Weekly' | 'Bi-weekly' | 'Quarterly' | 'Daily'
  method: string; // 'Diminishing Balance' | 'Flat Rate' | 'Simple Interest' | 'Fixed Interest'
  start_date: string; // YYYY-MM-DD
  grace_period_days?: number;
  processing_fee?: number;
  service_fee?: number;
  other_fee?: number;
  amortize_fees?: boolean;
}

export class InterestCalculationService {
  /**
   * Calculates dynamic amortization schedule based on configurable rate, method, and frequency
   */
  public static calculateSchedule(params: InterestCalculationParams): {
    schedule: AmortizationScheduleItem[];
    total_principal: number;
    total_interest: number;
    total_repayment: number;
    installment_amount: number;
    processing_fee: number;
    service_fee: number;
    other_fee: number;
    total_fees: number;
    net_disbursed: number;
  } {
    const {
      principal,
      annual_rate,
      term_months,
      frequency,
      method,
      start_date,
      processing_fee = 0,
      service_fee = 0,
      other_fee = 0,
      amortize_fees = false
    } = params;

    const rateDec = annual_rate / 100;
    
    // Determine number of payments and periodic rate based on frequency
    let paymentsPerYear = 12;
    let daysPerPeriod = 30;

    switch (frequency) {
      case 'Daily':
        paymentsPerYear = 365;
        daysPerPeriod = 1;
        break;
      case 'Weekly':
        paymentsPerYear = 52;
        daysPerPeriod = 7;
        break;
      case 'Bi-weekly':
        paymentsPerYear = 26;
        daysPerPeriod = 14;
        break;
      case 'Semi-monthly':
        paymentsPerYear = 24;
        daysPerPeriod = 15;
        break;
      case 'Monthly':
        paymentsPerYear = 12;
        daysPerPeriod = 30;
        break;
      case 'Quarterly':
        paymentsPerYear = 4;
        daysPerPeriod = 90;
        break;
      case 'Semi-annually':
        paymentsPerYear = 2;
        daysPerPeriod = 180;
        break;
      case 'Annually':
        paymentsPerYear = 1;
        daysPerPeriod = 365;
        break;
      default:
        paymentsPerYear = 12;
        daysPerPeriod = 30;
    }

    // Total number of installments
    const totalPeriods = Math.max(1, Math.round((term_months / 12) * paymentsPerYear));
    const periodicRate = rateDec / paymentsPerYear;

    const total_fees = Number((Number(processing_fee || 0) + Number(service_fee || 0) + Number(other_fee || 0)).toFixed(2));
    const net_disbursed = Math.max(0, Number((principal - total_fees).toFixed(2)));
    const periodicFee = amortize_fees ? Number((total_fees / totalPeriods).toFixed(2)) : 0;

    const schedule: AmortizationScheduleItem[] = [];
    let currentBalance = Number(principal.toFixed(2));
    const baseDate = new Date(start_date || new Date().toISOString().split('T')[0]);

    if (method === 'Flat Rate') {
      // Total Interest = Principal * (Rate/Year) * (Term in Years)
      const totalInterest = Number((principal * rateDec * (term_months / 12)).toFixed(2));
      const periodicInterest = Number((totalInterest / totalPeriods).toFixed(2));
      const periodicPrincipal = Number((principal / totalPeriods).toFixed(2));
      let accumulatedInterest = 0;

      for (let i = 1; i <= totalPeriods; i++) {
        const dueDate = new Date(baseDate);
        dueDate.setDate(dueDate.getDate() + i * daysPerPeriod);
        const p = i === totalPeriods ? currentBalance : periodicPrincipal;
        const interest = i === totalPeriods ? Number((totalInterest - accumulatedInterest).toFixed(2)) : periodicInterest;
        accumulatedInterest = Number((accumulatedInterest + interest).toFixed(2));
        currentBalance = Math.max(0, Number((currentBalance - p).toFixed(2)));

        schedule.push({
          installment_no: i,
          due_date: dueDate.toISOString().split('T')[0],
          principal: Number(p.toFixed(2)),
          interest: Number(interest.toFixed(2)),
          fee: Number(periodicFee.toFixed(2)),
          total_installment: Number((p + interest + periodicFee).toFixed(2)),
          principal_balance: Number(currentBalance.toFixed(2))
        });
      }
    } else if (method === 'Diminishing Balance') {
      // Amortized equal periodic payment formula: PMT = P * r / (1 - (1 + r)^-n)
      let pmt = 0;
      if (periodicRate > 0) {
        pmt = (principal * periodicRate) / (1 - Math.pow(1 + periodicRate, -totalPeriods));
      } else {
        pmt = principal / totalPeriods;
      }
      pmt = Number(pmt.toFixed(2));

      for (let i = 1; i <= totalPeriods; i++) {
        const dueDate = new Date(baseDate);
        dueDate.setDate(dueDate.getDate() + i * daysPerPeriod);

        const interest = Number((currentBalance * periodicRate).toFixed(2));
        let p = Number((pmt - interest).toFixed(2));

        if (i === totalPeriods || p > currentBalance) {
          p = currentBalance;
        }

        currentBalance = Math.max(0, Number((currentBalance - p).toFixed(2)));

        schedule.push({
          installment_no: i,
          due_date: dueDate.toISOString().split('T')[0],
          principal: Number(p.toFixed(2)),
          interest: Number(interest.toFixed(2)),
          fee: Number(periodicFee.toFixed(2)),
          total_installment: Number((p + interest + periodicFee).toFixed(2)),
          principal_balance: Number(currentBalance.toFixed(2))
        });
      }
    } else {
      // Simple Interest or Fixed Interest
      const periodicPrincipal = Number((principal / totalPeriods).toFixed(2));
      for (let i = 1; i <= totalPeriods; i++) {
        const dueDate = new Date(baseDate);
        dueDate.setDate(dueDate.getDate() + i * daysPerPeriod);

        const interest = Number((currentBalance * periodicRate).toFixed(2));
        const p = i === totalPeriods ? currentBalance : periodicPrincipal;
        currentBalance = Math.max(0, Number((currentBalance - p).toFixed(2)));

        schedule.push({
          installment_no: i,
          due_date: dueDate.toISOString().split('T')[0],
          principal: Number(p.toFixed(2)),
          interest: Number(interest.toFixed(2)),
          fee: Number(periodicFee.toFixed(2)),
          total_installment: Number((p + interest + periodicFee).toFixed(2)),
          principal_balance: Number(currentBalance.toFixed(2))
        });
      }
    }

    const total_principal = schedule.reduce((sum, item) => sum + item.principal, 0);
    const total_interest = schedule.reduce((sum, item) => sum + item.interest, 0);
    const total_installment_fees = schedule.reduce((sum, item) => sum + item.fee, 0);
    const total_repayment = total_principal + total_interest + total_installment_fees;
    const installment_amount = schedule.length > 0 ? schedule[0].total_installment : 0;

    return {
      schedule,
      total_principal: Number(total_principal.toFixed(2)),
      total_interest: Number(total_interest.toFixed(2)),
      total_fees,
      processing_fee: Number(processing_fee.toFixed(2)),
      service_fee: Number(service_fee.toFixed(2)),
      other_fee: Number(other_fee.toFixed(2)),
      net_disbursed,
      total_repayment: Number(total_repayment.toFixed(2)),
      installment_amount: Number(installment_amount.toFixed(2))
    };
  }
}
