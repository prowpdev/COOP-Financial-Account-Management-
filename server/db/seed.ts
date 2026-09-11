import { DatabaseSchema } from './database';

export const initialSeedData: DatabaseSchema = {
  cooperatives: [
    {
      id: 'coop_01',
      name: 'St. Isidore Multi-Purpose Cooperative',
      registration_no: 'CDA-REG-9502-100234',
      tax_identification_number: '005-891-234-000',
      address: 'Poblacion Plaza, Tarlac City, Philippines',
      email: 'admin@stisidorecoop.org',
      phone: '+63 (045) 982-1200',
      currency: 'PHP',
      currency_symbol: '₱',
      decimal_places: 2,
      thousands_separator: ',',
      decimal_separator: '.',
      fiscal_year_start: '01-01',
      fiscal_year_end: '12-31',
      created_at: '2026-01-01T00:00:00Z'
    }
  ],

  branches: [
    {
      id: 'branch_tar',
      cooperative_id: 'coop_01',
      code: 'TAR',
      name: 'Main Branch - Tarlac',
      address: 'Poblacion, Tarlac City',
      phone: '+63 (045) 982-1200',
      manager_name: 'Elena Rostro',
      active: true
    },
    {
      id: 'branch_urd',
      cooperative_id: 'coop_01',
      code: 'URD',
      name: 'Urdaneta Branch',
      address: 'MacArthur Highway, Urdaneta City, Pangasinan',
      phone: '+63 (075) 568-3341',
      manager_name: 'Roberto Valenzuela',
      active: true
    },
    {
      id: 'branch_sfe',
      cooperative_id: 'coop_01',
      code: 'SFE',
      name: 'San Fernando Branch',
      address: 'Dolores Crossing, San Fernando City, Pampanga',
      phone: '+63 (045) 455-8812',
      manager_name: 'Carmela Santos',
      active: true
    }
  ],

  system_settings: [
    { key: 'cooperative_name', value: 'St. Isidore Multi-Purpose Cooperative', category: 'Cooperative' },
    { key: 'currency', value: 'PHP', category: 'Accounting' },
    { key: 'currency_symbol', value: '₱', category: 'Accounting' },
    { key: 'decimal_precision', value: '2', category: 'Accounting' },
    { key: 'thousands_separator', value: ',', category: 'Accounting' },
    { key: 'decimal_separator', value: '.', category: 'Accounting' },
    { key: 'fiscal_year_start', value: '01-01', category: 'Accounting' },
    { key: 'fiscal_year_end', value: '12-31', category: 'Accounting' },
    { key: 'default_grace_period_days', value: '5', category: 'Loans' },
    { key: 'default_penalty_rate', value: '2.0', category: 'Penalties' },
    { key: 'require_maker_checker_loans', value: 'true', category: 'Approvals' },
    { key: 'require_balanced_opening_balances', value: 'true', category: 'Accounting' }
  ],

  feature_toggles: [
    { id: 'feat_loans', key: 'feature_loans', name: 'Loans & Credit Facility', description: 'Enable loan origination, amortization schedules, and repayments', enabled: true },
    { id: 'feat_savings', key: 'feature_savings', name: 'Savings & Deposits', description: 'Member regular savings and time deposit facilities', enabled: true },
    { id: 'feat_share_capital', key: 'feature_share_capital', name: 'Share Capital (CBU)', description: 'Capital build-up, share subscription, and dividend accounts', enabled: true },
    { id: 'feat_cash_mgmt', key: 'feature_cash_management', name: 'Cash & Bank Management', description: 'Vault, cashier cash drawers, petty cash, and bank accounts', enabled: true },
    { id: 'feat_accounting', key: 'feature_accounting', name: 'General Accounting & GL', description: 'Dynamic Chart of Accounts, Journal entries, and postings', enabled: true },
    { id: 'feat_reports', key: 'feature_reports', name: 'Financial & Regulatory Reports', description: 'CDA-compliant financial statements, portfolio aging, and ledgers', enabled: true },
    { id: 'feat_custom_fields', key: 'feature_custom_fields', name: 'Custom Fields & Extensibility', description: 'Dynamic member, loan, and document custom attributes', enabled: true }
  ],

  chart_of_accounts: [
    // Assets
    { id: 'acc_1100', code: '1100', name: 'Cash and Cash Equivalents', type: 'Asset', category: 'Current Assets', normal_balance: 'Debit', parent_id: null, is_control: true, has_subsidiary: false, active: true },
    { id: 'acc_1110', code: '1110', name: 'Cash on Hand - Tellers', type: 'Asset', category: 'Current Assets', normal_balance: 'Debit', parent_id: 'acc_1100', is_control: false, has_subsidiary: true, active: true },
    { id: 'acc_1111', code: '1111', name: 'Petty Cash Fund', type: 'Asset', category: 'Current Assets', normal_balance: 'Debit', parent_id: 'acc_1100', is_control: false, has_subsidiary: false, active: true },
    { id: 'acc_1120', code: '1120', name: 'Cash in Bank - LBP Operating', type: 'Asset', category: 'Current Assets', normal_balance: 'Debit', parent_id: 'acc_1100', is_control: false, has_subsidiary: true, active: true },
    { id: 'acc_1121', code: '1121', name: 'Cash in Bank - DBP Reserve', type: 'Asset', category: 'Current Assets', normal_balance: 'Debit', parent_id: 'acc_1100', is_control: false, has_subsidiary: true, active: true },
    { id: 'acc_1200', code: '1200', name: 'Loans Receivable - Control', type: 'Asset', category: 'Current Assets', normal_balance: 'Debit', parent_id: null, is_control: true, has_subsidiary: true, active: true },
    { id: 'acc_1210', code: '1210', name: 'Loans Receivable - Regular', type: 'Asset', category: 'Current Assets', normal_balance: 'Debit', parent_id: 'acc_1200', is_control: false, has_subsidiary: true, active: true },
    { id: 'acc_1220', code: '1220', name: 'Loans Receivable - Emergency', type: 'Asset', category: 'Current Assets', normal_balance: 'Debit', parent_id: 'acc_1200', is_control: false, has_subsidiary: true, active: true },
    { id: 'acc_1230', code: '1230', name: 'Loans Receivable - Agricultural', type: 'Asset', category: 'Current Assets', normal_balance: 'Debit', parent_id: 'acc_1200', is_control: false, has_subsidiary: true, active: true },
    { id: 'acc_1240', code: '1240', name: 'Loans Receivable - Business Micro', type: 'Asset', category: 'Current Assets', normal_balance: 'Debit', parent_id: 'acc_1200', is_control: false, has_subsidiary: true, active: true },
    { id: 'acc_1310', code: '1310', name: 'Interest Receivable on Loans', type: 'Asset', category: 'Current Assets', normal_balance: 'Debit', parent_id: null, is_control: false, has_subsidiary: true, active: true },
    { id: 'acc_1510', code: '1510', name: 'Office Furniture & Equipment', type: 'Asset', category: 'Non-current Assets', normal_balance: 'Debit', parent_id: null, is_control: false, has_subsidiary: false, active: true },
    
    // Liabilities
    { id: 'acc_2100', code: '2100', name: 'Deposit Liabilities', type: 'Liability', category: 'Current Liabilities', normal_balance: 'Credit', parent_id: null, is_control: true, has_subsidiary: true, active: true },
    { id: 'acc_2110', code: '2110', name: 'Regular Savings Deposits', type: 'Liability', category: 'Current Liabilities', normal_balance: 'Credit', parent_id: 'acc_2100', is_control: false, has_subsidiary: true, active: true },
    { id: 'acc_2120', code: '2120', name: 'Special Savings & Time Deposits', type: 'Liability', category: 'Current Liabilities', normal_balance: 'Credit', parent_id: 'acc_2100', is_control: false, has_subsidiary: true, active: true },
    { id: 'acc_2210', code: '2210', name: 'Accounts Payable - Operations', type: 'Liability', category: 'Current Liabilities', normal_balance: 'Credit', parent_id: null, is_control: false, has_subsidiary: false, active: true },

    // Equity
    { id: 'acc_3100', code: '3100', name: 'Members Equity & Share Capital', type: 'Equity', category: 'Equity', normal_balance: 'Credit', parent_id: null, is_control: true, has_subsidiary: true, active: true },
    { id: 'acc_3110', code: '3110', name: 'Common Share Capital', type: 'Equity', category: 'Equity', normal_balance: 'Credit', parent_id: 'acc_3100', is_control: false, has_subsidiary: true, active: true },
    { id: 'acc_3120', code: '3120', name: 'Preferred Share Capital', type: 'Equity', category: 'Equity', normal_balance: 'Credit', parent_id: 'acc_3100', is_control: false, has_subsidiary: true, active: true },
    { id: 'acc_3210', code: '3210', name: 'Statutory Reserve Fund', type: 'Equity', category: 'Equity', normal_balance: 'Credit', parent_id: null, is_control: false, has_subsidiary: false, active: true },
    { id: 'acc_3900', code: '3900', name: 'Undivided Net Surplus / Retained Earnings', type: 'Equity', category: 'Equity', normal_balance: 'Credit', parent_id: null, is_control: false, has_subsidiary: false, active: true },

    // Income
    { id: 'acc_4110', code: '4110', name: 'Interest Income on Loans', type: 'Income', category: 'Income', normal_balance: 'Credit', parent_id: null, is_control: false, has_subsidiary: false, active: true },
    { id: 'acc_4120', code: '4120', name: 'Service and Processing Fees', type: 'Income', category: 'Income', normal_balance: 'Credit', parent_id: null, is_control: false, has_subsidiary: false, active: true },
    { id: 'acc_4130', code: '4130', name: 'Fines and Penalties on Loans', type: 'Income', category: 'Income', normal_balance: 'Credit', parent_id: null, is_control: false, has_subsidiary: false, active: true },
    { id: 'acc_4210', code: '4210', name: 'Membership Fees Income', type: 'Income', category: 'Income', normal_balance: 'Credit', parent_id: null, is_control: false, has_subsidiary: false, active: true },

    // Expenses
    { id: 'acc_5110', code: '5110', name: 'Interest Expense on Savings', type: 'Expense', category: 'Expenses', normal_balance: 'Debit', parent_id: null, is_control: false, has_subsidiary: false, active: true },
    { id: 'acc_5210', code: '5210', name: 'Salaries and Employee Benefits', type: 'Expense', category: 'Expenses', normal_balance: 'Debit', parent_id: null, is_control: false, has_subsidiary: false, active: true },
    { id: 'acc_5220', code: '5220', name: 'Office Supplies & Stationeries', type: 'Expense', category: 'Expenses', normal_balance: 'Debit', parent_id: null, is_control: false, has_subsidiary: false, active: true },
    { id: 'acc_5230', code: '5230', name: 'Rent, Power & Utilities', type: 'Expense', category: 'Expenses', normal_balance: 'Debit', parent_id: null, is_control: false, has_subsidiary: false, active: true }
  ],

  financial_statement_mappings: [
    { category: 'Current Assets', account_types: ['Asset'], display_order: 1 },
    { category: 'Non-current Assets', account_types: ['Asset'], display_order: 2 },
    { category: 'Current Liabilities', account_types: ['Liability'], display_order: 3 },
    { category: 'Long-term Liabilities', account_types: ['Liability'], display_order: 4 },
    { category: 'Equity', account_types: ['Equity'], display_order: 5 },
    { category: 'Income', account_types: ['Income'], display_order: 6 },
    { category: 'Expenses', account_types: ['Expense'], display_order: 7 }
  ],

  accounting_periods: [
    { id: 'period_2026_01', name: 'January 2026', start_date: '2026-01-01', end_date: '2026-01-31', status: 'Closed', closed_at: '2026-02-05T17:00:00Z', closed_by: 'Chief Accountant' },
    { id: 'period_2026_02', name: 'February 2026', start_date: '2026-02-01', end_date: '2026-02-28', status: 'Closed', closed_at: '2026-03-05T17:00:00Z', closed_by: 'Chief Accountant' },
    { id: 'period_2026_03', name: 'March 2026', start_date: '2026-03-01', end_date: '2026-03-31', status: 'Open', closed_at: null, closed_by: null },
    { id: 'period_2026_04', name: 'April 2026', start_date: '2026-04-01', end_date: '2026-04-30', status: 'Open', closed_at: null, closed_by: null }
  ],

  accounting_mappings: [
    {
      id: 'map_loan_release',
      transaction_type: 'LOAN_RELEASE',
      name: 'Loan Disbursement / Release',
      debit_account_id: 'acc_1210', // Loans Receivable - Regular (overridable per product)
      credit_account_id: 'acc_1110', // Cash on Hand
      description: 'Disbursement of approved loan principal to borrower'
    },
    {
      id: 'map_loan_payment',
      transaction_type: 'LOAN_PAYMENT',
      name: 'Loan Repayment (Principal)',
      debit_account_id: 'acc_1110', // Cash on Hand
      credit_account_id: 'acc_1210', // Loans Receivable - Regular
      description: 'Collection of loan installment principal'
    },
    {
      id: 'map_interest_income',
      transaction_type: 'INTEREST_INCOME',
      name: 'Loan Interest Collection',
      debit_account_id: 'acc_1110',
      credit_account_id: 'acc_4110', // Interest Income
      description: 'Interest portion of loan repayment'
    },
    {
      id: 'map_penalty_income',
      transaction_type: 'PENALTY_INCOME',
      name: 'Loan Penalty Collection',
      debit_account_id: 'acc_1110',
      credit_account_id: 'acc_4130', // Fines & Penalties
      description: 'Late payment fee collected'
    },
    {
      id: 'map_fee_income',
      transaction_type: 'FEE_INCOME',
      name: 'Service and Processing Fee Collection',
      debit_account_id: 'acc_1110',
      credit_account_id: 'acc_4120', // Service & Processing Fees
      description: 'Deducted or collected processing fees'
    },
    {
      id: 'map_savings_dep',
      transaction_type: 'SAVINGS_DEPOSIT',
      name: 'Member Savings Deposit',
      debit_account_id: 'acc_1110',
      credit_account_id: 'acc_2110', // Regular Savings Deposits
      description: 'Member deposits cash into savings account'
    },
    {
      id: 'map_savings_with',
      transaction_type: 'SAVINGS_WITHDRAWAL',
      name: 'Member Savings Withdrawal',
      debit_account_id: 'acc_2110',
      credit_account_id: 'acc_1110',
      description: 'Member withdraws cash from savings account'
    },
    {
      id: 'map_cbu_payment',
      transaction_type: 'SHARE_CAPITAL_PAYMENT',
      name: 'Share Capital Contribution (CBU)',
      debit_account_id: 'acc_1110',
      credit_account_id: 'acc_3110', // Common Share Capital
      description: 'Member adds capital build-up'
    },
    {
      id: 'map_expense',
      transaction_type: 'EXPENSE_PAYMENT',
      name: 'Operating Expense Payment',
      debit_account_id: 'acc_5220', // Office Supplies
      credit_account_id: 'acc_1110',
      description: 'Disbursement for operational expenditure'
    }
  ],

  numbering_formats: [
    { id: 'num_jv', module: 'Journal Voucher', prefix: 'JV', pattern: '{BRANCH}-JV-{YEAR}-{NUMBER}', length: 6, current_seq: 42 },
    { id: 'num_cd', module: 'Cash Disbursement', prefix: 'CD', pattern: '{BRANCH}-CD-{YEAR}-{NUMBER}', length: 6, current_seq: 38 },
    { id: 'num_or', module: 'Cash Receipt / OR', prefix: 'OR', pattern: '{BRANCH}-OR-{YEAR}-{NUMBER}', length: 6, current_seq: 154 },
    { id: 'num_ln', module: 'Loan Account', prefix: 'LN', pattern: 'LN-{YEAR}-{NUMBER}', length: 5, current_seq: 28 },
    { id: 'num_mem', module: 'Member Number', prefix: 'MEM', pattern: 'MEM-{YEAR}-{NUMBER}', length: 5, current_seq: 105 }
  ],

  approval_workflows: [
    {
      id: 'wf_loan_standard',
      name: 'Multi-Tier Loan Approval Workflow',
      module: 'Loans',
      description: 'Tiered loan approvals based on configurable principal thresholds',
      active: true
    },
    {
      id: 'wf_expense_standard',
      name: 'Operational Expense Approval',
      module: 'Expenses',
      description: 'Approval hierarchy for cash and bank disbursements',
      active: true
    }
  ],

  approval_rules: [
    {
      id: 'rule_loan_tier1',
      workflow_id: 'wf_loan_standard',
      level_name: 'Tier 1 - Express Micro Loan',
      minimum_amount: 0,
      maximum_amount: 50000,
      required_role: 'Loan Officer',
      required_approvals: 1,
      order: 1,
      active: true
    },
    {
      id: 'rule_loan_tier2',
      workflow_id: 'wf_loan_standard',
      level_name: 'Tier 2 - Branch Manager Approval',
      minimum_amount: 50000.01,
      maximum_amount: 150000,
      required_role: 'Branch Manager',
      required_approvals: 1,
      order: 2,
      active: true
    },
    {
      id: 'rule_loan_tier3',
      workflow_id: 'wf_loan_standard',
      level_name: 'Tier 3 - Credit Committee & Board',
      minimum_amount: 150000.01,
      maximum_amount: 10000000,
      required_role: 'Board of Directors',
      required_approvals: 2,
      order: 3,
      active: true
    }
  ],

  custom_fields: [
    {
      id: 'cf_occupation',
      entity: 'Member',
      field_name: 'occupation',
      field_label: 'Primary Occupation',
      field_type: 'Dropdown',
      options: ['Farmer / Fisherfolk', 'Government Employee', 'Private Employee', 'Self-Employed / Entrepreneur', 'OFW / Remittance Dependent', 'Professional', 'Retired'],
      required: true,
      default_value: 'Farmer / Fisherfolk',
      active: true
    },
    {
      id: 'cf_barangay',
      entity: 'Member',
      field_name: 'barangay',
      field_label: 'Barangay & Sitio',
      field_type: 'Text',
      options: [],
      required: true,
      default_value: '',
      active: true
    },
    {
      id: 'cf_monthly_income',
      entity: 'Member',
      field_name: 'monthly_income',
      field_label: 'Estimated Monthly Gross Income',
      field_type: 'Currency',
      options: [],
      required: false,
      default_value: '25000',
      active: true
    },
    {
      id: 'cf_tin_number',
      entity: 'Member',
      field_name: 'tin_number',
      field_label: 'Tax Identification No. (TIN)',
      field_type: 'Text',
      options: [],
      required: false,
      default_value: '',
      active: true
    },
    {
      id: 'cf_collateral_desc',
      entity: 'Loan',
      field_name: 'collateral_description',
      field_label: 'Collateral / Chattel Details',
      field_type: 'Text',
      options: [],
      required: false,
      default_value: '',
      active: true
    }
  ],

  member_types: [
    {
      id: 'mt_regular',
      code: 'REG',
      name: 'Regular Member',
      description: 'Fully entitled to vote, hold office, and access all loan facilities',
      membership_fee: 500,
      min_share_capital: 10000,
      savings_requirement: 1000,
      loan_eligibility: true,
      required_documents: ['Valid Government ID', 'Proof of Billing', '2x2 Photo', 'Pre-Membership Seminar (PMES) Certificate'],
      active: true
    },
    {
      id: 'mt_associate',
      code: 'ASC',
      name: 'Associate Member',
      description: 'Entitled to loan and savings services, non-voting',
      membership_fee: 300,
      min_share_capital: 3000,
      savings_requirement: 500,
      loan_eligibility: true,
      required_documents: ['Valid Government ID', 'Proof of Billing', '2x2 Photo'],
      active: true
    },
    {
      id: 'mt_youth',
      code: 'YTH',
      name: 'Youth Saver',
      description: 'Ages 7 to 17, laboratory cooperative savings',
      membership_fee: 100,
      min_share_capital: 500,
      savings_requirement: 200,
      loan_eligibility: false,
      required_documents: ['Birth Certificate', 'Parents Consent Form'],
      active: true
    }
  ],

  members: [
    {
      id: 'mem_001',
      member_no: 'MEM-2026-00001',
      branch_id: 'branch_tar',
      member_type_id: 'mt_regular',
      first_name: 'Danilo',
      last_name: 'Macaraeg',
      middle_name: 'Santos',
      gender: 'Male',
      birthdate: '1982-05-14',
      email: 'danilo.macaraeg@gmail.com',
      phone: '+63 917 555 1290',
      address: 'Brgy. San Vicente, Tarlac City',
      status: 'Active',
      joined_date: '2023-03-15',
      custom_field_values: {
        occupation: 'Farmer / Fisherfolk',
        barangay: 'San Vicente',
        monthly_income: '35000',
        tin_number: '189-223-901-000'
      }
    },
    {
      id: 'mem_002',
      member_no: 'MEM-2026-00002',
      branch_id: 'branch_tar',
      member_type_id: 'mt_regular',
      first_name: 'Maricel',
      last_name: 'Dizon',
      middle_name: 'Aquino',
      gender: 'Female',
      birthdate: '1988-11-22',
      email: 'maricel.dizon@yahoo.com',
      phone: '+63 928 441 8872',
      address: 'Brgy. Matatalaib, Tarlac City',
      status: 'Active',
      joined_date: '2024-01-10',
      custom_field_values: {
        occupation: 'Self-Employed / Entrepreneur',
        barangay: 'Matatalaib',
        monthly_income: '60000',
        tin_number: '241-778-100-000'
      }
    },
    {
      id: 'mem_003',
      member_no: 'MEM-2026-00003',
      branch_id: 'branch_urd',
      member_type_id: 'mt_associate',
      first_name: 'Arnel',
      last_name: 'Bautista',
      middle_name: 'Flores',
      gender: 'Male',
      birthdate: '1995-08-03',
      email: 'arnel.bautista@gmail.com',
      phone: '+63 939 123 4567',
      address: 'Brgy. Nancayasan, Urdaneta City',
      status: 'Active',
      joined_date: '2025-06-20',
      custom_field_values: {
        occupation: 'Government Employee',
        barangay: 'Nancayasan',
        monthly_income: '42000',
        tin_number: '312-990-441-000'
      }
    }
  ],

  loan_products: [
    {
      id: 'lp_regular',
      code: 'LP-REG',
      name: 'Regular Multi-Purpose Loan',
      description: 'Standard term loan for regular members with 10% annual diminishing balance',
      version: 1,
      min_amount: 10000,
      max_amount: 300000,
      annual_interest_rate: 10.0,
      interest_calculation_method: 'Diminishing Balance', // Flat Rate, Diminishing Balance, Simple Interest, Fixed Interest
      default_term_months: 12,
      payment_frequency: 'Monthly',
      grace_period_days: 5,
      processing_fee_percentage: 2.0,
      service_fee_fixed: 250,
      penalty_rule_id: 'pen_standard',
      collateral_required: false,
      guarantor_required: true,
      debit_account_id: 'acc_1210',
      required_documents: ['Valid Government ID', 'Payslip / Income Proof', 'Co-maker Agreement'],
      approval_workflow_id: 'wf_loan_standard',
      active: true,
      effective_from: '2025-01-01',
      effective_until: null
    },
    {
      id: 'lp_emergency',
      code: 'LP-EMG',
      name: 'Emergency Instant Relief Loan',
      description: 'Fast-approval medical or calamity loan with fixed low interest',
      version: 1,
      min_amount: 5000,
      max_amount: 30000,
      annual_interest_rate: 6.0,
      interest_calculation_method: 'Flat Rate',
      default_term_months: 6,
      payment_frequency: 'Semi-monthly',
      grace_period_days: 3,
      processing_fee_percentage: 1.0,
      service_fee_fixed: 100,
      penalty_rule_id: 'pen_standard',
      collateral_required: false,
      guarantor_required: false,
      debit_account_id: 'acc_1220',
      required_documents: ['Valid Government ID', 'Proof of Emergency / Hospital Slip'],
      approval_workflow_id: 'wf_loan_standard',
      active: true,
      effective_from: '2025-01-01',
      effective_until: null
    },
    {
      id: 'lp_agri',
      code: 'LP-AGR',
      name: 'Agricultural Crop Production Loan',
      description: 'Seasonal crop & fertilizer financing payable after harvest',
      version: 1,
      min_amount: 25000,
      max_amount: 250000,
      annual_interest_rate: 8.0,
      interest_calculation_method: 'Simple Interest',
      default_term_months: 6,
      payment_frequency: 'Quarterly',
      grace_period_days: 15,
      processing_fee_percentage: 1.5,
      service_fee_fixed: 300,
      penalty_rule_id: 'pen_standard',
      collateral_required: true,
      guarantor_required: true,
      debit_account_id: 'acc_1230',
      required_documents: ['Land Title / Tenancy Agreement', 'Barangay Certification', 'Co-maker ID'],
      approval_workflow_id: 'wf_loan_standard',
      active: true,
      effective_from: '2025-01-01',
      effective_until: null
    }
  ],

  loan_product_versions: [
    {
      id: 'lp_ver_reg_1',
      loan_product_id: 'lp_regular',
      version: 1,
      annual_interest_rate: 10.0,
      interest_calculation_method: 'Diminishing Balance',
      changed_at: '2025-01-01T00:00:00Z',
      changed_by: 'System Initializer',
      reason: 'Initial CDA compliance configuration'
    }
  ],

  loan_applications: [],

  loans: [
    {
      id: 'loan_001',
      loan_account_no: 'LN-2026-00010',
      member_id: 'mem_001',
      loan_product_id: 'lp_regular',
      product_version: 1,
      branch_id: 'branch_tar',
      principal_amount: 80000,
      annual_interest_rate: 10.0,
      interest_calculation_method: 'Diminishing Balance',
      term_months: 12,
      payment_frequency: 'Monthly',
      disbursement_date: '2026-01-15',
      first_due_date: '2026-02-15',
      maturity_date: '2027-01-15',
      processing_fee: 1600,
      service_fee: 250,
      net_disbursed: 78150,
      disbursed_from_cash_account_id: 'cash_01',
      status: 'Active', // Draft, Submitted, Approved, Released, Active, Fully Paid, Past Due
      current_balance: 67120.50,
      total_principal_paid: 12879.50,
      total_interest_paid: 1305.20,
      total_penalty_paid: 0,
      total_fees_paid: 1850,
      approved_by: 'Elena Rostro',
      approved_date: '2026-01-14'
    }
  ],

  loan_amortization_schedules: [
    {
      id: 'sched_01_01',
      loan_id: 'loan_001',
      installment_no: 1,
      due_date: '2026-02-15',
      principal: 6415.80,
      interest: 666.67,
      fee: 0,
      total_installment: 7082.47,
      principal_balance: 73584.20,
      paid_principal: 6415.80,
      paid_interest: 666.67,
      paid_penalty: 0,
      paid_date: '2026-02-14',
      status: 'Paid'
    },
    {
      id: 'sched_01_02',
      loan_id: 'loan_001',
      installment_no: 2,
      due_date: '2026-03-15',
      principal: 6463.70,
      interest: 613.20,
      fee: 0,
      total_installment: 7076.90,
      principal_balance: 67120.50,
      paid_principal: 6463.70,
      paid_interest: 613.20,
      paid_penalty: 0,
      paid_date: '2026-03-12',
      status: 'Paid'
    },
    {
      id: 'sched_01_03',
      loan_id: 'loan_001',
      installment_no: 3,
      due_date: '2026-04-15',
      principal: 6517.56,
      interest: 559.34,
      fee: 0,
      total_installment: 7076.90,
      principal_balance: 60602.94,
      paid_principal: 0,
      paid_interest: 0,
      paid_penalty: 0,
      paid_date: null,
      status: 'Unpaid'
    }
  ],

  loan_payments: [
    {
      id: 'pmt_001',
      receipt_no: 'TAR-OR-2026-000101',
      loan_id: 'loan_001',
      member_id: 'mem_001',
      payment_date: '2026-02-14',
      total_amount: 7082.47,
      cash_account_id: 'cash_01',
      received_by: 'Cashier Maria Gomez',
      journal_entry_id: 'jv_pmt_001'
    },
    {
      id: 'pmt_002',
      receipt_no: 'TAR-OR-2026-000128',
      loan_id: 'loan_001',
      member_id: 'mem_001',
      payment_date: '2026-03-12',
      total_amount: 7076.90,
      cash_account_id: 'cash_01',
      received_by: 'Cashier Maria Gomez',
      journal_entry_id: 'jv_pmt_002'
    }
  ],

  loan_payment_allocations: [
    {
      id: 'alloc_001',
      payment_id: 'pmt_001',
      loan_id: 'loan_001',
      penalty_amount: 0,
      interest_amount: 666.67,
      fee_amount: 0,
      principal_amount: 6415.80,
      allocation_order_applied: ['Penalty', 'Interest', 'Fees', 'Principal']
    },
    {
      id: 'alloc_002',
      payment_id: 'pmt_002',
      loan_id: 'loan_001',
      penalty_amount: 0,
      interest_amount: 613.20,
      fee_amount: 0,
      principal_amount: 6463.70,
      allocation_order_applied: ['Penalty', 'Interest', 'Fees', 'Principal']
    }
  ],

  savings_products: [
    {
      id: 'sp_regular',
      code: 'SAV-REG',
      name: 'Regular Savings Deposit',
      min_balance_to_earn_interest: 1000,
      annual_interest_rate: 2.0,
      interest_calculation_method: 'Average Daily Balance',
      withdrawal_limit_per_day: 50000,
      debit_account_id: 'acc_2110',
      active: true
    },
    {
      id: 'sp_time_deposit',
      code: 'TD-SPECIAL',
      name: 'High-Yield Time Deposit (1 Year)',
      min_balance_to_earn_interest: 20000,
      annual_interest_rate: 5.5,
      interest_calculation_method: 'Fixed Term Maturity',
      withdrawal_limit_per_day: 0, // Not withdrawable before maturity
      debit_account_id: 'acc_2120',
      active: true
    }
  ],

  savings_accounts: [
    {
      id: 'sa_001',
      account_number: 'SA-2026-0001',
      member_id: 'mem_001',
      savings_product_id: 'sp_regular',
      branch_id: 'branch_tar',
      balance: 14500.00,
      opened_date: '2024-01-15',
      status: 'Active'
    },
    {
      id: 'sa_002',
      account_number: 'SA-2026-0002',
      member_id: 'mem_002',
      savings_product_id: 'sp_regular',
      branch_id: 'branch_tar',
      balance: 38200.00,
      opened_date: '2024-02-10',
      status: 'Active'
    }
  ],

  savings_transactions: [
    {
      id: 'st_001',
      transaction_no: 'TAR-OR-2026-000085',
      savings_account_id: 'sa_001',
      member_id: 'mem_001',
      type: 'DEPOSIT',
      amount: 5000,
      balance_after: 14500,
      cash_account_id: 'cash_01',
      transaction_date: '2026-02-01',
      notes: 'Monthly regular savings deposit'
    }
  ],

  share_capital_settings: [
    {
      id: 'sc_setting_01',
      cooperative_id: 'coop_01',
      par_value_per_share: 100.0,
      min_subscription_shares: 100, // ₱10,000
      min_paid_up_shares: 25, // ₱2,500
      max_share_holding_percentage: 10.0, // Max 10% of total coop capital per CDA rule
      transfer_fee: 100.0,
      withdrawal_rule: 'Subject to Board approval and 30-day prior written notice',
      accounting_account_id: 'acc_3110'
    }
  ],

  share_capital_accounts: [
    {
      id: 'sca_001',
      account_number: 'CBU-2026-0001',
      member_id: 'mem_001',
      subscribed_shares: 150,
      subscribed_amount: 15000,
      paid_up_shares: 120,
      paid_up_amount: 12000,
      status: 'Active'
    },
    {
      id: 'sca_002',
      account_number: 'CBU-2026-0002',
      member_id: 'mem_002',
      subscribed_shares: 300,
      subscribed_amount: 30000,
      paid_up_shares: 250,
      paid_up_amount: 25000,
      status: 'Active'
    }
  ],

  share_capital_transactions: [
    {
      id: 'sct_001',
      receipt_no: 'TAR-OR-2026-000012',
      share_account_id: 'sca_001',
      member_id: 'mem_001',
      type: 'PAYMENT',
      shares: 20,
      amount: 2000,
      transaction_date: '2026-01-20',
      cash_account_id: 'cash_01'
    }
  ],

  cash_accounts: [
    {
      id: 'cash_01',
      name: 'Cash on Hand - Teller 1',
      account_number: 'COH-TAR-01',
      bank_name: 'Cash Vault Drawer',
      branch_id: 'branch_tar',
      gl_account_id: 'acc_1110',
      opening_balance: 100000,
      current_balance: 145890.47,
      currency: 'PHP',
      active: true
    },
    {
      id: 'cash_02',
      name: 'Main Vault Reserve',
      account_number: 'VLT-TAR-00',
      bank_name: 'Master Vault Safety Depository',
      branch_id: 'branch_tar',
      gl_account_id: 'acc_1110',
      opening_balance: 500000,
      current_balance: 500000,
      currency: 'PHP',
      active: true
    },
    {
      id: 'cash_03',
      name: 'Land Bank of the Philippines - Operating Checking',
      account_number: 'LBP-0912-3341-99',
      bank_name: 'Land Bank of the Philippines',
      branch_id: 'branch_tar',
      gl_account_id: 'acc_1120',
      opening_balance: 1250000,
      current_balance: 1250000,
      currency: 'PHP',
      active: true
    },
    {
      id: 'cash_04',
      name: 'Development Bank of the Philippines - High Yield',
      account_number: 'DBP-4401-2990-11',
      bank_name: 'Development Bank of the Philippines',
      branch_id: 'branch_tar',
      gl_account_id: 'acc_1121',
      opening_balance: 800000,
      current_balance: 800000,
      currency: 'PHP',
      active: true
    },
    {
      id: 'cash_05',
      name: 'Urdaneta Branch Teller Cash',
      account_number: 'COH-URD-01',
      bank_name: 'Cash Drawer Urdaneta',
      branch_id: 'branch_urd',
      gl_account_id: 'acc_1110',
      opening_balance: 150000,
      current_balance: 150000,
      currency: 'PHP',
      active: true
    }
  ],

  cash_transactions: [],

  fees: [
    {
      id: 'fee_proc',
      name: 'Loan Processing Fee',
      code: 'FEE-PROC',
      calculation_type: 'Percentage of Loan', // Fixed, Percentage of Loan, Percentage of Payment, Percentage of Principal
      fixed_amount: 0,
      percentage: 2.0,
      min_amount: 500,
      max_amount: 5000,
      applicable_module: 'Loans',
      accounting_account_id: 'acc_4120',
      active: true
    },
    {
      id: 'fee_serv',
      name: 'Service and Appraisal Charge',
      code: 'FEE-SERV',
      calculation_type: 'Fixed',
      fixed_amount: 250,
      percentage: 0,
      min_amount: 250,
      max_amount: 250,
      applicable_module: 'Loans',
      accounting_account_id: 'acc_4120',
      active: true
    },
    {
      id: 'fee_mem',
      name: 'Cooperative Membership Entrance Fee',
      code: 'FEE-MEMB',
      calculation_type: 'Fixed',
      fixed_amount: 500,
      percentage: 0,
      min_amount: 500,
      max_amount: 500,
      applicable_module: 'Members',
      accounting_account_id: 'acc_4210',
      active: true
    },
    {
      id: 'fee_late',
      name: 'Late Installment Administrative Fee',
      code: 'FEE-LATE',
      calculation_type: 'Fixed',
      fixed_amount: 150,
      percentage: 0,
      min_amount: 150,
      max_amount: 150,
      applicable_module: 'Loans',
      accounting_account_id: 'acc_4130',
      active: true
    }
  ],

  penalty_rules: [
    {
      id: 'pen_standard',
      name: 'Standard 2% Monthly Overdue Penalty',
      calculation_type: 'Percentage of overdue amount',
      grace_period_days: 5,
      rate: 2.0, // 2% per month
      calculation_frequency: 'Monthly',
      minimum_penalty: 50,
      maximum_penalty: 2500,
      accounting_account_id: 'acc_4130',
      active: true
    },
    {
      id: 'pen_daily_fixed',
      name: 'Daily Fixed Penalty (₱20/day)',
      calculation_type: 'Fixed amount',
      grace_period_days: 3,
      rate: 20.0,
      calculation_frequency: 'Daily',
      minimum_penalty: 20,
      maximum_penalty: 1000,
      accounting_account_id: 'acc_4130',
      active: true
    }
  ],

  payment_allocation_rules: [
    {
      id: 'par_default',
      name: 'Standard CDA Priority Allocation',
      priorities: [
        { priority: 1, component: 'Penalty', label: 'Penalties & Late Fines' },
        { priority: 2, component: 'Interest', label: 'Accrued Interest' },
        { priority: 3, component: 'Fees', label: 'Service & Other Fees' },
        { priority: 4, component: 'Principal', label: 'Loan Principal Balance' }
      ],
      is_default: true,
      active: true
    },
    {
      id: 'par_borrower_favorable',
      name: 'Principal-First Relief Allocation',
      priorities: [
        { priority: 1, component: 'Interest', label: 'Accrued Interest' },
        { priority: 2, component: 'Principal', label: 'Loan Principal Balance' },
        { priority: 3, component: 'Penalty', label: 'Penalties & Late Fines' },
        { priority: 4, component: 'Fees', label: 'Service & Other Fees' }
      ],
      is_default: false,
      active: true
    }
  ],

  payment_frequencies: [
    { id: 'pf_daily', name: 'Daily', days_interval: 1, installments_per_year: 365, is_custom: false },
    { id: 'pf_weekly', name: 'Weekly', days_interval: 7, installments_per_year: 52, is_custom: false },
    { id: 'pf_biweekly', name: 'Bi-weekly', days_interval: 14, installments_per_year: 26, is_custom: false },
    { id: 'pf_semimonthly', name: 'Semi-monthly (15th & 30th)', days_interval: 15, installments_per_year: 24, is_custom: false },
    { id: 'pf_monthly', name: 'Monthly', days_interval: 30, installments_per_year: 12, is_custom: false },
    { id: 'pf_quarterly', name: 'Quarterly', days_interval: 90, installments_per_year: 4, is_custom: false },
    { id: 'pf_semiannual', name: 'Semi-annually', days_interval: 180, installments_per_year: 2, is_custom: false },
    { id: 'pf_annual', name: 'Annually', days_interval: 365, installments_per_year: 1, is_custom: false }
  ],

  document_requirements: [
    { id: 'doc_id', name: 'Valid Government Issued Photo ID', code: 'DOC-ID', required_for: 'All Members', active: true },
    { id: 'doc_income', name: 'Proof of Income / 3 Months Payslip / ITR', code: 'DOC-INC', required_for: 'Borrowers', active: true },
    { id: 'doc_brgy', name: 'Barangay Clearance & Residency Certificate', code: 'DOC-BRGY', required_for: 'New Members', active: true },
    { id: 'doc_collateral', name: 'Original Title / OR-CR / Collateral Documents', code: 'DOC-COLL', required_for: 'Secured Loans', active: true },
    { id: 'doc_pmes', name: 'Pre-Membership Education Seminar Certificate', code: 'DOC-PMES', required_for: 'Regular Members', active: true }
  ],

  notification_rules: [
    {
      id: 'notif_past_due',
      trigger_event: 'Loan Becomes Past Due',
      recipient_roles: ['Loan Officer', 'Branch Manager'],
      channels: ['In-App System Notification', 'Email Digest'],
      message_template: 'Loan {loan_number} for member {member_name} is overdue by {days_overdue} days.',
      active: true
    },
    {
      id: 'notif_loan_approved',
      trigger_event: 'Loan Approved',
      recipient_roles: ['Cashier', 'Loan Officer'],
      channels: ['In-App System Notification'],
      message_template: 'Loan {loan_number} of ₱{amount} has been approved and is ready for disbursement.',
      active: true
    }
  ],

  transaction_types: [
    { id: 'tx_loan_rel', code: 'LOAN_RELEASE', name: 'Loan Release / Disbursement', module: 'Loans', requires_approval: true, numbering_format_id: 'num_cd', active: true },
    { id: 'tx_loan_pmt', code: 'LOAN_PAYMENT', name: 'Loan Repayment Installment', module: 'Loans', requires_approval: false, numbering_format_id: 'num_or', active: true },
    { id: 'tx_sav_dep', code: 'SAVINGS_DEPOSIT', name: 'Savings Deposit', module: 'Savings', requires_approval: false, numbering_format_id: 'num_or', active: true },
    { id: 'tx_sav_wit', code: 'SAVINGS_WITHDRAWAL', name: 'Savings Withdrawal', module: 'Savings', requires_approval: true, numbering_format_id: 'num_cd', active: true },
    { id: 'tx_cbu_pmt', code: 'SHARE_CAPITAL_PAYMENT', name: 'Share Capital Contribution', module: 'Share Capital', requires_approval: false, numbering_format_id: 'num_or', active: true },
    { id: 'tx_exp_pmt', code: 'EXPENSE_PAYMENT', name: 'Operational Expense Disbursement', module: 'Accounting', requires_approval: true, numbering_format_id: 'num_cd', active: true },
    { id: 'tx_open_bal', code: 'OPENING_BALANCE', name: 'Opening Balance Journal Entry', module: 'Accounting', requires_approval: true, numbering_format_id: 'num_jv', active: true }
  ],

  journal_entries: [
    {
      id: 'jv_open_2026',
      voucher_number: 'TAR-JV-2026-000001',
      branch_id: 'branch_tar',
      posting_date: '2026-01-01',
      reference_type: 'OPENING_BALANCE',
      reference_id: 'op_bal_01',
      description: 'Fiscal Year 2026 General Ledger Opening Balances',
      total_debit: 2650000,
      total_credit: 2650000,
      period_id: 'period_2026_01',
      status: 'Posted',
      created_by: 'Chief Accountant',
      posted_at: '2026-01-01T08:00:00Z'
    },
    {
      id: 'jv_loan_rel_01',
      voucher_number: 'TAR-CD-2026-000014',
      branch_id: 'branch_tar',
      posting_date: '2026-01-15',
      reference_type: 'LOAN_RELEASE',
      reference_id: 'loan_001',
      description: 'Release of Loan LN-2026-00010 Danilo Macaraeg less fees',
      total_debit: 80000,
      total_credit: 80000,
      period_id: 'period_2026_01',
      status: 'Posted',
      created_by: 'Chief Accountant',
      posted_at: '2026-01-15T10:30:00Z'
    },
    {
      id: 'jv_pmt_001',
      voucher_number: 'TAR-OR-2026-000101',
      branch_id: 'branch_tar',
      posting_date: '2026-02-14',
      reference_type: 'LOAN_PAYMENT',
      reference_id: 'pmt_001',
      description: 'Loan payment LN-2026-00010 installment 1 Danilo Macaraeg',
      total_debit: 7082.47,
      total_credit: 7082.47,
      period_id: 'period_2026_02',
      status: 'Posted',
      created_by: 'Cashier Maria Gomez',
      posted_at: '2026-02-14T11:15:00Z'
    },
    {
      id: 'jv_pmt_002',
      voucher_number: 'TAR-OR-2026-000128',
      branch_id: 'branch_tar',
      posting_date: '2026-03-12',
      reference_type: 'LOAN_PAYMENT',
      reference_id: 'pmt_002',
      description: 'Loan payment LN-2026-00010 installment 2 Danilo Macaraeg',
      total_debit: 7076.90,
      total_credit: 7076.90,
      period_id: 'period_2026_03',
      status: 'Posted',
      created_by: 'Cashier Maria Gomez',
      posted_at: '2026-03-12T14:40:00Z'
    }
  ],

  journal_lines: [
    // Opening balance lines
    { id: 'jl_01', journal_entry_id: 'jv_open_2026', account_id: 'acc_1110', debit: 600000, credit: 0, subsidiary_type: null, subsidiary_id: null },
    { id: 'jl_02', journal_entry_id: 'jv_open_2026', account_id: 'acc_1120', debit: 1250000, credit: 0, subsidiary_type: null, subsidiary_id: null },
    { id: 'jl_03', journal_entry_id: 'jv_open_2026', account_id: 'acc_1121', debit: 800000, credit: 0, subsidiary_type: null, subsidiary_id: null },
    { id: 'jl_04', journal_entry_id: 'jv_open_2026', account_id: 'acc_2110', debit: 0, credit: 47700, subsidiary_type: null, subsidiary_id: null },
    { id: 'jl_05', journal_entry_id: 'jv_open_2026', account_id: 'acc_3110', debit: 0, credit: 35000, subsidiary_type: null, subsidiary_id: null },
    { id: 'jl_06', journal_entry_id: 'jv_open_2026', account_id: 'acc_3210', debit: 0, credit: 200000, subsidiary_type: null, subsidiary_id: null },
    { id: 'jl_07', journal_entry_id: 'jv_open_2026', account_id: 'acc_3900', debit: 0, credit: 2367300, subsidiary_type: null, subsidiary_id: null },

    // Loan release lines
    { id: 'jl_10', journal_entry_id: 'jv_loan_rel_01', account_id: 'acc_1210', debit: 80000, credit: 0, subsidiary_type: 'Loan', subsidiary_id: 'loan_001' },
    { id: 'jl_11', journal_entry_id: 'jv_loan_rel_01', account_id: 'acc_1110', debit: 0, credit: 78150, subsidiary_type: 'Cash', subsidiary_id: 'cash_01' },
    { id: 'jl_12', journal_entry_id: 'jv_loan_rel_01', account_id: 'acc_4120', debit: 0, credit: 1850, subsidiary_type: null, subsidiary_id: null }, // fees deducted

    // Loan payment 1 lines
    { id: 'jl_20', journal_entry_id: 'jv_pmt_001', account_id: 'acc_1110', debit: 7082.47, credit: 0, subsidiary_type: 'Cash', subsidiary_id: 'cash_01' },
    { id: 'jl_21', journal_entry_id: 'jv_pmt_001', account_id: 'acc_1210', debit: 0, credit: 6415.80, subsidiary_type: 'Loan', subsidiary_id: 'loan_001' },
    { id: 'jl_22', journal_entry_id: 'jv_pmt_001', account_id: 'acc_4110', debit: 0, credit: 666.67, subsidiary_type: null, subsidiary_id: null },

    // Loan payment 2 lines
    { id: 'jl_30', journal_entry_id: 'jv_pmt_002', account_id: 'acc_1110', debit: 7076.90, credit: 0, subsidiary_type: 'Cash', subsidiary_id: 'cash_01' },
    { id: 'jl_31', journal_entry_id: 'jv_pmt_002', account_id: 'acc_1210', debit: 0, credit: 6463.70, subsidiary_type: 'Loan', subsidiary_id: 'loan_001' },
    { id: 'jl_32', journal_entry_id: 'jv_pmt_002', account_id: 'acc_4110', debit: 0, credit: 613.20, subsidiary_type: null, subsidiary_id: null }
  ],

  general_ledger: [],

  configuration_audit_trails: [
    {
      id: 'audit_init_01',
      setting: 'System Initialization',
      old_value: 'None',
      new_value: 'CoopFlex Core Active',
      changed_by: 'System Administrator',
      created_at: '2026-01-01T00:00:00Z',
      reason: 'Initial system deployment and cooperative setup'
    }
  ],

  user_roles: [
    {
      id: 'role_admin',
      name: 'System Administrator',
      description: 'Unrestricted access to all configuration centers, modules, and audits',
      permissions: [
        'configuration.view', 'configuration.create', 'configuration.edit', 'configuration.approve', 'configuration.publish',
        'loan.view', 'loan.create', 'loan.edit', 'loan.approve', 'loan.release', 'loan.reverse',
        'journal.view', 'journal.create', 'journal.approve', 'journal.post', 'journal.reverse',
        'cash_receipt.create', 'cash_disbursement.create',
        'member.view', 'member.create', 'member.edit',
        'period.close', 'period.reopen',
        'reports.view', 'reports.export'
      ]
    },
    {
      id: 'role_manager',
      name: 'Branch Manager',
      description: 'Manages branch operations, approves loans, reviews financial reports',
      permissions: [
        'configuration.view',
        'loan.view', 'loan.approve', 'loan.release',
        'journal.view', 'journal.approve',
        'member.view', 'member.create',
        'reports.view', 'reports.export'
      ]
    },
    {
      id: 'role_accountant',
      name: 'Chief Accountant',
      description: 'Maintains Chart of Accounts, validates journals, closes periods, and builds reports',
      permissions: [
        'configuration.view', 'configuration.edit',
        'journal.view', 'journal.create', 'journal.approve', 'journal.post',
        'period.close', 'period.reopen',
        'reports.view', 'reports.export'
      ]
    },
    {
      id: 'role_loan_officer',
      name: 'Loan Officer',
      description: 'Processes loan applications, conducts credit evaluation',
      permissions: [
        'loan.view', 'loan.create', 'loan.edit',
        'member.view', 'member.create'
      ]
    },
    {
      id: 'role_cashier',
      name: 'Cashier / Teller',
      description: 'Receives payments, issues receipts, handles cash disbursements',
      permissions: [
        'cash_receipt.create', 'cash_disbursement.create',
        'loan.view', 'member.view'
      ]
    }
  ],

  users: [
    { id: 'usr_admin', name: 'Maria Rodriguez', username: 'admin', role_id: 'role_admin', role_name: 'System Administrator', branch_id: 'branch_tar' },
    { id: 'usr_manager', name: 'Elena Rostro', username: 'manager', role_id: 'role_manager', role_name: 'Branch Manager', branch_id: 'branch_tar' },
    { id: 'usr_accountant', name: 'Arturo Santos', username: 'accountant', role_id: 'role_accountant', role_name: 'Chief Accountant', branch_id: 'branch_tar' },
    { id: 'usr_loan_officer', name: 'Jose Mendoza', username: 'loanofficer', role_id: 'role_loan_officer', role_name: 'Loan Officer', branch_id: 'branch_tar' },
    { id: 'usr_cashier', name: 'Maria Gomez', username: 'cashier', role_id: 'role_cashier', role_name: 'Cashier / Teller', branch_id: 'branch_tar' }
  ]
};
