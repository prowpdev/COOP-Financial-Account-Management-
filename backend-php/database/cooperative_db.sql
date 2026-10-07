-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Oct 07, 2026 at 10:42 AM
-- Server version: 8.0.30
-- PHP Version: 8.1.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `cooperative_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `accounting_mappings`
--

CREATE TABLE `accounting_mappings` (
  `id` varchar(50) NOT NULL,
  `event_type` varchar(100) NOT NULL,
  `description` varchar(255) NOT NULL,
  `debit_account_id` varchar(50) NOT NULL,
  `credit_account_id` varchar(50) NOT NULL,
  `is_system` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `accounting_mappings`
--

INSERT INTO `accounting_mappings` (`id`, `event_type`, `description`, `debit_account_id`, `credit_account_id`, `is_system`) VALUES
('map_int_inc', 'INTEREST_INCOME_RECOGNITION', 'Loan interest collected', 'acc_1110', 'acc_4110', 1),
('map_loan_pmt', 'LOAN_PAYMENT', 'Loan installment repayment entry', 'acc_1110', 'acc_1210', 1),
('map_loan_rel', 'LOAN_RELEASE', 'Standard loan release journal entry', 'acc_1210', 'acc_1110', 1),
('map_pen_inc', 'PENALTY_INCOME_RECOGNITION', 'Late payment default penalty', 'acc_1110', 'acc_4130', 1),
('map_sav_dep', 'SAVINGS_DEPOSIT', 'Member savings cash deposit', 'acc_1110', 'acc_2110', 1),
('map_sav_with', 'SAVINGS_WITHDRAWAL', 'Member savings cash withdrawal', 'acc_2110', 'acc_1110', 1),
('map_sc_sub', 'SHARE_SUBSCRIPTION_PAYMENT', 'Share capital contribution', 'acc_1110', 'acc_3110', 1);

-- --------------------------------------------------------

--
-- Table structure for table `accounting_periods`
--

CREATE TABLE `accounting_periods` (
  `id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `fiscal_year` int NOT NULL,
  `period_number` int NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `status` enum('Open','Closed','Locked') DEFAULT 'Open',
  `closed_at` timestamp NULL DEFAULT NULL,
  `closed_by` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `accounting_periods`
--

INSERT INTO `accounting_periods` (`id`, `name`, `fiscal_year`, `period_number`, `start_date`, `end_date`, `status`, `closed_at`, `closed_by`, `created_at`) VALUES
('period_2026_01', 'January 2026', 2026, 1, '2026-01-01', '2026-01-31', 'Open', NULL, NULL, '2026-09-12 00:07:46'),
('period_2026_02', 'February 2026', 2026, 2, '2026-02-01', '2026-02-28', 'Open', NULL, NULL, '2026-09-12 00:07:46'),
('period_2026_03', 'March 2026', 2026, 3, '2026-03-01', '2026-03-31', 'Open', NULL, NULL, '2026-09-12 00:07:46'),
('period_2026_04', 'April 2026', 2026, 4, '2026-04-01', '2026-04-30', 'Open', NULL, NULL, '2026-09-12 00:07:46'),
('period_2026_05', 'May 2026', 2026, 5, '2026-05-01', '2026-05-31', 'Open', NULL, NULL, '2026-09-12 00:07:46'),
('period_2026_06', 'June 2026', 2026, 6, '2026-06-01', '2026-06-30', 'Open', NULL, NULL, '2026-09-12 00:07:46'),
('period_2026_07', 'July 2026', 2026, 7, '2026-07-01', '2026-07-31', 'Open', NULL, NULL, '2026-09-12 00:07:46'),
('period_2026_08', 'August 2026', 2026, 8, '2026-08-01', '2026-08-31', 'Open', NULL, NULL, '2026-09-12 00:07:46'),
('period_2026_09', 'September 2026', 2026, 9, '2026-09-01', '2026-09-30', 'Open', NULL, NULL, '2026-09-12 00:07:46'),
('period_2026_10', 'October 2026', 2026, 10, '2026-10-01', '2026-10-31', 'Open', NULL, NULL, '2026-09-12 00:07:46'),
('period_2026_11', 'November 2026', 2026, 11, '2026-11-01', '2026-11-30', 'Open', NULL, NULL, '2026-09-12 00:07:46'),
('period_2026_12', 'December 2026', 2026, 12, '2026-12-01', '2026-12-31', 'Open', NULL, NULL, '2026-09-12 00:07:46');

-- --------------------------------------------------------

--
-- Table structure for table `approval_rules`
--

