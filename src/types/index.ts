export interface Cooperative {
  id: string;
  name: string;
  registration_no: string;
  tax_identification_number: string;
  address: string;
  email: string;
  phone: string;
  currency: string;
  currency_symbol: string;
  decimal_places: number;
  thousands_separator: string;
  decimal_separator: string;
  fiscal_year_start: string;
  fiscal_year_end: string;
}

export interface Branch {
  id: string;
  cooperative_id: string;
  code: string;
  name: string;
  address: string;
  phone: string;
  manager_name: string;
  active: boolean;
}

export interface SystemSetting {
  key: string;
  value: string;
  category: string;
}

export interface FeatureToggle {
  id: string;
  key: string;
  name: string;
  description: string;
  enabled: boolean;
}

export interface Account {
  id: string;
  account_code: string;
  code?: string; // compatibility alias for account_code
  name: string;
  category: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense' | string;
  type?: 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Revenue' | 'Expense' | string; // compatibility alias
  report_group: string;
  normal_balance: 'Debit' | 'Credit';
  parent_account_id?: string | null;
  parent_id?: string | null; // compatibility alias
  description?: string | null;
  is_active?: boolean;
  active?: boolean; // compatibility alias
  is_control?: boolean;
  has_subsidiary?: boolean;
  created_at?: string;
}

export interface AccountingMapping {
  id: string;
  transaction_type: string;
  name: string;
  debit_account_id: string;
  credit_account_id: string;
  description: string;
}

export interface AccountingPeriod {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: 'Open' | 'Closed';
  closed_at: string | null;
  closed_by: string | null;
}

export interface NumberingFormat {
  id: string;
  module: string;
  prefix: string;
  pattern: string;
  length: number;
  current_seq: number;
}

export interface ApprovalWorkflow {
  id: string;
  name: string;
  module: string;
  description: string;
  active: boolean;
}

export interface ApprovalRule {
  id: string;
  workflow_id: string;
  level_name: string;
  minimum_amount: number;
  maximum_amount: number;
  required_role: string;
  required_approvals: number;
  order: number;
  active: boolean;
}

export interface CustomField {
  id: string;
  entity: 'Member' | 'Loan';
  field_name?: string;
  field_key?: string;
  field_label?: string;
  label?: string;
  field_type: 'Text' | 'Number' | 'Date' | 'Dropdown' | 'Radio' | 'Checkbox' | 'Currency' | 'Phone' | 'Email';
  options: string[];
  required: boolean;
  default_value: string;
  active: boolean;
}

export interface MemberType {
  id: string;
  code: string;
  name: string;
  description: string;
  membership_fee: number;
  min_share_capital: number;
  savings_requirement: number;
  loan_eligibility: boolean;
  required_documents: string[];
  active: boolean;
}

export interface Member {
  id: string;
  member_no: string;
  branch_id: string;
  branch_name?: string;
  member_type_id: string;
  member_type_name?: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  gender: string;
  birthdate: string;
  email: string;
  phone: string;
  address: string;
  status: string;
  joined_date: string;
  custom_field_values: Record<string, any>;
}

export interface LoanProduct {
  id: string;
  code: string;
  name: string;
  description: string;
  version: number;
  min_amount: number;
  max_amount: number;
  min_term_months?: number;
  max_term_months?: number;
  annual_interest_rate: number;
  interest_calculation_method: string;
  default_term_months: number;
  payment_frequency: string;
  grace_period_days: number;
  processing_fee_percentage: number;
  penalty_rate_percentage?: number;
  service_fee_fixed: number;
  penalty_rule_id: string;
  collateral_required: boolean;
  guarantor_required: boolean;
  debit_account_id: string;
  gl_receivable_account_id?: string;
  gl_interest_income_account_id?: string;
  required_documents: string[];
  approval_workflow_id: string;
  active: boolean;
  effective_from: string;
  effective_until: string | null;
}

export interface LoanApplication {
  id: string;
  application_no: string;
  member_id: string;
  member_name?: string;
  member_no?: string;
  loan_product_id: string;
  loan_product_name?: string;
  loan_product_code?: string;
  product_name?: string;
  branch_id: string;
  branch_name?: string;
  applied_amount: number;
  term_months: number;
  purpose?: string | null;
  status: 'Pending' | 'Draft' | 'Submitted' | 'Under Review' | 'Approved' | 'Rejected' | 'Released';
  submitted_date?: string | null;
  reviewed_by?: string | null;
  reviewed_date?: string | null;
  approved_amount?: number | null;
  remarks?: string | null;
  created_at?: string;
}

