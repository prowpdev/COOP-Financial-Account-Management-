import { db } from '../db/database';
import { initialSeedData } from '../db/seed';

export function resetDatabaseToBaseline() {
  db.resetToSeed(initialSeedData);
  return {
    success: true,
    message: 'Cooperative database successfully reset to clean CDA baseline seed.',
    data: {
      reset: {
        success: true,
        message: 'Database reset successfully.',
        tables_reset: 24
      }
    }
  };
}

export function runComprehensiveDatabaseSeeder() {
  // 1. Reset to base CDA schema
  db.resetToSeed(initialSeedData);

  const today = new Date().toISOString().split('T')[0];
  const postingTimestamp = `${today} 09:00:00`;
  const periodId = 'period_2026_09';

  // 2. Members (10 realistic members)
  const sampleMembers = [
    {
      id: 'mem_000001',
      member_no: 'MEM-2026-0001',
      branch_id: 'branch_tar',
      branch_name: 'Main Branch - Tarlac',
      member_type_id: 'mt_regular',
      member_type_name: 'Regular Agricultural Member',
      first_name: 'Juan',
      middle_name: 'Santos',
      last_name: 'Dela Cruz',
      gender: 'Male',
      birthdate: '1985-03-15',
      email: 'juan.delacruz@example.com',
      phone: '09171234567',
      address: 'Brgy. San Vicente, Tarlac City, Tarlac',
      status: 'Active',
      active: true,
      joined_date: '2026-01-15',
      custom_field_values: { occupation: 'Farmer', civil_status: 'Married', monthly_income: 25000 }
    },
    {
      id: 'mem_000002',
      member_no: 'MEM-2026-0002',
      branch_id: 'branch_tar',
      branch_name: 'Main Branch - Tarlac',
      member_type_id: 'mt_regular',
      member_type_name: 'Regular Agricultural Member',
      first_name: 'Maria',
      middle_name: 'Garcia',
      last_name: 'Santos',
      gender: 'Female',
      birthdate: '1990-07-22',
      email: 'maria.santos@example.com',
      phone: '09181234567',
      address: 'Brgy. San Jose, Tarlac City, Tarlac',
      status: 'Active',
      active: true,
      joined_date: '2026-02-10',
      custom_field_values: { occupation: 'Teacher', civil_status: 'Married', monthly_income: 32000 }
    },
    {
      id: 'mem_000003',
      member_no: 'MEM-2026-0003',
      branch_id: 'branch_urd',
      branch_name: 'Urdaneta Branch',
      member_type_id: 'mt_regular',
      member_type_name: 'Regular Agricultural Member',
      first_name: 'Pedro',
      middle_name: 'Cruz',
      last_name: 'Reyes',
      gender: 'Male',
      birthdate: '1978-11-05',
      email: 'pedro.reyes@example.com',
      phone: '09191234567',
      address: 'Brgy. Nancayasan, Urdaneta City, Pangasinan',
      status: 'Active',
      active: true,
      joined_date: '2026-02-20',
      custom_field_values: { occupation: 'Business Owner', civil_status: 'Married', monthly_income: 45000 }
    },
    {
      id: 'mem_000004',
      member_no: 'MEM-2026-0004',
      branch_id: 'branch_sfe',
      branch_name: 'San Fernando Branch',
      member_type_id: 'mt_regular',
      member_type_name: 'Regular Agricultural Member',
      first_name: 'Ana',
      middle_name: 'Lopez',
      last_name: 'Garcia',
      gender: 'Female',
      birthdate: '1995-01-18',
      email: 'ana.garcia@example.com',
      phone: '09201234567',
      address: 'Brgy. Catbangen, City of San Fernando, La Union',
      status: 'Active',
      active: true,
      joined_date: '2026-03-05',
      custom_field_values: { occupation: 'Accountant', civil_status: 'Single', monthly_income: 38000 }
    },
    {
      id: 'mem_000005',
      member_no: 'MEM-2026-0005',
      branch_id: 'branch_tar',
      branch_name: 'Main Branch - Tarlac',
      member_type_id: 'mt_associate',
      member_type_name: 'Associate Micro-Entrepreneur',
      first_name: 'Roberto',
      middle_name: 'Dizon',
      last_name: 'Mendoza',
      gender: 'Male',
      birthdate: '1982-09-30',
      email: 'roberto.mendoza@example.com',
      phone: '09211234567',
      address: 'Brgy. Matatalaib, Tarlac City, Tarlac',
      status: 'Active',
      active: true,
      joined_date: '2026-03-12',
      custom_field_values: { occupation: 'Carpenter', civil_status: 'Married', monthly_income: 28000 }
    },
    {
      id: 'mem_000006',
      member_no: 'MEM-2026-0006',
      branch_id: 'branch_urd',
      branch_name: 'Urdaneta Branch',
      member_type_id: 'mt_regular',
      member_type_name: 'Regular Agricultural Member',
      first_name: 'Catherine',
      middle_name: 'Reyes',
      last_name: 'Navarro',
      gender: 'Female',
      birthdate: '1988-05-11',
      email: 'catherine.navarro@example.com',
      phone: '09221234567',
      address: 'Brgy. San Vicente, Urdaneta City, Pangasinan',
      status: 'Active',
      active: true,
      joined_date: '2026-04-18',
      custom_field_values: { occupation: 'Nurse', civil_status: 'Married', monthly_income: 40000 }
    },
    {
      id: 'mem_000007',
      member_no: 'MEM-2026-0007',
      branch_id: 'branch_sfe',
      branch_name: 'San Fernando Branch',
      member_type_id: 'mt_associate',
      member_type_name: 'Associate Micro-Entrepreneur',
      first_name: 'Fernando',
      middle_name: 'Ramos',
      last_name: 'Torres',
      gender: 'Male',
      birthdate: '1975-12-25',
      email: 'fernando.torres@example.com',
      phone: '09231234567',
      address: 'Brgy. Catbangen, City of San Fernando, La Union',
      status: 'Active',
      active: true,
      joined_date: '2025-06-10',
      custom_field_values: { occupation: 'Entrepreneur', civil_status: 'Married', monthly_income: 55000 }
    },
    {
      id: 'mem_000008',
      member_no: 'MEM-2026-0008',
      branch_id: 'branch_tar',
      branch_name: 'Main Branch - Tarlac',
      member_type_id: 'mt_lab',
      member_type_name: 'Laboratory / Youth Member',
      first_name: 'Sofia',
      middle_name: 'Morales',
      last_name: 'Aquino',
      gender: 'Female',
      birthdate: '2008-10-08',
      email: 'sofia.aquino@example.com',
      phone: '09241234567',
      address: 'Brgy. Tibag, Tarlac City, Tarlac',
      status: 'Active',
      active: true,
      joined_date: '2026-09-01',
      custom_field_values: { occupation: 'Student', civil_status: 'Single', monthly_income: 0 }
    },
    {
      id: 'mem_000009',
      member_no: 'MEM-2026-0009',
      branch_id: 'branch_urd',
      branch_name: 'Urdaneta Branch',
      member_type_id: 'mt_regular',
      member_type_name: 'Regular Agricultural Member',
      first_name: 'Michael',
      middle_name: 'Castro',
      last_name: 'Fernandez',
      gender: 'Male',
      birthdate: '1992-02-14',
      email: 'michael.fernandez@example.com',
      phone: '09251234567',
      address: 'Brgy. San Vicente, Urdaneta City, Pangasinan',
      status: 'Active',
      active: true,
      joined_date: '2026-05-22',
      custom_field_values: { occupation: 'Driver', civil_status: 'Single', monthly_income: 26000 }
    },
    {
      id: 'mem_000010',
      member_no: 'MEM-2026-0010',
      branch_id: 'branch_sfe',
      branch_name: 'San Fernando Branch',
      member_type_id: 'mt_regular',
      member_type_name: 'Regular Agricultural Member',
      first_name: 'Elena',
      middle_name: 'Diaz',
      last_name: 'Villanueva',
      gender: 'Female',
      birthdate: '1986-06-19',
      email: 'elena.villanueva@example.com',
      phone: '09261234567',
      address: 'Brgy. Catbangen, City of San Fernando, La Union',
      status: 'Active',
      active: true,
      joined_date: '2026-06-30',
      custom_field_values: { occupation: 'Store Owner', civil_status: 'Married', monthly_income: 35000 }
    }
  ];

  // Overwrite members table with complete list
  (db as any).data.members = sampleMembers;

  // 3. Share Capital Accounts & Transactions
  const shareCapitalAccounts: any[] = [];
  const shareCapitalTransactions: any[] = [];
  let totalShareCapitalPaid = 0;

  sampleMembers.forEach((mem, index) => {
    const paidShares = index < 4 ? 50 : 25; // 50 shares (5,000) or 25 shares (2,500)
    const paidAmount = paidShares * 100;
    totalShareCapitalPaid += paidAmount;

    const sca = {
      id: `sca_${mem.id}`,
      account_number: `CBU-${mem.member_no.replace('MEM-', '')}`,
      member_id: mem.id,
      member_name: `${mem.first_name} ${mem.last_name}`,
      branch_id: mem.branch_id,
      subscribed_shares: 100,
      subscribed_amount: 10000,
      paid_up_shares: paidShares,
      paid_up_amount: paidAmount,
      par_value: 100,
      status: 'Active',
      created_at: mem.joined_date
    };
    shareCapitalAccounts.push(sca);

    const sct = {
      id: `sct_${mem.id}_01`,
      share_account_id: sca.id,
      receipt_no: `OR-CBU-2026-000${index + 1}`,
      member_id: mem.id,
      type: 'Subscription Payment',
      shares: paidShares,
      amount: paidAmount,
      transaction_date: mem.joined_date,
      cash_account_id: 'cash_01',
      created_at: `${mem.joined_date} 10:00:00`
    };
    shareCapitalTransactions.push(sct);
  });

  (db as any).data.share_capital_accounts = shareCapitalAccounts;
  (db as any).data.share_capital_transactions = shareCapitalTransactions;

  // 4. Savings Accounts & Transactions
  const savingsAccounts: any[] = [];
  const savingsTransactions: any[] = [];
  let totalSavingsDeposits = 0;

  sampleMembers.forEach((mem, index) => {
    const initialDeposit = (index + 1) * 1500 + 2000; // between 3,500 and 17,000
    totalSavingsDeposits += initialDeposit;

    const sa = {
      id: `sa_${mem.id}`,
      account_number: `SA-2026-000${index + 1}`,
      member_id: mem.id,
      member_name: `${mem.first_name} ${mem.last_name}`,
      savings_product_id: 'sp_reg',
      branch_id: mem.branch_id,
      balance: initialDeposit,
      opened_date: mem.joined_date,
      status: 'Active',
      created_at: mem.joined_date
    };
    savingsAccounts.push(sa);

    const st = {
      id: `st_${mem.id}_01`,
      transaction_no: `TX-SA-2026-000${index + 1}`,
      savings_account_id: sa.id,
      member_id: mem.id,
      type: 'Deposit',
      amount: initialDeposit,
      balance_after: initialDeposit,
      cash_account_id: 'cash_01',
      transaction_date: mem.joined_date,
      notes: 'Initial Savings Deposit',
      created_at: `${mem.joined_date} 10:30:00`
    };
    savingsTransactions.push(st);
  });

  (db as any).data.savings_accounts = savingsAccounts;
  (db as any).data.savings_transactions = savingsTransactions;

  // 5. Loans, Amortization Schedules & Payments
  const loans: any[] = [];
  const schedules: any[] = [];
  const payments: any[] = [];
  const allocations: any[] = [];
  let totalLoanPrincipalOutstanding = 0;
  let totalInterestCollected = 0;
  let totalFeesCollected = 0;

  // Loan 1: Juan Dela Cruz (Active, partially paid)
  const l1Principal = 25000;
  const l1Term = 12;
  const l1MonthlyPrin = Number((l1Principal / l1Term).toFixed(2));
  const l1MonthlyInt = Number(((l1Principal * 0.10) / 12).toFixed(2));
  const l1Fee = 500;
  totalFeesCollected += l1Fee;

  const loan1 = {
    id: 'ln_000001',
    loan_account_no: 'LN-2026-0001',
    member_id: 'mem_000001',
    member_name: 'Juan Dela Cruz',
    loan_product_id: 'lp_regular',
    product_name: 'Regular Multi-Purpose Loan',
    product_version: 1,
    branch_id: 'branch_tar',
    principal_amount: l1Principal,
    annual_interest_rate: 10.0,
    interest_calculation_method: 'Diminishing Balance',
    term_months: l1Term,
    payment_frequency: 'Monthly',
    disbursement_date: '2026-01-20',
    first_due_date: '2026-02-20',
    maturity_date: '2027-01-20',
    processing_fee: l1Fee,
    service_fee: 0,
    net_disbursed: l1Principal - l1Fee,
    disbursed_from_cash_account_id: 'cash_01',
    status: 'Active',
    current_balance: Number((l1Principal - l1MonthlyPrin * 2).toFixed(2)),
    total_principal_paid: Number((l1MonthlyPrin * 2).toFixed(2)),
    total_interest_paid: Number((l1MonthlyInt * 2).toFixed(2)),
    total_penalty_paid: 0,
    total_fees_paid: l1Fee,
    approved_by: 'Elena Rostro',
    approved_date: '2026-01-19',
    created_at: '2026-01-20T08:30:00Z'
  };
  loans.push(loan1);
  totalLoanPrincipalOutstanding += loan1.current_balance;
  totalInterestCollected += loan1.total_interest_paid;

  // Generate 12 amortization schedule installments for Loan 1
  for (let i = 1; i <= l1Term; i++) {
    const isPaid = i <= 2;
    const dueDate = new Date(2026, i, 20).toISOString().split('T')[0];
    const remBal = Math.max(0, Number((l1Principal - l1MonthlyPrin * i).toFixed(2)));
    schedules.push({
      id: `las_ln1_${i}`,
      loan_id: loan1.id,
      installment_no: i,
      due_date: dueDate,
      principal: l1MonthlyPrin,
      interest: l1MonthlyInt,
      fee: 0,
      total_installment: Number((l1MonthlyPrin + l1MonthlyInt).toFixed(2)),
      principal_balance: remBal,
      paid_principal: isPaid ? l1MonthlyPrin : 0,
      paid_interest: isPaid ? l1MonthlyInt : 0,
      paid_penalty: 0,
      paid_date: isPaid ? dueDate : null,
      status: isPaid ? 'Paid' : 'Unpaid'
    });
  }

  // Payments for Loan 1
  for (let p = 1; p <= 2; p++) {
    const payDate = new Date(2026, p, 18).toISOString().split('T')[0];
    const payTotal = Number((l1MonthlyPrin + l1MonthlyInt).toFixed(2));
    const payId = `pay_ln1_${p}`;
    payments.push({
      id: payId,
      receipt_no: `OR-LN-2026-000${p}`,
      loan_id: loan1.id,
      member_id: loan1.member_id,
      payment_date: payDate,
      total_amount: payTotal,
      cash_account_id: 'cash_01',
      received_by: 'Elena Rostro',
      created_at: `${payDate} 11:00:00`
    });
    allocations.push({
      id: `alloc_ln1_${p}_p`,
      payment_id: payId,
      loan_id: loan1.id,
      fee_type: 'Principal',
      allocated_amount: l1MonthlyPrin
    });
    allocations.push({
      id: `alloc_ln1_${p}_i`,
      payment_id: payId,
      loan_id: loan1.id,
      fee_type: 'Interest',
      allocated_amount: l1MonthlyInt
    });
  }

  // Loan 2: Maria Santos (Active)
  const l2Principal = 15000;
  const l2Fee = 300;
  totalFeesCollected += l2Fee;
  const loan2 = {
    id: 'ln_000002',
    loan_account_no: 'LN-2026-0002',
    member_id: 'mem_000002',
    member_name: 'Maria Santos',
    loan_product_id: 'lp_regular',
    product_name: 'Regular Multi-Purpose Loan',
    product_version: 1,
    branch_id: 'branch_tar',
    principal_amount: l2Principal,
    annual_interest_rate: 10.0,
    interest_calculation_method: 'Diminishing Balance',
    term_months: 6,
    payment_frequency: 'Monthly',
    disbursement_date: '2026-02-15',
    first_due_date: '2026-03-15',
    maturity_date: '2026-08-15',
    processing_fee: l2Fee,
    service_fee: 0,
    net_disbursed: l2Principal - l2Fee,
    disbursed_from_cash_account_id: 'cash_01',
    status: 'Active',
    current_balance: l2Principal,
    total_principal_paid: 0,
    total_interest_paid: 0,
    total_penalty_paid: 0,
    total_fees_paid: l2Fee,
    approved_by: 'Elena Rostro',
    approved_date: '2026-02-14',
    created_at: '2026-02-15T09:00:00Z'
  };
  loans.push(loan2);
  totalLoanPrincipalOutstanding += loan2.current_balance;

  for (let i = 1; i <= 6; i++) {
    const dueDate = new Date(2026, i + 1, 15).toISOString().split('T')[0];
    const mPrin = Number((l2Principal / 6).toFixed(2));
    const mInt = Number(((l2Principal * 0.10) / 12).toFixed(2));
    schedules.push({
      id: `las_ln2_${i}`,
      loan_id: loan2.id,
      installment_no: i,
      due_date: dueDate,
      principal: mPrin,
      interest: mInt,
      fee: 0,
      total_installment: Number((mPrin + mInt).toFixed(2)),
      principal_balance: Math.max(0, Number((l2Principal - mPrin * i).toFixed(2))),
      paid_principal: 0,
      paid_interest: 0,
      paid_penalty: 0,
      paid_date: null,
      status: 'Unpaid'
    });
  }

  // Loan 3: Pedro Reyes (Active)
  const l3Principal = 50000;
  const l3Fee = 1000;
  totalFeesCollected += l3Fee;
  const loan3 = {
    id: 'ln_000003',
    loan_account_no: 'LN-2026-0003',
    member_id: 'mem_000003',
    member_name: 'Pedro Reyes',
    loan_product_id: 'lp_regular',
    product_name: 'Regular Multi-Purpose Loan',
    product_version: 1,
    branch_id: 'branch_urd',
    principal_amount: l3Principal,
    annual_interest_rate: 10.0,
    interest_calculation_method: 'Diminishing Balance',
    term_months: 12,
    payment_frequency: 'Monthly',
    disbursement_date: '2026-03-01',
    first_due_date: '2026-04-01',
    maturity_date: '2027-03-01',
    processing_fee: l3Fee,
    service_fee: 0,
    net_disbursed: l3Principal - l3Fee,
    disbursed_from_cash_account_id: 'cash_02',
    status: 'Active',
    current_balance: l3Principal,
    total_principal_paid: 0,
    total_interest_paid: 0,
    total_penalty_paid: 0,
    total_fees_paid: l3Fee,
    approved_by: 'Roberto Valenzuela',
    approved_date: '2026-02-28',
    created_at: '2026-03-01T10:00:00Z'
  };
  loans.push(loan3);
  totalLoanPrincipalOutstanding += loan3.current_balance;

  for (let i = 1; i <= 12; i++) {
    const dueDate = new Date(2026, i + 2, 1).toISOString().split('T')[0];
    const mPrin = Number((l3Principal / 12).toFixed(2));
    const mInt = Number(((l3Principal * 0.10) / 12).toFixed(2));
    schedules.push({
      id: `las_ln3_${i}`,
      loan_id: loan3.id,
      installment_no: i,
      due_date: dueDate,
      principal: mPrin,
      interest: mInt,
      fee: 0,
      total_installment: Number((mPrin + mInt).toFixed(2)),
      principal_balance: Math.max(0, Number((l3Principal - mPrin * i).toFixed(2))),
      paid_principal: 0,
      paid_interest: 0,
      paid_penalty: 0,
      paid_date: null,
      status: 'Unpaid'
    });
  }

  (db as any).data.loans = loans;
  (db as any).data.loan_amortization_schedules = schedules;
  (db as any).data.loan_payments = payments;
  (db as any).data.loan_payment_allocations = allocations;

  // 6. Cash Accounts with realistic balances
  const cashAccounts = [
    {
      id: 'cash_01',
      name: 'Cashier Drawer - Tarlac Main',
      account_number: 'CSH-TAR-01',
      bank_name: 'Over-the-Counter Vault',
      branch_id: 'branch_tar',
      gl_account_id: 'acc_1110',
      opening_balance: 100000.0,
      current_balance: 154500.0,
      currency: 'PHP',
      active: true
    },
    {
      id: 'cash_02',
      name: 'Cashier Drawer - Urdaneta',
      account_number: 'CSH-URD-01',
      bank_name: 'Over-the-Counter Vault',
      branch_id: 'branch_urd',
      gl_account_id: 'acc_1110',
      opening_balance: 50000.0,
      current_balance: 62000.0,
      currency: 'PHP',
      active: true
    },
    {
      id: 'cash_03',
      name: 'Cashier Drawer - San Fernando',
      account_number: 'CSH-SFE-01',
      bank_name: 'Over-the-Counter Vault',
      branch_id: 'branch_sfe',
      gl_account_id: 'acc_1110',
      opening_balance: 50000.0,
      current_balance: 58500.0,
      currency: 'PHP',
      active: true
    },
    {
      id: 'cash_04',
      name: 'Land Bank of the Philippines - Operating Account',
      account_number: 'LBP-0941-2291-88',
      bank_name: 'Land Bank of the Philippines',
      branch_id: 'branch_tar',
      gl_account_id: 'acc_1120',
      opening_balance: 1500000.0,
      current_balance: 1500000.0,
      currency: 'PHP',
      active: true
    },
    {
      id: 'cash_05',
      name: 'BDO Commercial Clearing Account',
      account_number: 'BDO-0081-3349-12',
      bank_name: 'Banco de Oro',
      branch_id: 'branch_tar',
      gl_account_id: 'acc_1120',
      opening_balance: 500000.0,
      current_balance: 500000.0,
      currency: 'PHP',
      active: true
    }
  ];
  (db as any).data.cash_accounts = cashAccounts;

  // 7. Balanced Journal Entries & Journal Lines
  const journalEntries: any[] = [];
  const journalLines: any[] = [];

  // Helper to add balanced voucher
  const addVoucher = (
    voucherNo: string,
    branchId: string,
    date: string,
    desc: string,
    lines: { account_id: string; debit: number; credit: number; subType?: string; subId?: string }[]
  ) => {
    const totalDr = Number(lines.reduce((s, l) => s + (l.debit || 0), 0).toFixed(2));
    const totalCr = Number(lines.reduce((s, l) => s + (l.credit || 0), 0).toFixed(2));
    const jId = `jv_seed_${voucherNo.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    journalEntries.push({
      id: jId,
      voucher_number: voucherNo,
      branch_id: branchId,
      posting_date: date,
      reference_type: 'System Seed Voucher',
      reference_id: null,
      description: desc,
      total_debit: totalDr,
      total_credit: totalCr,
      period_id: periodId,
      status: 'Posted',
      created_by: 'Administrator',
      posted_at: `${date} 09:00:00`
    });

    lines.forEach((l, idx) => {
      journalLines.push({
        id: `jl_${jId}_${idx + 1}`,
        journal_entry_id: jId,
        account_id: l.account_id,
        debit: l.debit || 0,
        credit: l.credit || 0,
        subsidiary_type: l.subType || null,
        subsidiary_id: l.subId || null
      });
    });
  };

  // Voucher 1: Opening Capitalization & Bank Balances
  // Dr Cash in Bank (acc_1120) 2,000,000
  // Dr Cash on Hand (acc_1110) 200,000
  // Cr Paid-up Share Capital - Institutional Founding (acc_3110) 1,500,000
  // Cr Donated Capital & General Reserve Fund (acc_3130) 700,000
  addVoucher('JV-2026-0001', 'branch_tar', '2026-01-01', 'Initial baseline cooperative capitalization and depository funding', [
    { account_id: 'acc_1120', debit: 2000000, credit: 0, subType: 'Bank', subId: 'cash_04' },
    { account_id: 'acc_1110', debit: 200000, credit: 0, subType: 'Cash', subId: 'cash_01' },
    { account_id: 'acc_3110', debit: 0, credit: 1500000, subType: 'Equity', subId: 'coop_01' },
    { account_id: 'acc_3130', debit: 0, credit: 700000, subType: 'Reserve', subId: 'coop_01' }
  ]);

  // Voucher 2: Members Share Capital (CBU) Paid-Up
  // Dr Cash on Hand (acc_1110) totalShareCapitalPaid
  // Cr Paid-up Share Capital - Common (acc_3110) totalShareCapitalPaid
  addVoucher('JV-2026-0002', 'branch_tar', '2026-01-15', 'Members initial Capital Build-Up (CBU) share capital contributions', [
    { account_id: 'acc_1110', debit: totalShareCapitalPaid, credit: 0, subType: 'Cash', subId: 'cash_01' },
    { account_id: 'acc_3110', debit: 0, credit: totalShareCapitalPaid, subType: 'Member', subId: 'mem_000001' }
  ]);

  // Voucher 3: Members Regular Savings Deposits
  // Dr Cash on Hand (acc_1110) totalSavingsDeposits
  // Cr Savings Deposits Liability (acc_2110) totalSavingsDeposits
  addVoucher('JV-2026-0003', 'branch_tar', '2026-01-16', 'Members opening regular savings deposit collections', [
    { account_id: 'acc_1110', debit: totalSavingsDeposits, credit: 0, subType: 'Cash', subId: 'cash_01' },
    { account_id: 'acc_2110', debit: 0, credit: totalSavingsDeposits, subType: 'Savings', subId: 'sa_mem_000001' }
  ]);

  // Voucher 4: Loan Release - Juan Dela Cruz
  // Dr Loans Receivable (acc_1210) 25,000
  // Cr Cash on Hand (acc_1110) 24,500
  // Cr Service and Processing Fee Income (acc_4120) 500
  addVoucher('JV-2026-0004', 'branch_tar', '2026-01-20', 'Loan release LN-2026-0001 for Juan Dela Cruz less processing fee', [
    { account_id: 'acc_1210', debit: 25000, credit: 0, subType: 'Loan', subId: 'ln_000001' },
    { account_id: 'acc_1110', debit: 0, credit: 24500, subType: 'Cash', subId: 'cash_01' },
    { account_id: 'acc_4120', debit: 0, credit: 500 }
  ]);

  // Voucher 5: Loan Release - Maria Santos
  // Dr Loans Receivable (acc_1210) 15,000
  // Cr Cash on Hand (acc_1110) 14,700
  // Cr Service and Processing Fee Income (acc_4120) 300
  addVoucher('JV-2026-0005', 'branch_tar', '2026-02-15', 'Loan release LN-2026-0002 for Maria Santos less processing fee', [
    { account_id: 'acc_1210', debit: 15000, credit: 0, subType: 'Loan', subId: 'ln_000002' },
    { account_id: 'acc_1110', debit: 0, credit: 14700, subType: 'Cash', subId: 'cash_01' },
    { account_id: 'acc_4120', debit: 0, credit: 300 }
  ]);

  // Voucher 6: Loan Release - Pedro Reyes
  // Dr Loans Receivable (acc_1210) 50,000
  // Cr Cash on Hand (acc_1110) 49,000
  // Cr Service and Processing Fee Income (acc_4120) 1,000
  addVoucher('JV-2026-0006', 'branch_urd', '2026-03-01', 'Loan release LN-2026-0003 for Pedro Reyes less processing fee', [
    { account_id: 'acc_1210', debit: 50000, credit: 0, subType: 'Loan', subId: 'ln_000003' },
    { account_id: 'acc_1110', debit: 0, credit: 49000, subType: 'Cash', subId: 'cash_02' },
    { account_id: 'acc_4120', debit: 0, credit: 1000 }
  ]);

  // Voucher 7: Loan Payments Collected (Loan 1 - 2 installments)
  const l1TotalPaid = Number(((l1MonthlyPrin + l1MonthlyInt) * 2).toFixed(2));
  const l1PrinPaid = Number((l1MonthlyPrin * 2).toFixed(2));
  const l1IntPaid = Number((l1MonthlyInt * 2).toFixed(2));
  addVoucher('JV-2026-0007', 'branch_tar', '2026-03-20', 'Amortization payments received for LN-2026-0001 (Juan Dela Cruz)', [
    { account_id: 'acc_1110', debit: l1TotalPaid, credit: 0, subType: 'Cash', subId: 'cash_01' },
    { account_id: 'acc_1210', debit: 0, credit: l1PrinPaid, subType: 'Loan', subId: 'ln_000001' },
    { account_id: 'acc_4110', debit: 0, credit: l1IntPaid, subType: 'Income', subId: 'acc_4110' }
  ]);

  (db as any).data.journal_entries = journalEntries;
  (db as any).data.journal_lines = journalLines;

  // Persist to disk
  db.save();

  return {
    success: true,
    message: 'database seeders success',
    data: {
      seeded: true,
      members: sampleMembers.length,
      share_capital_accounts: shareCapitalAccounts.length,
      savings_accounts: savingsAccounts.length,
      loans: loans.length,
      journal_entries: journalEntries.length,
      journal_lines: journalLines.length
    }
  };
}