CREATE TABLE `approval_rules` (
  `id` varchar(50) NOT NULL,
  `workflow_id` varchar(50) NOT NULL,
  `level_name` varchar(50) DEFAULT NULL,
  `order` int NOT NULL,
  `required_role` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `minimum_amount` decimal(15,2) DEFAULT '0.00',
  `maximum_amount` decimal(15,2) DEFAULT NULL,
  `required_approvals` tinyint(1) DEFAULT '0',
  `active` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `approval_rules`
--

INSERT INTO `approval_rules` (`id`, `workflow_id`, `level_name`, `order`, `required_role`, `minimum_amount`, `maximum_amount`, `required_approvals`, `active`) VALUES
('rule_loan_tier1', 'wf_loan_standard', 'Tier 1 - Express Micro Loan', 1, 'Loan Officer', 0.00, 50000.00, 1, 1),
('rule_loan_tier2', 'wf_loan_standard', 'Tier 2 - Branch Manager Approval', 2, 'Branch Manager', 50000.01, 150000.00, 1, 1),
('rule_loan_tier3', 'wf_loan_standard', 'Tier 3 - Credit Committee & Board', 3, 'Board of Directors', 150000.01, 10000000.00, 2, 1);

-- --------------------------------------------------------

--
-- Table structure for table `approval_workflows`
--

CREATE TABLE `approval_workflows` (
  `id` varchar(50) NOT NULL,
  `name` varchar(150) NOT NULL,
  `module` varchar(50) NOT NULL,
  `description` text,
  `active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `approval_workflows`
--

INSERT INTO `approval_workflows` (`id`, `name`, `module`, `description`, `active`, `created_at`) VALUES
('wf_expense_standard', 'Operational Expense Approval', 'Expenses', 'Approval hierarchy for cash and bank disbursements', 1, '2026-09-29 07:09:55'),
('wf_loan_standard', 'Multi-Tier Loan Approval Workflow', 'Loans', 'Tiered loan approvals based on configurable principal thresholds', 1, '2026-09-29 07:09:55'),
('wf_test_1789200177598', 'Emergency Micro-Credit Express Approval', 'Loans', 'Fast single-tier approval for calamity loans', 1, '2026-09-29 07:09:55'),
('wf_test_1789298974260', 'Emergency Micro-Credit Express Approval', 'Loans', 'Fast single-tier approval for calamity loans', 1, '2026-09-29 07:09:55');

-- --------------------------------------------------------

--
-- Table structure for table `branches`
--

CREATE TABLE `branches` (
  `id` varchar(50) NOT NULL,
  `code` varchar(20) NOT NULL,
  `name` varchar(150) NOT NULL,
  `address` text NOT NULL,
  `contact_number` varchar(50) DEFAULT NULL,
  `manager_name` varchar(100) DEFAULT NULL,
  `is_main_branch` tinyint(1) DEFAULT '0',
  `active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `branches`
--

INSERT INTO `branches` (`id`, `code`, `name`, `address`, `contact_number`, `manager_name`, `is_main_branch`, `active`, `created_at`) VALUES
('branch_tar', 'TAR', 'Main Tarlac Central Branch', 'Plaza Mabini Commercial Arcade, Tarlac City, Tarlac', '+63 (045) 982-1144', 'Ricardo P. Manalili', 1, 1, '2026-09-12 00:07:46');

-- --------------------------------------------------------

--
-- Table structure for table `cash_accounts`
--

CREATE TABLE `cash_accounts` (
  `id` varchar(50) NOT NULL,
  `name` varchar(150) NOT NULL,
  `account_number` varchar(100) NOT NULL,
  `bank_name` varchar(150) DEFAULT NULL,
  `branch_id` varchar(50) NOT NULL,
  `gl_account_id` varchar(50) NOT NULL,
  `opening_balance` decimal(15,2) DEFAULT '0.00',
  `current_balance` decimal(15,2) DEFAULT '0.00',
  `currency` varchar(10) DEFAULT 'PHP',
  `active` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `cash_accounts`
--

INSERT INTO `cash_accounts` (`id`, `name`, `account_number`, `bank_name`, `branch_id`, `gl_account_id`, `opening_balance`, `current_balance`, `currency`, `active`) VALUES
('cash_01', 'Cash on Hand - Teller 1', 'COH-TAR-01', 'Cash Vault Drawer', 'branch_tar', 'acc_1110', 0.00, 33000.00, 'PHP', 1),
('cash_02', 'Main Vault Reserve', 'VLT-TAR-00', 'Master Vault Safety Depository', 'branch_tar', 'acc_1110', 0.00, 0.00, 'PHP', 1),
('cash_03', 'Land Bank of the Philippines - Operating Checking', 'LBP-0912-3341-99', 'Land Bank of the Philippines', 'branch_tar', 'acc_1120', 0.00, 0.00, 'PHP', 1),
('cash_04', 'Development Bank of the Philippines - High Yield', 'DBP-4401-2990-11', 'Development Bank of the Philippines', 'branch_tar', 'acc_1121', 0.00, 0.00, 'PHP', 1),
('cash_05', 'Urdaneta Branch Teller Cash', 'COH-URD-01', 'Cash Drawer Urdaneta', 'branch_tar', 'acc_1110', 0.00, 0.00, 'PHP', 1),
('cash_06', 'San Fernando Branch Teller Cash', 'COH-SFE-01', 'Cash Drawer San Fernando', 'branch_tar', 'acc_1110', 0.00, 0.00, 'PHP', 1);

-- --------------------------------------------------------

--
-- Table structure for table `cash_transactions`
--

CREATE TABLE `cash_transactions` (
  `id` varchar(50) NOT NULL,
  `transaction_no` varchar(100) NOT NULL,
  `cash_account_id` varchar(50) NOT NULL,
  `type` enum('INFLOW','OUTFLOW','TRANSFER') NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `balance_before` decimal(15,2) NOT NULL,
  `balance_after` decimal(15,2) NOT NULL,
  `running_balance` decimal(15,2) DEFAULT '0.00',
  `reference_number` varchar(100) DEFAULT NULL,
  `reference_type` varchar(50) DEFAULT NULL,
  `reference_id` varchar(50) DEFAULT NULL,
  `description` text,
  `notes` text,
  `transaction_date` date DEFAULT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `chart_of_accounts`
--

CREATE TABLE `chart_of_accounts` (
  `id` varchar(50) NOT NULL,
  `account_code` varchar(20) NOT NULL,
  `name` varchar(150) NOT NULL,
  `category` enum('Asset','Liability','Equity','Revenue','Expense') NOT NULL,
  `normal_balance` enum('Debit','Credit') NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `parent_account_id` varchar(50) DEFAULT NULL,
  `report_group` varchar(100) NOT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `chart_of_accounts`
--

INSERT INTO `chart_of_accounts` (`id`, `account_code`, `name`, `category`, `normal_balance`, `is_active`, `parent_account_id`, `report_group`, `description`, `created_at`) VALUES
('acc_1110', '1110', 'Cash on Hand - Tellers', 'Asset', 'Debit', 1, NULL, 'Current Assets', 'Petty cash and daily cashier vault drawers', '2026-09-29 07:09:54'),
('acc_1120', '1120', 'Cash in Bank - Land Bank of the Philippines', 'Asset', 'Debit', 1, NULL, 'Current Assets', 'LBP primary operating clearing depository', '2026-09-29 07:09:54'),
('acc_1121', '1121', 'Cash in Bank - Development Bank of the Philippines', 'Asset', 'Debit', 1, NULL, 'Current Assets', 'DBP high-yield special reserve depository', '2026-09-29 07:09:54'),
('acc_1210', '1210', 'Loans Receivable - Regular Multi-Purpose', 'Asset', 'Debit', 1, NULL, 'Loans and Receivables', 'Principal balance of outstanding member multi-purpose loans', '2026-09-29 07:09:54'),
('acc_1220', '1220', 'Loans Receivable - Emergency Micro-Loans', 'Asset', 'Debit', 1, NULL, 'Loans and Receivables', 'Emergency calamity and express medical credit lines', '2026-09-29 07:09:54'),
('acc_1230', '1230', 'Loans Receivable - Agricultural Crop Financing', 'Asset', 'Debit', 1, NULL, 'Loans and Receivables', 'Seasonal crop inputs, fertilizer, and agricultural financing', '2026-09-29 07:09:54'),
('acc_1290', '1290', 'Allowance for Probable Loan Losses', 'Asset', 'Credit', 1, NULL, 'Contra-Asset', 'Provision for PAR and non-performing loan impairments', '2026-09-29 07:09:54'),
('acc_1310', '1310', 'Interest Receivable on Loans', 'Asset', 'Debit', 1, NULL, 'Receivables', 'Accrued but uncollected loan installment interest', '2026-09-29 07:09:54'),
('acc_1400', '1200', 'Farm Machinery', 'Asset', 'Debit', 1, NULL, 'Property, Plant & Equipment', 'Farm machinery and equipment owned by the cooperative', '2026-09-29 07:09:54'),
('acc_1510', '1510', 'Office & IT Equipment', 'Asset', 'Debit', 1, NULL, 'Property, Plant & Equipment', 'Servers, teller terminals, and office workstations', '2026-09-29 07:09:54'),
('acc_1590', '1590', 'Accumulated Depreciation - Office Equipment', 'Asset', 'Credit', 1, NULL, 'Contra-Asset', 'Depreciation reserve on operational equipment', '2026-09-29 07:09:54'),
('acc_2110', '2110', 'Savings Deposits - Regular', 'Liability', 'Credit', 1, NULL, 'Deposit Liabilities', 'Withdrawable member deposit savings balances', '2026-09-29 07:09:54'),
('acc_2120', '2120', 'Time Deposits - High Yield', 'Liability', 'Credit', 1, NULL, 'Deposit Liabilities', 'Fixed-term high-yield member placements', '2026-09-29 07:09:54'),
('acc_2210', '2210', 'Accounts Payable & Accrued Expenses', 'Liability', 'Credit', 1, NULL, 'Current Liabilities', 'Supplier payables and operational vendor balances', '2026-09-29 07:09:54'),
('acc_2220', '2220', 'Interest Payable on Deposits', 'Liability', 'Credit', 1, NULL, 'Current Liabilities', 'Accrued interest payable to member savings deposits', '2026-09-29 07:09:54'),
('acc_3110', '3110', 'Paid-Up Share Capital - Common (Voting)', 'Equity', 'Credit', 1, NULL, 'Share Capital', 'Member common share capital subscribed and paid', '2026-09-29 07:09:54'),
('acc_3120', '3120', 'Paid-Up Share Capital - Preferred (Non-Voting)', 'Equity', 'Credit', 1, NULL, 'Share Capital', 'Associate member preferred non-voting equity', '2026-09-29 07:09:54'),
('acc_3210', '3210', 'Statutory Reserve Fund (General)', 'Equity', 'Credit', 1, NULL, 'Statutory Reserves', 'Mandatory 10% statutory reserve mandated by CDA', '2026-09-29 07:09:54'),
('acc_3220', '3220', 'Coop Education & Training Fund (CETF)', 'Equity', 'Credit', 1, NULL, 'Statutory Reserves', 'Mandatory educational reserve (5% localized, 5% apex federation)', '2026-09-29 07:09:54'),
('acc_3230', '3230', 'Community Development Fund', 'Equity', 'Credit', 1, NULL, 'Statutory Reserves', 'Mandatory 3% social community outreach fund', '2026-09-29 07:09:54'),
('acc_3240', '3240', 'Optional Reserve Fund', 'Equity', 'Credit', 1, NULL, 'Statutory Reserves', 'Discretionary cooperative stability and building fund', '2026-09-29 07:09:54'),
('acc_3900', '3900', 'Undivided Net Surplus / Retained Earnings', 'Equity', 'Credit', 1, NULL, 'Equity Surplus', 'Cumulative operating surplus available for dividend allocation', '2026-09-29 07:09:54'),
('acc_4110', '4110', 'Interest Income from Loans', 'Revenue', 'Credit', 1, NULL, 'Operating Revenue', 'Earned interest collected on member loan disbursements', '2026-09-29 07:09:54'),
('acc_4120', '4120', 'Service & Processing Fees', 'Revenue', 'Credit', 1, NULL, 'Operating Revenue', 'Loan origination, filing, and notarial service fees', '2026-09-29 07:09:54'),
('acc_4130', '4130', 'Fines & Late Payment Penalties', 'Revenue', 'Credit', 1, NULL, 'Operating Revenue', 'Default penalty charges assessed on delinquent installments', '2026-09-29 07:09:54'),
('acc_4140', '4140', 'Membership & Admission Fees', 'Revenue', 'Credit', 1, NULL, 'Operating Revenue', 'Non-refundable membership application and seminar fees', '2026-09-29 07:09:54'),
('acc_5110', '5110', 'Interest Expense on Savings Deposits', 'Expense', 'Debit', 1, NULL, 'Financial Expenses', 'Annual dividend and monthly interest yield distributed on deposits', '2026-09-29 07:09:54'),
('acc_5210', '5210', 'Salaries, Wages & Employee Benefits', 'Expense', 'Debit', 1, NULL, 'Administrative Expenses', 'Staff compensation, 13th month pay, and personnel allowances', '2026-09-29 07:09:54'),
('acc_5220', '5220', 'Office Supplies, Utilities & Communication', 'Expense', 'Debit', 1, NULL, 'Administrative Expenses', 'Electric, water, telecommunications, and stationery expenses', '2026-09-29 07:09:54'),
('acc_5290', '5290', 'Provision for Loan Losses', 'Expense', 'Debit', 1, NULL, 'Credit Losses', 'Expense entry provisioning reserve for doubtful loan accounts', '2026-09-29 07:09:54'),
('coa_846c4cb7e1f1', '5120', 'Food / Snacks', 'Expense', 'Debit', 1, NULL, 'Administrative Expenses', 'Food and Snack Expenses', '2026-10-06 00:58:09'),
('coa_a651ed3b601d', '5130', 'Transportation Fees', 'Expense', 'Debit', 1, NULL, 'Administrative Expenses', 'All Transportation Fees', '2026-10-06 00:59:59');

-- --------------------------------------------------------

--
-- Table structure for table `configuration_audit_trails`
--

CREATE TABLE `configuration_audit_trails` (
  `id` varchar(50) NOT NULL,
  `action` varchar(20) NOT NULL DEFAULT 'UPDATE',
  `setting` varchar(150) NOT NULL,
  `old_value` text,
  `new_value` text,
  `changed_by` varchar(100) NOT NULL,
  `reason` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `configuration_audit_trails`
--

INSERT INTO `configuration_audit_trails` (`id`, `action`, `setting`, `old_value`, `new_value`, `changed_by`, `reason`, `created_at`) VALUES
('audit_07a6e14906f96308', 'UPDATE', 'Share Capital Account Created', 'None', '{\"account_id\":\"sc_239631e1f88c\",\"account_number\":\"CBU-2026-18325\",\"member_id\":\"mem_000032\",\"branch_id\":\"branch_tar\",\"subscribed_shares\":40,\"subscribed_amount\":4000,\"paid_up_shares\":10,\"paid_up_amount\":1000,\"cash_account_id\":\"cash_01\",\"cash_gl_account_id\":\"acc_1110\",\"share_capital_gl_account_id\":\"acc_3110\",\"transaction_id\":\"sctx_986edf0175db\",\"journal_entry_id\":\"je_8292b5ea8ab2\",\"voucher_number\":\"OR-SC-20261001-D23705\",\"old_cash_balance\":2000,\"new_cash_balance\":3000}', 'Administrator', 'New Share Capital / CBU account created.', '2026-10-01 09:43:52'),
('audit_0b1bdc5b95575ebb', 'UPDATE', 'Share Capital Account Created', 'None', '{\"account_id\":\"sc_1d8bc3397316\",\"account_number\":\"CBU-2026-10911\",\"member_id\":\"mem_000008\",\"branch_id\":\"branch_tar\",\"subscribed_shares\":40,\"subscribed_amount\":4000,\"paid_up_shares\":10,\"paid_up_amount\":1000,\"cash_account_id\":\"cash_01\",\"cash_gl_account_id\":\"acc_1110\",\"share_capital_gl_account_id\":\"acc_3110\",\"transaction_id\":\"sctx_33ad5ba77906\",\"journal_entry_id\":\"je_ba853b82c053\",\"voucher_number\":\"OR-SC-20261001-F2EB76\",\"old_cash_balance\":0,\"new_cash_balance\":1000}', 'Administrator', 'New Share Capital / CBU account created.', '2026-10-01 08:59:29'),
('audit_110dc267b6781c03', 'UPDATE', 'Share Capital Account Created', 'None', '{\"account_id\":\"sc_dfafa52f8c3f\",\"account_number\":\"CBU-2026-40970\",\"member_id\":\"mem_000021\",\"branch_id\":\"branch_tar\",\"subscribed_shares\":40,\"subscribed_amount\":4000,\"paid_up_shares\":10,\"paid_up_amount\":1000,\"cash_account_id\":\"cash_01\",\"cash_gl_account_id\":\"acc_1110\",\"share_capital_gl_account_id\":\"acc_3110\",\"transaction_id\":\"sctx_22c1fbd5612b\",\"journal_entry_id\":\"je_fb450e9170aa\",\"voucher_number\":\"OR-SC-20261001-DACC5F\",\"old_cash_balance\":7000,\"new_cash_balance\":8000}', 'Administrator', 'New Share Capital / CBU account created.', '2026-10-01 09:46:17'),
('audit_1478ddaef809d68a', 'UPDATE', 'Share Capital Account Created', 'None', '{\"account_id\":\"sc_024b56de6448\",\"account_number\":\"CBU-2026-26567\",\"member_id\":\"mem_000026\",\"branch_id\":\"branch_tar\",\"subscribed_shares\":40,\"subscribed_amount\":4000,\"paid_up_shares\":10,\"paid_up_amount\":1000,\"cash_account_id\":\"cash_01\",\"cash_gl_account_id\":\"acc_1110\",\"share_capital_gl_account_id\":\"acc_3110\",\"transaction_id\":\"sctx_89761c9f56cc\",\"journal_entry_id\":\"je_1414fb2af6d1\",\"voucher_number\":\"OR-SC-20261001-0809F1\",\"old_cash_balance\":23000,\"new_cash_balance\":24000}', 'Administrator', 'New Share Capital / CBU account created.', '2026-10-01 09:48:58'),
('audit_1a251c1df8980f51', 'UPDATE', 'Share Capital Account Created', 'None', '{\"account_id\":\"sc_80947fa8dff2\",\"account_number\":\"CBU-2026-48852\",\"member_id\":\"mem_000030\",\"branch_id\":\"branch_tar\",\"subscribed_shares\":40,\"subscribed_amount\":4000,\"paid_up_shares\":10,\"paid_up_amount\":1000,\"cash_account_id\":\"cash_01\",\"cash_gl_account_id\":\"acc_1110\",\"share_capital_gl_account_id\":\"acc_3110\",\"transaction_id\":\"sctx_d5e65615219e\",\"journal_entry_id\":\"je_dd6653d7ff5d\",\"voucher_number\":\"OR-SC-20261001-AC0C5E\",\"old_cash_balance\":6000,\"new_cash_balance\":7000}', 'Administrator', 'New Share Capital / CBU account created.', '2026-10-01 09:45:47'),
('audit_1ee1d1d360ace1ff', 'UPDATE', 'Share Capital Account Created', 'None', '{\"account_id\":\"sc_1d4b9e27ba41\",\"account_number\":\"CBU-2026-99226\",\"member_id\":\"mem_000015\",\"branch_id\":\"branch_tar\",\"subscribed_shares\":40,\"subscribed_amount\":4000,\"paid_up_shares\":10,\"paid_up_amount\":1000,\"cash_account_id\":\"cash_01\",\"cash_gl_account_id\":\"acc_1110\",\"share_capital_gl_account_id\":\"acc_3110\",\"transaction_id\":\"sctx_c19f3f323fef\",\"journal_entry_id\":\"je_b92e180c9a05\",\"voucher_number\":\"OR-SC-20261001-24EBD7\",\"old_cash_balance\":3000,\"new_cash_balance\":4000}', 'Administrator', 'New Share Capital / CBU account created.', '2026-10-01 09:44:11'),
('audit_1f5008c712aa7ed2', 'UPDATE', 'Share Capital Account Created', 'None', '{\"account_id\":\"sc_a50e957a8103\",\"account_number\":\"CBU-2026-44421\",\"member_id\":\"mem_000020\",\"branch_id\":\"branch_tar\",\"subscribed_shares\":40,\"subscribed_amount\":4000,\"paid_up_shares\":10,\"paid_up_amount\":1000,\"cash_account_id\":\"cash_01\",\"cash_gl_account_id\":\"acc_1110\",\"share_capital_gl_account_id\":\"acc_3110\",\"transaction_id\":\"sctx_fffd1a3e196d\",\"journal_entry_id\":\"je_cc042fca5e45\",\"voucher_number\":\"OR-SC-20261001-301E10\",\"old_cash_balance\":21000,\"new_cash_balance\":22000}', 'Administrator', 'New Share Capital / CBU account created.', '2026-10-01 09:48:40'),
('audit_2095786d47b129e6', 'UPDATE', 'Share Capital Account Created', 'None', '{\"account_id\":\"sc_609fb678b67d\",\"account_number\":\"CBU-2026-80952\",\"member_id\":\"mem_3fd127b4f2e2\",\"branch_id\":\"branch_tar\",\"subscribed_shares\":40,\"subscribed_amount\":4000,\"paid_up_shares\":10,\"paid_up_amount\":1000,\"cash_account_id\":\"cash_01\",\"cash_gl_account_id\":\"acc_1110\",\"share_capital_gl_account_id\":\"acc_3110\",\"transaction_id\":\"sctx_1e5024294be5\",\"journal_entry_id\":\"je_2c2b6435851a\",\"voucher_number\":\"OR-SC-20261002-48EB5E\",\"old_cash_balance\":30000,\"new_cash_balance\":31000}', 'Administrator', 'New Share Capital / CBU account created.', '2026-10-02 15:43:28'),
('audit_250ff2db8abb2688', 'UPDATE', 'Share Capital Account Created', 'None', '{\"account_id\":\"sc_70286636434b\",\"account_number\":\"CBU-2026-53688\",\"member_id\":\"mem_000014\",\"branch_id\":\"branch_tar\",\"subscribed_shares\":40,\"subscribed_amount\":4000,\"paid_up_shares\":10,\"paid_up_amount\":1000,\"cash_account_id\":\"cash_01\",\"cash_gl_account_id\":\"acc_1110\",\"share_capital_gl_account_id\":\"acc_3110\",\"transaction_id\":\"sctx_81ed793cc5a6\",\"journal_entry_id\":\"je_1a4d18194f58\",\"voucher_number\":\"OR-SC-20261001-AC2600\",\"old_cash_balance\":4000,\"new_cash_balance\":5000}', 'Administrator', 'New Share Capital / CBU account created.', '2026-10-01 09:45:24'),
('audit_349d527aa40d581c', 'UPDATE', 'Share Capital Account Created', 'None', '{\"account_id\":\"sc_461458b55465\",\"account_number\":\"CBU-2026-40552\",\"member_id\":\"mem_000016\",\"branch_id\":\"branch_tar\",\"subscribed_shares\":40,\"subscribed_amount\":4000,\"paid_up_shares\":10,\"paid_up_amount\":1000,\"cash_account_id\":\"cash_01\",\"cash_gl_account_id\":\"acc_1110\",\"share_capital_gl_account_id\":\"acc_3110\",\"transaction_id\":\"sctx_f2296b539dad\",\"journal_entry_id\":\"je_a8b74b673cbe\",\"voucher_number\":\"OR-SC-20261001-3C0929\",\"old_cash_balance\":5000,\"new_cash_balance\":6000}', 'Administrator', 'New Share Capital / CBU account created.', '2026-10-01 09:45:36'),
('audit_369dd82d4fa1c0a0', 'UPDATE', 'Share Capital Account Created', 'None', '{\"account_id\":\"sc_9b7025e57a44\",\"account_number\":\"CBU-2026-19912\",\"member_id\":\"mem_fe59a10fc0c9\",\"branch_id\":\"branch_tar\",\"subscribed_shares\":40,\"subscribed_amount\":4000,\"paid_up_shares\":10,\"paid_up_amount\":1000,\"cash_account_id\":\"cash_01\",\"cash_gl_account_id\":\"acc_1110\",\"share_capital_gl_account_id\":\"acc_3110\",\"transaction_id\":\"sctx_cf180996d0f2\",\"journal_entry_id\":\"je_797448b4a678\",\"voucher_number\":\"OR-SC-20261001-CC8125\",\"old_cash_balance\":28000,\"new_cash_balance\":29000}', 'Administrator', 'New Share Capital / CBU account created.', '2026-10-01 09:56:49'),
('audit_398029d98f270a80', 'UPDATE', 'Share Capital Account Created', 'None', '{\"account_id\":\"sc_50c09dc02c47\",\"account_number\":\"CBU-2026-61932\",\"member_id\":\"mem_000007\",\"branch_id\":\"branch_tar\",\"subscribed_shares\":40,\"subscribed_amount\":4000,\"paid_up_shares\":10,\"paid_up_amount\":1000,\"cash_account_id\":\"cash_01\",\"cash_gl_account_id\":\"acc_1110\",\"share_capital_gl_account_id\":\"acc_3110\",\"transaction_id\":\"sctx_69f50e57ba50\",\"journal_entry_id\":\"je_9f88a396921c\",\"voucher_number\":\"OR-SC-20261001-C0B62E\",\"old_cash_balance\":25000,\"new_cash_balance\":26000}', 'Administrator', 'New Share Capital / CBU account created.', '2026-10-01 09:53:21'),
('audit_44d95d84463879e5', 'UPDATE', 'Share Capital Account Created', 'None', '{\"account_id\":\"sc_fb40cb1aa19c\",\"account_number\":\"CBU-2026-70611\",\"member_id\":\"mem_000006\",\"branch_id\":\"branch_tar\",\"subscribed_shares\":40,\"subscribed_amount\":4000,\"paid_up_shares\":10,\"paid_up_amount\":1000,\"cash_account_id\":\"cash_01\",\"cash_gl_account_id\":\"acc_1110\",\"share_capital_gl_account_id\":\"acc_3110\",\"transaction_id\":\"sctx_c9ad4e9ba625\",\"journal_entry_id\":\"je_b546634d8679\",\"voucher_number\":\"OR-SC-20261001-69ECC4\",\"old_cash_balance\":27000,\"new_cash_balance\":28000}', 'Administrator', 'New Share Capital / CBU account created.', '2026-10-01 09:55:54'),
('audit_4747b3430392e5ab', 'UPDATE', 'Share Capital Account Created', 'None', '{\"account_id\":\"sc_885366558867\",\"account_number\":\"CBU-2026-21341\",\"member_id\":\"mem_000012\",\"branch_id\":\"branch_tar\",\"subscribed_shares\":40,\"subscribed_amount\":4000,\"paid_up_shares\":10,\"paid_up_amount\":1000,\"cash_account_id\":\"cash_01\",\"cash_gl_account_id\":\"acc_1110\",\"share_capital_gl_account_id\":\"acc_3110\",\"transaction_id\":\"sctx_1fd16c447a84\",\"journal_entry_id\":\"je_cc07532c021b\",\"voucher_number\":\"OR-SC-20261001-26460E\",\"old_cash_balance\":10000,\"new_cash_balance\":11000}', 'Administrator', 'New Share Capital / CBU account created.', '2026-10-01 09:46:48'),
('audit_48ca61d4c0fe5f4e', 'UPDATE', 'Share Capital Account Created', 'None', '{\"account_id\":\"sc_bae037e9b229\",\"account_number\":\"CBU-2026-56064\",\"member_id\":\"mem_7c9db0b04f64\",\"branch_id\":\"branch_tar\",\"subscribed_shares\":40,\"subscribed_amount\":4000,\"paid_up_shares\":10,\"paid_up_amount\":1000,\"cash_account_id\":\"cash_01\",\"cash_gl_account_id\":\"acc_1110\",\"share_capital_gl_account_id\":\"acc_3110\",\"transaction_id\":\"sctx_3c1be8ec68d3\",\"journal_entry_id\":\"je_8a17ec1af4ae\",\"voucher_number\":\"OR-SC-20261006-66E5C6\",\"old_cash_balance\":32000,\"new_cash_balance\":33000}', 'System', 'New Share Capital / CBU account created.', '2026-10-06 00:46:24'),
('audit_4a6a45916d4a0d01', 'UPDATE', 'Share Capital Account Created', 'None', '{\"account_id\":\"sc_3dfc5217e8ad\",\"account_number\":\"CBU-2026-67466\",\"member_id\":\"mem_000004\",\"branch_id\":\"branch_tar\",\"subscribed_shares\":40,\"subscribed_amount\":4000,\"paid_up_shares\":10,\"paid_up_amount\":1000,\"cash_account_id\":\"cash_01\",\"cash_gl_account_id\":\"acc_1110\",\"share_capital_gl_account_id\":\"acc_3110\",\"transaction_id\":\"sctx_891925d96cb2\",\"journal_entry_id\":\"je_a641a7d3c266\",\"voucher_number\":\"OR-SC-20261001-45DD88\",\"old_cash_balance\":13000,\"new_cash_balance\":14000}', 'Administrator', 'New Share Capital / CBU account created.', '2026-10-01 09:47:13'),
('audit_4dd70d6d9823a912', 'UPDATE', 'Share Capital Account Created', 'None', '{\"account_id\":\"sc_5fa7be4283e4\",\"account_number\":\"CBU-2026-71210\",\"member_id\":\"mem_6ef261ec914a\",\"branch_id\":\"branch_tar\",\"subscribed_shares\":40,\"subscribed_amount\":4000,\"paid_up_shares\":10,\"paid_up_amount\":1000,\"cash_account_id\":\"cash_01\",\"cash_gl_account_id\":\"acc_1110\",\"share_capital_gl_account_id\":\"acc_3110\",\"transaction_id\":\"sctx_7b17e98ccbe8\",\"journal_entry_id\":\"je_309d1f099d0b\",\"voucher_number\":\"OR-SC-20261006-C1B204\",\"old_cash_balance\":31000,\"new_cash_balance\":32000}', 'System', 'New Share Capital / CBU account created.', '2026-10-06 00:46:18'),
('audit_515f56736d69f508', 'UPDATE', 'Share Capital Account Created', 'None', '{\"account_id\":\"sc_46655523c1f8\",\"account_number\":\"CBU-2026-90076\",\"member_id\":\"mem_000025\",\"branch_id\":\"branch_tar\",\"subscribed_shares\":40,\"subscribed_amount\":4000,\"paid_up_shares\":10,\"paid_up_amount\":1000,\"cash_account_id\":\"cash_01\",\"cash_gl_account_id\":\"acc_1110\",\"share_capital_gl_account_id\":\"acc_3110\",\"transaction_id\":\"sctx_e4d24eb88e78\",\"journal_entry_id\":\"je_858c8f8288eb\",\"voucher_number\":\"OR-SC-20261001-557DE5\",\"old_cash_balance\":17000,\"new_cash_balance\":18000}', 'Administrator', 'New Share Capital / CBU account created.', '2026-10-01 09:47:50'),
('audit_517ea0e2a7906a52', 'UPDATE', 'Share Capital Account Created', 'None', '{\"account_id\":\"sc_759fe9274091\",\"account_number\":\"CBU-2026-39923\",\"member_id\":\"mem_000012\",\"branch_id\":\"branch_tar\",\"subscribed_shares\":40,\"subscribed_amount\":4000,\"paid_up_shares\":10,\"paid_up_amount\":1000,\"cash_account_id\":\"cash_01\",\"cash_gl_account_id\":\"acc_1110\",\"share_capital_gl_account_id\":\"acc_3110\",\"transaction_id\":\"sctx_143581f0d9ce\",\"journal_entry_id\":\"je_26905addb995\",\"voucher_number\":\"OR-SC-20261001-DBFCF0\",\"old_cash_balance\":1000,\"new_cash_balance\":2000}', 'Administrator', 'New Share Capital / CBU account created.', '2026-10-01 09:01:58'),
('audit_54fcd4c834601ecc', 'UPDATE', 'Share Capital Account Created', 'None', '{\"account_id\":\"sc_b18da87292d9\",\"account_number\":\"CBU-2026-43080\",\"member_id\":\"mem_000022\",\"branch_id\":\"branch_tar\",\"subscribed_shares\":40,\"subscribed_amount\":4000,\"paid_up_shares\":10,\"paid_up_amount\":1000,\"cash_account_id\":\"cash_01\",\"cash_gl_account_id\":\"acc_1110\",\"share_capital_gl_account_id\":\"acc_3110\",\"transaction_id\":\"sctx_c715d9563f3e\",\"journal_entry_id\":\"je_41680db05d9c\",\"voucher_number\":\"OR-SC-20261001-DBEB36\",\"old_cash_balance\":26000,\"new_cash_balance\":27000}', 'Administrator', 'New Share Capital / CBU account created.', '2026-10-01 09:55:10'),
('audit_571a1465c8704ca3', 'UPDATE', 'Share Capital Account Created', 'None', '{\"account_id\":\"sc_26368c10b9a3\",\"account_number\":\"CBU-2026-70806\",\"member_id\":\"mem_000017\",\"branch_id\":\"branch_tar\",\"subscribed_shares\":40,\"subscribed_amount\":4000,\"paid_up_shares\":10,\"paid_up_amount\":1000,\"cash_account_id\":\"cash_01\",\"cash_gl_account_id\":\"acc_1110\",\"share_capital_gl_account_id\":\"acc_3110\",\"transaction_id\":\"sctx_390fddfe62a1\",\"journal_entry_id\":\"je_bb6338c5f4c1\",\"voucher_number\":\"OR-SC-20261001-8B2B27\",\"old_cash_balance\":20000,\"new_cash_balance\":21000}', 'Administrator', 'New Share Capital / CBU account created.', '2026-10-01 09:48:31'),
('audit_57f93fee390f9e0e', 'UPDATE', 'Share Capital Account Created', 'None', '{\"account_id\":\"sc_184f78dfad9a\",\"account_number\":\"CBU-2026-41483\",\"member_id\":\"mem_000024\",\"branch_id\":\"branch_tar\",\"subscribed_shares\":40,\"subscribed_amount\":4000,\"paid_up_shares\":10,\"paid_up_amount\":1000,\"cash_account_id\":\"cash_01\",\"cash_gl_account_id\":\"acc_1110\",\"share_capital_gl_account_id\":\"acc_3110\",\"transaction_id\":\"sctx_788f07c5c599\",\"journal_entry_id\":\"je_bb76b210c12d\",\"voucher_number\":\"OR-SC-20261001-ECB290\",\"old_cash_balance\":9000,\"new_cash_balance\":10000}', 'Administrator', 'New Share Capital / CBU account created.', '2026-10-01 09:46:39'),
('audit_5e625865d4e30ac5', 'UPDATE', 'Share Capital Account Created', 'None', '{\"account_id\":\"sc_9081fb39818f\",\"account_number\":\"CBU-2026-10378\",\"member_id\":\"mem_000018\",\"branch_id\":\"branch_tar\",\"subscribed_shares\":40,\"subscribed_amount\":4000,\"paid_up_shares\":10,\"paid_up_amount\":1000,\"cash_account_id\":\"cash_01\",\"cash_gl_account_id\":\"acc_1110\",\"share_capital_gl_account_id\":\"acc_3110\",\"transaction_id\":\"sctx_da56e93d6824\",\"journal_entry_id\":\"je_f2b6cbe9987c\",\"voucher_number\":\"OR-SC-20261001-214F22\",\"old_cash_balance\":8000,\"new_cash_balance\":9000}', 'Administrator', 'New Share Capital / CBU account created.', '2026-10-01 09:46:29'),
('audit_6301b0c0db509606', 'UPDATE', 'Share Capital Account Created', 'None', '{\"account_id\":\"sc_447adf17f6d5\",\"account_number\":\"CBU-2026-74125\",\"member_id\":\"mem_000031\",\"branch_id\":\"branch_tar\",\"subscribed_shares\":40,\"subscribed_amount\":4000,\"paid_up_shares\":10,\"paid_up_amount\":1000,\"cash_account_id\":\"cash_01\",\"cash_gl_account_id\":\"acc_1110\",\"share_capital_gl_account_id\":\"acc_3110\",\"transaction_id\":\"sctx_72a28ac5b688\",\"journal_entry_id\":\"je_a2bf7849ca50\",\"voucher_number\":\"OR-SC-20261001-9BBCE4\",\"old_cash_balance\":18000,\"new_cash_balance\":19000}', 'Administrator', 'New Share Capital / CBU account created.', '2026-10-01 09:48:02'),
('audit_80b9e795d8f606b0', 'UPDATE', 'Share Capital Account Created', 'None', '{\"account_id\":\"sc_44adb963be0e\",\"account_number\":\"CBU-2026-67338\",\"member_id\":\"mem_000005\",\"branch_id\":\"branch_tar\",\"subscribed_shares\":40,\"subscribed_amount\":4000,\"paid_up_shares\":10,\"paid_up_amount\":1000,\"cash_account_id\":\"cash_01\",\"cash_gl_account_id\":\"acc_1110\",\"share_capital_gl_account_id\":\"acc_3110\",\"transaction_id\":\"sctx_75e8142ae37d\",\"journal_entry_id\":\"je_ac97b7f7c517\",\"voucher_number\":\"OR-SC-20261001-3B7243\",\"old_cash_balance\":16000,\"new_cash_balance\":17000}', 'Administrator', 'New Share Capital / CBU account created.', '2026-10-01 09:47:42'),
('audit_813049212a1b7a62', 'UPDATE', 'Share Capital Account Created', 'None', '{\"account_id\":\"sc_e552574916e7\",\"account_number\":\"CBU-2026-88093\",\"member_id\":\"mem_dcdabdcc6967\",\"branch_id\":\"branch_tar\",\"subscribed_shares\":40,\"subscribed_amount\":4000,\"paid_up_shares\":10,\"paid_up_amount\":1000,\"cash_account_id\":\"cash_01\",\"cash_gl_account_id\":\"acc_1110\",\"share_capital_gl_account_id\":\"acc_3110\",\"transaction_id\":\"sctx_d0c61f2febc6\",\"journal_entry_id\":\"je_5035f9711656\",\"voucher_number\":\"OR-SC-20261001-816067\",\"old_cash_balance\":12000,\"new_cash_balance\":13000}', 'Administrator', 'New Share Capital / CBU account created.', '2026-10-01 09:47:05'),
('audit_97b52722ca5e7545', 'UPDATE', 'Share Capital Account Created', 'None', '{\"account_id\":\"sc_fcb2a8f88642\",\"account_number\":\"CBU-2026-58246\",\"member_id\":\"mem_000008\",\"branch_id\":\"branch_tar\",\"subscribed_shares\":40,\"subscribed_amount\":4000,\"paid_up_shares\":10,\"paid_up_amount\":1000,\"cash_account_id\":\"cash_01\",\"cash_gl_account_id\":\"acc_1110\",\"share_capital_gl_account_id\":\"acc_3110\",\"transaction_id\":\"sctx_a5bd678794ab\",\"journal_entry_id\":\"je_83efff4b8806\",\"voucher_number\":\"OR-SC-20261001-BC1D4B\",\"old_cash_balance\":15000,\"new_cash_balance\":16000}', 'Administrator', 'New Share Capital / CBU account created.', '2026-10-01 09:47:31'),
('audit_a47d7e084e248af1', 'UPDATE', 'Share Capital Account Created', 'None', '{\"account_id\":\"sc_4e3b3263a4b6\",\"account_number\":\"CBU-2026-48875\",\"member_id\":\"mem_7ff0cbb78e10\",\"branch_id\":\"branch_tar\",\"subscribed_shares\":40,\"subscribed_amount\":4000,\"paid_up_shares\":10,\"paid_up_amount\":1000,\"cash_account_id\":\"cash_01\",\"cash_gl_account_id\":\"acc_1110\",\"share_capital_gl_account_id\":\"acc_3110\",\"transaction_id\":\"sctx_868a3c84802d\",\"journal_entry_id\":\"je_67318c1d5c41\",\"voucher_number\":\"OR-SC-20261001-5B4390\",\"old_cash_balance\":29000,\"new_cash_balance\":30000}', 'Administrator', 'New Share Capital / CBU account created.', '2026-10-01 09:58:11'),
('audit_c158e6042e2853d9', 'UPDATE', 'Share Capital Account Created', 'None', '{\"account_id\":\"sc_1171e4bac62b\",\"account_number\":\"CBU-2026-68013\",\"member_id\":\"mem_723dc94d9064\",\"branch_id\":\"branch_tar\",\"subscribed_shares\":40,\"subscribed_amount\":4000,\"paid_up_shares\":10,\"paid_up_amount\":1000,\"cash_account_id\":\"cash_01\",\"cash_gl_account_id\":\"acc_1110\",\"share_capital_gl_account_id\":\"acc_3110\",\"transaction_id\":\"sctx_abebc3179715\",\"journal_entry_id\":\"je_96436be27d81\",\"voucher_number\":\"OR-SC-20261001-5D6121\",\"old_cash_balance\":14000,\"new_cash_balance\":15000}', 'Administrator', 'New Share Capital / CBU account created.', '2026-10-01 09:47:22'),
('audit_eabb6aa4501abd30', 'UPDATE', 'Share Capital Account Created', 'None', '{\"account_id\":\"sc_b6856480d706\",\"account_number\":\"CBU-2026-35390\",\"member_id\":\"mem_000029\",\"branch_id\":\"branch_tar\",\"subscribed_shares\":40,\"subscribed_amount\":4000,\"paid_up_shares\":10,\"paid_up_amount\":1000,\"cash_account_id\":\"cash_01\",\"cash_gl_account_id\":\"acc_1110\",\"share_capital_gl_account_id\":\"acc_3110\",\"transaction_id\":\"sctx_3611844aa118\",\"journal_entry_id\":\"je_97d0f635ea08\",\"voucher_number\":\"OR-SC-20261001-977F8B\",\"old_cash_balance\":19000,\"new_cash_balance\":20000}', 'Administrator', 'New Share Capital / CBU account created.', '2026-10-01 09:48:18'),
('audit_f06cfc876ae6b3ac', 'UPDATE', 'Share Capital Account Created', 'None', '{\"account_id\":\"sc_64bc431c26af\",\"account_number\":\"CBU-2026-75526\",\"member_id\":\"mem_000019\",\"branch_id\":\"branch_tar\",\"subscribed_shares\":40,\"subscribed_amount\":4000,\"paid_up_shares\":10,\"paid_up_amount\":1000,\"cash_account_id\":\"cash_01\",\"cash_gl_account_id\":\"acc_1110\",\"share_capital_gl_account_id\":\"acc_3110\",\"transaction_id\":\"sctx_83fd13a92b84\",\"journal_entry_id\":\"je_41175ce477bf\",\"voucher_number\":\"OR-SC-20261001-538A0C\",\"old_cash_balance\":22000,\"new_cash_balance\":23000}', 'Administrator', 'New Share Capital / CBU account created.', '2026-10-01 09:48:49'),
('audit_f8cf877d1acca3f7', 'UPDATE', 'Share Capital Account Created', 'None', '{\"account_id\":\"sc_849ff1914ab2\",\"account_number\":\"CBU-2026-69006\",\"member_id\":\"mem_000013\",\"branch_id\":\"branch_tar\",\"subscribed_shares\":40,\"subscribed_amount\":4000,\"paid_up_shares\":10,\"paid_up_amount\":1000,\"cash_account_id\":\"cash_01\",\"cash_gl_account_id\":\"acc_1110\",\"share_capital_gl_account_id\":\"acc_3110\",\"transaction_id\":\"sctx_b2c23269242f\",\"journal_entry_id\":\"je_c2e1d120d53d\",\"voucher_number\":\"OR-SC-20261001-75A620\",\"old_cash_balance\":11000,\"new_cash_balance\":12000}', 'Administrator', 'New Share Capital / CBU account created.', '2026-10-01 09:46:55'),
('audit_fa5b1385665fcf16', 'UPDATE', 'Share Capital Account Created', 'None', '{\"account_id\":\"sc_12f418dded8a\",\"account_number\":\"CBU-2026-85575\",\"member_id\":\"mem_fcac6ceede75\",\"branch_id\":\"branch_tar\",\"subscribed_shares\":40,\"subscribed_amount\":4000,\"paid_up_shares\":10,\"paid_up_amount\":1000,\"cash_account_id\":\"cash_01\",\"cash_gl_account_id\":\"acc_1110\",\"share_capital_gl_account_id\":\"acc_3110\",\"transaction_id\":\"sctx_02465702e7df\",\"journal_entry_id\":\"je_0aa5241d17d5\",\"voucher_number\":\"OR-SC-20261001-85087A\",\"old_cash_balance\":24000,\"new_cash_balance\":25000}', 'Administrator', 'New Share Capital / CBU account created.', '2026-10-01 09:52:23'),
('audit_init_01', 'UPDATE', 'Cooperative SQL Initialization', 'None', 'Clean Schema & Master Seeds Created', 'System Administrator', 'Deployment of SQL database for PHP MVC backend integration', '2026-09-12 00:07:46');

-- --------------------------------------------------------

--
-- Table structure for table `cooperatives`
--

CREATE TABLE `cooperatives` (
  `id` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `cda_registration_no` varchar(100) NOT NULL,
  `tax_identification_no` varchar(100) NOT NULL,
  `coop_type` varchar(100) DEFAULT 'Agricultural',
  `address` text,
  `contact_phone` varchar(50) DEFAULT NULL,
  `contact_email` varchar(100) DEFAULT NULL,
  `fiscal_year_start` varchar(10) DEFAULT '01-01',
  `base_currency` varchar(10) DEFAULT 'PHP',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `cooperatives`
--

INSERT INTO `cooperatives` (`id`, `name`, `cda_registration_no`, `tax_identification_no`, `coop_type`, `address`, `contact_phone`, `contact_email`, `fiscal_year_start`, `base_currency`, `created_at`, `updated_at`) VALUES
('coop_01', 'Mayap Care Agriculture Cooperative', 'CDA-REG-CAR-2018-09142', '009-881-209-000', 'Agricultural / Multi-Purpose', 'National Highway, San Vicente, Tarlac City, Tarlac', '+63 (045) 982-1144', 'contact@mayapcare.coop', '01-01', 'PHP', '2026-09-12 00:07:46', '2026-09-12 00:07:46');

-- --------------------------------------------------------

--
-- Table structure for table `custom_fields`
--

CREATE TABLE `custom_fields` (
  `id` varchar(50) NOT NULL,
  `entity_type` enum('Member','Loan','Savings','ShareCapital') NOT NULL,
  `field_key` varchar(100) NOT NULL,
  `label` varchar(150) NOT NULL,
  `field_type` enum('Text','Number','Date','Select','Boolean','Phone','Dropdown','File','Image','PDF','Document') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `options` json DEFAULT NULL,
  `is_required` tinyint(1) DEFAULT '0',
  `active` tinyint(1) DEFAULT '1',
  `display_order` int DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `custom_fields`
--

INSERT INTO `custom_fields` (`id`, `entity_type`, `field_key`, `label`, `field_type`, `options`, `is_required`, `active`, `display_order`) VALUES
('cf_2236bcb4', 'Member', 'custom_656', 'Photo holding ID', 'Image', '[]', 0, 1, 0),
('cf_53e27b5c', 'Member', 'custom_440', 'Marriage Certificate ( Photo )', 'Image', '[]', 0, 1, 0),
('cf_5bb23c78', 'Member', 'custom_516', 'PhilHealth Identification No.', 'Text', '[]', 0, 1, 0),
('cf_6db4e97c', 'Member', 'custom_266', 'SSS / UMID Number', 'Text', '[]', 0, 1, 0),
('cf_707898bf', 'Member', 'custom_391', 'PAGIBIG No.', 'Text', '[]', 0, 1, 0),
('cf_b4a8e24e', 'Member', 'custom_670', 'Valid ID ( secondary )', 'Image', '[]', 0, 1, 0),
('cf_mem_01', 'Member', 'occupation', 'Primary Occupation / Enterprise', 'Select', '[\"Farmer / Fisherfolk\", \"Self-Employed / Entrepreneur\", \"Government Employee\", \"Private Sector Employee\", \"Healthcare Professional\", \"OFW / Remittance Dependent\", \"Retired\"]', 1, 1, 1),
('cf_mem_02', 'Member', 'barangay', 'Barangay / Village Residence', 'Text', NULL, 1, 1, 2),
('cf_mem_03', 'Member', 'monthly_income', 'Estimated Monthly Household Income (PHP)', 'Number', NULL, 1, 1, 3),
('cf_mem_04', 'Member', 'tin_number', 'Tax Identification Number (TIN)', 'Text', NULL, 0, 1, 4);

-- --------------------------------------------------------

--
-- Table structure for table `document_requirements`
--

CREATE TABLE `document_requirements` (
  `id` varchar(50) NOT NULL,
  `module` varchar(50) NOT NULL,
  `name` varchar(150) NOT NULL,
  `is_mandatory` tinyint(1) DEFAULT '1',
  `active` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `document_requirements`
--

INSERT INTO `document_requirements` (`id`, `module`, `name`, `is_mandatory`, `active`) VALUES
('doc_billing', 'Members', 'Proof of Billing / Residence Certificate', 1, 1),
('doc_income', 'Loans', 'Proof of Income / Income Tax Return / Crop Harvest Log', 1, 1),
('doc_pmes', 'Members', 'Pre-Membership Education Seminar (PMES) Certificate', 1, 1),
('doc_promissory', 'Loans', 'Signed Promissory Note with Co-maker Agreement', 1, 1),
('doc_valid_id', 'Members', 'Government Issued Valid ID (Driver License, UMID, Passport)', 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `feature_toggles`
--

CREATE TABLE `feature_toggles` (
  `id` varchar(50) NOT NULL,
  `feature_key` varchar(100) NOT NULL,
  `name` varchar(150) NOT NULL,
  `description` text,
  `category` varchar(50) DEFAULT NULL,
  `enabled` tinyint(1) DEFAULT '1',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `feature_toggles`
--

INSERT INTO `feature_toggles` (`id`, `feature_key`, `name`, `description`, `category`, `enabled`, `updated_at`) VALUES
('feat_appr', 'feature_approval_workflows', 'Tiered Approval Workflows', 'Multi-step role-based authorization for loans and capital adjustments', 'Security', 1, '2026-09-12 00:07:46'),
('feat_cf', 'feature_custom_fields', 'Custom Member Fields', 'Enable dynamic custom fields for member profiles without code changes', 'Members', 1, '2026-09-12 00:07:46'),
('feat_notif', 'feature_notification_rules', 'Automated SMS / Push Triggers', 'Trigger alerts on loan approvals, overdue payments, and scheduled dues', 'Communications', 1, '2026-09-12 00:07:46'),
('feat_sub', 'feature_subsidiary_ledger', 'Subsidiary Ledger Tracking', 'Granular accounting subsidiary breakdown by member, loan, and cash drawers', 'Accounting', 1, '2026-09-12 00:07:46');

-- --------------------------------------------------------

--
-- Table structure for table `fees`
--

CREATE TABLE `fees` (
  `id` varchar(50) NOT NULL,
  `code` varchar(50) NOT NULL,
  `name` varchar(150) NOT NULL,
  `calculation_type` enum('Fixed','Percentage','Percentage of Principal') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `applies_to` varchar(50) NOT NULL,
  `percentage` int NOT NULL,
  `gl_account_id` varchar(50) NOT NULL,
  `active` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `fees`
--

INSERT INTO `fees` (`id`, `code`, `name`, `calculation_type`, `amount`, `applies_to`, `percentage`, `gl_account_id`, `active`) VALUES
('fee_05a86a81', 'FEE-724', 'Loan Processing Fee', 'Percentage', 0.00, 'loan', 2, 'acc_4110', 1),
('fee_c0f73b0e', 'FEE-MEMB', 'Cooperative Membership Entrance Fee', 'Fixed', 500.00, 'Loans', 0, 'acc_4140', 1);

-- --------------------------------------------------------

--
-- Table structure for table `general_ledger`
--

CREATE TABLE `general_ledger` (
  `id` varchar(50) NOT NULL,
  `journal_entry_id` varchar(50) NOT NULL,
  `account_id` varchar(50) NOT NULL,
  `posting_date` date NOT NULL,
  `period_id` varchar(50) NOT NULL,
  `branch_id` varchar(50) NOT NULL,
  `debit` decimal(15,2) DEFAULT '0.00',
  `credit` decimal(15,2) DEFAULT '0.00',
  `balance_running` decimal(15,2) DEFAULT '0.00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `journal_entries`
--

CREATE TABLE `journal_entries` (
  `id` varchar(50) NOT NULL,
  `voucher_number` varchar(50) NOT NULL,
  `branch_id` varchar(50) NOT NULL,
  `posting_date` date NOT NULL,
  `reference_type` varchar(50) NOT NULL,
  `reference_id` varchar(50) DEFAULT NULL,
  `description` text NOT NULL,
  `total_debit` decimal(15,2) NOT NULL,
  `total_credit` decimal(15,2) NOT NULL,
  `period_id` varchar(50) NOT NULL,
  `status` enum('Draft','Pending Approval','Posted','Reversed') DEFAULT 'Posted',
  `created_by` varchar(100) NOT NULL,
  `posted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `journal_entries`
--

INSERT INTO `journal_entries` (`id`, `voucher_number`, `branch_id`, `posting_date`, `reference_type`, `reference_id`, `description`, `total_debit`, `total_credit`, `period_id`, `status`, `created_by`, `posted_at`) VALUES
('je_00f9f5a60096', 'CD-20261006-1232', 'branch_tar', '2026-07-21', 'CASH_DISBURSEMENT', NULL, 'Bought Paper plates used in the meeting held', 200.00, 200.00, 'period_2026_10', 'Posted', 'Administrator', '2026-10-06 01:03:31'),
('je_0aa5241d17d5', 'OR-SC-20261001-85087A', 'branch_tar', '2026-10-01', 'Share Capital Payment', NULL, 'Initial share capital payment - CBU-2026-85575 - Receipt SC-OR-20261001-2F05', 1000.00, 1000.00, 'period_2026_10', 'Posted', 'Administrator', '2026-10-01 09:52:23'),
('je_0da233affb56', 'CD-20261006-7468', 'branch_tar', '2026-06-30', 'CASH_DISBURSEMENT', NULL, 'Foods for coop members participated in CDA Registration', 300.00, 300.00, 'period_2026_10', 'Posted', 'Administrator', '2026-10-06 01:01:05'),
('je_1414fb2af6d1', 'OR-SC-20261001-0809F1', 'branch_tar', '2026-10-01', 'Share Capital Payment', NULL, 'Initial share capital payment - CBU-2026-26567 - Receipt SC-OR-20261001-25F9', 1000.00, 1000.00, 'period_2026_10', 'Posted', 'Administrator', '2026-10-01 09:48:58'),
('je_16a4b2261793', 'CD-20261006-8702', 'branch_tar', '2026-09-29', 'CASH_DISBURSEMENT', NULL, 'food expense', 200.00, 200.00, 'period_2026_10', 'Posted', 'Administrator', '2026-10-06 01:07:02'),
('je_16f3ba444191', 'OR-20261001-1235', 'branch_tar', '2026-02-22', 'CASH_RECEIPT', NULL, 'Joselito Perez transaction', 500.00, 500.00, 'period_2026_10', 'Posted', 'Administrator', '2026-10-01 09:50:20'),
('je_1a4d18194f58', 'OR-SC-20261001-AC2600', 'branch_tar', '2026-10-01', 'Share Capital Payment', NULL, 'Initial share capital payment - CBU-2026-53688 - Receipt SC-OR-20261001-9CE6', 1000.00, 1000.00, 'period_2026_10', 'Posted', 'Administrator', '2026-10-01 09:45:24'),
('je_22687fe5d7f9', 'OR-20261001-5760', 'branch_tar', '2026-10-01', 'CASH_RECEIPT', NULL, 'August Tacubansa transaction', 500.00, 500.00, 'period_2026_10', 'Posted', 'Administrator', '2026-10-01 09:46:04'),
('je_2c2b6435851a', 'OR-SC-20261002-48EB5E', 'branch_tar', '2026-10-02', 'Share Capital Payment', NULL, 'Initial share capital payment - CBU-2026-80952 - Receipt SC-OR-20261002-9555', 1000.00, 1000.00, 'period_2026_10', 'Posted', 'Administrator', '2026-10-02 15:43:28'),
('je_309d1f099d0b', 'OR-SC-20261006-C1B204', 'branch_tar', '2026-10-06', 'Share Capital Payment', NULL, 'Initial share capital payment - CBU-2026-71210 - Receipt SC-OR-20261006-1477', 1000.00, 1000.00, 'period_2026_10', 'Posted', 'System', '2026-10-06 00:46:18'),
('je_38e0b2c379ec', 'OR-20261001-9866', 'branch_tar', '2026-10-01', 'CASH_RECEIPT', NULL, 'Julie Lee transaction', 500.00, 500.00, 'period_2026_10', 'Posted', 'Administrator', '2026-10-01 09:57:03'),
('je_41175ce477bf', 'OR-SC-20261001-538A0C', 'branch_tar', '2026-10-01', 'Share Capital Payment', NULL, 'Initial share capital payment - CBU-2026-75526 - Receipt SC-OR-20261001-3DE5', 1000.00, 1000.00, 'period_2026_10', 'Posted', 'Administrator', '2026-10-01 09:48:49'),
('je_41680db05d9c', 'OR-SC-20261001-DBEB36', 'branch_tar', '2026-10-01', 'Share Capital Payment', NULL, 'Initial share capital payment - CBU-2026-43080 - Receipt SC-OR-20261001-3B4B', 1000.00, 1000.00, 'period_2026_10', 'Posted', 'Administrator', '2026-10-01 09:55:10'),
('je_44d653a548fb', 'JV-20261006-9794', 'branch_tar', '2026-10-06', 'Manual JV', NULL, 'John Rey Alimurong Paid Membership Fee', 500.00, 500.00, 'period_2026_10', 'Posted', 'System User', '2026-10-06 00:47:02'),
('je_49fb10126a7e', 'CD-20261006-5343', 'branch_tar', '2026-07-12', 'CASH_DISBURSEMENT', NULL, 'Meeting Food', 700.00, 700.00, 'period_2026_10', 'Posted', 'Administrator', '2026-10-06 01:01:47'),
('je_4c695b91c9e1', 'OR-20261001-1806', 'branch_tar', '2026-04-10', 'CASH_RECEIPT', NULL, 'Jhomel Ignacio transaction', 500.00, 500.00, 'period_2026_10', 'Posted', 'Administrator', '2026-10-01 10:00:54'),
('je_4d45d7a56481', 'CD-20261006-5030', 'branch_tar', '2026-10-06', 'CASH_DISBURSEMENT', NULL, 'Coffee and Sugar used in the meeting', 100.00, 100.00, 'period_2026_10', 'Posted', 'Administrator', '2026-10-06 01:07:56'),
('je_5035f9711656', 'OR-SC-20261001-816067', 'branch_tar', '2026-10-01', 'Share Capital Payment', NULL, 'Initial share capital payment - CBU-2026-88093 - Receipt SC-OR-20261001-4EA5', 1000.00, 1000.00, 'period_2026_10', 'Posted', 'Administrator', '2026-10-01 09:47:05'),
('je_56a1ae9c98ac', 'OR-20261001-2663', 'branch_tar', '2026-10-01', 'CASH_RECEIPT', NULL, 'Marjay Santos transaction', 500.00, 500.00, 'period_2026_10', 'Posted', 'Administrator', '2026-10-01 09:54:10'),
('je_57359048ee6f', 'OR-20261001-7403', 'branch_tar', '2026-10-01', 'CASH_RECEIPT', NULL, 'Roberto A. Luanzon transaction', 500.00, 500.00, 'period_2026_10', 'Posted', 'Administrator', '2026-10-01 09:51:28'),
('je_67318c1d5c41', 'OR-SC-20261001-5B4390', 'branch_tar', '2026-10-01', 'Share Capital Payment', NULL, 'Initial share capital payment - CBU-2026-48875 - Receipt SC-OR-20261001-7392', 1000.00, 1000.00, 'period_2026_10', 'Posted', 'Administrator', '2026-10-01 09:58:11'),
('je_69eed47774cc', 'OR-20261001-6467', 'branch_tar', '2025-11-28', 'CASH_RECEIPT', NULL, 'Fernando Jr Luanzon transaction', 500.00, 500.00, 'period_2026_10', 'Posted', 'Administrator', '2026-10-01 09:44:42'),
('je_6bb43dc156cf', 'CD-20261006-9539', 'branch_tar', '2026-10-06', 'CASH_DISBURSEMENT', NULL, 'Printing Tarpaulin for MAYAP CARE COOP', 700.00, 700.00, 'period_2026_10', 'Posted', 'Administrator', '2026-10-06 01:02:31'),
('je_797448b4a678', 'OR-SC-20261001-CC8125', 'branch_tar', '2026-10-01', 'Share Capital Payment', NULL, 'Initial share capital payment - CBU-2026-19912 - Receipt SC-OR-20261001-DD94', 1000.00, 1000.00, 'period_2026_10', 'Posted', 'Administrator', '2026-10-01 09:56:49'),
('je_7cb4d03455cf', 'OR-20261001-4507', 'branch_tar', '2026-10-01', 'CASH_RECEIPT', NULL, 'Jayson Santos transaction', 500.00, 500.00, 'period_2026_10', 'Posted', 'Administrator', '2026-10-01 09:50:37'),
('je_8292b5ea8ab2', 'OR-SC-20261001-D23705', 'branch_tar', '2026-10-01', 'Share Capital Payment', NULL, 'Initial share capital payment - CBU-2026-18325 - Receipt SC-OR-20261001-256E', 1000.00, 1000.00, 'period_2026_10', 'Posted', 'Administrator', '2026-10-01 09:43:52'),
('je_83efff4b8806', 'OR-SC-20261001-BC1D4B', 'branch_tar', '2026-10-01', 'Share Capital Payment', NULL, 'Initial share capital payment - CBU-2026-58246 - Receipt SC-OR-20261001-BDD6', 1000.00, 1000.00, 'period_2026_10', 'Posted', 'Administrator', '2026-10-01 09:47:30'),
('je_851dfe73edfc', 'JV-20261006-8827', 'branch_tar', '2026-10-06', 'Manual JV', NULL, 'Raul Alimurong transaction', 500.00, 500.00, 'period_2026_10', 'Posted', 'System User', '2026-10-06 00:47:25'),
('je_858c8f8288eb', 'OR-SC-20261001-557DE5', 'branch_tar', '2026-10-01', 'Share Capital Payment', NULL, 'Initial share capital payment - CBU-2026-90076 - Receipt SC-OR-20261001-6859', 1000.00, 1000.00, 'period_2026_10', 'Posted', 'Administrator', '2026-10-01 09:47:50'),
('je_8a17ec1af4ae', 'OR-SC-20261006-66E5C6', 'branch_tar', '2026-10-06', 'Share Capital Payment', NULL, 'Initial share capital payment - CBU-2026-56064 - Receipt SC-OR-20261006-2A25', 1000.00, 1000.00, 'period_2026_10', 'Posted', 'System', '2026-10-06 00:46:24'),
('je_96436be27d81', 'OR-SC-20261001-5D6121', 'branch_tar', '2026-10-01', 'Share Capital Payment', NULL, 'Initial share capital payment - CBU-2026-68013 - Receipt SC-OR-20261001-BEF9', 1000.00, 1000.00, 'period_2026_10', 'Posted', 'Administrator', '2026-10-01 09:47:22'),
('je_97d0f635ea08', 'OR-SC-20261001-977F8B', 'branch_tar', '2026-10-01', 'Share Capital Payment', NULL, 'Initial share capital payment - CBU-2026-35390 - Receipt SC-OR-20261001-2201', 1000.00, 1000.00, 'period_2026_10', 'Posted', 'Administrator', '2026-10-01 09:48:18'),
('je_9f88a396921c', 'OR-SC-20261001-C0B62E', 'branch_tar', '2026-10-01', 'Share Capital Payment', NULL, 'Initial share capital payment - CBU-2026-61932 - Receipt SC-OR-20261001-15FE', 1000.00, 1000.00, 'period_2026_10', 'Posted', 'Administrator', '2026-10-01 09:53:21'),
('je_a2bf7849ca50', 'OR-SC-20261001-9BBCE4', 'branch_tar', '2026-10-01', 'Share Capital Payment', NULL, 'Initial share capital payment - CBU-2026-74125 - Receipt SC-OR-20261001-7C55', 1000.00, 1000.00, 'period_2026_10', 'Posted', 'Administrator', '2026-10-01 09:48:02'),
('je_a641a7d3c266', 'OR-SC-20261001-45DD88', 'branch_tar', '2026-10-01', 'Share Capital Payment', NULL, 'Initial share capital payment - CBU-2026-67466 - Receipt SC-OR-20261001-9824', 1000.00, 1000.00, 'period_2026_10', 'Posted', 'Administrator', '2026-10-01 09:47:13'),
('je_a7c18d40db96', 'OR-20261001-5278', 'branch_tar', '2026-10-01', 'CASH_RECEIPT', NULL, 'Jobert Luanzon transaction', 500.00, 500.00, 'period_2026_10', 'Posted', 'Administrator', '2026-10-01 09:51:52'),
('je_a864473bcdbd', 'OR-20261001-5447', 'branch_tar', '2026-10-01', 'CASH_RECEIPT', NULL, 'Thomas Rey Bagsic transaction', 500.00, 500.00, 'period_2026_10', 'Posted', 'Administrator', '2026-10-01 09:50:55'),
('je_a8b74b673cbe', 'OR-SC-20261001-3C0929', 'branch_tar', '2026-10-01', 'Share Capital Payment', NULL, 'Initial share capital payment - CBU-2026-40552 - Receipt SC-OR-20261001-4815', 1000.00, 1000.00, 'period_2026_10', 'Posted', 'Administrator', '2026-10-01 09:45:36'),
('je_a961661face1', 'CD-20261007-2717', 'branch_tar', '2026-10-06', 'CASH_DISBURSEMENT', NULL, 'Transportation expense submitting docs and pickup Farm sprayer', 1000.00, 1000.00, 'period_2026_10', 'Posted', 'System User', '2026-10-07 06:11:37'),
('je_abf11fd10a60', 'OR-20261001-3194', 'branch_tar', '2026-10-01', 'CASH_RECEIPT', NULL, 'Tony Castro transaction', 500.00, 500.00, 'period_2026_10', 'Posted', 'Administrator', '2026-10-01 09:57:19'),
('je_ac97b7f7c517', 'OR-SC-20261001-3B7243', 'branch_tar', '2026-10-01', 'Share Capital Payment', NULL, 'Initial share capital payment - CBU-2026-67338 - Receipt SC-OR-20261001-C3DA', 1000.00, 1000.00, 'period_2026_10', 'Posted', 'Administrator', '2026-10-01 09:47:42'),
('je_b546634d8679', 'OR-SC-20261001-69ECC4', 'branch_tar', '2026-10-01', 'Share Capital Payment', NULL, 'Initial share capital payment - CBU-2026-70611 - Receipt SC-OR-20261001-AB03', 1000.00, 1000.00, 'period_2026_10', 'Posted', 'Administrator', '2026-10-01 09:55:54'),
('je_b92e180c9a05', 'OR-SC-20261001-24EBD7', 'branch_tar', '2026-10-01', 'Share Capital Payment', NULL, 'Initial share capital payment - CBU-2026-99226 - Receipt SC-OR-20261001-31DC', 1000.00, 1000.00, 'period_2026_10', 'Posted', 'Administrator', '2026-10-01 09:44:11'),
('je_bb6338c5f4c1', 'OR-SC-20261001-8B2B27', 'branch_tar', '2026-10-01', 'Share Capital Payment', NULL, 'Initial share capital payment - CBU-2026-70806 - Receipt SC-OR-20261001-68A0', 1000.00, 1000.00, 'period_2026_10', 'Posted', 'Administrator', '2026-10-01 09:48:31'),
('je_bb76b210c12d', 'OR-SC-20261001-ECB290', 'branch_tar', '2026-10-01', 'Share Capital Payment', NULL, 'Initial share capital payment - CBU-2026-41483 - Receipt SC-OR-20261001-2807', 1000.00, 1000.00, 'period_2026_10', 'Posted', 'Administrator', '2026-10-01 09:46:39'),
('je_c1600aa51cd2', 'OR-20261001-6898', 'branch_tar', '2026-10-01', 'CASH_RECEIPT', NULL, 'Renato Laxamana transaction', 500.00, 500.00, 'period_2026_10', 'Posted', 'Administrator', '2026-10-01 09:49:33'),
('je_c2e1d120d53d', 'OR-SC-20261001-75A620', 'branch_tar', '2026-10-01', 'Share Capital Payment', NULL, 'Initial share capital payment - CBU-2026-69006 - Receipt SC-OR-20261001-6BA3', 1000.00, 1000.00, 'period_2026_10', 'Posted', 'Administrator', '2026-10-01 09:46:55'),
('je_c8b3276ce78b', 'OR-20261001-8827', 'branch_tar', '2026-10-01', 'CASH_RECEIPT', NULL, 'Jose Luanzon transaction', 500.00, 500.00, 'period_2026_10', 'Posted', 'Administrator', '2026-10-01 09:52:13'),
('je_c985cbc940aa', 'CD-20261006-7221', 'branch_tar', '2026-10-06', 'CASH_DISBURSEMENT', NULL, 'Gas - Transportation expense ', 1000.00, 1000.00, 'period_2026_10', 'Posted', 'Administrator', '2026-10-06 01:04:53'),
('je_cb5ba35fd16d', 'OR-20261001-8936', 'branch_tar', '2026-10-01', 'CASH_RECEIPT', NULL, 'Catalino Jr. L. Mejia transaction', 500.00, 500.00, 'period_2026_10', 'Posted', 'Administrator', '2026-10-01 09:49:52'),
('je_cc042fca5e45', 'OR-SC-20261001-301E10', 'branch_tar', '2026-10-01', 'Share Capital Payment', NULL, 'Initial share capital payment - CBU-2026-44421 - Receipt SC-OR-20261001-8E70', 1000.00, 1000.00, 'period_2026_10', 'Posted', 'Administrator', '2026-10-01 09:48:40'),
('je_cc07532c021b', 'OR-SC-20261001-26460E', 'branch_tar', '2026-10-01', 'Share Capital Payment', NULL, 'Initial share capital payment - CBU-2026-21341 - Receipt SC-OR-20261001-4CA3', 1000.00, 1000.00, 'period_2026_10', 'Posted', 'Administrator', '2026-10-01 09:46:48'),
('je_cdcd95db57ab', 'CD-20261006-8711', 'branch_tar', '2026-06-23', 'CASH_DISBURSEMENT', NULL, 'Printing of Documents submitted to CDA', 300.00, 300.00, 'period_2026_10', 'Posted', 'Administrator', '2026-10-06 01:05:30'),
('je_d03280f5e07c', 'CD-20261006-2585', 'branch_tar', '2026-09-25', 'CASH_DISBURSEMENT', NULL, 'Bought Bond Paper Long', 250.00, 250.00, 'period_2026_10', 'Posted', 'Administrator', '2026-10-06 01:09:54'),
('je_d47c7963d699', 'CD-20261006-9021', 'branch_tar', '2026-06-21', 'CASH_DISBURSEMENT', NULL, 'Transportation fee going to CDA Pampanga', 1000.00, 1000.00, 'period_2026_10', 'Posted', 'Administrator', '2026-10-06 01:04:25'),
('je_da67819602d3', 'CD-20261006-4012', 'branch_tar', '2026-10-06', 'CASH_DISBURSEMENT', NULL, 'Print ID for BIR TIN Submittions', 80.00, 80.00, 'period_2026_10', 'Posted', 'Administrator', '2026-10-06 01:08:29'),
('je_dd6653d7ff5d', 'OR-SC-20261001-AC0C5E', 'branch_tar', '2026-10-01', 'Share Capital Payment', NULL, 'Initial share capital payment - CBU-2026-48852 - Receipt SC-OR-20261001-5CE0', 1000.00, 1000.00, 'period_2026_10', 'Posted', 'Administrator', '2026-10-01 09:45:47'),
('je_e6c75073e111', 'CD-20261006-1645', 'branch_tar', '2026-10-06', 'CASH_DISBURSEMENT', NULL, 'Printing Form 1904 Document', 198.00, 198.00, 'period_2026_10', 'Posted', 'Administrator', '2026-10-06 01:09:00'),
('je_ea1007187265', 'CD-20261006-8211', 'branch_tar', '2026-10-06', 'CASH_DISBURSEMENT', NULL, 'Bought Cash Drawer for MAYAP Store', 1215.00, 1215.00, 'period_2026_10', 'Posted', 'Administrator', '2026-10-06 01:06:13'),
('je_ec05cf3df263', 'CD-20261007-6151', 'branch_tar', '2026-10-06', 'CASH_DISBURSEMENT', NULL, 'Bought Bond paper', 300.00, 300.00, 'period_2026_10', 'Posted', 'System User', '2026-10-07 06:16:59'),
('je_f2b6cbe9987c', 'OR-SC-20261001-214F22', 'branch_tar', '2026-10-01', 'Share Capital Payment', NULL, 'Initial share capital payment - CBU-2026-10378 - Receipt SC-OR-20261001-1885', 1000.00, 1000.00, 'period_2026_10', 'Posted', 'Administrator', '2026-10-01 09:46:29'),
('je_f516f3272db1', 'OR-20261001-2623', 'branch_tar', '2026-08-21', 'CASH_RECEIPT', NULL, 'Danny Marcos transaction', 500.00, 500.00, 'period_2026_10', 'Posted', 'Administrator', '2026-10-01 09:57:51'),
('je_fb450e9170aa', 'OR-SC-20261001-DACC5F', 'branch_tar', '2026-10-01', 'Share Capital Payment', NULL, 'Initial share capital payment - CBU-2026-40970 - Receipt SC-OR-20261001-766B', 1000.00, 1000.00, 'period_2026_10', 'Posted', 'Administrator', '2026-10-01 09:46:17');

-- --------------------------------------------------------

--
-- Table structure for table `journal_lines`
--

CREATE TABLE `journal_lines` (
  `id` varchar(50) NOT NULL,
  `journal_entry_id` varchar(50) NOT NULL,
  `account_id` varchar(50) NOT NULL,
  `debit` decimal(15,2) DEFAULT '0.00',
  `credit` decimal(15,2) DEFAULT '0.00',
  `subsidiary_type` varchar(50) DEFAULT NULL,
  `subsidiary_id` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `journal_lines`
--

INSERT INTO `journal_lines` (`id`, `journal_entry_id`, `account_id`, `debit`, `credit`, `subsidiary_type`, `subsidiary_id`) VALUES
('jl_00e35e492856', 'je_858c8f8288eb', 'acc_3110', 0.00, 1000.00, 'Member', 'mem_000025'),
('jl_012bf870ad7e', 'je_49fb10126a7e', 'acc_1110', 0.00, 700.00, 'Cash', 'cash_01'),
('jl_0163bc217068', 'je_c985cbc940aa', 'coa_a651ed3b601d', 1000.00, 0.00, '', ''),
('jl_01734a92f42a', 'je_d47c7963d699', 'coa_a651ed3b601d', 1000.00, 0.00, '', ''),
('jl_046f92a28ec2', 'je_dd6653d7ff5d', 'acc_3110', 0.00, 1000.00, 'Member', 'mem_000030'),
('jl_086933e0837b', 'je_cc07532c021b', 'acc_1110', 1000.00, 0.00, 'Member', 'mem_000012'),
('jl_08e5395d6884', 'je_da67819602d3', 'acc_5220', 80.00, 0.00, '', ''),
('jl_0c834f390906', 'je_c2e1d120d53d', 'acc_1110', 1000.00, 0.00, 'Member', 'mem_000013'),
('jl_0d8009db3bbd', 'je_69eed47774cc', 'acc_4140', 0.00, 500.00, '', ''),
('jl_0e51394998a6', 'je_22687fe5d7f9', 'acc_1110', 500.00, 0.00, 'Cash', 'cash_01'),
('jl_0fb9e5af0e18', 'je_56a1ae9c98ac', 'acc_1110', 500.00, 0.00, 'Cash', 'cash_01'),
('jl_10173025859a', 'je_bb6338c5f4c1', 'acc_3110', 0.00, 1000.00, 'Member', 'mem_000017'),
('jl_112c9b105adb', 'je_bb76b210c12d', 'acc_1110', 1000.00, 0.00, 'Member', 'mem_000024'),
('jl_178703a359f6', 'je_309d1f099d0b', 'acc_3110', 0.00, 1000.00, 'Member', 'mem_6ef261ec914a'),
('jl_18e621ccdd68', 'je_8292b5ea8ab2', 'acc_1110', 1000.00, 0.00, 'Member', 'mem_000032'),
('jl_191405897db0', 'je_b92e180c9a05', 'acc_1110', 1000.00, 0.00, 'Member', 'mem_000015'),
('jl_19f9ee34ab29', 'je_44d653a548fb', 'acc_4140', 0.00, 500.00, '', ''),
('jl_1a5e1b4dfcb7', 'je_a2bf7849ca50', 'acc_1110', 1000.00, 0.00, 'Member', 'mem_000031'),
('jl_1ad587f5bbd3', 'je_bb6338c5f4c1', 'acc_1110', 1000.00, 0.00, 'Member', 'mem_000017'),
('jl_1c0f885e51b0', 'je_a8b74b673cbe', 'acc_1110', 1000.00, 0.00, 'Member', 'mem_000016'),
('jl_1c886e0c6dd5', 'je_96436be27d81', 'acc_3110', 0.00, 1000.00, 'Member', 'mem_723dc94d9064'),
('jl_1dabde2e5419', 'je_a864473bcdbd', 'acc_4140', 0.00, 500.00, '', ''),
('jl_1f3a8863ead5', 'je_a961661face1', 'coa_a651ed3b601d', 1000.00, 0.00, '', ''),
('jl_20e8949eefd6', 'je_67318c1d5c41', 'acc_3110', 0.00, 1000.00, 'Member', 'mem_7ff0cbb78e10'),
('jl_28f5fab2df80', 'je_4d45d7a56481', 'acc_1110', 0.00, 100.00, 'Cash', 'cash_01'),
('jl_2ab1b3267e0e', 'je_38e0b2c379ec', 'acc_4140', 0.00, 500.00, '', ''),
('jl_2b53ff7fccdf', 'je_cdcd95db57ab', 'acc_5220', 300.00, 0.00, '', ''),
('jl_303372e86515', 'je_7cb4d03455cf', 'acc_1110', 500.00, 0.00, 'Cash', 'cash_01'),
('jl_317ee12b4b82', 'je_bb76b210c12d', 'acc_3110', 0.00, 1000.00, 'Member', 'mem_000024'),
('jl_3221e3f2a998', 'je_f2b6cbe9987c', 'acc_1110', 1000.00, 0.00, 'Member', 'mem_000018'),
('jl_34e435930aed', 'je_dd6653d7ff5d', 'acc_1110', 1000.00, 0.00, 'Member', 'mem_000030'),
('jl_350fd260b07e', 'je_b546634d8679', 'acc_1110', 1000.00, 0.00, 'Member', 'mem_000006'),
('jl_39d84a3032cc', 'je_d47c7963d699', 'acc_1110', 0.00, 1000.00, 'Cash', 'cash_01'),
('jl_3d70ebf460e2', 'je_69eed47774cc', 'acc_1110', 500.00, 0.00, 'Cash', 'cash_01'),
('jl_3dfa4e2728c5', 'je_e6c75073e111', 'acc_5220', 198.00, 0.00, '', ''),
('jl_3fa4289bc513', 'je_a641a7d3c266', 'acc_1110', 1000.00, 0.00, 'Member', 'mem_000004'),
('jl_44490c53201f', 'je_d03280f5e07c', 'acc_5220', 250.00, 0.00, '', ''),
('jl_4757bb02b5b4', 'je_41680db05d9c', 'acc_1110', 1000.00, 0.00, 'Member', 'mem_000022'),
('jl_4874210b7c60', 'je_c1600aa51cd2', 'acc_1110', 500.00, 0.00, 'Cash', 'cash_01'),
('jl_49deb09ced1b', 'je_c2e1d120d53d', 'acc_3110', 0.00, 1000.00, 'Member', 'mem_000013'),
('jl_4a6c2f23bf5f', 'je_a2bf7849ca50', 'acc_3110', 0.00, 1000.00, 'Member', 'mem_000031'),
('jl_4a91f0944b01', 'je_c1600aa51cd2', 'acc_4140', 0.00, 500.00, '', ''),
('jl_4b4c81e146bc', 'je_a961661face1', 'acc_1110', 0.00, 1000.00, 'Cash', 'cash_01'),
('jl_4fbd91541b2a', 'je_1a4d18194f58', 'acc_3110', 0.00, 1000.00, 'Member', 'mem_000014'),
('jl_4ffd61a10dcc', 'je_ec05cf3df263', 'acc_5220', 300.00, 0.00, '', ''),
('jl_50957d125837', 'je_cb5ba35fd16d', 'acc_4140', 0.00, 500.00, '', ''),
('jl_50c5de27c9d8', 'je_a8b74b673cbe', 'acc_3110', 0.00, 1000.00, 'Member', 'mem_000016'),
('jl_51c84b322912', 'je_ec05cf3df263', 'acc_1110', 0.00, 300.00, 'Cash', 'cash_01'),
('jl_531ebab46500', 'je_1414fb2af6d1', 'acc_1110', 1000.00, 0.00, 'Member', 'mem_000026'),
('jl_53aad2ea316d', 'je_38e0b2c379ec', 'acc_1110', 500.00, 0.00, 'Cash', 'cash_01'),
('jl_582c83c9a4ea', 'je_41175ce477bf', 'acc_3110', 0.00, 1000.00, 'Member', 'mem_000019'),
('jl_590ea790ef11', 'je_ac97b7f7c517', 'acc_3110', 0.00, 1000.00, 'Member', 'mem_000005'),
('jl_5b43219048b1', 'je_96436be27d81', 'acc_1110', 1000.00, 0.00, 'Member', 'mem_723dc94d9064'),
('jl_61222c725ab8', 'je_5035f9711656', 'acc_1110', 1000.00, 0.00, 'Member', 'mem_dcdabdcc6967'),
('jl_6439d4f4320e', 'je_4d45d7a56481', 'coa_846c4cb7e1f1', 100.00, 0.00, '', ''),
('jl_65b45ffe5431', 'je_a864473bcdbd', 'acc_1110', 500.00, 0.00, 'Cash', 'cash_01'),
('jl_6654335ad0db', 'je_f516f3272db1', 'acc_4140', 0.00, 500.00, '', ''),
('jl_693222c90905', 'je_9f88a396921c', 'acc_1110', 1000.00, 0.00, 'Member', 'mem_000007'),
('jl_6a1f90d87458', 'je_a641a7d3c266', 'acc_3110', 0.00, 1000.00, 'Member', 'mem_000004'),
('jl_6be1fd847bde', 'je_851dfe73edfc', 'acc_1110', 500.00, 0.00, '', ''),
('jl_6fe3f43a3905', 'je_ac97b7f7c517', 'acc_1110', 1000.00, 0.00, 'Member', 'mem_000005'),
('jl_6ff230f6eabe', 'je_b546634d8679', 'acc_3110', 0.00, 1000.00, 'Member', 'mem_000006'),
('jl_70a40a15ae18', 'je_1a4d18194f58', 'acc_1110', 1000.00, 0.00, 'Member', 'mem_000014'),
('jl_736563aa6f47', 'je_83efff4b8806', 'acc_3110', 0.00, 1000.00, 'Member', 'mem_000008'),
('jl_7623a249fcee', 'je_22687fe5d7f9', 'acc_4140', 0.00, 500.00, '', ''),
('jl_78b6be4f0353', 'je_41175ce477bf', 'acc_1110', 1000.00, 0.00, 'Member', 'mem_000019'),
('jl_7b148a7f27ab', 'je_a7c18d40db96', 'acc_1110', 500.00, 0.00, 'Cash', 'cash_01'),
('jl_7b73aadb0be7', 'je_309d1f099d0b', 'acc_1110', 1000.00, 0.00, 'Member', 'mem_6ef261ec914a'),
('jl_7c748265305b', 'je_cc07532c021b', 'acc_3110', 0.00, 1000.00, 'Member', 'mem_000012'),
('jl_7e1d831d39db', 'je_fb450e9170aa', 'acc_1110', 1000.00, 0.00, 'Member', 'mem_000021'),
('jl_7f256565bd7e', 'je_f516f3272db1', 'acc_1110', 500.00, 0.00, 'Cash', 'cash_01'),
('jl_80984fe31094', 'je_5035f9711656', 'acc_3110', 0.00, 1000.00, 'Member', 'mem_dcdabdcc6967'),
('jl_810f8560dddd', 'je_8292b5ea8ab2', 'acc_3110', 0.00, 1000.00, 'Member', 'mem_000032'),
('jl_822f4c63497f', 'je_797448b4a678', 'acc_3110', 0.00, 1000.00, 'Member', 'mem_fe59a10fc0c9'),
('jl_8234627f903b', 'je_83efff4b8806', 'acc_1110', 1000.00, 0.00, 'Member', 'mem_000008'),
('jl_830f28ee75de', 'je_00f9f5a60096', 'acc_5220', 200.00, 0.00, '', ''),
('jl_8463c166cadd', 'je_16a4b2261793', 'acc_1110', 0.00, 200.00, 'Cash', 'cash_01'),
('jl_881e9e3fa62f', 'je_2c2b6435851a', 'acc_1110', 1000.00, 0.00, 'Member', 'mem_3fd127b4f2e2'),
('jl_8bca25a40675', 'je_4c695b91c9e1', 'acc_4140', 0.00, 500.00, '', ''),
('jl_8e738bbf5a45', 'je_cc042fca5e45', 'acc_3110', 0.00, 1000.00, 'Member', 'mem_000020'),
('jl_90c46bd9637f', 'je_16a4b2261793', 'coa_846c4cb7e1f1', 200.00, 0.00, '', ''),
('jl_92aa40941c58', 'je_56a1ae9c98ac', 'acc_4140', 0.00, 500.00, '', ''),
('jl_957c348d7e2e', 'je_49fb10126a7e', 'coa_846c4cb7e1f1', 700.00, 0.00, '', ''),
('jl_9584046e3ea5', 'je_16f3ba444191', 'acc_4140', 0.00, 500.00, '', ''),
('jl_99f901e3994d', 'je_7cb4d03455cf', 'acc_4140', 0.00, 500.00, '', ''),
('jl_9c4fdd54d7ce', 'je_9f88a396921c', 'acc_3110', 0.00, 1000.00, 'Member', 'mem_000007'),
('jl_9f0fb2536d7c', 'je_abf11fd10a60', 'acc_4140', 0.00, 500.00, '', ''),
('jl_9fbc3a985c2b', 'je_cdcd95db57ab', 'acc_1110', 0.00, 300.00, 'Cash', 'cash_01'),
('jl_a3caff1c9f11', 'je_00f9f5a60096', 'acc_1110', 0.00, 200.00, 'Cash', 'cash_01'),
('jl_a8b6ba412e03', 'je_41680db05d9c', 'acc_3110', 0.00, 1000.00, 'Member', 'mem_000022'),
('jl_a9ccb5d153d7', 'je_ea1007187265', 'acc_1110', 0.00, 1215.00, 'Cash', 'cash_01'),
('jl_acf208516837', 'je_c985cbc940aa', 'acc_1110', 0.00, 1000.00, 'Cash', 'cash_01'),
('jl_b23719ce3ff8', 'je_b92e180c9a05', 'acc_3110', 0.00, 1000.00, 'Member', 'mem_000015'),
('jl_b740d52b229b', 'je_16f3ba444191', 'acc_1110', 500.00, 0.00, 'Cash', 'cash_01'),
('jl_b77a19f3d442', 'je_cc042fca5e45', 'acc_1110', 1000.00, 0.00, 'Member', 'mem_000020'),
('jl_bdaf3947c723', 'je_4c695b91c9e1', 'acc_1110', 500.00, 0.00, 'Cash', 'cash_01'),
('jl_c006991e1197', 'je_797448b4a678', 'acc_1110', 1000.00, 0.00, 'Member', 'mem_fe59a10fc0c9'),
('jl_c0f95978ffa5', 'je_a7c18d40db96', 'acc_4140', 0.00, 500.00, '', ''),
('jl_c13cf337586d', 'je_cb5ba35fd16d', 'acc_1110', 500.00, 0.00, 'Cash', 'cash_01'),
('jl_c544899fc99f', 'je_44d653a548fb', 'acc_1110', 500.00, 0.00, '', ''),
('jl_cda61e5b5154', 'je_851dfe73edfc', 'acc_4140', 0.00, 500.00, '', ''),
('jl_cddd23ba2d6e', 'je_0da233affb56', 'acc_1110', 0.00, 300.00, 'Cash', 'cash_01'),
('jl_cfc411b6b8be', 'je_da67819602d3', 'acc_1110', 0.00, 80.00, 'Cash', 'cash_01'),
('jl_cff0d3f66616', 'je_858c8f8288eb', 'acc_1110', 1000.00, 0.00, 'Member', 'mem_000025'),
('jl_d0ff10358708', 'je_67318c1d5c41', 'acc_1110', 1000.00, 0.00, 'Member', 'mem_7ff0cbb78e10'),
('jl_d23846aa4f82', 'je_0aa5241d17d5', 'acc_1110', 1000.00, 0.00, 'Member', 'mem_fcac6ceede75'),
('jl_d39b6666d62e', 'je_abf11fd10a60', 'acc_1110', 500.00, 0.00, 'Cash', 'cash_01'),
('jl_d3e98d2da04f', 'je_8a17ec1af4ae', 'acc_1110', 1000.00, 0.00, 'Member', 'mem_7c9db0b04f64'),
('jl_d50c254da5f4', 'je_e6c75073e111', 'acc_1110', 0.00, 198.00, 'Cash', 'cash_01'),
('jl_d6ad886de8c9', 'je_2c2b6435851a', 'acc_3110', 0.00, 1000.00, 'Member', 'mem_3fd127b4f2e2'),
('jl_d806bbee44a1', 'je_ea1007187265', 'acc_5220', 1215.00, 0.00, '', ''),
('jl_d83da2640169', 'je_57359048ee6f', 'acc_1110', 500.00, 0.00, 'Cash', 'cash_01'),
('jl_dbb23c1f7b7f', 'je_c8b3276ce78b', 'acc_1110', 500.00, 0.00, 'Cash', 'cash_01'),
('jl_e46e424ebd76', 'je_0aa5241d17d5', 'acc_3110', 0.00, 1000.00, 'Member', 'mem_fcac6ceede75'),
('jl_e47f13a4d7fa', 'je_c8b3276ce78b', 'acc_4140', 0.00, 500.00, '', ''),
('jl_ec84678d624a', 'je_fb450e9170aa', 'acc_3110', 0.00, 1000.00, 'Member', 'mem_000021'),
('jl_f360b19c93cb', 'je_97d0f635ea08', 'acc_3110', 0.00, 1000.00, 'Member', 'mem_000029'),
('jl_f37aa50f1007', 'je_0da233affb56', 'coa_846c4cb7e1f1', 300.00, 0.00, '', ''),
('jl_f37de3d60aec', 'je_6bb43dc156cf', 'acc_5220', 700.00, 0.00, '', ''),
('jl_f6b43d8484bb', 'je_1414fb2af6d1', 'acc_3110', 0.00, 1000.00, 'Member', 'mem_000026'),
('jl_f788543cdc78', 'je_8a17ec1af4ae', 'acc_3110', 0.00, 1000.00, 'Member', 'mem_7c9db0b04f64'),
('jl_fb71790fb36d', 'je_57359048ee6f', 'acc_4140', 0.00, 500.00, '', ''),
('jl_fb765b0527df', 'je_6bb43dc156cf', 'acc_1110', 0.00, 700.00, 'Cash', 'cash_01'),
('jl_fc586dfac4ee', 'je_d03280f5e07c', 'acc_1110', 0.00, 250.00, 'Cash', 'cash_01'),
('jl_fcc4198f1c31', 'je_f2b6cbe9987c', 'acc_3110', 0.00, 1000.00, 'Member', 'mem_000018'),
('jl_fffd35a53c01', 'je_97d0f635ea08', 'acc_1110', 1000.00, 0.00, 'Member', 'mem_000029');

-- --------------------------------------------------------

--
-- Table structure for table `loans`
--

CREATE TABLE `loans` (
  `id` varchar(50) NOT NULL,
  `loan_account_no` varchar(50) NOT NULL,
  `application_id` varchar(50) DEFAULT NULL,
  `member_id` varchar(50) NOT NULL,
  `loan_product_id` varchar(50) NOT NULL,
  `product_version` int DEFAULT '1',
  `branch_id` varchar(50) NOT NULL,
  `principal_amount` decimal(15,2) NOT NULL,
  `annual_interest_rate` decimal(5,2) NOT NULL,
  `interest_calculation_method` varchar(50) NOT NULL,
  `term_months` int NOT NULL,
  `payment_frequency` varchar(50) NOT NULL,
  `disbursement_date` date NOT NULL,
  `first_due_date` date NOT NULL,
  `maturity_date` date NOT NULL,
  `processing_fee` decimal(15,2) DEFAULT '0.00',
  `service_fee` decimal(15,2) DEFAULT '0.00',
  `net_disbursed` decimal(15,2) NOT NULL,
  `disbursed_from_cash_account_id` varchar(50) NOT NULL,
  `status` enum('Draft','Submitted','Approved','Released','Active','Fully Paid','Past Due','Restructured','Pending') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT 'Submitted',
  `current_balance` decimal(15,2) NOT NULL,
  `total_principal_paid` decimal(15,2) DEFAULT '0.00',
  `total_interest_paid` decimal(15,2) DEFAULT '0.00',
  `total_penalty_paid` decimal(15,2) DEFAULT '0.00',
  `total_fees_paid` decimal(15,2) DEFAULT '0.00',
  `approved_by` varchar(100) DEFAULT NULL,
  `approved_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `loan_amortization_schedules`
--

CREATE TABLE `loan_amortization_schedules` (
  `id` varchar(50) NOT NULL,
  `loan_id` varchar(50) NOT NULL,
  `installment_no` int NOT NULL,
  `due_date` date NOT NULL,
  `principal` decimal(15,2) NOT NULL,
  `interest` decimal(15,2) NOT NULL,
  `fee` decimal(15,2) DEFAULT '0.00',
  `total_installment` decimal(15,2) NOT NULL,
  `principal_balance` decimal(15,2) NOT NULL,
  `paid_principal` decimal(15,2) DEFAULT '0.00',
  `paid_interest` decimal(15,2) DEFAULT '0.00',
  `paid_penalty` decimal(15,2) DEFAULT '0.00',
  `paid_date` date DEFAULT NULL,
  `status` enum('Unpaid','Partially Paid','Paid','Overdue') DEFAULT 'Unpaid'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `loan_amortization_schedules`
--

INSERT INTO `loan_amortization_schedules` (`id`, `loan_id`, `installment_no`, `due_date`, `principal`, `interest`, `fee`, `total_installment`, `principal_balance`, `paid_principal`, `paid_interest`, `paid_penalty`, `paid_date`, `status`) VALUES
('las_0af818c3a472', 'ln_f46a9df33e22', 9, '2027-06-24', 2500.00, 50.00, 0.00, 2550.00, 7500.00, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_0d4164f1ba48', 'ln_296c6ba63756', 9, '2027-06-24', 833.33, 27.78, 0.00, 861.11, 2500.00, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_130d9f020511', 'ln_8401ad89455c', 7, '2027-04-24', 2500.00, 75.00, 0.00, 2575.00, 12500.00, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_132d9d6b7def', 'ln_3e565468098c', 5, '2027-02-24', 833.33, 55.56, 0.00, 888.89, 5833.33, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_19370d358762', 'ln_f46a9df33e22', 8, '2027-05-24', 2500.00, 62.50, 0.00, 2562.50, 10000.00, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_29dfae5404b5', 'ln_8401ad89455c', 6, '2027-03-24', 2500.00, 87.50, 0.00, 2587.50, 15000.00, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_2dd17bc59b6d', 'ln_296c6ba63756', 6, '2027-03-24', 833.33, 48.61, 0.00, 881.94, 5000.00, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_338979ccc37f', 'ln_f46a9df33e22', 5, '2027-02-24', 2500.00, 100.00, 0.00, 2600.00, 17500.00, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_36d7178dc798', 'ln_3e565468098c', 9, '2027-06-24', 833.33, 27.78, 0.00, 861.11, 2500.00, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_36e87092c4db', 'ln_8401ad89455c', 1, '2026-10-24', 2500.00, 150.00, 0.00, 2650.00, 27500.00, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_38d785b6bfc6', 'ln_296c6ba63756', 10, '2027-07-24', 833.33, 20.83, 0.00, 854.17, 1666.67, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_3bfff71119a5', 'ln_296c6ba63756', 1, '2026-10-24', 833.33, 83.33, 0.00, 916.67, 9166.67, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_427096f3f200', 'ln_3e565468098c', 7, '2027-04-24', 833.33, 41.67, 0.00, 875.00, 4166.67, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_447b305df856', 'ln_8401ad89455c', 3, '2026-12-24', 2500.00, 125.00, 0.00, 2625.00, 22500.00, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_46393ceab60d', 'ln_8401ad89455c', 4, '2027-01-24', 2500.00, 112.50, 0.00, 2612.50, 20000.00, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_4a735b8ea86e', 'ln_f46a9df33e22', 3, '2026-12-24', 2500.00, 125.00, 0.00, 2625.00, 22500.00, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_4e244a1a7bf0', 'ln_8401ad89455c', 9, '2027-06-24', 2500.00, 50.00, 0.00, 2550.00, 7500.00, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_596ba67a27a3', 'ln_f46a9df33e22', 12, '2027-09-24', 2500.00, 12.50, 0.00, 2512.50, 0.00, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_5edacfb3de90', 'ln_3e565468098c', 10, '2027-07-24', 833.33, 20.83, 0.00, 854.17, 1666.67, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_6809efd5f11f', 'ln_296c6ba63756', 7, '2027-04-24', 833.33, 41.67, 0.00, 875.00, 4166.67, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_6c8fae33a0a2', 'ln_296c6ba63756', 5, '2027-02-24', 833.33, 55.56, 0.00, 888.89, 5833.33, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_76fcd80d97f0', 'ln_8401ad89455c', 2, '2026-11-24', 2500.00, 137.50, 0.00, 2637.50, 25000.00, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_7e1cd37cd85d', 'ln_296c6ba63756', 4, '2027-01-24', 833.33, 62.50, 0.00, 895.83, 6666.67, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_7f3fee14f874', 'ln_f46a9df33e22', 11, '2027-08-24', 2500.00, 25.00, 0.00, 2525.00, 2500.00, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_827a28d3540e', 'ln_8401ad89455c', 5, '2027-02-24', 2500.00, 100.00, 0.00, 2600.00, 17500.00, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_872b4f70b8fb', 'ln_f46a9df33e22', 7, '2027-04-24', 2500.00, 75.00, 0.00, 2575.00, 12500.00, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_8a2c32a04053', 'ln_3e565468098c', 1, '2026-10-24', 833.33, 83.33, 0.00, 916.67, 9166.67, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_8d53d0d88c45', 'ln_f46a9df33e22', 10, '2027-07-24', 2500.00, 37.50, 0.00, 2537.50, 5000.00, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_8e8e28711b95', 'ln_3e565468098c', 3, '2026-12-24', 833.33, 69.44, 0.00, 902.78, 7500.00, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_929078283c9c', 'ln_3e565468098c', 6, '2027-03-24', 833.33, 48.61, 0.00, 881.94, 5000.00, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_937bc9228d51', 'ln_296c6ba63756', 12, '2027-09-24', 833.33, 6.94, 0.00, 840.28, 0.00, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_95fcf9544489', 'ln_f46a9df33e22', 1, '2026-10-24', 2500.00, 150.00, 0.00, 2650.00, 27500.00, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_96dc17ef5812', 'ln_296c6ba63756', 3, '2026-12-24', 833.33, 69.44, 0.00, 902.78, 7500.00, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_99f105473bb9', 'ln_8401ad89455c', 8, '2027-05-24', 2500.00, 62.50, 0.00, 2562.50, 10000.00, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_9eb72f73007c', 'ln_3e565468098c', 4, '2027-01-24', 833.33, 62.50, 0.00, 895.83, 6666.67, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_a76becf9e3f1', 'ln_3e565468098c', 12, '2027-09-24', 833.33, 6.94, 0.00, 840.28, 0.00, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_ad91afab4a47', 'ln_3e565468098c', 11, '2027-08-24', 833.33, 13.89, 0.00, 847.22, 833.33, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_b7d5b5344dec', 'ln_f46a9df33e22', 6, '2027-03-24', 2500.00, 87.50, 0.00, 2587.50, 15000.00, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_c026410a0e97', 'ln_8401ad89455c', 11, '2027-08-24', 2500.00, 25.00, 0.00, 2525.00, 2500.00, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_ca1beb66ad56', 'ln_f46a9df33e22', 4, '2027-01-24', 2500.00, 112.50, 0.00, 2612.50, 20000.00, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_ca6a57709541', 'ln_8401ad89455c', 10, '2027-07-24', 2500.00, 37.50, 0.00, 2537.50, 5000.00, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_cadda54c9093', 'ln_f46a9df33e22', 2, '2026-11-24', 2500.00, 137.50, 0.00, 2637.50, 25000.00, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_d37a92aa3d50', 'ln_3e565468098c', 8, '2027-05-24', 833.33, 34.72, 0.00, 868.06, 3333.33, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_df95507d9c82', 'ln_3e565468098c', 2, '2026-11-24', 833.33, 76.39, 0.00, 909.72, 8333.33, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_dfa7e65f4782', 'ln_8401ad89455c', 12, '2027-09-24', 2500.00, 12.50, 0.00, 2512.50, 0.00, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_f2c2ef8a1c43', 'ln_296c6ba63756', 8, '2027-05-24', 833.33, 34.72, 0.00, 868.06, 3333.33, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_f38292ecdf52', 'ln_296c6ba63756', 11, '2027-08-24', 833.33, 13.89, 0.00, 847.22, 833.33, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_ffdc123a9008', 'ln_296c6ba63756', 2, '2026-11-24', 833.33, 76.39, 0.00, 909.72, 8333.33, 0.00, 0.00, 0.00, NULL, 'Unpaid');

-- --------------------------------------------------------

--
-- Table structure for table `loan_applications`
--

CREATE TABLE `loan_applications` (
  `id` varchar(50) NOT NULL,
  `loan_id` varchar(50) DEFAULT NULL,
  `application_no` varchar(50) NOT NULL,
  `member_id` varchar(50) NOT NULL,
  `loan_product_id` varchar(50) NOT NULL,
  `branch_id` varchar(50) NOT NULL,
  `applied_amount` decimal(15,2) NOT NULL,
  `term_months` int NOT NULL,
  `purpose` text,
  `status` enum('Draft','Submitted','Under Review','Approved','Rejected','Released','Pending') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT 'Draft',
  `submitted_date` date DEFAULT NULL,
  `reviewed_by` varchar(100) DEFAULT NULL,
  `reviewed_date` date DEFAULT NULL,
  `approved_amount` decimal(15,2) DEFAULT NULL,
  `remarks` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `loan_payments`
--

CREATE TABLE `loan_payments` (
  `id` varchar(50) NOT NULL,
  `receipt_no` varchar(50) NOT NULL,
  `loan_id` varchar(50) NOT NULL,
  `member_id` varchar(50) NOT NULL,
  `payment_date` date NOT NULL,
  `total_amount` decimal(15,2) NOT NULL,
  `cash_account_id` varchar(50) NOT NULL,
  `received_by` varchar(100) NOT NULL,
  `journal_entry_id` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `loan_payment_allocations`
--

CREATE TABLE `loan_payment_allocations` (
  `id` varchar(50) NOT NULL,
  `payment_id` varchar(50) NOT NULL,
  `loan_id` varchar(50) NOT NULL,
  `penalty_amount` decimal(15,2) DEFAULT '0.00',
  `interest_amount` decimal(15,2) DEFAULT '0.00',
  `fee_amount` decimal(15,2) DEFAULT '0.00',
  `principal_amount` decimal(15,2) DEFAULT '0.00',
  `allocation_order_applied` json DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `loan_products`
--

CREATE TABLE `loan_products` (
  `id` varchar(50) NOT NULL,
  `code` varchar(50) NOT NULL,
  `name` varchar(150) NOT NULL,
  `description` text,
  `version` int DEFAULT '1',
  `min_amount` decimal(15,2) NOT NULL,
  `max_amount` decimal(15,2) NOT NULL,
  `min_term_months` int DEFAULT NULL,
  `max_term_months` int DEFAULT NULL,
  `annual_interest_rate` decimal(5,2) NOT NULL,
  `default_term_months` int DEFAULT NULL,
  `interest_calculation_method` enum('Diminishing Balance','Flat Rate','Equal Amortization') NOT NULL,
  `payment_frequency` enum('Monthly','Semi-monthly','Weekly','Lump Sum') NOT NULL,
  `grace_period_days` int DEFAULT '0',
  `processing_fee_percentage` decimal(5,2) NOT NULL DEFAULT '0.00',
  `service_fee_fixed` decimal(12,2) NOT NULL DEFAULT '0.00',
  `penalty_rule_id` varchar(100) DEFAULT NULL,
  `collateral_required` tinyint(1) NOT NULL DEFAULT '0',
  `guarantor_required` tinyint(1) NOT NULL DEFAULT '0',
  `debit_account_id` varchar(100) DEFAULT NULL,
  `required_documents` json DEFAULT NULL,
  `approval_workflow_id` varchar(100) DEFAULT NULL,
  `effective_from` date DEFAULT NULL,
  `effective_until` date DEFAULT NULL,
  `penalty_rate_percentage` decimal(5,2) DEFAULT '2.00',
  `gl_receivable_account_id` varchar(50) NOT NULL,
  `gl_interest_income_account_id` varchar(50) NOT NULL,
  `active` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `loan_products`
--

INSERT INTO `loan_products` (`id`, `code`, `name`, `description`, `version`, `min_amount`, `max_amount`, `min_term_months`, `max_term_months`, `annual_interest_rate`, `default_term_months`, `interest_calculation_method`, `payment_frequency`, `grace_period_days`, `processing_fee_percentage`, `service_fee_fixed`, `penalty_rule_id`, `collateral_required`, `guarantor_required`, `debit_account_id`, `required_documents`, `approval_workflow_id`, `effective_from`, `effective_until`, `penalty_rate_percentage`, `gl_receivable_account_id`, `gl_interest_income_account_id`, `active`) VALUES
('lp_regular', 'LP-REG', 'Regular Multi-Purpose Loan', 'Standard term loan for regular members with 10% annual diminishing balance', 1, 10000.00, 300000.00, 6, 12, 10.00, 12, 'Diminishing Balance', 'Monthly', 5, 2.00, 250.00, 'pen_standard', 0, 1, 'acc_1210', '[\"Valid Government ID\", \"Payslip / Income Proof\", \"Co-maker Agreement\"]', 'wf_loan_standard', '2025-01-01', NULL, 0.00, 'acc_1210', 'acc_4110', 1);

-- --------------------------------------------------------

--
-- Table structure for table `loan_product_versions`
--

CREATE TABLE `loan_product_versions` (
  `id` varchar(50) NOT NULL,
  `loan_product_id` varchar(50) NOT NULL,
  `version_number` int NOT NULL,
  `annual_interest_rate` decimal(5,2) NOT NULL,
  `interest_calculation_method` varchar(50) NOT NULL,
  `effective_from` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `changed_by` varchar(100) DEFAULT NULL,
  `reason` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `members`
--

CREATE TABLE `members` (
  `id` varchar(50) NOT NULL,
  `member_no` varchar(50) NOT NULL,
  `branch_id` varchar(50) NOT NULL,
  `member_type_id` varchar(50) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `middle_name` varchar(100) DEFAULT NULL,
  `gender` enum('Male','Female','Other') NOT NULL,
  `birthdate` date NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `phone` varchar(50) NOT NULL,
  `address` text NOT NULL,
  `status` enum('Active','Pending Approval','Inactive','Terminated','Deceased') DEFAULT 'Pending Approval',
  `joined_date` date NOT NULL,
  `custom_field_values` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `members`
--

INSERT INTO `members` (`id`, `member_no`, `branch_id`, `member_type_id`, `first_name`, `last_name`, `middle_name`, `gender`, `birthdate`, `email`, `phone`, `address`, `status`, `joined_date`, `custom_field_values`, `created_at`, `updated_at`) VALUES
('mem_000001', 'MEM-2026-0001', 'branch_tar', 'mt_regular', 'Jeffrey', 'Acido', 'Asio', 'Male', '1985-03-21', 'jeffrey.asio@example.com', '09171234501', 'Barangay Care Tarlac City, Tarlac', 'Active', '2026-01-15', '{\"notes\": \"\", \"occupation\": \"Farmer\", \"tin_number\": \"\", \"civil_status\": \"Married\", \"monthly_income\": 10000}', '2026-09-12 01:57:16', '2026-10-06 00:49:31'),
('mem_000002', 'MEM-2026-0002', 'branch_tar', 'mt_regular', 'Jomar', 'Acido', 'Asio', 'Male', '1981-09-08', 'jomar.asio@example.com', '09171234502', 'Barangay Care Tarlac City, Tarlac', 'Active', '2026-01-15', '{\"occupation\": \"Farmer\", \"civil_status\": \"Married\", \"monthly_income\": 10000}', '2026-09-12 01:57:16', '2026-09-12 01:57:16'),
('mem_000003', 'MEM-2026-0003', 'branch_tar', 'mt_regular', 'Thomas Rey', 'Bagsic', 'Mejia', 'Male', '1987-07-11', 'thomas.mera@example.com', '09150025186', 'Barangay Care Tarlac City, Tarlac', 'Active', '2026-01-15', '{\"notes\": \"\", \"id_photo\": {\"name\": \"Screenshot 2026-10-02 234116.png\", \"path\": \"/assets/members/mem_000003/Screenshot_2026-10-02_234116_1790955687.png\", \"size\": 79879, \"type\": \"image/png\", \"file_name\": \"Screenshot_2026-10-02_234116_1790955687.png\", \"uploaded_at\": \"2026-10-02T15:41:27.098Z\"}, \"occupation\": \"Farmer\", \"tin_number\": \"\", \"civil_status\": \"Married\", \"monthly_income\": 10000}', '2026-09-12 01:57:16', '2026-10-02 15:41:27'),
('mem_000004', 'MEM-2026-0004', 'branch_tar', 'mt_regular', 'Jordan', 'Calma', 'Ibarra', 'Male', '1975-10-23', 'jordan.ibarra@example.com', '09551757833', 'Barangay Care Tarlac City, Tarlac', 'Active', '2026-01-15', '{\"notes\": \"\", \"id_photo\": {\"name\": \"Screenshot 2026-10-02 175053.png\", \"path\": \"/assets/members/mem_000004/Screenshot_2026-10-02_175053_1790952663.png\", \"size\": 99343, \"type\": \"image/png\", \"file_name\": \"Screenshot_2026-10-02_175053_1790952663.png\", \"uploaded_at\": \"2026-10-02T14:51:03.720Z\"}, \"custom_656\": {\"name\": \"829584929_1423167106410525_5751546283241510742_n.jpg\", \"path\": \"/assets/members/mem_000004/829584929_1423167106410525_5751546283241510742_n_1790952713.jpg\", \"size\": 152569, \"type\": \"image/jpeg\", \"file_name\": \"829584929_1423167106410525_5751546283241510742_n_1790952713.jpg\", \"uploaded_at\": \"2026-10-02T14:51:53.456Z\"}, \"custom_670\": {\"name\": \"Screenshot 2026-10-02 233401.png\", \"path\": \"/assets/members/mem_000004/Screenshot_2026-10-02_233401_1790955255.png\", \"size\": 384435, \"type\": \"image/png\", \"file_name\": \"Screenshot_2026-10-02_233401_1790955255.png\", \"uploaded_at\": \"2026-10-02T15:34:15.555Z\"}, \"occupation\": \"Farmer\", \"tin_number\": \"\", \"civil_status\": \"Single\", \"monthly_income\": 10000, \"marriage_certificate\": {\"name\": \"Calma, Jordan I. ( Marriage Certificate ).pdf\", \"path\": \"/assets/members/mem_000004/Calma__Jordan_I.___Marriage_Certificate_1790952674.pdf\", \"size\": 434551, \"type\": \"application/pdf\", \"file_name\": \"Calma__Jordan_I.___Marriage_Certificate_1790952674.pdf\", \"uploaded_at\": \"2026-10-02T14:51:14.306Z\"}}', '2026-09-12 01:57:16', '2026-10-02 15:34:15'),
('mem_000005', 'MEM-2026-0005', 'branch_tar', 'mt_regular', 'Dionicio', 'Curioso', 'Morla', 'Male', '1961-07-20', 'dionicio.morla@example.com', '09171234505', 'Barangay Care Tarlac City, Tarlac', 'Active', '2026-01-15', '{\"notes\": \"\", \"id_photo\": {\"name\": \"Screenshot 2026-10-02 233521.png\", \"path\": \"/assets/members/mem_000005/Screenshot_2026-10-02_233521_1790955333.png\", \"size\": 410747, \"type\": \"image/png\", \"file_name\": \"Screenshot_2026-10-02_233521_1790955333.png\", \"uploaded_at\": \"2026-10-02T15:35:33.742Z\"}, \"occupation\": \"Farmer\", \"tin_number\": \"776-009-500-000\", \"civil_status\": \"Married\", \"monthly_income\": 10000}', '2026-09-12 01:57:16', '2026-10-02 15:35:33'),
('mem_000006', 'MEM-2026-0006', 'branch_tar', 'mt_regular', 'Marites', 'Curioso', 'Luanzon', 'Female', '1966-06-07', 'marites.luanzon@example.com', '09171234506', 'Barangay Care Tarlac City, Tarlac', 'Active', '2026-01-15', '{\"notes\": \"\", \"id_photo\": {\"name\": \"Screenshot 2026-10-02 233502.png\", \"path\": \"/assets/members/mem_000006/Screenshot_2026-10-02_233502_1790955314.png\", \"size\": 112740, \"type\": \"image/png\", \"file_name\": \"Screenshot_2026-10-02_233502_1790955314.png\", \"uploaded_at\": \"2026-10-02T15:35:14.448Z\"}, \"occupation\": \"Farmer\", \"tin_number\": \"457-069-189-000\", \"civil_status\": \"Married\", \"monthly_income\": 10000}', '2026-09-12 01:57:16', '2026-10-02 15:35:14'),
('mem_000007', 'MEM-2026-0007', 'branch_tar', 'mt_regular', 'Lloyd', 'Feliciano', 'Dulay', 'Male', '1994-11-26', 'lloyd.edlay@example.com', '09171234507', 'Barangay Care Tarlac City, Tarlac', 'Active', '2026-01-15', '{\"notes\": \"\", \"id_photo\": {\"name\": \"b07d3a0c-397c-4bc8-9b00-b74614702218.jfif\", \"path\": \"/assets/members/mem_000007/b07d3a0c-397c-4bc8-9b00-b74614702218_1790955575.jpg\", \"size\": 81764, \"type\": \"image/jpeg\", \"file_name\": \"b07d3a0c-397c-4bc8-9b00-b74614702218_1790955575.jpg\", \"uploaded_at\": \"2026-10-02T15:39:35.170Z\"}, \"occupation\": \"Farmer\", \"tin_number\": \"757-207-826-000\", \"civil_status\": \"Married\", \"monthly_income\": 10000}', '2026-09-12 01:57:16', '2026-10-07 06:41:25'),
('mem_000008', 'MEM-2026-0008', 'branch_tar', 'mt_regular', 'Jhomel', 'Ignacio', 'Luanzon', 'Male', '1996-06-08', 'jhomel.luanzon@example.com', '09352989795', 'Barangay Care Tarlac City, Tarlac', 'Active', '2026-01-15', '{\"notes\": \"\", \"custom_266\": \"02-3808608-7\", \"custom_391\": \"1211-4535-3330\", \"custom_516\": \"07-050957526-4\", \"occupation\": \"Farmer\", \"tin_number\": \"321-628-243-000\", \"civil_status\": \"Single\", \"monthly_income\": 10000}', '2026-09-12 01:57:16', '2026-10-02 09:17:00'),
('mem_000009', 'MEM-2026-0009', 'branch_tar', 'mt_regular', 'John Marck L.', 'Ignacio', '', 'Male', '1990-10-19', 'johnmark.ignacio@example.com', '09077666374', 'Barangay Care Tarlac City, Tarlac', 'Active', '2026-01-15', '{\"notes\": \"carecooperative11262025+09@gmail.com\\nMember09-2026\\nARN O26J17AHCUI995\", \"id_photo\": {\"name\": \"1b180485-d772-4457-a720-0dbd49b570a4.jfif\", \"path\": \"/assets/members/mem_000009/1b180485-d772-4457-a720-0dbd49b570a4_1790955593.jpg\", \"size\": 202442, \"type\": \"image/jpeg\", \"file_name\": \"1b180485-d772-4457-a720-0dbd49b570a4_1790955593.jpg\", \"uploaded_at\": \"2026-10-02T15:39:53.324Z\"}, \"occupation\": \"Farmer\", \"tin_number\": \"\", \"civil_status\": \"Single\", \"monthly_income\": 10000}', '2026-09-12 01:57:16', '2026-10-02 15:39:53'),
('mem_000010', 'MEM-2026-0010', 'branch_tar', 'mt_regular', 'Luis Jr', 'Ignacio', 'Galang', 'Male', '1970-05-10', 'luis.galang@example.com', '09352989795', 'Barangay Care Tarlac City, Tarlac', 'Active', '2026-01-15', '{\"notes\": \"\", \"id_photo\": {\"name\": \"Screenshot 2026-10-02 234003.png\", \"path\": \"/assets/members/mem_000010/Screenshot_2026-10-02_234003_1790955618.png\", \"size\": 663031, \"type\": \"image/png\", \"file_name\": \"Screenshot_2026-10-02_234003_1790955618.png\", \"uploaded_at\": \"2026-10-02T15:40:18.307Z\"}, \"occupation\": \"Farmer\", \"tin_number\": \"\", \"civil_status\": \"Single\", \"monthly_income\": 10000}', '2026-09-12 01:57:16', '2026-10-02 15:40:18'),
('mem_000011', 'MEM-2026-0011', 'branch_tar', 'mt_regular', 'Fely', 'LagUNERO', 'Paraiso', 'Female', '1959-03-20', 'hey.marasco@example.com', '09171234511', 'Barangay Care Tarlac City, Tarlac', 'Active', '2026-01-15', '{\"id_photo\": {\"name\": \"Screenshot 2026-10-02 233657.png\", \"path\": \"/assets/members/mem_000011/Screenshot_2026-10-02_233657_1790955431.png\", \"size\": 388240, \"type\": \"image/png\", \"file_name\": \"Screenshot_2026-10-02_233657_1790955431.png\", \"uploaded_at\": \"2026-10-02T15:37:11.847Z\"}, \"occupation\": \"Farmer\", \"civil_status\": \"Married\", \"monthly_income\": 10000}', '2026-09-12 01:57:16', '2026-10-02 15:37:11'),
('mem_000012', 'MEM-2026-0012', 'branch_tar', 'mt_regular', 'Nila', 'Laxamana', 'Tabamo', 'Female', '1962-12-21', 'nila.laxamana@example.com', '09278831742', 'Barangay Care Tarlac City, Tarlac', 'Active', '2026-01-15', '{\"notes\": \"\", \"id_photo\": {\"name\": \"Screenshot 2026-10-02 231552.png\", \"path\": \"/assets/members/mem_000012/Screenshot_2026-10-02_231552_1790954172.png\", \"size\": 162917, \"type\": \"image/png\", \"file_name\": \"Screenshot_2026-10-02_231552_1790954172.png\", \"uploaded_at\": \"2026-10-02T15:16:12.935Z\"}, \"custom_440\": {\"name\": \"Screenshot 2026-10-02 231808.png\", \"path\": \"/assets/members/mem_000012/Screenshot_2026-10-02_231808_1790954323.png\", \"size\": 351522, \"type\": \"image/png\", \"file_name\": \"Screenshot_2026-10-02_231808_1790954323.png\", \"uploaded_at\": \"2026-10-02T15:18:43.585Z\"}, \"custom_656\": {\"name\": \"825309752_2597537207339954_657975428742615958_n.jpg\", \"path\": \"/assets/members/mem_000012/825309752_2597537207339954_657975428742615958_n_1790954187.jpg\", \"size\": 196598, \"type\": \"image/jpeg\", \"file_name\": \"825309752_2597537207339954_657975428742615958_n_1790954187.jpg\", \"uploaded_at\": \"2026-10-02T15:16:27.647Z\"}, \"occupation\": \"Farmer\", \"tin_number\": \"\", \"civil_status\": \"Married\", \"monthly_income\": 10000}', '2026-09-12 01:57:16', '2026-10-02 15:18:43'),
('mem_000013', 'MEM-2026-0013', 'branch_tar', 'mt_regular', 'Renato', 'Laxamana', 'Luanzon', 'Male', '1961-04-29', 'renaldo.luanzon@example.com', '09278831742', 'Barangay Care Tarlac City, Tarlac', 'Active', '2026-01-15', '{\"notes\": \"\", \"id_photo\": {\"name\": \"Screenshot 2026-10-02 231651.png\", \"path\": \"/assets/members/mem_000013/Screenshot_2026-10-02_231651_1790954228.png\", \"size\": 202529, \"type\": \"image/png\", \"file_name\": \"Screenshot_2026-10-02_231651_1790954228.png\", \"uploaded_at\": \"2026-10-02T15:17:08.842Z\"}, \"custom_440\": {\"name\": \"Screenshot 2026-10-02 231808.png\", \"path\": \"/assets/members/mem_000013/Screenshot_2026-10-02_231808_1790954304.png\", \"size\": 351522, \"type\": \"image/png\", \"file_name\": \"Screenshot_2026-10-02_231808_1790954304.png\", \"uploaded_at\": \"2026-10-02T15:18:24.829Z\"}, \"custom_656\": {\"name\": \"825260967_1834387727989189_7264436958515917140_n.jpg\", \"path\": \"/assets/members/mem_000013/825260967_1834387727989189_7264436958515917140_n_1790954243.jpg\", \"size\": 241300, \"type\": \"image/jpeg\", \"file_name\": \"825260967_1834387727989189_7264436958515917140_n_1790954243.jpg\", \"uploaded_at\": \"2026-10-02T15:17:23.137Z\"}, \"occupation\": \"Farmer\", \"tin_number\": \"\", \"civil_status\": \"Married\", \"monthly_income\": 10000}', '2026-09-12 01:57:16', '2026-10-02 15:18:24'),
('mem_000014', 'MEM-2026-0014', 'branch_tar', 'mt_regular', 'Celso', 'Luanzon', 'Aguilar', 'Male', '1968-02-11', 'chiso.aguilar@example.com', '09159731264', 'Barangay Care Tarlac City, Tarlac', 'Active', '2026-01-15', '{\"notes\": \"\", \"id_photo\": {\"name\": \"Screenshot 2026-10-02 234030.png\", \"path\": \"/assets/members/mem_000014/Screenshot_2026-10-02_234030_1790955645.png\", \"size\": 422889, \"type\": \"image/png\", \"file_name\": \"Screenshot_2026-10-02_234030_1790955645.png\", \"uploaded_at\": \"2026-10-02T15:40:45.109Z\"}, \"occupation\": \"Farmer\", \"tin_number\": \"\", \"civil_status\": \"Married\", \"monthly_income\": 10000}', '2026-09-12 01:57:16', '2026-10-02 15:40:45'),
('mem_000015', 'MEM-2026-0015', 'branch_tar', 'mt_regular', 'Fernando Jr', 'Luanzon', 'Taguines', 'Male', '1979-05-27', 'fernando.taglines@example.com', '09491634203', 'Barangay Care Tarlac City, Tarlac', 'Active', '2026-01-15', '{\"notes\": \"jhomignacio08+fer@gmail.com\\nMember01-2026\\nARN O26F17AHKCMHJQ \", \"id_photo\": {\"name\": \"IMG20260929093245.jpg\", \"path\": \"/assets/members/mem_000015/IMG20260929093245_1790953973.jpg\", \"size\": 3244664, \"type\": \"image/jpeg\", \"file_name\": \"IMG20260929093245_1790953973.jpg\", \"uploaded_at\": \"2026-10-02T15:12:53.654Z\"}, \"custom_440\": {\"name\": \"827693139_2196853074193827_2766620351400643009_n.jpg\", \"path\": \"/assets/members/mem_000015/827693139_2196853074193827_2766620351400643009_n_1790953990.jpg\", \"size\": 156496, \"type\": \"image/jpeg\", \"file_name\": \"827693139_2196853074193827_2766620351400643009_n_1790953990.jpg\", \"uploaded_at\": \"2026-10-02T15:13:10.730Z\"}, \"custom_656\": {\"name\": \"829331371_3429943853842425_4520955212035312477_n.jpg\", \"path\": \"/assets/members/mem_000015/829331371_3429943853842425_4520955212035312477_n_1790954858.jpg\", \"size\": 219754, \"type\": \"image/jpeg\", \"file_name\": \"829331371_3429943853842425_4520955212035312477_n_1790954858.jpg\", \"uploaded_at\": \"2026-10-02T15:27:38.330Z\"}, \"custom_670\": {\"name\": \"Screenshot 2026-10-02 233335.png\", \"path\": \"/assets/members/mem_000015/Screenshot_2026-10-02_233335_1790955226.png\", \"size\": 266140, \"type\": \"image/png\", \"file_name\": \"Screenshot_2026-10-02_233335_1790955226.png\", \"uploaded_at\": \"2026-10-02T15:33:46.271Z\"}, \"occupation\": \"Farmer\", \"tin_number\": \"\", \"civil_status\": \"Married\", \"monthly_income\": 10000}', '2026-09-12 01:57:16', '2026-10-02 15:33:46'),
('mem_000016', 'MEM-2026-0016', 'branch_tar', 'mt_regular', 'Jessie Cristian C.', 'Luanzon', '', 'Male', '1994-12-25', 'jessie.luanzon@example.com', '09171234516', 'Barangay Care Tarlac City, Tarlac', 'Active', '2026-01-15', '{\"notes\": \"\", \"id_photo\": {\"name\": \"Screenshot 2026-10-02 232210.png\", \"path\": \"/assets/members/mem_000016/Screenshot_2026-10-02_232210_1790954544.png\", \"size\": 102643, \"type\": \"image/png\", \"file_name\": \"Screenshot_2026-10-02_232210_1790954544.png\", \"uploaded_at\": \"2026-10-02T15:22:24.907Z\"}, \"custom_670\": {\"name\": \"Screenshot 2026-10-02 234053.png\", \"path\": \"/assets/members/mem_000016/Screenshot_2026-10-02_234053_1790955666.png\", \"size\": 366098, \"type\": \"image/png\", \"file_name\": \"Screenshot_2026-10-02_234053_1790955666.png\", \"uploaded_at\": \"2026-10-02T15:41:06.136Z\"}, \"occupation\": \"Farmer\", \"tin_number\": \"475-169-287-000\", \"civil_status\": \"Single\", \"monthly_income\": 10000}', '2026-09-12 01:57:16', '2026-10-02 15:41:06'),
('mem_000017', 'MEM-2026-0017', 'branch_tar', 'mt_regular', 'Jesus Jr. A.', 'Luanzon', '', 'Male', '1975-04-12', 'jesus.luanzon@example.com', '09454069792', 'Barangay Care Tarlac City, Tarlac', 'Active', '2026-01-15', '{\"notes\": \"carecooperative11262025+17@gmail.com\\nMember17-2026\\nARN O26J17AGJAE5KW\", \"id_photo\": {\"name\": \"IMG20260929105236.jpg\", \"path\": \"/assets/members/mem_000017/IMG20260929105236_1790954023.jpg\", \"size\": 5303252, \"type\": \"image/jpeg\", \"file_name\": \"IMG20260929105236_1790954023.jpg\", \"uploaded_at\": \"2026-10-02T15:13:43.288Z\"}, \"custom_440\": {\"name\": \"IMG20260929105316.jpg\", \"path\": \"/assets/members/mem_000017/IMG20260929105316_1790954035.jpg\", \"size\": 9053294, \"type\": \"image/jpeg\", \"file_name\": \"IMG20260929105316_1790954035.jpg\", \"uploaded_at\": \"2026-10-02T15:13:54.762Z\"}, \"custom_656\": {\"name\": \"IMG20260929105253.jpg\", \"path\": \"/assets/members/mem_000017/IMG20260929105253_1790954041.jpg\", \"size\": 2781204, \"type\": \"image/jpeg\", \"file_name\": \"IMG20260929105253_1790954041.jpg\", \"uploaded_at\": \"2026-10-02T15:14:01.164Z\"}, \"occupation\": \"Farmer\", \"tin_number\": \"698560059-00000\", \"civil_status\": \"Single\", \"monthly_income\": 10000}', '2026-09-12 01:57:16', '2026-10-02 15:14:01'),
('mem_000018', 'MEM-2026-0018', 'branch_tar', 'mt_regular', 'Jobert', 'Luanzon', 'Mamaclay', 'Male', '1992-04-24', 'robert.mamaclay@example.com', '09166317224', 'Barangay Care Tarlac City, Tarlac', 'Active', '2026-01-15', '{\"notes\": \"jhomignacio08+jobert@gmail.com\\nMember18-2026\\nARN O26J17AUR36HVB\", \"id_photo\": {\"name\": \"IMG20260929104822.jpg\", \"path\": \"/assets/members/mem_000018/IMG20260929104822_1790954095.jpg\", \"size\": 3219022, \"type\": \"image/jpeg\", \"file_name\": \"IMG20260929104822_1790954095.jpg\", \"uploaded_at\": \"2026-10-02T15:14:55.007Z\"}, \"custom_440\": {\"name\": \"IMG20260929105212.jpg\", \"path\": \"/assets/members/mem_000018/IMG20260929105212_1790954103.jpg\", \"size\": 7685057, \"type\": \"image/jpeg\", \"file_name\": \"IMG20260929105212_1790954103.jpg\", \"uploaded_at\": \"2026-10-02T15:15:03.228Z\"}, \"custom_656\": {\"name\": \"IMG20260929104920.jpg\", \"path\": \"/assets/members/mem_000018/IMG20260929104920_1790954119.jpg\", \"size\": 2004164, \"type\": \"image/jpeg\", \"file_name\": \"IMG20260929104920_1790954119.jpg\", \"uploaded_at\": \"2026-10-02T15:15:18.958Z\"}, \"occupation\": \"Farmer\", \"tin_number\": \"\", \"civil_status\": \"Single\", \"monthly_income\": 10000}', '2026-09-12 01:57:16', '2026-10-02 15:15:19'),
('mem_000019', 'MEM-2026-0019', 'branch_tar', 'mt_regular', 'Marciano', 'Luanzon', 'Aguilar', 'Male', '1978-10-06', 'marciano.aguilar@example.com', '09171234519', 'Barangay Care Tarlac City, Tarlac', 'Active', '2026-01-15', '{\"notes\": \"\", \"id_photo\": {\"name\": \"Screenshot 2026-10-02 232338.png\", \"path\": \"/assets/members/mem_000019/Screenshot_2026-10-02_232338_1790954636.png\", \"size\": 304117, \"type\": \"image/png\", \"file_name\": \"Screenshot_2026-10-02_232338_1790954636.png\", \"uploaded_at\": \"2026-10-02T15:23:56.582Z\"}, \"custom_440\": {\"name\": \"Screenshot 2026-10-02 232130.png\", \"path\": \"/assets/members/mem_000019/Screenshot_2026-10-02_232130_1790954510.png\", \"size\": 873274, \"type\": \"image/png\", \"file_name\": \"Screenshot_2026-10-02_232130_1790954510.png\", \"uploaded_at\": \"2026-10-02T15:21:50.290Z\"}, \"custom_670\": {\"name\": \"Screenshot 2026-10-02 233546.png\", \"path\": \"/assets/members/mem_000019/Screenshot_2026-10-02_233546_1790955359.png\", \"size\": 266077, \"type\": \"image/png\", \"file_name\": \"Screenshot_2026-10-02_233546_1790955359.png\", \"uploaded_at\": \"2026-10-02T15:35:59.866Z\"}, \"occupation\": \"Farmer\", \"tin_number\": \"449-328-303-000\", \"civil_status\": \"Married\", \"monthly_income\": 10000}', '2026-09-12 01:57:16', '2026-10-07 06:42:39'),
('mem_000020', 'MEM-2026-0020', 'branch_tar', 'mt_regular', 'Marjorie', 'Luanzon', 'Cuaresma', 'Male', '1978-03-25', 'marjorie.cuaresma@example.com', '09539646620', 'Barangay Care Tarlac City, Tarlac', 'Active', '2026-01-15', '{\"notes\": \"\", \"id_photo\": {\"name\": \"Screenshot 2026-10-02 233837.png\", \"path\": \"/assets/members/mem_000020/Screenshot_2026-10-02_233837_1790955535.png\", \"size\": 613515, \"type\": \"image/png\", \"file_name\": \"Screenshot_2026-10-02_233837_1790955535.png\", \"uploaded_at\": \"2026-10-02T15:38:55.615Z\"}, \"occupation\": \"Farmer\", \"tin_number\": \"\", \"civil_status\": \"Married\", \"monthly_income\": 10000}', '2026-09-12 01:57:16', '2026-10-02 15:38:55'),
('mem_000021', 'MEM-2026-0021', 'branch_tar', 'mt_regular', 'Roberto A.', 'Luanzon', '', 'Male', '1964-07-28', 'roberto.luanzon@example.com', '09454071621', 'Barangay Care Tarlac City, Tarlac', 'Active', '2026-01-15', '{\"notes\": \"Member02-2026\\njhomignacio08+roberto@gmail.com\\nARN O26R17AKY3SINH \", \"id_photo\": {\"name\": \"IMG20260929104114.jpg\", \"path\": \"/assets/members/mem_000021/IMG20260929104114_1790954428.jpg\", \"size\": 3718861, \"type\": \"image/jpeg\", \"file_name\": \"IMG20260929104114_1790954428.jpg\", \"uploaded_at\": \"2026-10-02T15:20:27.884Z\"}, \"custom_440\": {\"name\": \"IMG20260929104441.jpg\", \"path\": \"/assets/members/mem_000021/IMG20260929104441_1790954436.jpg\", \"size\": 7605818, \"type\": \"image/jpeg\", \"file_name\": \"IMG20260929104441_1790954436.jpg\", \"uploaded_at\": \"2026-10-02T15:20:36.193Z\"}, \"custom_670\": {\"name\": \"Screenshot 2026-10-02 233308.png\", \"path\": \"/assets/members/mem_000021/Screenshot_2026-10-02_233308_1790955202.png\", \"size\": 187584, \"type\": \"image/png\", \"file_name\": \"Screenshot_2026-10-02_233308_1790955202.png\", \"uploaded_at\": \"2026-10-02T15:33:22.385Z\"}, \"occupation\": \"Farmer\", \"tin_number\": \"\", \"civil_status\": \"Married\", \"monthly_income\": 10000}', '2026-09-12 01:57:16', '2026-10-02 15:33:22'),
('mem_000022', 'MEM-2026-0022', 'branch_tar', 'mt_regular', 'Catalino Jr. L.', 'Mejia', '', 'Male', '1957-11-25', 'catalino.mejia@example.com', '09171234522', 'Barangay Care Tarlac City, Tarlac', 'Active', '2026-01-15', '{\"notes\": \"\", \"id_photo\": {\"name\": \"Screenshot 2026-10-02 232416.png\", \"path\": \"/assets/members/mem_000022/Screenshot_2026-10-02_232416_1790954674.png\", \"size\": 262677, \"type\": \"image/png\", \"file_name\": \"Screenshot_2026-10-02_232416_1790954674.png\", \"uploaded_at\": \"2026-10-02T15:24:34.508Z\"}, \"custom_670\": {\"name\": \"Screenshot 2026-10-02 233102.png\", \"path\": \"/assets/members/mem_000022/Screenshot_2026-10-02_233102_1790955131.png\", \"size\": 406633, \"type\": \"image/png\", \"file_name\": \"Screenshot_2026-10-02_233102_1790955131.png\", \"uploaded_at\": \"2026-10-02T15:32:11.762Z\"}, \"occupation\": \"Farmer\", \"tin_number\": \"207-966-700-000\", \"civil_status\": \"Married\", \"monthly_income\": 10000}', '2026-09-12 01:57:16', '2026-10-07 06:42:57'),
('mem_000023', 'MEM-2026-0023', 'branch_tar', 'mt_regular', 'Dominador Almodivar Jr.', 'Ocampo', '', 'Male', '1962-01-26', 'dominador.almodivar@example.com', '09171234523', 'Barangay Care Tarlac City, Tarlac', 'Active', '2026-01-15', '{\"notes\": \"\", \"id_photo\": {\"name\": \"Screenshot 2026-10-02 231951.png\", \"path\": \"/assets/members/mem_000023/Screenshot_2026-10-02_231951_1790954406.png\", \"size\": 180891, \"type\": \"image/png\", \"file_name\": \"Screenshot_2026-10-02_231951_1790954406.png\", \"uploaded_at\": \"2026-10-02T15:20:06.701Z\"}, \"custom_670\": {\"name\": \"Screenshot 2026-10-02 233730.png\", \"path\": \"/assets/members/mem_000023/Screenshot_2026-10-02_233730_1790955463.png\", \"size\": 179500, \"type\": \"image/png\", \"file_name\": \"Screenshot_2026-10-02_233730_1790955463.png\", \"uploaded_at\": \"2026-10-02T15:37:43.228Z\"}, \"occupation\": \"Farmer\", \"tin_number\": \"122-704-469-000\", \"civil_status\": \"Married\", \"monthly_income\": 10000}', '2026-09-12 01:57:16', '2026-10-02 15:37:43'),
('mem_000024', 'MEM-2026-0024', 'branch_tar', 'mt_regular', 'Joselito', 'Perez', 'Espinosa', 'Male', '1972-07-16', 'joselito.espinosa@example.com', '09171234524', 'Barangay Care Tarlac City, Tarlac', 'Active', '2026-01-15', '{\"notes\": \"\", \"id_photo\": {\"name\": \"Screenshot 2026-10-02 233432.png\", \"path\": \"/assets/members/mem_000024/Screenshot_2026-10-02_233432_1790955286.png\", \"size\": 287281, \"type\": \"image/png\", \"file_name\": \"Screenshot_2026-10-02_233432_1790955286.png\", \"uploaded_at\": \"2026-10-02T15:34:46.920Z\"}, \"occupation\": \"Farmer\", \"tin_number\": \"\", \"civil_status\": \"Married\", \"monthly_income\": 10000}', '2026-09-12 01:57:16', '2026-10-02 15:34:46'),
('mem_000025', 'MEM-2026-0025', 'branch_tar', 'mt_regular', 'Rocky', 'Retomalta', 'Gervacio', 'Male', '1986-08-06', 'rocky.gervacio@example.com', '09171234525', 'Barangay Care Tarlac City, Tarlac', 'Active', '2026-01-15', '{\"id_photo\": {\"name\": \"Screenshot 2026-10-02 232645.png\", \"path\": \"/assets/members/mem_000025/Screenshot_2026-10-02_232645_1790954821.png\", \"size\": 263423, \"type\": \"image/png\", \"file_name\": \"Screenshot_2026-10-02_232645_1790954821.png\", \"uploaded_at\": \"2026-10-02T15:27:01.628Z\"}, \"custom_656\": {\"name\": \"825309746_1091061147110611_1385501748127571778_n.jpg\", \"path\": \"/assets/members/mem_000025/825309746_1091061147110611_1385501748127571778_n_1790954837.jpg\", \"size\": 144990, \"type\": \"image/jpeg\", \"file_name\": \"825309746_1091061147110611_1385501748127571778_n_1790954837.jpg\", \"uploaded_at\": \"2026-10-02T15:27:17.428Z\"}, \"occupation\": \"Farmer\", \"civil_status\": \"Married\", \"monthly_income\": 10000}', '2026-09-12 01:57:16', '2026-10-02 15:27:17'),
('mem_000026', 'MEM-2026-0026', 'branch_tar', 'mt_regular', 'Rafael', 'Retomalta', 'Gervacio', 'Male', '1984-01-08', 'rafael.retomalta@example.com', '09454071625', 'Barangay Care Tarlac City, Tarlac', 'Active', '2026-01-15', '{\"notes\": \"\", \"id_photo\": {\"name\": \"Screenshot 2026-10-02 233236.png\", \"path\": \"/assets/members/mem_000026/Screenshot_2026-10-02_233236_1790955169.png\", \"size\": 329372, \"type\": \"image/png\", \"file_name\": \"Screenshot_2026-10-02_233236_1790955169.png\", \"uploaded_at\": \"2026-10-02T15:32:49.573Z\"}, \"occupation\": \"Farmer\", \"tin_number\": \"\", \"civil_status\": \"\", \"monthly_income\": 10000}', '2026-09-29 04:00:00', '2026-10-02 15:32:49'),
('mem_000027', 'MEM-2026-0027', 'branch_tar', 'mt_regular', 'Gibson D.', 'Romero', '', 'Male', '1958-05-24', 'gibson.romero@example.com', '09170000027', 'Barangay Care Tarlac City, Tarlac', 'Active', '2026-01-15', '{\"occupation\": \"Farmer\", \"civil_status\": \"\", \"monthly_income\": 10000}', '2026-09-29 04:00:00', '2026-09-29 04:00:00'),
('mem_000028', 'MEM-2026-0028', 'branch_tar', 'mt_regular', 'Jayson', 'Santos', 'Mallari', 'Male', '1979-10-12', 'jayson.santos@example.com', '09170000028', 'Barangay Care Tarlac City, Tarlac', 'Active', '2026-01-15', '{\"notes\": \"\", \"id_photo\": {\"name\": \"3a3212b9-243d-4d95-bbb0-dee4dfa8d4d6.jfif\", \"path\": \"/assets/members/mem_000028/3a3212b9-243d-4d95-bbb0-dee4dfa8d4d6_1790955406.jpg\", \"size\": 42233, \"type\": \"image/jpeg\", \"file_name\": \"3a3212b9-243d-4d95-bbb0-dee4dfa8d4d6_1790955406.jpg\", \"uploaded_at\": \"2026-10-02T15:36:46.165Z\"}, \"occupation\": \"Farmer\", \"tin_number\": \"447-698-076-000\", \"civil_status\": \"\", \"monthly_income\": 10000}', '2026-09-29 04:00:00', '2026-10-07 06:42:02'),
('mem_000029', 'MEM-2026-0029', 'branch_tar', 'mt_regular', 'Marjay', 'Santos', 'Mallari', 'Male', '1984-09-16', 'marjay.santos@example.com', '09127755316', 'Barangay Care Tarlac City, Tarlac', 'Active', '2026-01-15', '{\"notes\": \"carecooperative11262025+29@gmail.com\\nMember29-2026\\nARN O26M17AQAL6420 \", \"id_photo\": {\"name\": \"IMG20260929105013.jpg\", \"path\": \"/assets/members/mem_000029/IMG20260929105013_1790954347.jpg\", \"size\": 4492091, \"type\": \"image/jpeg\", \"file_name\": \"IMG20260929105013_1790954347.jpg\", \"uploaded_at\": \"2026-10-02T15:19:06.821Z\"}, \"custom_440\": {\"name\": \"825261099_3002739980067066_7739913278338405786_n.jpg\", \"path\": \"/assets/members/mem_000029/825261099_3002739980067066_7739913278338405786_n_1790954351.jpg\", \"size\": 444668, \"type\": \"image/jpeg\", \"file_name\": \"825261099_3002739980067066_7739913278338405786_n_1790954351.jpg\", \"uploaded_at\": \"2026-10-02T15:19:11.686Z\"}, \"custom_656\": {\"name\": \"IMG20260929105035.jpg\", \"path\": \"/assets/members/mem_000029/IMG20260929105035_1790954355.jpg\", \"size\": 3237168, \"type\": \"image/jpeg\", \"file_name\": \"IMG20260929105035_1790954355.jpg\", \"uploaded_at\": \"2026-10-02T15:19:15.224Z\"}, \"occupation\": \"Farmer\", \"tin_number\": \"479-235-022-00000\", \"civil_status\": \"\", \"monthly_income\": 10000}', '2026-09-29 04:00:00', '2026-10-02 15:19:15'),
('mem_000030', 'MEM-2026-0030', 'branch_tar', 'mt_regular', 'August', 'Tagubansa', 'Villarico', 'Male', '1979-07-03', 'august.tacubansa@example.com', '09532972679', 'Barangay Care Tarlac City, Tarlac', 'Active', '2026-01-15', '{\"notes\": \"\", \"id_photo\": {\"name\": \"Screenshot 2026-10-02 232804.png\", \"path\": \"/assets/members/mem_000030/Screenshot_2026-10-02_232804_1790954914.png\", \"size\": 374933, \"type\": \"image/png\", \"file_name\": \"Screenshot_2026-10-02_232804_1790954914.png\", \"uploaded_at\": \"2026-10-02T15:28:34.682Z\"}, \"custom_670\": {\"name\": \"Screenshot 2026-10-02 233755.png\", \"path\": \"/assets/members/mem_000030/Screenshot_2026-10-02_233755_1790955488.png\", \"size\": 405411, \"type\": \"image/png\", \"file_name\": \"Screenshot_2026-10-02_233755_1790955488.png\", \"uploaded_at\": \"2026-10-02T15:38:08.863Z\"}, \"occupation\": \"Farmer\", \"tin_number\": \"512-450-123-000\", \"civil_status\": \"\", \"monthly_income\": 10000}', '2026-09-29 04:00:00', '2026-10-02 15:38:08'),
('mem_000031', 'MEM-2026-0031', 'branch_tar', 'mt_regular', 'Victor B.', 'Tanedo', '', 'Male', '1969-11-11', 'victor.tanedo@example.com', '09170000031', 'Barangay Care Tarlac City, Tarlac', 'Active', '2026-01-15', '{\"occupation\": \"Farmer\", \"civil_status\": \"\", \"monthly_income\": 10000}', '2026-09-29 04:00:00', '2026-09-29 04:00:00'),
('mem_000032', 'MEM-2026-0032', 'branch_tar', 'mt_regular', 'Efren', 'Teofilo', 'Dulay', 'Male', '1968-04-30', 'efren.teofilo@example.com', '09077064290', 'Barangay Care Tarlac City, Tarlac', 'Active', '2026-01-15', '{\"notes\": \"jhomignacio08+efren@gmail.com\\nMember32-2026\", \"id_photo\": {\"name\": \"IMG20260929105048.jpg\", \"path\": \"/assets/members/mem_000032/IMG20260929105048_1790953754.jpg\", \"size\": 5729109, \"type\": \"image/jpeg\", \"file_name\": \"IMG20260929105048_1790953754.jpg\", \"uploaded_at\": \"2026-10-02T15:09:14.485Z\"}, \"occupation\": \"Farmer\", \"tin_number\": \"\", \"civil_status\": \"\", \"monthly_income\": 10000, \"marriage_certificate\": {\"name\": \"Teofilo, Efren ( marriage Cert ).pdf\", \"path\": \"/assets/members/mem_000032/Teofilo__Efren___marriage_Cert_1790953900.pdf\", \"size\": 189105, \"type\": \"application/pdf\", \"file_name\": \"Teofilo__Efren___marriage_Cert_1790953900.pdf\", \"uploaded_at\": \"2026-10-02T15:11:40.411Z\"}}', '2026-09-29 04:00:00', '2026-10-02 15:11:40'),
('mem_000033', 'MEM-2026-0033', 'branch_tar', 'mt_regular', 'Armando', 'Villegas', 'Aguilar', 'Male', '1975-08-13', 'armando.villegas@example.com', '09659658546', 'Barangay Care Tarlac City, Tarlac', 'Active', '2026-01-15', '{\"notes\": \"\", \"id_photo\": {\"name\": \"Screenshot 2026-10-02 233611.png\", \"path\": \"/assets/members/mem_000033/Screenshot_2026-10-02_233611_1790955385.png\", \"size\": 474447, \"type\": \"image/png\", \"file_name\": \"Screenshot_2026-10-02_233611_1790955385.png\", \"uploaded_at\": \"2026-10-02T15:36:25.548Z\"}, \"occupation\": \"Farmer\", \"tin_number\": \"\", \"civil_status\": \"\", \"monthly_income\": 10000}', '2026-09-29 04:00:00', '2026-10-02 15:36:25'),
('mem_381c588be996', 'MEM-2026-91770', 'branch_tar', 'mt_associate', 'Raul', 'Alimurong', 'O', 'Male', '1992-05-15', '', '', '', 'Active', '2026-10-06', '{\"notes\": \"\", \"barangay\": \"Care\", \"occupation\": \"Farmer\", \"tin_number\": \"\", \"monthly_income\": \"50000\"}', '2026-10-06 00:45:33', '2026-10-06 00:45:33'),
('mem_3fd127b4f2e2', 'MEM-2026-64825', 'branch_tar', 'mt_associate', 'Tony', 'Castro', 'L', 'Male', '1992-05-15', '', '', '', 'Active', '2026-10-01', '{\"notes\": \"\", \"barangay\": \"care\", \"occupation\": \"Farmer\", \"tin_number\": \"426-507-523-000\", \"monthly_income\": \"15000\"}', '2026-10-01 07:47:49', '2026-10-07 06:40:34'),
('mem_6ef261ec914a', 'MEM-2026-56702', 'branch_tar', 'mt_associate', 'John Rey', 'Alimurong', '', 'Male', '1992-05-15', '', '', '', 'Active', '2026-10-06', '{\"notes\": \"\", \"barangay\": \"Care\", \"occupation\": \"Farmer\", \"tin_number\": \"\", \"monthly_income\": \"50000\"}', '2026-10-06 00:46:07', '2026-10-07 09:55:33'),
('mem_723dc94d9064', 'MEM-2026-22756', 'branch_tar', 'mt_associate', 'Jaycee', 'Calma', 'M', 'Male', '1992-05-15', '', '', '', 'Active', '2026-10-01', '{\"notes\": \"\", \"barangay\": \"Tibagan\", \"occupation\": \"Farmer\", \"tin_number\": \"\", \"monthly_income\": \"25000\"}', '2026-10-01 06:55:30', '2026-10-01 07:05:16'),
('mem_7c9db0b04f64', 'MEM-2026-59695', 'branch_tar', 'mt_associate', 'Raul', 'Alimurong', 'O', 'Male', '1992-05-15', '', '', '', 'Active', '2026-10-06', '{\"notes\": \"\", \"barangay\": \"Care\", \"occupation\": \"Farmer\", \"tin_number\": \"\", \"monthly_income\": \"50000\"}', '2026-10-06 00:45:33', '2026-10-06 00:45:33'),
('mem_7ff0cbb78e10', 'MEM-2026-00134', 'branch_tar', 'mt_associate', 'Danny', 'Marcos', 'L', 'Male', '1992-05-15', '', '', '', 'Active', '2026-10-01', '{\"\": {\"name\": \"Uploaded Document\", \"size\": 0, \"type\": \"application/octet-stream\", \"dataUrl\": \"\", \"uploaded_at\": \"2026-10-02T10:04:14+00:00\"}, \"notes\": \"\", \"barangay\": \"care\", \"custom_391\": \"\", \"custom_904\": null, \"occupation\": \"farmers\", \"tin_number\": \"\", \"monthly_income\": \"20000\"}', '2026-10-01 07:48:22', '2026-10-02 14:37:21'),
('mem_c9165024c006', 'MEM-2026-91343', 'branch_tar', 'mt_associate', 'Raul', 'Alimurong', 'O', 'Male', '1992-05-15', '', '', '', 'Active', '2026-10-06', '{\"notes\": \"\", \"barangay\": \"Care\", \"occupation\": \"Farmer\", \"tin_number\": \"\", \"monthly_income\": \"50000\"}', '2026-10-06 00:45:33', '2026-10-06 00:45:33'),
('mem_dcdabdcc6967', 'MEM-2026-39737', 'branch_tar', 'mt_associate', 'Wilson', 'Aguilar', 'Subok', 'Female', '1992-05-15', '', '', '', 'Active', '2026-10-01', '{\"notes\": \"\", \"barangay\": \"care zone 5\", \"occupation\": \"Engineer\", \"tin_number\": \"\", \"monthly_income\": \"500000\"}', '2026-10-01 06:50:34', '2026-10-01 06:50:34'),
('mem_fcac6ceede75', 'MEM-2026-62836', 'branch_tar', 'mt_associate', 'Jose', 'Luanzon', 'T', 'Male', '1992-05-15', '', '', '', 'Active', '2026-10-01', '{\"notes\": \"\", \"barangay\": \"zone 5 care\", \"occupation\": \"Farmer\", \"tin_number\": \"198-768-704-000\", \"monthly_income\": \"25000\"}', '2026-10-01 07:22:50', '2026-10-07 06:40:57'),
('mem_fe59a10fc0c9', 'MEM-2026-75155', 'branch_tar', 'mt_associate', 'Julie', 'Lee', 'C', 'Female', '1992-05-15', '', '', '', 'Active', '2026-10-01', '{\"notes\": \"\", \"barangay\": \"care\", \"occupation\": \"Farmer\", \"tin_number\": \"\", \"monthly_income\": \"15000\"}', '2026-10-01 07:47:25', '2026-10-01 07:47:25');

-- --------------------------------------------------------

--
-- Table structure for table `member_types`
--

CREATE TABLE `member_types` (
  `id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `code` varchar(20) NOT NULL,
  `description` text,
  `voting_rights` tinyint(1) DEFAULT '1',
  `min_share_capital` decimal(15,2) DEFAULT '1000.00',
  `savings_requirement` decimal(15,2) DEFAULT '500.00',
  `loan_eligibility` tinyint(1) DEFAULT '1',
  `required_documents` json DEFAULT NULL,
  `active` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `member_types`
--

INSERT INTO `member_types` (`id`, `name`, `code`, `description`, `voting_rights`, `min_share_capital`, `savings_requirement`, `loan_eligibility`, `required_documents`, `active`) VALUES
('mt_associate', 'Associate Member', 'ASSOCIATE', 'Non-voting member enjoying savings deposit and credit facilities', 0, 5000.00, 500.00, 1, '[\"Valid Gov ID\", \"2x2 ID Photo\", \"Proof of Billing\"]', 1),
('mt_lab', 'Laboratory / Youth Member', 'LAB_YOUTH', 'Minor/Student savings depositor preparing for future cooperative participation', 0, 500.00, 200.00, 0, '[\"Birth Certificate\", \"Parents Consent Form\"]', 1),
('mt_regular', 'Regular Member', 'REGULAR', 'Full-fledged member with voting rights and dividend participation', 1, 10000.00, 1000.00, 1, '[\"Valid Gov ID\", \"2x2 ID Photo\", \"Proof of Billing\", \"PMES Certificate\"]', 1);

-- --------------------------------------------------------

--
-- Table structure for table `numbering_formats`
--

CREATE TABLE `numbering_formats` (
  `id` varchar(50) NOT NULL,
  `module` varchar(50) NOT NULL,
  `prefix` varchar(20) NOT NULL,
  `branch_specific` tinyint(1) DEFAULT '1',
  `include_year` tinyint(1) DEFAULT '1',
  `padding` int DEFAULT '5',
  `next_number` int DEFAULT '1',
  `pattern` varchar(100) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `numbering_formats`
--

INSERT INTO `numbering_formats` (`id`, `module`, `prefix`, `branch_specific`, `include_year`, `padding`, `next_number`, `pattern`, `created_at`) VALUES
('num_cbu', 'ShareCapital', 'CBU', 1, 1, 4, 1, '{BRANCH}-CBU-{YEAR}-{NUMBER}', '2026-09-12 00:07:46'),
('num_cd', 'Disbursements', 'CD', 1, 1, 6, 1, '{BRANCH}-CD-{YEAR}-{NUMBER}', '2026-09-12 00:07:46'),
('num_jv', 'Journal', 'JV', 1, 1, 6, 1, '{BRANCH}-JV-{YEAR}-{NUMBER}', '2026-09-12 00:07:46'),
('num_loan', 'Loans', 'LN', 1, 1, 5, 1, '{BRANCH}-LN-{YEAR}-{NUMBER}', '2026-09-12 00:07:46'),
('num_mem', 'Members', 'MEM', 0, 1, 5, 1, 'MEM-{YEAR}-{NUMBER}', '2026-09-12 00:07:46'),
('num_or', 'Receipts', 'OR', 1, 1, 6, 1, '{BRANCH}-OR-{YEAR}-{NUMBER}', '2026-09-12 00:07:46'),
('num_sa', 'Savings', 'SA', 1, 1, 4, 1, '{BRANCH}-SA-{YEAR}-{NUMBER}', '2026-09-12 00:07:46');

-- --------------------------------------------------------

--
-- Table structure for table `payment_allocation_rules`
--

CREATE TABLE `payment_allocation_rules` (
  `id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text,
  `priority_order` json NOT NULL,
  `is_default` tinyint(1) DEFAULT '1',
  `active` tinyint(1) NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `payment_allocation_rules`
--

INSERT INTO `payment_allocation_rules` (`id`, `name`, `description`, `priority_order`, `is_default`, `active`, `updated_at`) VALUES
('par_borrower_favorable', 'Principal-First Relief Allocation', NULL, '[{\"label\": \"Accrued Interest\", \"priority\": 1, \"component\": \"Interest\"}, {\"label\": \"Loan Principal Balance\", \"priority\": 2, \"component\": \"Principal\"}, {\"label\": \"Penalties & Late Fines\", \"priority\": 3, \"component\": \"Penalty\"}, {\"label\": \"Service & Other Fees\", \"priority\": 4, \"component\": \"Fees\"}]', 0, 1, '2026-09-29 07:09:55'),
('par_default', 'Standard CDA Priority Allocation', NULL, '[{\"label\": \"Penalties & Late Fines\", \"priority\": 1, \"component\": \"Penalty\"}, {\"label\": \"Accrued Interest\", \"priority\": 2, \"component\": \"Interest\"}, {\"label\": \"Service & Other Fees\", \"priority\": 3, \"component\": \"Fees\"}, {\"label\": \"Loan Principal Balance\", \"priority\": 4, \"component\": \"Principal\"}]', 1, 1, '2026-09-29 07:09:55');

-- --------------------------------------------------------

--
-- Table structure for table `payment_frequencies`
--

CREATE TABLE `payment_frequencies` (
  `id` varchar(50) NOT NULL,
  `name` varchar(50) NOT NULL,
  `days_interval` int NOT NULL,
  `periods_per_year` int NOT NULL,
  `active` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `payment_frequencies`
--

INSERT INTO `payment_frequencies` (`id`, `name`, `days_interval`, `periods_per_year`, `active`) VALUES
('freq_lumpsum', 'Lump Sum', 180, 2, 1),
('freq_monthly', 'Monthly', 30, 12, 1),
('freq_semimonthly', 'Semi-monthly', 15, 24, 1),
('freq_weekly', 'Weekly', 7, 52, 1);

-- --------------------------------------------------------

--
-- Table structure for table `penalty_rules`
--

CREATE TABLE `penalty_rules` (
  `id` varchar(50) NOT NULL,
  `name` varchar(150) NOT NULL,
  `grace_period_days` int DEFAULT '0',
  `penalty_rate_percentage` decimal(5,2) NOT NULL,
  `calculation_base` enum('Overdue Principal','Total Overdue Installment') DEFAULT 'Overdue Principal',
  `compounding_frequency` enum('None','Monthly','Daily') DEFAULT 'None',
  `gl_income_account_id` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `penalty_rules`
--

INSERT INTO `penalty_rules` (`id`, `name`, `grace_period_days`, `penalty_rate_percentage`, `calculation_base`, `compounding_frequency`, `gl_income_account_id`) VALUES
('pen_agricultural', 'Agricultural Loan Delinquency Penalty', 15, 1.00, 'Overdue Principal', 'None', 'acc_4130'),
('pen_default', 'Standard Default Amortization Penalty', 5, 2.00, 'Overdue Principal', 'None', 'acc_4130'),
('pen_emergency', 'Emergency Loan Late Payment Penalty', 3, 2.00, 'Overdue Principal', 'None', 'acc_4130'),
('pen_grace', 'Extended Grace Period Penalty', 15, 0.00, 'Total Overdue Installment', 'None', 'acc_4130'),
('pen_regular', 'Regular Loan Delinquency Penalty', 5, 2.00, 'Total Overdue Installment', 'None', 'acc_4130'),
('pen_restructured', 'Restructured Loan Penalty', 7, 1.00, 'Overdue Principal', 'None', 'acc_4130'),
('pen_severe', 'Severe Delinquency Penalty', 30, 3.00, 'Overdue Principal', 'Monthly', 'acc_4130');

-- --------------------------------------------------------

--
-- Table structure for table `savings_accounts`
--

CREATE TABLE `savings_accounts` (
  `id` varchar(50) NOT NULL,
  `account_number` varchar(50) NOT NULL,
  `member_id` varchar(50) NOT NULL,
  `savings_product_id` varchar(50) NOT NULL,
  `branch_id` varchar(50) NOT NULL,
  `balance` decimal(15,2) DEFAULT '0.00',
  `opened_date` date NOT NULL,
  `status` enum('Active','Dormant','Closed') DEFAULT 'Active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `savings_products`
--

CREATE TABLE `savings_products` (
  `id` varchar(50) NOT NULL,
  `code` varchar(50) NOT NULL,
  `name` varchar(150) NOT NULL,
  `min_balance_to_earn_interest` decimal(15,2) DEFAULT '1000.00',
  `annual_interest_rate` decimal(5,2) DEFAULT '2.00',
  `interest_calculation_method` varchar(50) DEFAULT 'Average Daily Balance',
  `min_opening_deposit` decimal(15,2) DEFAULT '500.00',
  `maintaining_balance` decimal(15,2) DEFAULT '500.00',
  `gl_liability_account_id` varchar(50) NOT NULL,
  `gl_interest_expense_account_id` varchar(50) NOT NULL,
  `active` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `savings_products`
--

INSERT INTO `savings_products` (`id`, `code`, `name`, `min_balance_to_earn_interest`, `annual_interest_rate`, `interest_calculation_method`, `min_opening_deposit`, `maintaining_balance`, `gl_liability_account_id`, `gl_interest_expense_account_id`, `active`) VALUES
('sp_regular', 'SAV-REG', 'Regular Savings Deposit', 1000.00, 2.00, 'Average Daily Balance', 500.00, 500.00, 'acc_2110', 'acc_5110', 1),
('sp_time', 'SAV-TIME', 'High-Yield Time Deposit (1 Year)', 20000.00, 5.50, 'Simple Interest', 20000.00, 20000.00, 'acc_2120', 'acc_5110', 1);

-- --------------------------------------------------------

--
-- Table structure for table `savings_transactions`
--

CREATE TABLE `savings_transactions` (
  `id` varchar(50) NOT NULL,
  `transaction_no` varchar(50) NOT NULL,
  `savings_account_id` varchar(50) NOT NULL,
  `member_id` varchar(50) NOT NULL,
  `type` enum('DEPOSIT','WITHDRAWAL','INTEREST_POSTING','FEE_DEDUCTION') NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `balance_after` decimal(15,2) NOT NULL,
  `cash_account_id` varchar(50) DEFAULT NULL,
  `transaction_date` date NOT NULL,
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `share_capital_accounts`
--

CREATE TABLE `share_capital_accounts` (
  `id` varchar(50) NOT NULL,
  `account_number` varchar(50) NOT NULL,
  `member_id` varchar(50) NOT NULL,
  `branch_id` varchar(50) DEFAULT NULL,
  `subscribed_shares` int NOT NULL,
  `subscribed_amount` decimal(15,2) NOT NULL,
  `paid_up_shares` int NOT NULL,
  `paid_up_amount` decimal(15,2) NOT NULL,
  `status` enum('Active','Withdrawn','Transferred') DEFAULT 'Active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `share_capital_accounts`
--

INSERT INTO `share_capital_accounts` (`id`, `account_number`, `member_id`, `branch_id`, `subscribed_shares`, `subscribed_amount`, `paid_up_shares`, `paid_up_amount`, `status`, `created_at`) VALUES
('sc_024b56de6448', 'CBU-2026-26567', 'mem_000026', 'branch_tar', 40, 4000.00, 10, 1000.00, 'Active', '2026-10-01 09:48:58'),
('sc_1171e4bac62b', 'CBU-2026-68013', 'mem_723dc94d9064', 'branch_tar', 40, 4000.00, 10, 1000.00, 'Active', '2026-10-01 09:47:22'),
('sc_12f418dded8a', 'CBU-2026-85575', 'mem_fcac6ceede75', 'branch_tar', 40, 4000.00, 10, 1000.00, 'Active', '2026-10-01 09:52:23'),
('sc_184f78dfad9a', 'CBU-2026-41483', 'mem_000024', 'branch_tar', 40, 4000.00, 10, 1000.00, 'Active', '2026-10-01 09:46:39'),
('sc_1d4b9e27ba41', 'CBU-2026-99226', 'mem_000015', 'branch_tar', 40, 4000.00, 10, 1000.00, 'Active', '2026-10-01 09:44:11'),
('sc_239631e1f88c', 'CBU-2026-18325', 'mem_000032', 'branch_tar', 40, 4000.00, 10, 1000.00, 'Active', '2026-10-01 09:43:52'),
('sc_26368c10b9a3', 'CBU-2026-70806', 'mem_000017', 'branch_tar', 40, 4000.00, 10, 1000.00, 'Active', '2026-10-01 09:48:31'),
('sc_3dfc5217e8ad', 'CBU-2026-67466', 'mem_000004', 'branch_tar', 40, 4000.00, 10, 1000.00, 'Active', '2026-10-01 09:47:13'),
('sc_447adf17f6d5', 'CBU-2026-74125', 'mem_000031', 'branch_tar', 40, 4000.00, 10, 1000.00, 'Active', '2026-10-01 09:48:02'),
('sc_44adb963be0e', 'CBU-2026-67338', 'mem_000005', 'branch_tar', 40, 4000.00, 10, 1000.00, 'Active', '2026-10-01 09:47:42'),
('sc_461458b55465', 'CBU-2026-40552', 'mem_000016', 'branch_tar', 40, 4000.00, 10, 1000.00, 'Active', '2026-10-01 09:45:36'),
('sc_46655523c1f8', 'CBU-2026-90076', 'mem_000025', 'branch_tar', 40, 4000.00, 10, 1000.00, 'Active', '2026-10-01 09:47:50'),
('sc_4e3b3263a4b6', 'CBU-2026-48875', 'mem_7ff0cbb78e10', 'branch_tar', 40, 4000.00, 10, 1000.00, 'Active', '2026-10-01 09:58:11'),
('sc_50c09dc02c47', 'CBU-2026-61932', 'mem_000007', 'branch_tar', 40, 4000.00, 10, 1000.00, 'Active', '2026-10-01 09:53:21'),
('sc_5fa7be4283e4', 'CBU-2026-71210', 'mem_6ef261ec914a', 'branch_tar', 40, 4000.00, 10, 1000.00, 'Active', '2026-10-06 00:46:18'),
('sc_609fb678b67d', 'CBU-2026-80952', 'mem_3fd127b4f2e2', 'branch_tar', 40, 4000.00, 10, 1000.00, 'Active', '2026-10-02 15:43:28'),
('sc_64bc431c26af', 'CBU-2026-75526', 'mem_000019', 'branch_tar', 40, 4000.00, 10, 1000.00, 'Active', '2026-10-01 09:48:49'),
('sc_70286636434b', 'CBU-2026-53688', 'mem_000014', 'branch_tar', 40, 4000.00, 10, 1000.00, 'Active', '2026-10-01 09:45:24'),
('sc_80947fa8dff2', 'CBU-2026-48852', 'mem_000030', 'branch_tar', 40, 4000.00, 10, 1000.00, 'Active', '2026-10-01 09:45:47'),
('sc_849ff1914ab2', 'CBU-2026-69006', 'mem_000013', 'branch_tar', 40, 4000.00, 10, 1000.00, 'Active', '2026-10-01 09:46:55'),
('sc_885366558867', 'CBU-2026-21341', 'mem_000012', 'branch_tar', 40, 4000.00, 10, 1000.00, 'Active', '2026-10-01 09:46:48'),
('sc_9081fb39818f', 'CBU-2026-10378', 'mem_000018', 'branch_tar', 40, 4000.00, 10, 1000.00, 'Active', '2026-10-01 09:46:29'),
('sc_9b7025e57a44', 'CBU-2026-19912', 'mem_fe59a10fc0c9', 'branch_tar', 40, 4000.00, 10, 1000.00, 'Active', '2026-10-01 09:56:49'),
('sc_a50e957a8103', 'CBU-2026-44421', 'mem_000020', 'branch_tar', 40, 4000.00, 10, 1000.00, 'Active', '2026-10-01 09:48:40'),
('sc_b18da87292d9', 'CBU-2026-43080', 'mem_000022', 'branch_tar', 40, 4000.00, 10, 1000.00, 'Active', '2026-10-01 09:55:10'),
('sc_b6856480d706', 'CBU-2026-35390', 'mem_000029', 'branch_tar', 40, 4000.00, 10, 1000.00, 'Active', '2026-10-01 09:48:18'),
('sc_bae037e9b229', 'CBU-2026-56064', 'mem_7c9db0b04f64', 'branch_tar', 40, 4000.00, 10, 1000.00, 'Active', '2026-10-06 00:46:24'),
('sc_dfafa52f8c3f', 'CBU-2026-40970', 'mem_000021', 'branch_tar', 40, 4000.00, 10, 1000.00, 'Active', '2026-10-01 09:46:17'),
('sc_e552574916e7', 'CBU-2026-88093', 'mem_dcdabdcc6967', 'branch_tar', 40, 4000.00, 10, 1000.00, 'Active', '2026-10-01 09:47:05'),
('sc_fb40cb1aa19c', 'CBU-2026-70611', 'mem_000006', 'branch_tar', 40, 4000.00, 10, 1000.00, 'Active', '2026-10-01 09:55:54'),
('sc_fcb2a8f88642', 'CBU-2026-58246', 'mem_000008', 'branch_tar', 40, 4000.00, 10, 1000.00, 'Active', '2026-10-01 09:47:30');

-- --------------------------------------------------------

--
-- Table structure for table `share_capital_settings`
--

CREATE TABLE `share_capital_settings` (
  `id` varchar(50) NOT NULL,
  `cooperative_id` varchar(50) NOT NULL,
  `par_value_per_share` decimal(15,2) DEFAULT '100.00',
  `min_subscription_shares` int DEFAULT '100',
  `min_paid_up_shares` int DEFAULT '25',
  `max_share_holding_percentage` decimal(5,2) DEFAULT '10.00',
  `transfer_fee` decimal(15,2) DEFAULT '100.00',
  `withdrawal_rule` text,
  `accounting_account_id` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `share_capital_settings`
--

INSERT INTO `share_capital_settings` (`id`, `cooperative_id`, `par_value_per_share`, `min_subscription_shares`, `min_paid_up_shares`, `max_share_holding_percentage`, `transfer_fee`, `withdrawal_rule`, `accounting_account_id`) VALUES
('sc_setting_01', 'coop_01', 100.00, 100, 25, 10.00, 100.00, 'Subject to Board approval and 30-day prior written notice', 'acc_3110');

-- --------------------------------------------------------

--
-- Table structure for table `share_capital_transactions`
--

CREATE TABLE `share_capital_transactions` (
  `id` varchar(50) NOT NULL,
  `receipt_no` varchar(50) NOT NULL,
  `share_account_id` varchar(50) NOT NULL,
  `member_id` varchar(50) NOT NULL,
  `type` enum('SUBSCRIPTION','PAYMENT','WITHDRAWAL','TRANSFER','DIVIDEND_PATRONAGE') NOT NULL,
  `shares` int NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `transaction_date` date NOT NULL,
  `cash_account_id` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `share_capital_transactions`
--

INSERT INTO `share_capital_transactions` (`id`, `receipt_no`, `share_account_id`, `member_id`, `type`, `shares`, `amount`, `transaction_date`, `cash_account_id`, `created_at`) VALUES
('sctx_02465702e7df', 'SC-OR-20261001-2F05', 'sc_12f418dded8a', 'mem_fcac6ceede75', 'PAYMENT', 10, 1000.00, '2026-10-01', 'cash_01', '2026-10-01 09:52:23'),
('sctx_1e5024294be5', 'SC-OR-20261002-9555', 'sc_609fb678b67d', 'mem_3fd127b4f2e2', 'PAYMENT', 10, 1000.00, '2026-10-02', 'cash_01', '2026-10-02 15:43:28'),
('sctx_1fd16c447a84', 'SC-OR-20261001-4CA3', 'sc_885366558867', 'mem_000012', 'PAYMENT', 10, 1000.00, '2026-10-01', 'cash_01', '2026-10-01 09:46:48'),
('sctx_22c1fbd5612b', 'SC-OR-20261001-766B', 'sc_dfafa52f8c3f', 'mem_000021', 'PAYMENT', 10, 1000.00, '2026-10-01', 'cash_01', '2026-10-01 09:46:17'),
('sctx_3611844aa118', 'SC-OR-20261001-2201', 'sc_b6856480d706', 'mem_000029', 'PAYMENT', 10, 1000.00, '2026-10-01', 'cash_01', '2026-10-01 09:48:18'),
('sctx_390fddfe62a1', 'SC-OR-20261001-68A0', 'sc_26368c10b9a3', 'mem_000017', 'PAYMENT', 10, 1000.00, '2026-10-01', 'cash_01', '2026-10-01 09:48:31'),
('sctx_3c1be8ec68d3', 'SC-OR-20261006-2A25', 'sc_bae037e9b229', 'mem_7c9db0b04f64', 'PAYMENT', 10, 1000.00, '2026-10-06', 'cash_01', '2026-10-06 00:46:24'),
('sctx_69f50e57ba50', 'SC-OR-20261001-15FE', 'sc_50c09dc02c47', 'mem_000007', 'PAYMENT', 10, 1000.00, '2026-10-01', 'cash_01', '2026-10-01 09:53:21'),
('sctx_72a28ac5b688', 'SC-OR-20261001-7C55', 'sc_447adf17f6d5', 'mem_000031', 'PAYMENT', 10, 1000.00, '2026-10-01', 'cash_01', '2026-10-01 09:48:02'),
('sctx_75e8142ae37d', 'SC-OR-20261001-C3DA', 'sc_44adb963be0e', 'mem_000005', 'PAYMENT', 10, 1000.00, '2026-10-01', 'cash_01', '2026-10-01 09:47:42'),
('sctx_788f07c5c599', 'SC-OR-20261001-2807', 'sc_184f78dfad9a', 'mem_000024', 'PAYMENT', 10, 1000.00, '2026-10-01', 'cash_01', '2026-10-01 09:46:39'),
('sctx_7b17e98ccbe8', 'SC-OR-20261006-1477', 'sc_5fa7be4283e4', 'mem_6ef261ec914a', 'PAYMENT', 10, 1000.00, '2026-10-06', 'cash_01', '2026-10-06 00:46:18'),
('sctx_81ed793cc5a6', 'SC-OR-20261001-9CE6', 'sc_70286636434b', 'mem_000014', 'PAYMENT', 10, 1000.00, '2026-10-01', 'cash_01', '2026-10-01 09:45:24'),
('sctx_83fd13a92b84', 'SC-OR-20261001-3DE5', 'sc_64bc431c26af', 'mem_000019', 'PAYMENT', 10, 1000.00, '2026-10-01', 'cash_01', '2026-10-01 09:48:49'),
('sctx_868a3c84802d', 'SC-OR-20261001-7392', 'sc_4e3b3263a4b6', 'mem_7ff0cbb78e10', 'PAYMENT', 10, 1000.00, '2026-10-01', 'cash_01', '2026-10-01 09:58:11'),
('sctx_891925d96cb2', 'SC-OR-20261001-9824', 'sc_3dfc5217e8ad', 'mem_000004', 'PAYMENT', 10, 1000.00, '2026-10-01', 'cash_01', '2026-10-01 09:47:13'),
('sctx_89761c9f56cc', 'SC-OR-20261001-25F9', 'sc_024b56de6448', 'mem_000026', 'PAYMENT', 10, 1000.00, '2026-10-01', 'cash_01', '2026-10-01 09:48:58'),
('sctx_986edf0175db', 'SC-OR-20261001-256E', 'sc_239631e1f88c', 'mem_000032', 'PAYMENT', 10, 1000.00, '2026-10-01', 'cash_01', '2026-10-01 09:43:52'),
('sctx_a5bd678794ab', 'SC-OR-20261001-BDD6', 'sc_fcb2a8f88642', 'mem_000008', 'PAYMENT', 10, 1000.00, '2026-10-01', 'cash_01', '2026-10-01 09:47:30'),
('sctx_abebc3179715', 'SC-OR-20261001-BEF9', 'sc_1171e4bac62b', 'mem_723dc94d9064', 'PAYMENT', 10, 1000.00, '2026-10-01', 'cash_01', '2026-10-01 09:47:22'),
('sctx_b2c23269242f', 'SC-OR-20261001-6BA3', 'sc_849ff1914ab2', 'mem_000013', 'PAYMENT', 10, 1000.00, '2026-10-01', 'cash_01', '2026-10-01 09:46:55'),
('sctx_c19f3f323fef', 'SC-OR-20261001-31DC', 'sc_1d4b9e27ba41', 'mem_000015', 'PAYMENT', 10, 1000.00, '2026-10-01', 'cash_01', '2026-10-01 09:44:11'),
('sctx_c715d9563f3e', 'SC-OR-20261001-3B4B', 'sc_b18da87292d9', 'mem_000022', 'PAYMENT', 10, 1000.00, '2026-10-01', 'cash_01', '2026-10-01 09:55:10'),
('sctx_c9ad4e9ba625', 'SC-OR-20261001-AB03', 'sc_fb40cb1aa19c', 'mem_000006', 'PAYMENT', 10, 1000.00, '2026-10-01', 'cash_01', '2026-10-01 09:55:54'),
('sctx_cf180996d0f2', 'SC-OR-20261001-DD94', 'sc_9b7025e57a44', 'mem_fe59a10fc0c9', 'PAYMENT', 10, 1000.00, '2026-10-01', 'cash_01', '2026-10-01 09:56:49'),
('sctx_d0c61f2febc6', 'SC-OR-20261001-4EA5', 'sc_e552574916e7', 'mem_dcdabdcc6967', 'PAYMENT', 10, 1000.00, '2026-10-01', 'cash_01', '2026-10-01 09:47:05'),
('sctx_d5e65615219e', 'SC-OR-20261001-5CE0', 'sc_80947fa8dff2', 'mem_000030', 'PAYMENT', 10, 1000.00, '2026-10-01', 'cash_01', '2026-10-01 09:45:47'),
('sctx_da56e93d6824', 'SC-OR-20261001-1885', 'sc_9081fb39818f', 'mem_000018', 'PAYMENT', 10, 1000.00, '2026-10-01', 'cash_01', '2026-10-01 09:46:29'),
('sctx_e4d24eb88e78', 'SC-OR-20261001-6859', 'sc_46655523c1f8', 'mem_000025', 'PAYMENT', 10, 1000.00, '2026-10-01', 'cash_01', '2026-10-01 09:47:50'),
('sctx_f2296b539dad', 'SC-OR-20261001-4815', 'sc_461458b55465', 'mem_000016', 'PAYMENT', 10, 1000.00, '2026-10-01', 'cash_01', '2026-10-01 09:45:36'),
('sctx_fffd1a3e196d', 'SC-OR-20261001-8E70', 'sc_a50e957a8103', 'mem_000020', 'PAYMENT', 10, 1000.00, '2026-10-01', 'cash_01', '2026-10-01 09:48:40');

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
--

CREATE TABLE `system_settings` (
  `id` varchar(50) NOT NULL,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text NOT NULL,
  `setting_group` varchar(50) NOT NULL,
  `description` text,
  `updated_by` varchar(100) DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `system_settings`
--

INSERT INTO `system_settings` (`id`, `setting_key`, `setting_value`, `setting_group`, `description`, `updated_by`, `updated_at`) VALUES
('set_cur', 'currency', 'PHP', 'General', 'Primary operating currency symbol', 'System Administrator', '2026-09-12 00:07:46'),
('set_fy', 'fiscal_year_start', '01-01', 'Accounting', 'Start of fiscal accounting calendar (MM-DD)', 'System Administrator', '2026-09-12 00:07:46'),
('set_grace', 'global_grace_period_days', '5', 'Loan Policy', 'Global grace period before loan delinquency penalties apply', 'System Administrator', '2026-09-12 00:07:46'),
('set_pen_comp', 'penalty_compounding', 'false', 'Loan Policy', 'Whether penalties compound into principal monthly', 'System Administrator', '2026-09-12 00:07:46'),
('set_sc_max', 'max_share_holding_percentage', '10', 'Regulatory', 'CDA maximum percentage of total share capital any single member may own', 'System Administrator', '2026-09-12 00:07:46');

-- --------------------------------------------------------

--
-- Table structure for table `transaction_types`
--

CREATE TABLE `transaction_types` (
  `id` varchar(50) NOT NULL,
  `code` varchar(50) NOT NULL,
  `name` varchar(150) NOT NULL,
  `module` varchar(50) NOT NULL,
  `requires_approval` tinyint(1) DEFAULT '0',
  `numbering_format_id` varchar(50) DEFAULT NULL,
  `active` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `transaction_types`
--

INSERT INTO `transaction_types` (`id`, `code`, `name`, `module`, `requires_approval`, `numbering_format_id`, `active`) VALUES
('tx_loan_pmt', 'LOAN_PAYMENT', 'Loan Amortization Collection', 'Loans', 0, 'num_or', 1),
('tx_loan_rel', 'LOAN_RELEASE', 'Loan Disbursement Voucher', 'Loans', 1, 'num_cd', 1),
('tx_open_bal', 'OPENING_BALANCE', 'Opening Balance Journal Entry', 'Accounting', 1, 'num_jv', 1),
('tx_sav_dep', 'SAVINGS_DEPOSIT', 'Savings Deposit Slip', 'Savings', 0, 'num_or', 1),
('tx_sav_with', 'SAVINGS_WITHDRAWAL', 'Savings Cash Withdrawal Voucher', 'Savings', 1, 'num_cd', 1),
('tx_sc_pay', 'SHARE_CAPITAL_PAYMENT', 'Capital Build-Up OR', 'ShareCapital', 0, 'num_or', 1);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` varchar(50) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `email` varchar(150) NOT NULL,
  `role_id` varchar(50) NOT NULL,
  `branch_id` varchar(50) NOT NULL,
  `documents` json DEFAULT NULL,
  `active` tinyint(1) DEFAULT '1',
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password_hash`, `full_name`, `email`, `role_id`, `branch_id`, `documents`, `active`, `last_login`, `created_at`) VALUES
('usr_57b4261a0d4c92b6', 'superadmin', '$2y$10$5LSGX.6LhAFRYQTZJwBGxef8S4QUUDYsMfyHzvbJQVAf3VkLRx9Ba', 'Jhomel L. Ignacio', 'jhomignacio08@gmail.com', 'role_admin', 'branch_tar', NULL, 1, NULL, '2026-10-07 01:50:13'),
('usr_933088ead62c0a82', 'admin01', '$2y$10$rZI2QiFsu23NtmJCNXIv7eK1ea9LCpdSO/CU.I3wi0z4hmAXYgGq2', 'jhomel', 'admin01@gmail.com', 'role_admin', 'branch_tar', NULL, 1, '2026-10-07 09:52:00', '2026-09-22 03:47:02');

-- --------------------------------------------------------

--
-- Table structure for table `user_documents`
--

CREATE TABLE `user_documents` (
  `user_id` varchar(50) NOT NULL,
  `doc_key` varchar(100) NOT NULL,
  `document_data` json DEFAULT NULL,
  `notes` longtext
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `user_documents`
--

INSERT INTO `user_documents` (`user_id`, `doc_key`, `document_data`, `notes`) VALUES
('usr_933088ead62c0a82', 'udoc_1791277025076', '{\"name\": \"PENRO - Calamansi.pdf\", \"path\": \"/assets/members/usr_933088ead62c0a82/PENRO_-_Calamansi_1791277025.pdf\", \"size\": 224636, \"type\": \"application/pdf\", \"file_name\": \"PENRO_-_Calamansi_1791277025.pdf\", \"uploaded_at\": \"2026-10-06T08:57:05+00:00\"}', NULL),
('usr_933088ead62c0a82', 'udoc_1791339615037', '{\"name\": \"ETC - MAYAP CARE COOP (4).pdf\", \"path\": \"/assets/members/usr_933088ead62c0a82/ETC_-_MAYAP_CARE_COOP__4_1791339615.pdf\", \"size\": 224833, \"type\": \"application/pdf\", \"file_name\": \"ETC_-_MAYAP_CARE_COOP__4_1791339615.pdf\", \"uploaded_at\": \"2026-10-07T02:20:15+00:00\"}', 'test'),
('usr_933088ead62c0a82', 'udoc_1791356001680', '{\"name\": \"Mayap Care Coop ( Request for Agricultural Machinery ) (2) (1).pdf\", \"path\": \"/assets/members/usr_933088ead62c0a82/Mayap_Care_Coop___Request_for_Agricultural_Machinery____2___1_1a6c4a78e2bc.pdf\", \"size\": 2785725, \"type\": \"application/pdf\", \"file_name\": \"Mayap_Care_Coop___Request_for_Agricultural_Machinery____2___1_1a6c4a78e2bc.pdf\", \"uploaded_at\": \"2026-10-07T06:53:21+00:00\"}', 'Submitted to Senator Camille Villar');

-- --------------------------------------------------------

--
-- Table structure for table `user_roles`
--

CREATE TABLE `user_roles` (
  `id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text,
  `permissions` json NOT NULL,
  `active` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `user_roles`
--

INSERT INTO `user_roles` (`id`, `name`, `description`, `permissions`, `active`) VALUES
('role_accountant', 'Chief / Branch Accountant', 'General ledger management, journal vouchers, and period close', '[\"manage_accounting\", \"view_gl\", \"post_journals\", \"close_periods\", \"view_reports\"]', 1),
('role_admin', 'System Administrator', 'Full unconstrained platform super-user access', '[\"manage_system\", \"manage_configurations\", \"manage_members\", \"manage_loans\", \"manage_savings\", \"manage_accounting\", \"approve_transactions\", \"view_reports\"]', 1),
('role_bod', 'Board of Directors', 'High-level policy review, macro-reporting, and large-loan approvals', '[\"approve_tier3_loans\", \"view_reports\", \"view_audit_trail\"]', 1),
('role_loan_officer', 'Credit & Loan Evaluation Officer', 'Loan application review, credit investigation, and schedule creation', '[\"manage_loans\", \"view_members\", \"create_schedules\"]', 1),
('role_manager', 'General / Branch Manager', 'Branch operations supervisor with level 2 approval rights', '[\"manage_members\", \"manage_loans\", \"manage_savings\", \"approve_transactions\", \"view_reports\"]', 1),
('role_teller', 'Teller / Cashier', 'Over-the-counter payments, deposits, and cash drawer settlements', '[\"receive_payments\", \"issue_receipts\", \"cash_inflow\", \"cash_outflow\"]', 1);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `accounting_mappings`
--
ALTER TABLE `accounting_mappings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `event_type` (`event_type`),
  ADD KEY `debit_account_id` (`debit_account_id`),
  ADD KEY `credit_account_id` (`credit_account_id`);

--
-- Indexes for table `accounting_periods`
--
ALTER TABLE `accounting_periods`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_year_period` (`fiscal_year`,`period_number`);

--
-- Indexes for table `approval_rules`
--
ALTER TABLE `approval_rules`
  ADD PRIMARY KEY (`id`),
  ADD KEY `workflow_id` (`workflow_id`);

--
-- Indexes for table `approval_workflows`
--
ALTER TABLE `approval_workflows`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `branches`
--
ALTER TABLE `branches`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Indexes for table `cash_accounts`
--
ALTER TABLE `cash_accounts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `branch_id` (`branch_id`),
  ADD KEY `gl_account_id` (`gl_account_id`);

--
-- Indexes for table `cash_transactions`
--
ALTER TABLE `cash_transactions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `transaction_no` (`transaction_no`),
  ADD KEY `cash_account_id` (`cash_account_id`);

--
-- Indexes for table `chart_of_accounts`
--
ALTER TABLE `chart_of_accounts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `account_code` (`account_code`),
  ADD KEY `idx_acc_code` (`account_code`),
  ADD KEY `idx_acc_cat` (`category`);

--
-- Indexes for table `configuration_audit_trails`
--
ALTER TABLE `configuration_audit_trails`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `cooperatives`
--
ALTER TABLE `cooperatives`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `custom_fields`
--
ALTER TABLE `custom_fields`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_entity_key` (`entity_type`,`field_key`);

--
-- Indexes for table `document_requirements`
--
ALTER TABLE `document_requirements`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `feature_toggles`
--
ALTER TABLE `feature_toggles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `feature_key` (`feature_key`);

--
-- Indexes for table `fees`
--
ALTER TABLE `fees`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `gl_account_id` (`gl_account_id`);

--
-- Indexes for table `general_ledger`
--
ALTER TABLE `general_ledger`
  ADD PRIMARY KEY (`id`),
  ADD KEY `journal_entry_id` (`journal_entry_id`),
  ADD KEY `period_id` (`period_id`),
  ADD KEY `branch_id` (`branch_id`),
  ADD KEY `idx_gl_acc_date` (`account_id`,`posting_date`);

--
-- Indexes for table `journal_entries`
--
ALTER TABLE `journal_entries`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `voucher_number` (`voucher_number`),
  ADD KEY `branch_id` (`branch_id`),
  ADD KEY `idx_jv_date` (`posting_date`),
  ADD KEY `idx_jv_period` (`period_id`);

--
-- Indexes for table `journal_lines`
--
ALTER TABLE `journal_lines`
  ADD PRIMARY KEY (`id`),
  ADD KEY `journal_entry_id` (`journal_entry_id`),
  ADD KEY `idx_jl_account` (`account_id`);

--
-- Indexes for table `loans`
--
ALTER TABLE `loans`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `loan_account_no` (`loan_account_no`),
  ADD KEY `loan_product_id` (`loan_product_id`),
  ADD KEY `branch_id` (`branch_id`),
  ADD KEY `disbursed_from_cash_account_id` (`disbursed_from_cash_account_id`),
  ADD KEY `idx_loan_member` (`member_id`),
  ADD KEY `idx_loan_status` (`status`),
  ADD KEY `fk_loans_application` (`application_id`);

--
-- Indexes for table `loan_amortization_schedules`
--
ALTER TABLE `loan_amortization_schedules`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sched_due` (`loan_id`,`due_date`);

--
-- Indexes for table `loan_applications`
--
ALTER TABLE `loan_applications`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `application_no` (`application_no`),
  ADD KEY `member_id` (`member_id`),
  ADD KEY `loan_product_id` (`loan_product_id`),
  ADD KEY `branch_id` (`branch_id`),
  ADD KEY `idx_loan_applications_loan_id` (`loan_id`);

--
-- Indexes for table `loan_payments`
--
ALTER TABLE `loan_payments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `receipt_no` (`receipt_no`),
  ADD KEY `loan_id` (`loan_id`),
  ADD KEY `member_id` (`member_id`),
  ADD KEY `cash_account_id` (`cash_account_id`);

--
-- Indexes for table `loan_payment_allocations`
--
ALTER TABLE `loan_payment_allocations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `payment_id` (`payment_id`),
  ADD KEY `loan_id` (`loan_id`);

--
-- Indexes for table `loan_products`
--
ALTER TABLE `loan_products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `gl_receivable_account_id` (`gl_receivable_account_id`),
  ADD KEY `gl_interest_income_account_id` (`gl_interest_income_account_id`);

--
-- Indexes for table `loan_product_versions`
--
ALTER TABLE `loan_product_versions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_prod_version` (`loan_product_id`,`version_number`);

--
-- Indexes for table `members`
--
ALTER TABLE `members`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `member_no` (`member_no`),
  ADD KEY `branch_id` (`branch_id`),
  ADD KEY `member_type_id` (`member_type_id`),
  ADD KEY `idx_member_name` (`last_name`,`first_name`),
  ADD KEY `idx_member_status` (`status`);

--
-- Indexes for table `member_types`
--
ALTER TABLE `member_types`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Indexes for table `numbering_formats`
--
ALTER TABLE `numbering_formats`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `payment_allocation_rules`
--
ALTER TABLE `payment_allocation_rules`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `payment_frequencies`
--
ALTER TABLE `payment_frequencies`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `penalty_rules`
--
ALTER TABLE `penalty_rules`
  ADD PRIMARY KEY (`id`),
  ADD KEY `gl_income_account_id` (`gl_income_account_id`);

--
-- Indexes for table `savings_accounts`
--
ALTER TABLE `savings_accounts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `account_number` (`account_number`),
  ADD KEY `savings_product_id` (`savings_product_id`),
  ADD KEY `branch_id` (`branch_id`),
  ADD KEY `idx_sa_member` (`member_id`);

--
-- Indexes for table `savings_products`
--
ALTER TABLE `savings_products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `gl_liability_account_id` (`gl_liability_account_id`),
  ADD KEY `gl_interest_expense_account_id` (`gl_interest_expense_account_id`);

--
-- Indexes for table `savings_transactions`
--
ALTER TABLE `savings_transactions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `transaction_no` (`transaction_no`),
  ADD KEY `savings_account_id` (`savings_account_id`),
  ADD KEY `member_id` (`member_id`),
  ADD KEY `cash_account_id` (`cash_account_id`);

--
-- Indexes for table `share_capital_accounts`
--
ALTER TABLE `share_capital_accounts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `account_number` (`account_number`),
  ADD KEY `idx_sca_member` (`member_id`),
  ADD KEY `idx_share_capital_branch_id` (`branch_id`);

--
-- Indexes for table `share_capital_settings`
--
ALTER TABLE `share_capital_settings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `accounting_account_id` (`accounting_account_id`);

--
-- Indexes for table `share_capital_transactions`
--
ALTER TABLE `share_capital_transactions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `receipt_no` (`receipt_no`),
  ADD KEY `share_account_id` (`share_account_id`),
  ADD KEY `member_id` (`member_id`),
  ADD KEY `cash_account_id` (`cash_account_id`);

--
-- Indexes for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `setting_key` (`setting_key`);

--
-- Indexes for table `transaction_types`
--
ALTER TABLE `transaction_types`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `role_id` (`role_id`),
  ADD KEY `branch_id` (`branch_id`);

--
-- Indexes for table `user_documents`
--
ALTER TABLE `user_documents`
  ADD PRIMARY KEY (`user_id`,`doc_key`);

--
-- Indexes for table `user_roles`
--
ALTER TABLE `user_roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Constraints for dumped tables
--

--
-- Constraints for table `accounting_mappings`
--
ALTER TABLE `accounting_mappings`
  ADD CONSTRAINT `accounting_mappings_ibfk_1` FOREIGN KEY (`debit_account_id`) REFERENCES `chart_of_accounts` (`id`),
  ADD CONSTRAINT `accounting_mappings_ibfk_2` FOREIGN KEY (`credit_account_id`) REFERENCES `chart_of_accounts` (`id`);

--
-- Constraints for table `approval_rules`
--
ALTER TABLE `approval_rules`
  ADD CONSTRAINT `approval_rules_ibfk_1` FOREIGN KEY (`workflow_id`) REFERENCES `approval_workflows` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `cash_accounts`
--
ALTER TABLE `cash_accounts`
  ADD CONSTRAINT `cash_accounts_ibfk_1` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`),
  ADD CONSTRAINT `cash_accounts_ibfk_2` FOREIGN KEY (`gl_account_id`) REFERENCES `chart_of_accounts` (`id`);

--
-- Constraints for table `cash_transactions`
--
ALTER TABLE `cash_transactions`
  ADD CONSTRAINT `cash_transactions_ibfk_1` FOREIGN KEY (`cash_account_id`) REFERENCES `cash_accounts` (`id`);

--
-- Constraints for table `fees`
--
ALTER TABLE `fees`
  ADD CONSTRAINT `fees_ibfk_1` FOREIGN KEY (`gl_account_id`) REFERENCES `chart_of_accounts` (`id`);

--
-- Constraints for table `general_ledger`
--
ALTER TABLE `general_ledger`
  ADD CONSTRAINT `general_ledger_ibfk_1` FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `general_ledger_ibfk_2` FOREIGN KEY (`account_id`) REFERENCES `chart_of_accounts` (`id`),
  ADD CONSTRAINT `general_ledger_ibfk_3` FOREIGN KEY (`period_id`) REFERENCES `accounting_periods` (`id`),
  ADD CONSTRAINT `general_ledger_ibfk_4` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`);

--
-- Constraints for table `journal_entries`
--
ALTER TABLE `journal_entries`
  ADD CONSTRAINT `journal_entries_ibfk_1` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`),
  ADD CONSTRAINT `journal_entries_ibfk_2` FOREIGN KEY (`period_id`) REFERENCES `accounting_periods` (`id`);

--
-- Constraints for table `journal_lines`
--
ALTER TABLE `journal_lines`
  ADD CONSTRAINT `journal_lines_ibfk_1` FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `journal_lines_ibfk_2` FOREIGN KEY (`account_id`) REFERENCES `chart_of_accounts` (`id`);

--
-- Constraints for table `loans`
--
ALTER TABLE `loans`
  ADD CONSTRAINT `fk_loans_application` FOREIGN KEY (`application_id`) REFERENCES `loan_applications` (`id`),
  ADD CONSTRAINT `loans_ibfk_1` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`),
  ADD CONSTRAINT `loans_ibfk_2` FOREIGN KEY (`loan_product_id`) REFERENCES `loan_products` (`id`),
  ADD CONSTRAINT `loans_ibfk_3` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`),
  ADD CONSTRAINT `loans_ibfk_4` FOREIGN KEY (`disbursed_from_cash_account_id`) REFERENCES `cash_accounts` (`id`);

--
-- Constraints for table `loan_amortization_schedules`
--
ALTER TABLE `loan_amortization_schedules`
  ADD CONSTRAINT `loan_amortization_schedules_ibfk_1` FOREIGN KEY (`loan_id`) REFERENCES `loans` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `loan_applications`
--
ALTER TABLE `loan_applications`
  ADD CONSTRAINT `loan_applications_ibfk_1` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`),
  ADD CONSTRAINT `loan_applications_ibfk_2` FOREIGN KEY (`loan_product_id`) REFERENCES `loan_products` (`id`),
  ADD CONSTRAINT `loan_applications_ibfk_3` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`);

--
-- Constraints for table `loan_payments`
--
ALTER TABLE `loan_payments`
  ADD CONSTRAINT `loan_payments_ibfk_1` FOREIGN KEY (`loan_id`) REFERENCES `loans` (`id`),
  ADD CONSTRAINT `loan_payments_ibfk_2` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`),
  ADD CONSTRAINT `loan_payments_ibfk_3` FOREIGN KEY (`cash_account_id`) REFERENCES `cash_accounts` (`id`);

--
-- Constraints for table `loan_payment_allocations`
--
ALTER TABLE `loan_payment_allocations`
  ADD CONSTRAINT `loan_payment_allocations_ibfk_1` FOREIGN KEY (`payment_id`) REFERENCES `loan_payments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `loan_payment_allocations_ibfk_2` FOREIGN KEY (`loan_id`) REFERENCES `loans` (`id`);

--
-- Constraints for table `loan_products`
--
ALTER TABLE `loan_products`
  ADD CONSTRAINT `loan_products_ibfk_1` FOREIGN KEY (`gl_receivable_account_id`) REFERENCES `chart_of_accounts` (`id`),
  ADD CONSTRAINT `loan_products_ibfk_2` FOREIGN KEY (`gl_interest_income_account_id`) REFERENCES `chart_of_accounts` (`id`);

--
-- Constraints for table `loan_product_versions`
--
ALTER TABLE `loan_product_versions`
  ADD CONSTRAINT `loan_product_versions_ibfk_1` FOREIGN KEY (`loan_product_id`) REFERENCES `loan_products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `members`
--
ALTER TABLE `members`
  ADD CONSTRAINT `members_ibfk_1` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`),
  ADD CONSTRAINT `members_ibfk_2` FOREIGN KEY (`member_type_id`) REFERENCES `member_types` (`id`);

--
-- Constraints for table `penalty_rules`
--
ALTER TABLE `penalty_rules`
  ADD CONSTRAINT `penalty_rules_ibfk_1` FOREIGN KEY (`gl_income_account_id`) REFERENCES `chart_of_accounts` (`id`);

--
-- Constraints for table `savings_accounts`
--
ALTER TABLE `savings_accounts`
  ADD CONSTRAINT `savings_accounts_ibfk_1` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`),
  ADD CONSTRAINT `savings_accounts_ibfk_2` FOREIGN KEY (`savings_product_id`) REFERENCES `savings_products` (`id`),
  ADD CONSTRAINT `savings_accounts_ibfk_3` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`);

--
-- Constraints for table `savings_products`
--
ALTER TABLE `savings_products`
  ADD CONSTRAINT `savings_products_ibfk_1` FOREIGN KEY (`gl_liability_account_id`) REFERENCES `chart_of_accounts` (`id`),
  ADD CONSTRAINT `savings_products_ibfk_2` FOREIGN KEY (`gl_interest_expense_account_id`) REFERENCES `chart_of_accounts` (`id`);

--
-- Constraints for table `savings_transactions`
--
ALTER TABLE `savings_transactions`
  ADD CONSTRAINT `savings_transactions_ibfk_1` FOREIGN KEY (`savings_account_id`) REFERENCES `savings_accounts` (`id`),
  ADD CONSTRAINT `savings_transactions_ibfk_2` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`),
  ADD CONSTRAINT `savings_transactions_ibfk_3` FOREIGN KEY (`cash_account_id`) REFERENCES `cash_accounts` (`id`);

--
-- Constraints for table `share_capital_accounts`
--
ALTER TABLE `share_capital_accounts`
  ADD CONSTRAINT `fk_share_capital_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `share_capital_accounts_ibfk_1` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`);

--
-- Constraints for table `share_capital_settings`
--
ALTER TABLE `share_capital_settings`
  ADD CONSTRAINT `share_capital_settings_ibfk_1` FOREIGN KEY (`accounting_account_id`) REFERENCES `chart_of_accounts` (`id`);

--
-- Constraints for table `share_capital_transactions`
--
ALTER TABLE `share_capital_transactions`
  ADD CONSTRAINT `share_capital_transactions_ibfk_1` FOREIGN KEY (`share_account_id`) REFERENCES `share_capital_accounts` (`id`),
  ADD CONSTRAINT `share_capital_transactions_ibfk_2` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`),
  ADD CONSTRAINT `share_capital_transactions_ibfk_3` FOREIGN KEY (`cash_account_id`) REFERENCES `cash_accounts` (`id`);

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `user_roles` (`id`),
  ADD CONSTRAINT `users_ibfk_2` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`);

--
-- Constraints for table `user_documents`
--
ALTER TABLE `user_documents`
  ADD CONSTRAINT `user_documents_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
