import { db } from '../db/database';
import { NumberingService } from './numberingService';

export interface PostTransactionRequest {
  transaction_type: string; // e.g. 'LOAN_RELEASE', 'LOAN_PAYMENT', 'SAVINGS_DEPOSIT', 'EXPENSE_PAYMENT'
  posting_date: string; // YYYY-MM-DD
  branch_id?: string;
  reference_id: string;
  description: string;
  performed_by: string;
  custom_debit_account_id?: string;
  custom_credit_account_id?: string;
  amount_breakdown: {
    principal?: number;
    interest?: number;
    penalty?: number;
    fees?: number;
    total: number;
  };
  subsidiary?: {
    type: 'Member' | 'Loan' | 'Cash' | 'Savings';
    id: string;
    account_id?: string;
  };
  member_id?: string;
  member_name?: string;
  cash_account_id?: string;
}

export class AccountingEngine {
  /**
   * Posts operational transaction through configured accounting rules
   */
  public static post(req: PostTransactionRequest): {
    success: boolean;
    journal_entry?: any;
    lines?: any[];
    error?: string;
  } {
    const {
      transaction_type,
      posting_date,
      branch_id,
      reference_id,
      description,
      performed_by,
      amount_breakdown,
      subsidiary,
      cash_account_id
    } = req;

    // 1. Validate Accounting Period (Requirement 29 & Test 15)
    const periods = db.getTable('accounting_periods');
    const targetPeriod = periods.find(p => posting_date >= p.start_date && posting_date <= p.end_date);

    if (targetPeriod && targetPeriod.status === 'Closed') {
      const errMsg = `Accounting period "${targetPeriod.name}" (${targetPeriod.start_date} to ${targetPeriod.end_date}) is CLOSED. Posting transactions into a closed period is strictly prohibited.`;
      console.warn(errMsg);
      return { success: false, error: errMsg };
    }

    // 2. Resolve Branch Code
    const branches = db.getTable('branches');
    const branch = branches.find(b => b.id === branch_id) || branches[0];
    const branchCode = branch ? branch.code : 'TAR';

    // 3. Resolve Accounting Mappings for transaction type
    const mappings = db.getTable('accounting_mappings');
    const txTypeMapping = mappings.find(m => m.transaction_type === transaction_type);

    // 4. Resolve Cash Account if specified
    const cashAccounts = db.getTable('cash_accounts');
    let cashGlAccountId = 'acc_1110';
    if (cash_account_id) {
      const cAcc = cashAccounts.find(c => c.id === cash_account_id);
      if (cAcc && cAcc.gl_account_id) {
        cashGlAccountId = cAcc.gl_account_id;
      }
    }

    const journalLines: any[] = [];
    const journalId = `jv_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    // Generate balanced debit and credit entries based on dynamic configuration
    if (transaction_type === 'LOAN_RELEASE') {
      // Dr Loans Receivable (Principal)
      // Cr Cash Account (Net Disbursed)
      // Cr Fee Income (Processing/Service fees withheld)
      const debitAccount = req.custom_debit_account_id || txTypeMapping?.debit_account_id || 'acc_1210';
      const creditCashAccount = cashGlAccountId || txTypeMapping?.credit_account_id || 'acc_1110';
      const feeAccount = 'acc_4120'; // Service & Processing fees

      const principal = amount_breakdown.principal || amount_breakdown.total;
      const fees = amount_breakdown.fees || 0;
      const netCash = Number((principal - fees).toFixed(2));

      journalLines.push({
        id: `jl_${Date.now()}_1`,
        journal_entry_id: journalId,
        account_id: debitAccount,
        debit: principal,
        credit: 0,
        subsidiary_type: 'Loan',
        subsidiary_id: subsidiary?.id || reference_id
      });

      journalLines.push({
        id: `jl_${Date.now()}_2`,
        journal_entry_id: journalId,
        account_id: creditCashAccount,
        debit: 0,
        credit: netCash,
        subsidiary_type: 'Cash',
        subsidiary_id: cash_account_id || 'cash_01'
      });

      if (fees > 0) {
        journalLines.push({
          id: `jl_${Date.now()}_3`,
          journal_entry_id: journalId,
          account_id: feeAccount,
          debit: 0,
          credit: fees,
          subsidiary_type: null,
          subsidiary_id: null
        });
      }
    } else if (transaction_type === 'LOAN_PAYMENT') {
      // Dr Cash Account (Total Payment)
      // Cr Loans Receivable (Principal Allocated)
      // Cr Interest Income (Interest Allocated)
      // Cr Penalty Income (Penalty Allocated)
      // Cr Fee Income (Fee Allocated)
      const cashDebitAccount = cashGlAccountId || txTypeMapping?.debit_account_id || 'acc_1110';
      const loanRecCredit = req.custom_credit_account_id || txTypeMapping?.credit_account_id || 'acc_1210';

      const totalPaid = amount_breakdown.total;
      const principalPart = amount_breakdown.principal || 0;
      const interestPart = amount_breakdown.interest || 0;
      const penaltyPart = amount_breakdown.penalty || 0;
      const feePart = amount_breakdown.fees || 0;

      journalLines.push({
        id: `jl_${Date.now()}_1`,
        journal_entry_id: journalId,
        account_id: cashDebitAccount,
        debit: totalPaid,
        credit: 0,
        subsidiary_type: 'Cash',
        subsidiary_id: cash_account_id || 'cash_01'
      });

      if (principalPart > 0) {
        journalLines.push({
          id: `jl_${Date.now()}_2`,
          journal_entry_id: journalId,
          account_id: loanRecCredit,
          debit: 0,
          credit: principalPart,
          subsidiary_type: 'Loan',
          subsidiary_id: subsidiary?.id || reference_id
        });
      }

      if (interestPart > 0) {
        const intMap = mappings.find(m => m.transaction_type === 'INTEREST_INCOME');
        const intAcc = intMap?.credit_account_id || 'acc_4110';
        journalLines.push({
          id: `jl_${Date.now()}_3`,
          journal_entry_id: journalId,
          account_id: intAcc,
          debit: 0,
          credit: interestPart,
          subsidiary_type: null,
          subsidiary_id: null
        });
      }

      if (penaltyPart > 0) {
        const penMap = mappings.find(m => m.transaction_type === 'PENALTY_INCOME');
        const penAcc = penMap?.credit_account_id || 'acc_4130';
        journalLines.push({
          id: `jl_${Date.now()}_4`,
          journal_entry_id: journalId,
          account_id: penAcc,
          debit: 0,
          credit: penaltyPart,
          subsidiary_type: null,
          subsidiary_id: null
        });
      }

      if (feePart > 0) {
        const feeMap = mappings.find(m => m.transaction_type === 'FEE_INCOME');
        const feeAcc = feeMap?.credit_account_id || 'acc_4120';
        journalLines.push({
          id: `jl_${Date.now()}_5`,
          journal_entry_id: journalId,
          account_id: feeAcc,
          debit: 0,
          credit: feePart,
          subsidiary_type: null,
          subsidiary_id: null
        });
      }
    } else if (transaction_type === 'SAVINGS_DEPOSIT') {
      const debitAcc = cashGlAccountId || txTypeMapping?.debit_account_id || 'acc_1110';
      const creditAcc = req.custom_credit_account_id || txTypeMapping?.credit_account_id || 'acc_2110';

      journalLines.push({
        id: `jl_${Date.now()}_1`,
        journal_entry_id: journalId,
        account_id: debitAcc,
        debit: amount_breakdown.total,
        credit: 0,
        subsidiary_type: 'Cash',
        subsidiary_id: cash_account_id
      });

      journalLines.push({
        id: `jl_${Date.now()}_2`,
        journal_entry_id: journalId,
        account_id: creditAcc,
        debit: 0,
        credit: amount_breakdown.total,
        subsidiary_type: 'Savings',
        subsidiary_id: subsidiary?.id || reference_id
      });
    } else if (transaction_type === 'SAVINGS_WITHDRAWAL') {
      const debitAcc = req.custom_debit_account_id || txTypeMapping?.debit_account_id || 'acc_2110';
      const creditAcc = cashGlAccountId || txTypeMapping?.credit_account_id || 'acc_1110';

      journalLines.push({
        id: `jl_${Date.now()}_1`,
        journal_entry_id: journalId,
        account_id: debitAcc,
        debit: amount_breakdown.total,
        credit: 0,
        subsidiary_type: 'Savings',
        subsidiary_id: subsidiary?.id || reference_id
      });

      journalLines.push({
        id: `jl_${Date.now()}_2`,
        journal_entry_id: journalId,
        account_id: creditAcc,
        debit: 0,
        credit: amount_breakdown.total,
        subsidiary_type: 'Cash',
        subsidiary_id: cash_account_id
      });
    } else if (
      transaction_type === 'SHARE_CAPITAL_PAYMENT' ||
      transaction_type === 'SHARE_CAPITAL_DEPOSIT' ||
      transaction_type === 'SHARE_CAPITAL_CONTRIBUTION'
    ) {
      const debitAcc = cashGlAccountId || txTypeMapping?.debit_account_id || 'acc_1110';
      const creditAcc = req.custom_credit_account_id || txTypeMapping?.credit_account_id || 'acc_3110';

      journalLines.push({
        id: `jl_${Date.now()}_1`,
        journal_entry_id: journalId,
        account_id: debitAcc,
        debit: amount_breakdown.total,
        credit: 0,
        subsidiary_type: 'Cash',
        subsidiary_id: cash_account_id
      });

      journalLines.push({
        id: `jl_${Date.now()}_2`,
        journal_entry_id: journalId,
        account_id: creditAcc,
        debit: 0,
        credit: amount_breakdown.total,
        subsidiary_type: 'Member',
        subsidiary_id: subsidiary?.id || reference_id
      });
    } else {
      // General custom mapping
      const debitAcc = req.custom_debit_account_id || txTypeMapping?.debit_account_id || 'acc_5220';
      const creditAcc = req.custom_credit_account_id || txTypeMapping?.credit_account_id || 'acc_1110';

      journalLines.push({
        id: `jl_${Date.now()}_1`,
        journal_entry_id: journalId,
        account_id: debitAcc,
        debit: amount_breakdown.total,
        credit: 0,
        subsidiary_type: null,
        subsidiary_id: null
      });

      journalLines.push({
        id: `jl_${Date.now()}_2`,
        journal_entry_id: journalId,
        account_id: creditAcc,
        debit: 0,
        credit: amount_breakdown.total,
        subsidiary_type: null,
        subsidiary_id: null
      });
    }

    // 5. Validate Balanced Debit and Credit
    const totalDebit = Number(journalLines.reduce((sum, l) => sum + (l.debit || 0), 0).toFixed(2));
    const totalCredit = Number(journalLines.reduce((sum, l) => sum + (l.credit || 0), 0).toFixed(2));

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      const err = `Unbalanced journal entry error: Debit (₱${totalDebit}) does not equal Credit (₱${totalCredit}).`;
      console.error(err);
      return { success: false, error: err };
    }

    // 6. Generate Numbering based on pattern
    const isReceipt = transaction_type.includes('PAYMENT') || 
                      transaction_type.includes('DEPOSIT') || 
                      transaction_type.includes('CAPITAL') || 
                      transaction_type.includes('RECEIPT') ||
                      transaction_type.includes('CONTRIBUTION');
    const isDisbursement = transaction_type.includes('RELEASE') || 
                          transaction_type.includes('EXPENSE') || 
                          transaction_type.includes('DISBURSE') ||
                          transaction_type.includes('WITHDRAW');
    const prefixType = isReceipt ? 'OR' : isDisbursement ? 'CD' : 'JV';
    const voucherType = isReceipt ? 'CRJ' : isDisbursement ? 'CDJ' : 'JV';

    // If reference_id is already a valid OR/CD/JV number, we can preserve it or generate via sequence
    let voucherNumber = reference_id && (reference_id.startsWith('OR-') || reference_id.startsWith('CD-') || reference_id.startsWith('JV-'))
      ? reference_id
      : NumberingService.getNextNumber(prefixType, branchCode);

    // Resolve member details if member subsidiary or passed in request
    let memberId: string | undefined = subsidiary?.type === 'Member' ? subsidiary.id : (req as any).member_id;
    let memberName: string | undefined = (req as any).member_name;
    if (memberId && !memberName) {
      const allMembers = db.getTable('members') || [];
      const mem = allMembers.find(m => m.id === memberId || m.member_no === memberId);
      if (mem) {
        memberName = `${mem.first_name} ${mem.last_name}`;
      }
    }

    // 7. Insert Journal Entry
    const journalEntry = {
      id: journalId,
      voucher_number: voucherNumber,
      voucher_type: voucherType,
      branch_id: branch?.id || 'branch_tar',
      posting_date,
      reference_type: transaction_type,
      reference_id: reference_id || voucherNumber,
      description,
      total_debit: totalDebit,
      total_credit: totalCredit,
      period_id: targetPeriod?.id || 'period_current',
      status: 'Posted',
      created_by: performed_by || 'Accounting System',
      posted_at: new Date().toISOString(),
      member_id: memberId,
      member_name: memberName
    };

    db.insert('journal_entries', journalEntry);

    for (const line of journalLines) {
      db.insert('journal_lines', line);
    }

    // 8. Update Cash Account Balance if cash was debited or credited
    if (cash_account_id) {
      const cashDebitLine = journalLines.find(l => l.account_id === cashGlAccountId && l.debit > 0);
      const cashCreditLine = journalLines.find(l => l.account_id === cashGlAccountId && l.credit > 0);

      let delta = 0;
      if (cashDebitLine) delta += cashDebitLine.debit;
      if (cashCreditLine) delta -= cashCreditLine.credit;

      if (delta !== 0) {
        db.update('cash_accounts', c => c.id === cash_account_id, c => ({
          ...c,
          current_balance: Number(((c.current_balance || 0) + delta).toFixed(2))
        }));
      }
    }

    return {
      success: true,
      journal_entry: journalEntry,
      lines: journalLines
    };
  }
}
