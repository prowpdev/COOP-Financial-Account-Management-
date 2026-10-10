import { DatabaseEngine } from './database';

export function seedMultiBranchFinancialData(db: DatabaseEngine) {
  const currentMembers = db.getTable('members') || [];
  const currentLoans = db.getTable('loans') || [];
  const currentJvs = db.getTable('journal_entries') || [];

  // If already seeded with operational data, skip full re-seeding
  if (currentLoans.length >= 4 && currentJvs.length >= 8) {
    return;
  }

  console.log('[financialSeeder] Seeding comprehensive multi-branch cooperative operational dataset...');

  // 1. Ensure Standard Members across all 3 branches
  const standardMembers = [
    {
      id: 'mem_sample_01',
      member_no: 'MEM-2026-0001',
      first_name: 'Juan',
      last_name: 'Cruz',
      middle_name: 'Santos',
      branch_id: 'branch_tar',
      branch_name: 'Main Branch - Tarlac',
      member_type_id: 'mt_regular',
      member_type_name: 'Regular Agricultural Member',
      gender: 'Male',
      date_of_birth: '1984-05-12',
      contact_number: '+63 917 555 1001',
      email: 'juan.cruz@mayapcare.ph',
      address: 'Barangay Care Zone 5, Tarlac City',
      tin_number: '123-456-789-000',
      status: 'Active',
      membership_date: '2026-01-15'
    },
    {
      id: 'mem_sample_02',
      member_no: 'MEM-2026-0002',
      first_name: 'Maria',
      last_name: 'Reyes',
      middle_name: 'Bautista',
      branch_id: 'branch_tar',
      branch_name: 'Main Branch - Tarlac',
      member_type_id: 'mt_regular',
      member_type_name: 'Regular Agricultural Member',
      gender: 'Female',
      date_of_birth: '1989-08-23',
      contact_number: '+63 918 555 2002',
      email: 'maria.reyes@mayapcare.ph',
      address: 'San Nicolas, Tarlac City',
      tin_number: '234-567-890-000',
      status: 'Active',
      membership_date: '2026-01-20'
    },
    {
      id: 'mem_sample_03',
      member_no: 'MEM-2026-0003',
      first_name: 'Roberto',
      last_name: 'Mendoza',
      middle_name: 'Gomez',
      branch_id: 'branch_urd',
      branch_name: 'Urdaneta Branch',
      member_type_id: 'mt_regular',
      member_type_name: 'Regular Enterprise Member',
      gender: 'Male',
      date_of_birth: '1979-11-04',
      contact_number: '+63 919 555 3003',
      email: 'roberto.m@mayapcare.ph',
      address: 'Poblacion, Urdaneta City, Pangasinan',
      tin_number: '345-678-901-000',
      status: 'Active',
      membership_date: '2026-02-01'
    },
    {
      id: 'mem_sample_04',
      member_no: 'MEM-2026-0004',
      first_name: 'Ana Patricia',
      last_name: 'Dizon',
      middle_name: 'Lim',
      branch_id: 'branch_urd',
      branch_name: 'Urdaneta Branch',
      member_type_id: 'mt_associate',
      member_type_name: 'Associate Micro Member',
      gender: 'Female',
      date_of_birth: '1992-03-15',
      contact_number: '+63 920 555 4004',
      email: 'ana.dizon@mayapcare.ph',
      address: 'MacArthur Highway, Urdaneta City',
      tin_number: '456-789-012-000',
      status: 'Active',
      membership_date: '2026-02-10'
    },
    {
      id: 'mem_sample_05',
      member_no: 'MEM-2026-0005',
      first_name: 'Carlos',
      last_name: 'Garcia',
      middle_name: 'Aquino',
      branch_id: 'branch_sfe',
      branch_name: 'San Fernando Branch',
      member_type_id: 'mt_regular',
      member_type_name: 'Regular Agricultural Member',
      gender: 'Male',
      date_of_birth: '1982-09-18',
      contact_number: '+63 921 555 5005',
      email: 'carlos.garcia@mayapcare.ph',
      address: 'Dolores, San Fernando City, Pampanga',
      tin_number: '567-890-123-000',
      status: 'Active',
      membership_date: '2026-02-15'
    },
    {
      id: 'mem_sample_06',
      member_no: 'MEM-2026-0006',
      first_name: 'Teresa',
      last_name: 'Pineda',
      middle_name: 'Castro',
      branch_id: 'branch_sfe',
      branch_name: 'San Fernando Branch',
      member_type_id: 'mt_regular',
      member_type_name: 'Regular Enterprise Member',
      gender: 'Female',
      date_of_birth: '1990-12-08',
      contact_number: '+63 922 555 6006',
      email: 'teresa.p@mayapcare.ph',
      address: 'Sindalan, San Fernando City, Pampanga',
      tin_number: '678-901-234-000',
      status: 'Active',
      membership_date: '2026-02-20'
    }
  ];

  standardMembers.forEach(m => {
    const existing = db.getTable('members').find(x => x.id === m.id);
    if (!existing) {
      db.insert('members', m);
    } else {
      Object.assign(existing, m);
    }
  });

  // 2. Share Capital Accounts (CBU)
  const standardShareAccounts = [
    { id: 'cbu_mem_sample_01', member_id: 'mem_sample_01', member_name: 'Juan Cruz', branch_id: 'branch_tar', account_number: 'CBU-TAR-0001', subscribed_shares: 10000, subscribed_amount: 1000000, paid_up_shares: 10000, paid_up_amount: 1000000, par_value: 100, status: 'Active' },
    { id: 'cbu_mem_sample_02', member_id: 'mem_sample_02', member_name: 'Maria Reyes', branch_id: 'branch_tar', account_number: 'CBU-TAR-0002', subscribed_shares: 15650, subscribed_amount: 1565000, paid_up_shares: 15650, paid_up_amount: 1565000, par_value: 100, status: 'Active' },
    { id: 'cbu_mem_sample_03', member_id: 'mem_sample_03', member_name: 'Roberto Mendoza', branch_id: 'branch_urd', account_number: 'CBU-URD-0003', subscribed_shares: 5000, subscribed_amount: 500000, paid_up_shares: 5000, paid_up_amount: 500000, par_value: 100, status: 'Active' },
    { id: 'cbu_mem_sample_04', member_id: 'mem_sample_04', member_name: 'Ana Patricia Dizon', branch_id: 'branch_urd', account_number: 'CBU-URD-0004', subscribed_shares: 5000, subscribed_amount: 500000, paid_up_shares: 5000, paid_up_amount: 500000, par_value: 100, status: 'Active' }, // Preferred Non-voting
    { id: 'cbu_mem_sample_05', member_id: 'mem_sample_05', member_name: 'Carlos Garcia', branch_id: 'branch_sfe', account_number: 'CBU-SFE-0005', subscribed_shares: 3000, subscribed_amount: 300000, paid_up_shares: 3000, paid_up_amount: 300000, par_value: 100, status: 'Active' },
    { id: 'cbu_mem_sample_06', member_id: 'mem_sample_06', member_name: 'Teresa Pineda', branch_id: 'branch_sfe', account_number: 'CBU-SFE-0006', subscribed_shares: 2000, subscribed_amount: 200000, paid_up_shares: 2000, paid_up_amount: 200000, par_value: 100, status: 'Active' }
  ];

  standardShareAccounts.forEach(sca => {
    const existing = db.getTable('share_capital_accounts').find(x => x.id === sca.id);
    if (!existing) {
      db.insert('share_capital_accounts', sca);
    } else {
      Object.assign(existing, sca);
    }
  });

  // 3. Regular Savings Accounts
  const standardSavingsAccounts = [
    { id: 'sav_mem_01', member_id: 'mem_sample_01', member_name: 'Juan Cruz', branch_id: 'branch_tar', account_number: 'SAV-TAR-0001', savings_product_id: 'sp_reg_01', balance: 250000, minimum_balance: 500, interest_rate: 3.5, status: 'Active', opened_date: '2026-01-20' },
    { id: 'sav_mem_02', member_id: 'mem_sample_02', member_name: 'Maria Reyes', branch_id: 'branch_tar', account_number: 'SAV-TAR-0002', savings_product_id: 'sp_reg_01', balance: 200000, minimum_balance: 500, interest_rate: 3.5, status: 'Active', opened_date: '2026-01-25' },
    { id: 'sav_mem_03', member_id: 'mem_sample_03', member_name: 'Roberto Mendoza', branch_id: 'branch_urd', account_number: 'SAV-URD-0003', savings_product_id: 'sp_reg_01', balance: 140000, minimum_balance: 500, interest_rate: 3.5, status: 'Active', opened_date: '2026-02-05' },
    { id: 'sav_mem_04', member_id: 'mem_sample_04', member_name: 'Ana Patricia Dizon', branch_id: 'branch_urd', account_number: 'SAV-URD-0004', savings_product_id: 'sp_reg_01', balance: 80000, minimum_balance: 500, interest_rate: 3.5, status: 'Active', opened_date: '2026-02-12' },
    { id: 'sav_mem_05', member_id: 'mem_sample_05', member_name: 'Carlos Garcia', branch_id: 'branch_sfe', account_number: 'SAV-SFE-0005', savings_product_id: 'sp_reg_01', balance: 100000, minimum_balance: 500, interest_rate: 3.5, status: 'Active', opened_date: '2026-02-18' },
    { id: 'sav_mem_06', member_id: 'mem_sample_06', member_name: 'Teresa Pineda', branch_id: 'branch_sfe', account_number: 'SAV-SFE-0006', savings_product_id: 'sp_reg_01', balance: 80000, minimum_balance: 500, interest_rate: 3.5, status: 'Active', opened_date: '2026-02-22' }
  ];

  standardSavingsAccounts.forEach(sa => {
    const existing = db.getTable('savings_accounts').find(x => x.id === sa.id);
    if (!existing) {
      db.insert('savings_accounts', sa);
    } else {
      Object.assign(existing, sa);
    }
  });

  // 4. Active Loans Portfolio
  const standardLoans = [
    {
      id: 'loan_sample_01',
      loan_account_no: 'LN-TAR-2026-0001',
      member_id: 'mem_sample_01',
      loan_product_id: 'prod_regular',
      branch_id: 'branch_tar',
      principal_amount: 500000,
      annual_interest_rate: 12.0,
      interest_calculation_method: 'diminishing_balance',
      term_months: 12,
      payment_frequency: 'monthly',
      disbursement_date: '2026-02-01',
      first_due_date: '2026-03-01',
      maturity_date: '2027-02-01',
      processing_fee: 5000,
      service_fee: 5000,
      net_disbursed: 490000,
      disbursed_from_cash_account_id: 'cash_01',
      status: 'Active',
      current_balance: 350000,
      total_principal_paid: 150000,
      total_interest_paid: 40000,
      total_penalty_paid: 3000,
      total_fees_paid: 10000
    },
    {
      id: 'loan_sample_02',
      loan_account_no: 'LN-TAR-2026-0002',
      member_id: 'mem_sample_02',
      loan_product_id: 'prod_agricultural',
      branch_id: 'branch_tar',
      principal_amount: 350000,
      annual_interest_rate: 10.0,
      interest_calculation_method: 'straight_line',
      term_months: 6,
      payment_frequency: 'monthly',
      disbursement_date: '2026-02-10',
      first_due_date: '2026-03-10',
      maturity_date: '2026-08-10',
      processing_fee: 4000,
      service_fee: 3000,
      net_disbursed: 343000,
      disbursed_from_cash_account_id: 'cash_01',
      status: 'Active',
      current_balance: 250000,
      total_principal_paid: 100000,
      total_interest_paid: 25000,
      total_penalty_paid: 2000,
      total_fees_paid: 7000
    },
    {
      id: 'loan_sample_03',
      loan_account_no: 'LN-URD-2026-0003',
      member_id: 'mem_sample_03',
      loan_product_id: 'prod_emergency',
      branch_id: 'branch_urd',
      principal_amount: 400000,
      annual_interest_rate: 14.0,
      interest_calculation_method: 'diminishing_balance',
      term_months: 12,
      payment_frequency: 'monthly',
      disbursement_date: '2026-02-15',
      first_due_date: '2026-03-15',
      maturity_date: '2027-02-15',
      processing_fee: 4000,
      service_fee: 4000,
      net_disbursed: 392000,
      disbursed_from_cash_account_id: 'cash_05',
      status: 'Active',
      current_balance: 400000,
      total_principal_paid: 0,
      total_interest_paid: 0,
      total_penalty_paid: 0,
      total_fees_paid: 8000
    },
    {
      id: 'loan_sample_04',
      loan_account_no: 'LN-SFE-2026-0004',
      member_id: 'mem_sample_05',
      loan_product_id: 'prod_regular',
      branch_id: 'branch_sfe',
      principal_amount: 400000,
      annual_interest_rate: 12.0,
      interest_calculation_method: 'diminishing_balance',
      term_months: 12,
      payment_frequency: 'monthly',
      disbursement_date: '2026-02-20',
      first_due_date: '2026-03-20',
      maturity_date: '2027-02-20',
      processing_fee: 2000,
      service_fee: 1000,
      net_disbursed: 397000,
      disbursed_from_cash_account_id: 'cash_06',
      status: 'Active',
      current_balance: 400000,
      total_principal_paid: 0,
      total_interest_paid: 0,
      total_penalty_paid: 0,
      total_fees_paid: 3000
    }
  ];

  standardLoans.forEach(l => {
    const existing = db.getTable('loans').find(x => x.id === l.id);
    if (!existing) {
      db.insert('loans', l);
    } else {
      Object.assign(existing, l);
    }
  });

  // 5. Seed Balanced Double-Entry Journal Entries & Journal Lines
  // Clear previous sample entries to ensure a pristine, CDA-balanced ledger
  (db as any).data.journal_entries = [];
  (db as any).data.journal_lines = [];

  const balancedJournalBatches = [
    // Batch 1: Tarlac Branch Initial Capitalization & Cash Reserves
    // Debits: ₱3,065,000 | Credits: ₱3,065,000
    {
      entry: {
        id: 'jv_cap_tar_01',
        voucher_number: 'JV-2026-TAR-001',
        voucher_type: 'JV',
        branch_id: 'branch_tar',
        posting_date: '2026-01-02',
        reference_type: 'OPENING_BALANCE',
        reference_id: 'CAP-2026-TAR',
        description: 'Tarlac Main Branch Initial Capitalization, Vault Reserves & IT Equipment',
        total_debit: 3065000,
        total_credit: 3065000,
        period_id: 'period_current',
        status: 'Posted',
        created_by: 'Board of Directors',
        posted_at: '2026-01-02T08:00:00Z'
      },
      lines: [
        { id: 'jl_cap_1', account_id: 'acc_1110', debit: 300000, credit: 0, subsidiary_type: 'Cash', subsidiary_id: 'cash_01' },
        { id: 'jl_cap_2', account_id: 'acc_1112', debit: 700000, credit: 0, subsidiary_type: 'Cash', subsidiary_id: 'cash_02' },
        { id: 'jl_cap_3', account_id: 'acc_1120', debit: 1200000, credit: 0, subsidiary_type: 'Cash', subsidiary_id: 'cash_03' },
        { id: 'jl_cap_4', account_id: 'acc_1121', debit: 800000, credit: 0, subsidiary_type: 'Cash', subsidiary_id: 'cash_04' },
        { id: 'jl_cap_5', account_id: 'acc_1510', debit: 65000, credit: 0, subsidiary_type: 'Asset', subsidiary_id: null },
        { id: 'jl_cap_6', account_id: 'acc_3110', debit: 0, credit: 2565000, subsidiary_type: 'Member', subsidiary_id: 'mem_sample_02' },
        { id: 'jl_cap_7', account_id: 'acc_3120', debit: 0, credit: 500000, subsidiary_type: 'Member', subsidiary_id: 'mem_sample_04' }
      ]
    },

    // Batch 2: Urdaneta Branch Capitalization & Vault Float
    // Debits: ₱500,000 | Credits: ₱500,000
    {
      entry: {
        id: 'jv_cap_urd_02',
        voucher_number: 'JV-2026-URD-001',
        voucher_type: 'JV',
        branch_id: 'branch_urd',
        posting_date: '2026-01-03',
        reference_type: 'OPENING_BALANCE',
        reference_id: 'CAP-2026-URD',
        description: 'Urdaneta Branch Operating Float & Member Common Share Capital',
        total_debit: 500000,
        total_credit: 500000,
        period_id: 'period_current',
        status: 'Posted',
        created_by: 'Board of Directors',
        posted_at: '2026-01-03T08:30:00Z'
      },
      lines: [
        { id: 'jl_urd_1', account_id: 'acc_1110', debit: 200000, credit: 0, subsidiary_type: 'Cash', subsidiary_id: 'cash_05' },
        { id: 'jl_urd_2', account_id: 'acc_1112', debit: 300000, credit: 0, subsidiary_type: 'Cash', subsidiary_id: 'cash_vault_urd' },
        { id: 'jl_urd_3', account_id: 'acc_3110', debit: 0, credit: 500000, subsidiary_type: 'Member', subsidiary_id: 'mem_sample_03' }
      ]
    },

    // Batch 3: San Fernando Branch Capitalization & Vault Float
    // Debits: ₱500,000 | Credits: ₱500,000
    {
      entry: {
        id: 'jv_cap_sfe_03',
        voucher_number: 'JV-2026-SFE-001',
        voucher_type: 'JV',
        branch_id: 'branch_sfe',
        posting_date: '2026-01-04',
        reference_type: 'OPENING_BALANCE',
        reference_id: 'CAP-2026-SFE',
        description: 'San Fernando Branch Operating Float & Member Common Share Capital',
        total_debit: 500000,
        total_credit: 500000,
        period_id: 'period_current',
        status: 'Posted',
        created_by: 'Board of Directors',
        posted_at: '2026-01-04T09:00:00Z'
      },
      lines: [
        { id: 'jl_sfe_1', account_id: 'acc_1110', debit: 200000, credit: 0, subsidiary_type: 'Cash', subsidiary_id: 'cash_06' },
        { id: 'jl_sfe_2', account_id: 'acc_1112', debit: 300000, credit: 0, subsidiary_type: 'Cash', subsidiary_id: 'cash_vault_sfe' },
        { id: 'jl_sfe_3', account_id: 'acc_3110', debit: 0, credit: 500000, subsidiary_type: 'Member', subsidiary_id: 'mem_sample_05' }
      ]
    },

    // Batch 4: Member Regular Savings Deposits across branches
    // Tarlac: ₱450,000 | Urdaneta: ₱220,000 | San Fernando: ₱180,000 = Total ₱850,000
    {
      entry: {
        id: 'or_sav_tar_01',
        voucher_number: 'OR-2026-TAR-SAV01',
        voucher_type: 'OR',
        branch_id: 'branch_tar',
        posting_date: '2026-01-22',
        reference_type: 'CASH_RECEIPT',
        reference_id: 'SAV-DEP-TAR',
        description: 'Member Regular Savings Deposits Inflow - Tarlac Branch',
        total_debit: 450000,
        total_credit: 450000,
        period_id: 'period_current',
        status: 'Posted',
        created_by: 'Branch Cashier',
        posted_at: '2026-01-22T10:00:00Z'
      },
      lines: [
        { id: 'jl_sav_tar_1', account_id: 'acc_1110', debit: 450000, credit: 0, subsidiary_type: 'Cash', subsidiary_id: 'cash_01' },
        { id: 'jl_sav_tar_2', account_id: 'acc_2110', debit: 0, credit: 450000, subsidiary_type: 'Member', subsidiary_id: 'mem_sample_01' }
      ]
    },
    {
      entry: {
        id: 'or_sav_urd_02',
        voucher_number: 'OR-2026-URD-SAV02',
        voucher_type: 'OR',
        branch_id: 'branch_urd',
        posting_date: '2026-01-25',
        reference_type: 'CASH_RECEIPT',
        reference_id: 'SAV-DEP-URD',
        description: 'Member Regular Savings Deposits Inflow - Urdaneta Branch',
        total_debit: 220000,
        total_credit: 220000,
        period_id: 'period_current',
        status: 'Posted',
        created_by: 'Branch Cashier',
        posted_at: '2026-01-25T11:00:00Z'
      },
      lines: [
        { id: 'jl_sav_urd_1', account_id: 'acc_1110', debit: 220000, credit: 0, subsidiary_type: 'Cash', subsidiary_id: 'cash_05' },
        { id: 'jl_sav_urd_2', account_id: 'acc_2110', debit: 0, credit: 220000, subsidiary_type: 'Member', subsidiary_id: 'mem_sample_03' }
      ]
    },
    {
      entry: {
        id: 'or_sav_sfe_03',
        voucher_number: 'OR-2026-SFE-SAV03',
        voucher_type: 'OR',
        branch_id: 'branch_sfe',
        posting_date: '2026-01-28',
        reference_type: 'CASH_RECEIPT',
        reference_id: 'SAV-DEP-SFE',
        description: 'Member Regular Savings Deposits Inflow - San Fernando Branch',
        total_debit: 180000,
        total_credit: 180000,
        period_id: 'period_current',
        status: 'Posted',
        created_by: 'Branch Cashier',
        posted_at: '2026-01-28T11:30:00Z'
      },
      lines: [
        { id: 'jl_sav_sfe_1', account_id: 'acc_1110', debit: 180000, credit: 0, subsidiary_type: 'Cash', subsidiary_id: 'cash_06' },
        { id: 'jl_sav_sfe_2', account_id: 'acc_2110', debit: 0, credit: 180000, subsidiary_type: 'Member', subsidiary_id: 'mem_sample_05' }
      ]
    },

    // Batch 5: Loan Disbursements (Debit Loans Receivable, Credit Cash, Credit Service Fee Income)
    // Tarlac: ₱850,000 principal
    {
      entry: {
        id: 'cd_loan_tar_01',
        voucher_number: 'CD-2026-TAR-LN01',
        voucher_type: 'CD',
        branch_id: 'branch_tar',
        posting_date: '2026-02-01',
        reference_type: 'LOAN_DISBURSEMENT',
        reference_id: 'loan_sample_01',
        member_id: 'mem_sample_01',
        member_name: 'Juan Cruz',
        description: 'Disbursement of Regular Multi-Purpose & Crop Loans (Net of Origination Fees)',
        total_debit: 850000,
        total_credit: 850000,
        period_id: 'period_current',
        status: 'Posted',
        created_by: 'Loan Officer',
        posted_at: '2026-02-01T14:00:00Z'
      },
      lines: [
        { id: 'jl_ln_tar_1', account_id: 'acc_1210', debit: 500000, credit: 0, subsidiary_type: 'Member', subsidiary_id: 'mem_sample_01' },
        { id: 'jl_ln_tar_2', account_id: 'acc_1230', debit: 350000, credit: 0, subsidiary_type: 'Member', subsidiary_id: 'mem_sample_02' },
        { id: 'jl_ln_tar_3', account_id: 'acc_1110', debit: 0, credit: 833000, subsidiary_type: 'Cash', subsidiary_id: 'cash_01' },
        { id: 'jl_ln_tar_4', account_id: 'acc_4120', debit: 0, credit: 17000, subsidiary_type: 'Income', subsidiary_id: null }
      ]
    },

    // Urdaneta: ₱400,000 Micro-Loan
    {
      entry: {
        id: 'cd_loan_urd_02',
        voucher_number: 'CD-2026-URD-LN02',
        voucher_type: 'CD',
        branch_id: 'branch_urd',
        posting_date: '2026-02-15',
        reference_type: 'LOAN_DISBURSEMENT',
        reference_id: 'loan_sample_03',
        member_id: 'mem_sample_03',
        member_name: 'Roberto Mendoza',
        description: 'Disbursement of Small Business Micro Loan #LN-URD-2026-0003',
        total_debit: 400000,
        total_credit: 400000,
        period_id: 'period_current',
        status: 'Posted',
        created_by: 'Loan Officer',
        posted_at: '2026-02-15T15:00:00Z'
      },
      lines: [
        { id: 'jl_ln_urd_1', account_id: 'acc_1240', debit: 400000, credit: 0, subsidiary_type: 'Member', subsidiary_id: 'mem_sample_03' },
        { id: 'jl_ln_urd_2', account_id: 'acc_1110', debit: 0, credit: 392000, subsidiary_type: 'Cash', subsidiary_id: 'cash_05' },
        { id: 'jl_ln_urd_3', account_id: 'acc_4120', debit: 0, credit: 8000, subsidiary_type: 'Income', subsidiary_id: null }
      ]
    },

    // San Fernando: ₱400,000 Emergency Loan
    {
      entry: {
        id: 'cd_loan_sfe_03',
        voucher_number: 'CD-2026-SFE-LN03',
        voucher_type: 'CD',
        branch_id: 'branch_sfe',
        posting_date: '2026-02-20',
        reference_type: 'LOAN_DISBURSEMENT',
        reference_id: 'loan_sample_04',
        member_id: 'mem_sample_05',
        member_name: 'Carlos Garcia',
        description: 'Disbursement of Calamity Emergency Micro Loan #LN-SFE-2026-0004',
        total_debit: 400000,
        total_credit: 400000,
        period_id: 'period_current',
        status: 'Posted',
        created_by: 'Loan Officer',
        posted_at: '2026-02-20T15:30:00Z'
      },
      lines: [
        { id: 'jl_ln_sfe_1', account_id: 'acc_1220', debit: 400000, credit: 0, subsidiary_type: 'Member', subsidiary_id: 'mem_sample_05' },
        { id: 'jl_ln_sfe_2', account_id: 'acc_1110', debit: 0, credit: 397000, subsidiary_type: 'Cash', subsidiary_id: 'cash_06' },
        { id: 'jl_ln_sfe_3', account_id: 'acc_4120', debit: 0, credit: 3000, subsidiary_type: 'Income', subsidiary_id: null }
      ]
    },

    // Batch 6: Loan Repayments & Interest Inflow (Debit Cash, Credit Loans Rec, Credit Interest Income & Fines)
    // Tarlac: ₱320,000 total inflow
    {
      entry: {
        id: 'or_repay_tar_01',
        voucher_number: 'OR-2026-TAR-RP01',
        voucher_type: 'OR',
        branch_id: 'branch_tar',
        posting_date: '2026-03-05',
        reference_type: 'LOAN_PAYMENT',
        reference_id: 'loan_sample_01',
        member_id: 'mem_sample_01',
        member_name: 'Juan Cruz',
        description: 'Collection of Monthly Loan Amortizations, Interest Yield & Late Penalties',
        total_debit: 320000,
        total_credit: 320000,
        period_id: 'period_current',
        status: 'Posted',
        created_by: 'Branch Teller',
        posted_at: '2026-03-05T13:00:00Z'
      },
      lines: [
        { id: 'jl_rp_1', account_id: 'acc_1110', debit: 320000, credit: 0, subsidiary_type: 'Cash', subsidiary_id: 'cash_01' },
        { id: 'jl_rp_2', account_id: 'acc_1210', debit: 0, credit: 150000, subsidiary_type: 'Member', subsidiary_id: 'mem_sample_01' },
        { id: 'jl_rp_3', account_id: 'acc_1230', debit: 0, credit: 100000, subsidiary_type: 'Member', subsidiary_id: 'mem_sample_02' },
        { id: 'jl_rp_4', account_id: 'acc_4110', debit: 0, credit: 65000, subsidiary_type: 'Income', subsidiary_id: null },
        { id: 'jl_rp_5', account_id: 'acc_4130', debit: 0, credit: 5000, subsidiary_type: 'Income', subsidiary_id: null }
      ]
    },

    // Batch 7: Membership Admission Fees across branches
    {
      entry: {
        id: 'or_memfee_01',
        voucher_number: 'OR-2026-MEM-FEES',
        voucher_type: 'OR',
        branch_id: 'branch_tar',
        posting_date: '2026-03-10',
        reference_type: 'MEMBERSHIP_FEE',
        reference_id: 'MEM-ADMISSION-2026',
        description: 'Collected Non-Refundable Cooperative Admission and Seminar Fees',
        total_debit: 15000,
        total_credit: 15000,
        period_id: 'period_current',
        status: 'Posted',
        created_by: 'Membership Officer',
        posted_at: '2026-03-10T11:00:00Z'
      },
      lines: [
        { id: 'jl_mf_1', account_id: 'acc_1110', debit: 15000, credit: 0, subsidiary_type: 'Cash', subsidiary_id: 'cash_01' },
        { id: 'jl_mf_2', account_id: 'acc_4140', debit: 0, credit: 15000, subsidiary_type: 'Income', subsidiary_id: null }
      ]
    },

    // Batch 8: Operating Expenses (Salaries, Rent, Utilities, Supplies, Interest on Savings)
    // Tarlac Main Branch (Disbursed from Land Bank Operating Account)
    {
      entry: {
        id: 'cd_exp_tar_01',
        voucher_number: 'CD-2026-TAR-EXP01',
        voucher_type: 'CD',
        branch_id: 'branch_tar',
        posting_date: '2026-03-25',
        reference_type: 'EXPENSE_DISBURSEMENT',
        reference_id: 'EXP-TAR-MAR',
        description: 'Monthly Personnel Payroll, Office Rent & Branch Utilities - Tarlac',
        total_debit: 41000,
        total_credit: 41000,
        period_id: 'period_current',
        status: 'Posted',
        created_by: 'Finance Manager',
        posted_at: '2026-03-25T16:00:00Z'
      },
      lines: [
        { id: 'jl_exp_tar_1', account_id: 'acc_5210', debit: 24000, credit: 0, subsidiary_type: 'Expense', subsidiary_id: null },
        { id: 'jl_exp_tar_2', account_id: 'acc_5230', debit: 10000, credit: 0, subsidiary_type: 'Expense', subsidiary_id: null },
        { id: 'jl_exp_tar_3', account_id: 'acc_5220', debit: 5000, credit: 0, subsidiary_type: 'Expense', subsidiary_id: null },
        { id: 'jl_exp_tar_4', account_id: 'acc_5110', debit: 2000, credit: 0, subsidiary_type: 'Expense', subsidiary_id: null },
        { id: 'jl_exp_tar_5', account_id: 'acc_1120', debit: 0, credit: 41000, subsidiary_type: 'Cash', subsidiary_id: 'cash_03' }
      ]
    },

    // Urdaneta Branch Expenses
    {
      entry: {
        id: 'cd_exp_urd_02',
        voucher_number: 'CD-2026-URD-EXP02',
        voucher_type: 'CD',
        branch_id: 'branch_urd',
        posting_date: '2026-03-26',
        reference_type: 'EXPENSE_DISBURSEMENT',
        reference_id: 'EXP-URD-MAR',
        description: 'Branch Operating Expenses & Teller Payroll - Urdaneta',
        total_debit: 17000,
        total_credit: 17000,
        period_id: 'period_current',
        status: 'Posted',
        created_by: 'Branch Manager',
        posted_at: '2026-03-26T16:00:00Z'
      },
      lines: [
        { id: 'jl_exp_urd_1', account_id: 'acc_5210', debit: 10000, credit: 0, subsidiary_type: 'Expense', subsidiary_id: null },
        { id: 'jl_exp_urd_2', account_id: 'acc_5230', debit: 4000, credit: 0, subsidiary_type: 'Expense', subsidiary_id: null },
        { id: 'jl_exp_urd_3', account_id: 'acc_5220', debit: 2000, credit: 0, subsidiary_type: 'Expense', subsidiary_id: null },
        { id: 'jl_exp_urd_4', account_id: 'acc_5110', debit: 1000, credit: 0, subsidiary_type: 'Expense', subsidiary_id: null },
        { id: 'jl_exp_urd_5', account_id: 'acc_1110', debit: 0, credit: 17000, subsidiary_type: 'Cash', subsidiary_id: 'cash_05' }
      ]
    },

    // San Fernando Branch Expenses
    {
      entry: {
        id: 'cd_exp_sfe_03',
        voucher_number: 'CD-2026-SFE-EXP03',
        voucher_type: 'CD',
        branch_id: 'branch_sfe',
        posting_date: '2026-03-27',
        reference_type: 'EXPENSE_DISBURSEMENT',
        reference_id: 'EXP-SFE-MAR',
        description: 'Branch Operating Expenses & Teller Payroll - San Fernando',
        total_debit: 14000,
        total_credit: 14000,
        period_id: 'period_current',
        status: 'Posted',
        created_by: 'Branch Manager',
        posted_at: '2026-03-27T16:00:00Z'
      },
      lines: [
        { id: 'jl_exp_sfe_1', account_id: 'acc_5210', debit: 8000, credit: 0, subsidiary_type: 'Expense', subsidiary_id: null },
        { id: 'jl_exp_sfe_2', account_id: 'acc_5230', debit: 4000, credit: 0, subsidiary_type: 'Expense', subsidiary_id: null },
        { id: 'jl_exp_sfe_3', account_id: 'acc_5220', debit: 1000, credit: 0, subsidiary_type: 'Expense', subsidiary_id: null },
        { id: 'jl_exp_sfe_4', account_id: 'acc_5110', debit: 1000, credit: 0, subsidiary_type: 'Expense', subsidiary_id: null },
        { id: 'jl_exp_sfe_5', account_id: 'acc_1110', debit: 0, credit: 14000, subsidiary_type: 'Cash', subsidiary_id: 'cash_06' }
      ]
    }
  ];

  balancedJournalBatches.forEach(b => {
    db.insert('journal_entries', b.entry);
    b.lines.forEach(line => {
      db.insert('journal_lines', {
        ...line,
        journal_entry_id: b.entry.id
      });
    });
  });

  db.save();
  console.log('[financialSeeder] Multi-branch cooperative operational dataset seeded successfully with balanced double-entry vouchers.');
}