export interface Loan {
  id: string;
  loan_account_no: string;
  member_id: string;
  member_name?: string;
  member_no?: string;
  loan_product_id: string;
  product_name?: string;
  product_version: number;
  branch_id: string;
  branch_name?: string;
  principal_amount: number;
  annual_interest_rate: number;
  interest_calculation_method: string;
  term_months: number;
  payment_frequency: string;
  disbursement_date: string;
  first_due_date: string;
  maturity_date: string;
  processing_fee: number;
  service_fee: number;
  net_disbursed: number;
  status: 'Draft' | 'Submitted' | 'Pending' | 'Under Review' | 'Approved' | 'Rejected' | 'Released' | 'Active' | 'Past Due' | 'Fully Paid';
  current_balance: number;
  total_principal_paid: number;
  total_interest_paid: number;
  total_penalty_paid: number;
  total_fees_paid: number;
  approved_by?: string;
}

export interface SavingsProduct {
  id: string;
  code: string;
  name: string;
  min_balance_to_earn_interest: number;
  annual_interest_rate: number;
  interest_calculation_method: string;
  withdrawal_limit_per_day: number;
  debit_account_id: string;
  active: boolean;
}

export interface SavingsAccount {
  id: string;
  account_number: string;
  member_id: string;
  member_name?: string;
  savings_product_id: string;
  product_name?: string;
  branch_id: string;
  balance: number;
  opened_date: string;
  status: string;
}

export interface ShareCapitalAccount {
  id: string;
  account_number: string;
  member_id: string;
  member_name?: string;
  branch_id?: string;
  branch_name?: string;
  par_value?: number;
  subscribed_shares: number;
  subscribed_amount: number;
  paid_up_shares: number;
  paid_up_amount: number;
  status: string;
  created_at?: string;
}

export interface ShareCapitalSetting {
  id: string;
  cooperative_id: string;
  par_value_per_share: number;
  min_subscription_shares: number;
  min_paid_up_shares: number;
  max_share_holding_percentage: number;
  transfer_fee: number;
  withdrawal_rule: string;
  accounting_account_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface CashAccount {
  id: string;
  name: string;
  account_number: string;
  bank_name: string;
  branch_id: string;
  gl_account_id: string;
  opening_balance: number;
  current_balance: number;
  currency: string;
  active: boolean;
}

export interface Fee {
  id: string;
  name: string;
  code: string;
  calculation_type: string;
  fixed_amount?: number;
  amount?: number;
  percentage?: number;
  rate?: number;
  min_amount?: number;
  max_amount?: number;
  applicable_module?: string;
  applies_to?: string;
  accounting_account_id?: string;
  gl_account_id?: string;
  active?: boolean;
}

export interface PenaltyRule {
  id: string;
  name: string;
  calculation_type: string;
  grace_period_days: number;
  rate: number;
  penalty_rate_percentage?: number;
  calculation_frequency: string;
  minimum_penalty: number;
  maximum_penalty: number;
  accounting_account_id: string;
  active: boolean;
}

export interface PaymentAllocationRule {
  id: string;
  name: string;
  priorities?: ({ priority: number; component: string; label?: string } | string)[];
  priority_order?: any;
  is_default: boolean;
  active: boolean;
}

export interface JournalEntry {
  id: string;
  voucher_number: string;
  branch_id: string;
  posting_date: string;
  reference_type: string;
  reference_id: string;
  description: string;
  total_debit: number;
  total_credit: number;
  period_id: string;
  status: string;
  created_by: string;
  posted_at: string;
  lines?: JournalLine[];
}

export interface JournalLine {
  id: string;
  journal_entry_id: string;
  account_id: string;
  account_code?: string;
  account_name?: string;
  debit: number;
  credit: number;
  subsidiary_type: string | null;
  subsidiary_id: string | null;
}

export interface ConfigurationAuditTrail {
  id: string;
  setting: string;
  old_value: string;
  new_value: string;
  changed_by: string;
  created_at: string;
  reason: string;
}

export interface UserRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

export interface User {
  id: string;
  name: string;
  username: string;
  role_id: string;
  role_name: string;
  branch_id: string;
}

export interface CoopProfile {
  name: string;
  registration_no?: string;
  currency_code?: string;
  currency_symbol?: string;
  operating_mode?: string;
  tax_exempt?: boolean;
  fiscal_year_start_month?: number;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
}

export interface VerificationTestResult {
  test_id?: number;
  test_number?: number;
  title: string;
  description?: string;
  passed: boolean;
  details: any;
}

export type AuthSession =
  | { type: 'staff'; user: User; token: string }
  | { type: 'member'; member: Member; token: string };

