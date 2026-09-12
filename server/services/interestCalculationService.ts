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
  } {
    const {
      principal,
      annual_rate,
      term_months,
      frequency,
      method,
      start_date
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

    const schedule: AmortizationScheduleItem[] = [];
    let currentBalance = principal;
    const baseDate = new Date(start_date || new Date().toISOString().split('T')[0]);

    if (method === 'Flat Rate') {
      // Total Interest = Principal * (Rate/Year) * (Term in Years)
      const totalInterest = principal * rateDec * (term_months / 12);
      const periodicInterest = totalInterest / totalPeriods;
      const periodicPrincipal = principal / totalPeriods;
      const periodicInstallment = periodicPrincipal + periodicInterest;

      for (let i = 1; i <= totalPeriods; i++) {
        const dueDate = new Date(baseDate);
        dueDate.setDate(dueDate.getDate() + i * daysPerPeriod);
        const p = i === totalPeriods ? currentBalance : periodicPrincipal;
        currentBalance = Math.max(0, currentBalance - p);

        schedule.push({
          installment_no: i,
          due_date: dueDate.toISOString().split('T')[0],
          principal: Number(p.toFixed(2)),
          interest: Number(periodicInterest.toFixed(2)),
          fee: 0,
          total_installment: Number((p + periodicInterest).toFixed(2)),
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

      for (let i = 1; i <= totalPeriods; i++) {
        const dueDate = new Date(baseDate);
        dueDate.setDate(dueDate.getDate() + i * daysPerPeriod);

        const interest = currentBalance * periodicRate;
        let p = pmt - interest;

        if (i === totalPeriods || p > currentBalance) {
          p = currentBalance;
        }

        currentBalance = Math.max(0, currentBalance - p);

        schedule.push({
          installment_no: i,
          due_date: dueDate.toISOString().split('T')[0],
          principal: Number(p.toFixed(2)),
          interest: Number(interest.toFixed(2)),
          fee: 0,
          total_installment: Number((p + interest).toFixed(2)),
          principal_balance: Number(currentBalance.toFixed(2))
        });
      }
    } else {
      // Simple Interest or Fixed Interest
      const periodicPrincipal = principal / totalPeriods;
      for (let i = 1; i <= totalPeriods; i++) {
        const dueDate = new Date(baseDate);
        dueDate.setDate(dueDate.getDate() + i * daysPerPeriod);

        const interest = currentBalance * periodicRate;
        const p = i === totalPeriods ? currentBalance : periodicPrincipal;
        currentBalance = Math.max(0, currentBalance - p);

        schedule.push({
          installment_no: i,
          due_date: dueDate.toISOString().split('T')[0],
          principal: Number(p.toFixed(2)),
          interest: Number(interest.toFixed(2)),
          fee: 0,
          total_installment: Number((p + interest).toFixed(2)),
          principal_balance: Number(currentBalance.toFixed(2))
        });
      }
    }

    const total_principal = schedule.reduce((sum, item) => sum + item.principal, 0);
    const total_interest = schedule.reduce((sum, item) => sum + item.interest, 0);
    const total_repayment = total_principal + total_interest;
    const installment_amount = schedule.length > 0 ? schedule[0].total_installment : 0;

    return {
      schedule,
      total_principal: Number(total_principal.toFixed(2)),
      total_interest: Number(total_interest.toFixed(2)),
      total_repayment: Number(total_repayment.toFixed(2)),
      installment_amount: Number(installment_amount.toFixed(2))
    };
  }
}
