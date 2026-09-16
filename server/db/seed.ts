import { DatabaseSchema } from './database';

export const initialSeedData: DatabaseSchema = {
  cooperatives: [
    {
      id: 'coop_01',
      name: 'Mayap Care Agriculture Coop.',
      registration_no: 'CDA-REG-9502-100234',
      tax_identification_number: '005-891-234-000',
      address: 'Poblacion Plaza, Tarlac City, Philippines',
      email: 'admin@mayapcare.coop',
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
    { key: 'cooperative_name', value: 'Mayap Care Agriculture Coop.', category: 'Cooperative' },
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
    { id: 'acc_1100', account_code: '1100', code: '1100', name: 'Cash and Cash Equivalents', category: 'Asset', type: 'Asset', report_group: 'Current Assets', normal_balance: 'Debit', is_active: true, active: true, parent_account_id: null, parent_id: null, description: 'Summary control account for all cash drawers, vaults, and bank repositories', is_control: true, has_subsidiary: false },
    { id: 'acc_1110', account_code: '1110', code: '1110', name: 'Cash on Hand - Tellers', category: 'Asset', type: 'Asset', report_group: 'Current Assets', normal_balance: 'Debit', is_active: true, active: true, parent_account_id: 'acc_1100', parent_id: 'acc_1100', description: 'Petty cash and daily cashier vault drawers', is_control: false, has_subsidiary: true },
    { id: 'acc_1111', account_code: '1111', code: '1111', name: 'Petty Cash Fund', category: 'Asset', type: 'Asset', report_group: 'Current Assets', normal_balance: 'Debit', is_active: true, active: true, parent_account_id: 'acc_1100', parent_id: 'acc_1100', description: 'Revolving petty cash fund for minor branch expenditures', is_control: false, has_subsidiary: false },
    { id: 'acc_1120', account_code: '1120', code: '1120', name: 'Cash in Bank - Land Bank of the Philippines', category: 'Asset', type: 'Asset', report_group: 'Current Assets', normal_balance: 'Debit', is_active: true, active: true, parent_account_id: 'acc_1100', parent_id: 'acc_1100', description: 'LBP primary operating clearing depository', is_control: false, has_subsidiary: true },
    { id: 'acc_1121', account_code: '1121', code: '1121', name: 'Cash in Bank - Development Bank of the Philippines', category: 'Asset', type: 'Asset', report_group: 'Current Assets', normal_balance: 'Debit', is_active: true, active: true, parent_account_id: 'acc_1100', parent_id: 'acc_1100', description: 'DBP high-yield special reserve depository', is_control: false, has_subsidiary: true },
    { id: 'acc_1200', account_code: '1200', code: '1200', name: 'Loans Receivable - Control', category: 'Asset', type: 'Asset', report_group: 'Loans and Receivables', normal_balance: 'Debit', is_active: true, active: true, parent_account_id: null, parent_id: null, description: 'Aggregate control account for all active member loan facilities', is_control: true, has_subsidiary: true },
    { id: 'acc_1210', account_code: '1210', code: '1210', name: 'Loans Receivable - Regular Multi-Purpose', category: 'Asset', type: 'Asset', report_group: 'Loans and Receivables', normal_balance: 'Debit', is_active: true, active: true, parent_account_id: 'acc_1200', parent_id: 'acc_1200', description: 'Principal balance of outstanding member multi-purpose loans', is_control: false, has_subsidiary: true },
    { id: 'acc_1220', account_code: '1220', code: '1220', name: 'Loans Receivable - Emergency Micro-Loans', category: 'Asset', type: 'Asset', report_group: 'Loans and Receivables', normal_balance: 'Debit', is_active: true, active: true, parent_account_id: 'acc_1200', parent_id: 'acc_1200', description: 'Emergency calamity and express medical credit lines', is_control: false, has_subsidiary: true },
    { id: 'acc_1230', account_code: '1230', code: '1230', name: 'Loans Receivable - Agricultural Crop Financing', category: 'Asset', type: 'Asset', report_group: 'Loans and Receivables', normal_balance: 'Debit', is_active: true, active: true, parent_account_id: 'acc_1200', parent_id: 'acc_1200', description: 'Seasonal crop inputs, fertilizer, and agricultural financing', is_control: false, has_subsidiary: true },
    { id: 'acc_1240', account_code: '1240', code: '1240', name: 'Loans Receivable - Business Micro', category: 'Asset', type: 'Asset', report_group: 'Loans and Receivables', normal_balance: 'Debit', is_active: true, active: true, parent_account_id: 'acc_1200', parent_id: 'acc_1200', description: 'Small business enterprise working capital financing', is_control: false, has_subsidiary: true },
    { id: 'acc_1290', account_code: '1290', code: '1290', name: 'Allowance for Probable Loan Losses', category: 'Asset', type: 'Asset', report_group: 'Contra-Asset', normal_balance: 'Credit', is_active: true, active: true, parent_account_id: 'acc_1200', parent_id: 'acc_1200', description: 'Provision for PAR and non-performing loan impairments', is_control: false, has_subsidiary: false },
    { id: 'acc_1310', account_code: '1310', code: '1310', name: 'Interest Receivable on Loans', category: 'Asset', type: 'Asset', report_group: 'Receivables', normal_balance: 'Debit', is_active: true, active: true, parent_account_id: null, parent_id: null, description: 'Accrued but uncollected loan installment interest', is_control: false, has_subsidiary: true },
    { id: 'acc_1510', account_code: '1510', code: '1510', name: 'Office & IT Equipment', category: 'Asset', type: 'Asset', report_group: 'Property, Plant & Equipment', normal_balance: 'Debit', is_active: true, active: true, parent_account_id: null, parent_id: null, description: 'Servers, teller terminals, and office workstations', is_control: false, has_subsidiary: false },
    { id: 'acc_1590', account_code: '1590', code: '1590', name: 'Accumulated Depreciation - Office Equipment', category: 'Asset', type: 'Asset', report_group: 'Contra-Asset', normal_balance: 'Credit', is_active: true, active: true, parent_account_id: null, parent_id: null, description: 'Depreciation reserve on operational equipment', is_control: false, has_subsidiary: false },
    
    // Liabilities
    { id: 'acc_2100', account_code: '2100', code: '2100', name: 'Deposit Liabilities', category: 'Liability', type: 'Liability', report_group: 'Deposit Liabilities', normal_balance: 'Credit', is_active: true, active: true, parent_account_id: null, parent_id: null, description: 'Control account for all member demand and term deposit liabilities', is_control: true, has_subsidiary: true },
    { id: 'acc_2110', account_code: '2110', code: '2110', name: 'Savings Deposits - Regular', category: 'Liability', type: 'Liability', report_group: 'Deposit Liabilities', normal_balance: 'Credit', is_active: true, active: true, parent_account_id: 'acc_2100', parent_id: 'acc_2100', description: 'Withdrawable member deposit savings balances', is_control: false, has_subsidiary: true },
    { id: 'acc_2120', account_code: '2120', code: '2120', name: 'Time Deposits - High Yield', category: 'Liability', type: 'Liability', report_group: 'Deposit Liabilities', normal_balance: 'Credit', is_active: true, active: true, parent_account_id: 'acc_2100', parent_id: 'acc_2100', description: 'Fixed-term high-yield member placements', is_control: false, has_subsidiary: true },
    { id: 'acc_2210', account_code: '2210', code: '2210', name: 'Accounts Payable & Accrued Expenses', category: 'Liability', type: 'Liability', report_group: 'Current Liabilities', normal_balance: 'Credit', is_active: true, active: true, parent_account_id: null, parent_id: null, description: 'Supplier payables and operational vendor balances', is_control: false, has_subsidiary: false },
    { id: 'acc_2220', account_code: '2220', code: '2220', name: 'Interest Payable on Deposits', category: 'Liability', type: 'Liability', report_group: 'Current Liabilities', normal_balance: 'Credit', is_active: true, active: true, parent_account_id: null, parent_id: null, description: 'Accrued interest payable to member savings deposits', is_control: false, has_subsidiary: false },

    // Equity
    { id: 'acc_3100', account_code: '3100', code: '3100', name: 'Members Equity & Share Capital', category: 'Equity', type: 'Equity', report_group: 'Share Capital', normal_balance: 'Credit', is_active: true, active: true, parent_account_id: null, parent_id: null, description: 'Summary control account for subscribed and paid-up share capital', is_control: true, has_subsidiary: true },
    { id: 'acc_3110', account_code: '3110', code: '3110', name: 'Paid-Up Share Capital - Common (Voting)', category: 'Equity', type: 'Equity', report_group: 'Share Capital', normal_balance: 'Credit', is_active: true, active: true, parent_account_id: 'acc_3100', parent_id: 'acc_3100', description: 'Member common share capital subscribed and paid', is_control: false, has_subsidiary: true },
    { id: 'acc_3120', account_code: '3120', code: '3120', name: 'Paid-Up Share Capital - Preferred (Non-Voting)', category: 'Equity', type: 'Equity', report_group: 'Share Capital', normal_balance: 'Credit', is_active: true, active: true, parent_account_id: 'acc_3100', parent_id: 'acc_3100', description: 'Associate member preferred non-voting equity', is_control: false, has_subsidiary: true },
    { id: 'acc_3210', account_code: '3210', code: '3210', name: 'Statutory Reserve Fund (General)', category: 'Equity', type: 'Equity', report_group: 'Statutory Reserves', normal_balance: 'Credit', is_active: true, active: true, parent_account_id: null, parent_id: null, description: 'Mandatory 10% statutory reserve mandated by CDA', is_control: false, has_subsidiary: false },
    { id: 'acc_3220', account_code: '3220', code: '3220', name: 'Coop Education & Training Fund (CETF)', category: 'Equity', type: 'Equity', report_group: 'Statutory Reserves', normal_balance: 'Credit', is_active: true, active: true, parent_account_id: null, parent_id: null, description: 'Mandatory educational reserve (5% localized, 5% apex federation)', is_control: false, has_subsidiary: false },
    { id: 'acc_3230', account_code: '3230', code: '3230', name: 'Community Development Fund', category: 'Equity', type: 'Equity', report_group: 'Statutory Reserves', normal_balance: 'Credit', is_active: true, active: true, parent_account_id: null, parent_id: null, description: 'Mandatory 3% social community outreach fund', is_control: false, has_subsidiary: false },
    { id: 'acc_3240', account_code: '3240', code: '3240', name: 'Optional Reserve Fund', category: 'Equity', type: 'Equity', report_group: 'Statutory Reserves', normal_balance: 'Credit', is_active: true, active: true, parent_account_id: null, parent_id: null, description: 'Discretionary cooperative stability and building fund', is_control: false, has_subsidiary: false },
    { id: 'acc_3900', account_code: '3900', code: '3900', name: 'Undivided Net Surplus / Retained Earnings', category: 'Equity', type: 'Equity', report_group: 'Equity Surplus', normal_balance: 'Credit', is_active: true, active: true, parent_account_id: null, parent_id: null, description: 'Cumulative operating surplus available for dividend allocation', is_control: false, has_subsidiary: false },

    // Revenue / Income
    { id: 'acc_4110', account_code: '4110', code: '4110', name: 'Interest Income from Loans', category: 'Revenue', type: 'Income', report_group: 'Operating Revenue', normal_balance: 'Credit', is_active: true, active: true, parent_account_id: null, parent_id: null, description: 'Earned interest collected on member loan disbursements', is_control: false, has_subsidiary: false },
    { id: 'acc_4120', account_code: '4120', code: '4120', name: 'Service & Processing Fees', category: 'Revenue', type: 'Income', report_group: 'Operating Revenue', normal_balance: 'Credit', is_active: true, active: true, parent_account_id: null, parent_id: null, description: 'Loan origination, filing, and notarial service fees', is_control: false, has_subsidiary: false },
    { id: 'acc_4130', account_code: '4130', code: '4130', name: 'Fines & Late Payment Penalties', category: 'Revenue', type: 'Income', report_group: 'Operating Revenue', normal_balance: 'Credit', is_active: true, active: true, parent_account_id: null, parent_id: null, description: 'Default penalty charges assessed on delinquent installments', is_control: false, has_subsidiary: false },
    { id: 'acc_4140', account_code: '4140', code: '4140', name: 'Membership & Admission Fees', category: 'Revenue', type: 'Income', report_group: 'Operating Revenue', normal_balance: 'Credit', is_active: true, active: true, parent_account_id: null, parent_id: null, description: 'Non-refundable membership application and seminar fees', is_control: false, has_subsidiary: false },
    { id: 'acc_4210', account_code: '4210', code: '4210', name: 'Membership Fees Income', category: 'Revenue', type: 'Income', report_group: 'Operating Revenue', normal_balance: 'Credit', is_active: true, active: true, parent_account_id: null, parent_id: null, description: 'General membership registration income', is_control: false, has_subsidiary: false },

    // Expenses
    { id: 'acc_5110', account_code: '5110', code: '5110', name: 'Interest Expense on Savings Deposits', category: 'Expense', type: 'Expense', report_group: 'Financial Expenses', normal_balance: 'Debit', is_active: true, active: true, parent_account_id: null, parent_id: null, description: 'Annual dividend and monthly interest yield distributed on deposits', is_control: false, has_subsidiary: false },
    { id: 'acc_5210', account_code: '5210', code: '5210', name: 'Salaries, Wages & Employee Benefits', category: 'Expense', type: 'Expense', report_group: 'Administrative Expenses', normal_balance: 'Debit', is_active: true, active: true, parent_account_id: null, parent_id: null, description: 'Staff compensation, 13th month pay, and personnel allowances', is_control: false, has_subsidiary: false },
    { id: 'acc_5220', account_code: '5220', code: '5220', name: 'Office Supplies, Utilities & Communication', category: 'Expense', type: 'Expense', report_group: 'Administrative Expenses', normal_balance: 'Debit', is_active: true, active: true, parent_account_id: null, parent_id: null, description: 'Electric, water, telecommunications, and stationery expenses', is_control: false, has_subsidiary: false },
    { id: 'acc_5230', account_code: '5230', code: '5230', name: 'Rent, Power & Utilities', category: 'Expense', type: 'Expense', report_group: 'Administrative Expenses', normal_balance: 'Debit', is_active: true, active: true, parent_account_id: null, parent_id: null, description: 'Branch premise lease rentals and utility services', is_control: false, has_subsidiary: false },
    { id: 'acc_5290', account_code: '5290', code: '5290', name: 'Provision for Loan Losses', category: 'Expense', type: 'Expense', report_group: 'Credit Losses', normal_balance: 'Debit', is_active: true, active: true, parent_account_id: null, parent_id: null, description: 'Expense entry provisioning reserve for doubtful loan accounts', is_control: false, has_subsidiary: false }
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
      id: 'mem_sample_01',
      member_no: 'MB-2026-0001',
      branch_id: 'branch_tar',
      branch_name: 'Tarlac Main Branch',
      member_type_id: 'mt_regular',
      member_type_name: 'Regular Agricultural Member',
      first_name: 'Juan',
      middle_name: 'Dela',
      last_name: 'Cruz',
      gender: 'Male',
      birthdate: '1982-06-15',
      phone: '+63 917 555 1234',
      email: 'juan.delacruz@tar-agri.ph',
      address: 'Poblacion, Victoria, Tarlac',
      custom_field_values: { farm_hectares: 3.5, primary_crop: 'Rice & Corn' },
      joined_date: '2026-01-10',
      active: true
    },
    {
      id: 'mem_sample_02',
      member_no: 'MB-2026-0002',
      branch_id: 'branch_tar',
      branch_name: 'Tarlac Main Branch',
      member_type_id: 'mt_regular',
      member_type_name: 'Regular Agricultural Member',
      first_name: 'Maria',
      middle_name: 'Santos',
      last_name: 'Reyes',
      gender: 'Female',
      birthdate: '1988-11-22',
      phone: '+63 920 444 8899',
      email: 'maria.reyes@organic-farm.ph',
      address: 'Brgy. San Vicente, Tarlac City',
      custom_field_values: { farm_hectares: 2.0, primary_crop: 'Organic Vegetables' },
      joined_date: '2026-01-15',
      active: true
    },
    {
      id: 'mem_sample_03',
      member_no: 'MB-2026-0003',
      branch_id: 'branch_ger',
      branch_name: 'Gerona Extension Office',
      member_type_id: 'mt_associate',
      member_type_name: 'Associate Micro-Entrepreneur',
      first_name: 'Rodrigo',
      middle_name: 'Bautista',
      last_name: 'Mendoza',
      gender: 'Male',
      birthdate: '1990-03-08',
      phone: '+63 918 222 3344',
      email: 'rodrigo.mendoza@agri-supply.ph',
      address: 'Brgy. Danzo, Gerona, Tarlac',
      custom_field_values: { business_nature: 'Agri-Farm Supplies' },
      joined_date: '2026-02-01',
      active: true
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

  loans: [],

  loan_amortization_schedules: [],

  loan_payments: [],

  loan_payment_allocations: [],

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

  savings_accounts: [],

  savings_transactions: [],

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

  share_capital_accounts: [],

  share_capital_transactions: [],

  cash_accounts: [
    {
      id: 'cash_01',
      name: 'Cash on Hand - Teller 1 (Tarlac)',
      account_number: 'COH-TAR-01',
      bank_name: 'Cash Vault Drawer 1',
      branch_id: 'branch_tar',
      gl_account_id: 'acc_1110',
      opening_balance: 250000,
      current_balance: 250000,
      currency: 'PHP',
      active: true
    },
    {
      id: 'cash_02',
      name: 'Main Vault Reserve (Tarlac Clearing)',
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
      opening_balance: 500000,
      current_balance: 500000,
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
      opening_balance: 500000,
      current_balance: 500000,
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
    },
    {
      id: 'cash_vault_urd',
      name: 'Urdaneta Branch Cash Vault Reserve',
      account_number: 'VLT-URD-00',
      bank_name: 'Urdaneta Branch Vault Safe',
      branch_id: 'branch_urd',
      gl_account_id: 'acc_1110',
      opening_balance: 250000,
      current_balance: 250000,
      currency: 'PHP',
      active: true
    },
    {
      id: 'cash_06',
      name: 'San Fernando Branch Teller Cash',
      account_number: 'COH-SFE-01',
      bank_name: 'Cash Drawer San Fernando',
      branch_id: 'branch_sfe',
      gl_account_id: 'acc_1110',
      opening_balance: 150000,
      current_balance: 150000,
      currency: 'PHP',
      active: true
    },
    {
      id: 'cash_vault_sfe',
      name: 'San Fernando Branch Cash Vault Reserve',
      account_number: 'VLT-SFE-00',
      bank_name: 'San Fernando Branch Vault Safe',
      branch_id: 'branch_sfe',
      gl_account_id: 'acc_1110',
      opening_balance: 250000,
      current_balance: 250000,
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

  journal_entries: [],

  journal_lines: [],

  general_ledger: [],

  configuration_audit_trails: [],

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
