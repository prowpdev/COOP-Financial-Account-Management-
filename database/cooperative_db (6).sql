-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Oct 16, 2026 at 11:27 AM
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
  `id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `event_type` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `debit_account_id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `credit_account_id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `is_system` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `accounting_periods`
--

CREATE TABLE `accounting_periods` (
  `id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `fiscal_year` int NOT NULL,
  `period_number` int NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `status` enum('Open','Closed','Locked') COLLATE utf8mb4_general_ci DEFAULT 'Open',
  `closed_at` timestamp NULL DEFAULT NULL,
  `closed_by` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `accounting_periods`
--

INSERT INTO `accounting_periods` (`id`, `name`, `fiscal_year`, `period_number`, `start_date`, `end_date`, `status`, `closed_at`, `closed_by`, `created_at`) VALUES
('period_941f183616ab', 'October 2026', 2026, 1, '2026-10-01', '2026-10-31', 'Open', NULL, NULL, '2026-10-16 01:21:37');

-- --------------------------------------------------------

--
-- Table structure for table `approval_rules`
--

CREATE TABLE `approval_rules` (
  `id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `workflow_id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `level_name` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `order` int NOT NULL,
  `required_role` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `minimum_amount` decimal(15,2) DEFAULT '0.00',
  `maximum_amount` decimal(15,2) DEFAULT NULL,
  `required_approvals` tinyint(1) DEFAULT '0',
  `active` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `approval_workflows`
--

CREATE TABLE `approval_workflows` (
  `id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `module` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `branches`
--

CREATE TABLE `branches` (
  `id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `coop_id` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `code` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `address` text COLLATE utf8mb4_general_ci NOT NULL,
  `contact_number` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `manager_name` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `is_main_branch` tinyint(1) DEFAULT '0',
  `active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `branches`
--

INSERT INTO `branches` (`id`, `coop_id`, `code`, `name`, `address`, `contact_number`, `manager_name`, `is_main_branch`, `active`, `created_at`) VALUES
('br_e87d2b43', 'coop_9fd7380350aa', 'MCAC-TAR', 'TARLAC BRANCH', 'Barangay Care zone 5 Tarlac City', NULL, 'JHOMEL IGNACIO', 0, 1, '2026-10-16 01:06:37');

-- --------------------------------------------------------

--
-- Table structure for table `cash_accounts`
--

CREATE TABLE `cash_accounts` (
  `id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `account_number` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `bank_name` varchar(150) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `branch_id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `gl_account_id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `opening_balance` decimal(15,2) DEFAULT '0.00',
  `current_balance` decimal(15,2) DEFAULT '0.00',
  `currency` varchar(10) COLLATE utf8mb4_general_ci DEFAULT 'PHP',
  `active` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `cash_accounts`
--

INSERT INTO `cash_accounts` (`id`, `name`, `account_number`, `bank_name`, `branch_id`, `gl_account_id`, `opening_balance`, `current_balance`, `currency`, `active`) VALUES
('cash_b1c0fd237363', 'Treasurer Cash on hand', 'COH-MCAC-TAR-02', 'Cash Drawer Float', 'br_e87d2b43', 'coa_d0999c38a6ca', 0.00, 1000.00, 'PHP', 1);

-- --------------------------------------------------------

--
-- Table structure for table `cash_transactions`
--

CREATE TABLE `cash_transactions` (
  `id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `transaction_no` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `cash_account_id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `type` enum('INFLOW','OUTFLOW','TRANSFER') COLLATE utf8mb4_general_ci NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `balance_before` decimal(15,2) NOT NULL,
  `balance_after` decimal(15,2) NOT NULL,
  `running_balance` decimal(15,2) DEFAULT '0.00',
  `reference_number` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `reference_type` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `reference_id` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `notes` text COLLATE utf8mb4_general_ci,
  `transaction_date` date DEFAULT NULL,
  `created_by` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `chart_of_accounts`
--

CREATE TABLE `chart_of_accounts` (
  `id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `branch_id` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `account_code` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `category` enum('Asset','Liability','Equity','Revenue','Expense') COLLATE utf8mb4_general_ci NOT NULL,
  `normal_balance` enum('Debit','Credit') COLLATE utf8mb4_general_ci NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `parent_account_id` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `report_group` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `chart_of_accounts`
--

INSERT INTO `chart_of_accounts` (`id`, `branch_id`, `account_code`, `name`, `category`, `normal_balance`, `is_active`, `parent_account_id`, `report_group`, `description`, `created_at`) VALUES
('coa_2fa18d4ae352', 'br_e87d2b43', '11210', 'Loans Receivable – Current', 'Asset', 'Debit', 1, NULL, 'Current Assets', NULL, '2026-10-16 01:10:57'),
('coa_422b462bc7d8', 'br_e87d2b43', '30130', 'Paid-up Share Capital – Common', 'Equity', 'Credit', 1, NULL, 'Share Capital', NULL, '2026-10-16 01:12:02'),
('coa_570488b21844', 'br_e87d2b43', '30810', 'Reserve Fund', 'Equity', 'Credit', 1, NULL, 'Reserve Fund', NULL, '2026-10-16 01:13:03'),
('coa_624d789d9709', 'br_e87d2b43', '71100', 'Interest Expense on Borrowings', 'Expense', 'Debit', 1, NULL, 'Interest Expense on Borrowings', NULL, '2026-10-16 01:14:26'),
('coa_6aaa1ea5d58a', 'br_e87d2b43', '21110', 'Saving Deposits', 'Liability', 'Credit', 1, NULL, 'Savings Deposits', NULL, '2026-10-16 01:11:13'),
('coa_6e78a8ab1efb', 'br_e87d2b43', '72140', 'Salaries & Wages', 'Expense', 'Debit', 1, NULL, 'Salaries & Wages', NULL, '2026-10-16 01:14:38'),
('coa_8ca652579878', 'br_e87d2b43', '21210', 'Accounts Payable–Trade', 'Liability', 'Credit', 1, NULL, 'Accounts Payable', NULL, '2026-10-16 01:11:29'),
('coa_a4c9612f875f', 'br_e87d2b43', '73600', 'Bank Charges', 'Expense', 'Debit', 1, NULL, 'Bank Charges', NULL, '2026-10-16 01:14:52'),
('coa_aa7aa0dbef41', 'br_e87d2b43', '40620', 'Membership Fee', 'Revenue', 'Credit', 1, NULL, 'Membership Fee', NULL, '2026-10-16 01:14:05'),
('coa_b22c209539c4', 'br_e87d2b43', '11130', 'Cash in Bank', 'Asset', 'Debit', 1, NULL, 'Current Assets', '', '2026-10-16 01:10:36'),
('coa_c6e060510df1', 'br_e87d2b43', '21300', 'Accrued Expenses', 'Liability', 'Credit', 1, NULL, 'Accrued Expenses', NULL, '2026-10-16 01:11:41'),
('coa_d0999c38a6ca', 'br_e87d2b43', '11110', 'Cash On Hand', 'Asset', 'Debit', 1, NULL, 'Current Assets', NULL, '2026-10-16 01:08:48'),
('coa_d30b923a2737', 'br_e87d2b43', '40120', 'Service Fees', 'Revenue', 'Credit', 1, NULL, 'Service Fees', NULL, '2026-10-16 01:13:47'),
('coa_f7da65201479', 'br_e87d2b43', '40110', 'Interest Income from Loans', 'Revenue', 'Credit', 1, NULL, 'Interest Income from Loans', NULL, '2026-10-16 01:13:25');

-- --------------------------------------------------------

--
-- Table structure for table `configuration_audit_trails`
--

CREATE TABLE `configuration_audit_trails` (
  `id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `action` varchar(20) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'UPDATE',
  `setting` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `old_value` text COLLATE utf8mb4_general_ci,
  `new_value` text COLLATE utf8mb4_general_ci,
  `changed_by` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `branch_id` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `reason` text COLLATE utf8mb4_general_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `configuration_audit_trails`
--

INSERT INTO `configuration_audit_trails` (`id`, `action`, `setting`, `old_value`, `new_value`, `changed_by`, `branch_id`, `reason`, `created_at`) VALUES
('audit_016a9a9727d53e2e', 'TRANSACTION', 'loan_payments', '{\"loan_id\":\"ln_88b29d244064\",\"balance\":\"10000.00\"}', '{\"payment_id\":\"lp_91ad9b5e177c\",\"receipt_no\":\"OR-20261016-4968\",\"loan_id\":\"ln_88b29d244064\",\"member_id\":\"mem_ee232b0b50e1\",\"amount\":916.66,\"principal_paid\":833.33,\"interest_paid\":83.33,\"allocation_count\":1}', 'usr_fc1b85fb1cfee461', 'br_e87d2b43', 'Loan repayment recorded', '2026-10-16 01:33:05'),
('audit_043b0381f183d526', 'CREATE', 'users', 'None', '{\"id\":\"usr_fc1b85fb1cfee461\",\"username\":\"admin\",\"branch_id\":\"br_e87d2b43\",\"cooperative_id\":null}', 'System', NULL, 'User account created', '2026-10-16 01:07:14'),
('audit_24c2a0e8711ab991', 'UPDATE', 'Loan Status', 'Pending', '{\"application_id\":\"la_ae2372741359\",\"approved_amount\":10000,\"status\":\"Approved\",\"approved_by\":\"admin`\",\"remarks\":\"Approved by Credit Committee after collateral & capacity assessment.\"}', 'usr_fc1b85fb1cfee461', 'br_e87d2b43', 'Approved loan application', '2026-10-16 01:32:44'),
('audit_321c3d18f2ea4616', 'TRANSACTION', 'loan_payments', '{\"loan_id\":\"ln_88b29d244064\",\"balance\":\"9166.67\"}', '{\"payment_id\":\"lp_e7d502dc5449\",\"receipt_no\":\"OR-20261016-2204\",\"loan_id\":\"ln_88b29d244064\",\"member_id\":\"mem_ee232b0b50e1\",\"amount\":916.66,\"principal_paid\":833.33,\"interest_paid\":83.33,\"allocation_count\":1}', 'usr_fc1b85fb1cfee461', 'br_e87d2b43', 'Loan repayment recorded', '2026-10-16 01:33:33'),
('audit_5417f428b86c3f15', 'CREATE', 'Loan', 'None', '{\"id\":\"ln_88b29d244064\",\"loan_account_no\":\"LN-2026-32343\",\"application_id\":\"la_ae2372741359\",\"member_id\":\"mem_ee232b0b50e1\",\"loan_product_id\":\"lp_88adac85\",\"branch_id\":\"br_e87d2b43\",\"principal_amount\":10000,\"annual_interest_rate\":10,\"interest_calculation_method\":\"Flat Rate\",\"term_months\":12,\"payment_frequency\":\"Monthly\",\"disbursement_date\":\"2026-10-16\",\"first_due_date\":\"2026-11-16\",\"maturity_date\":\"2027-10-16\",\"processing_fee\":0,\"service_fee\":0,\"net_disbursed\":10000,\"cash_account_id\":\"cash_b1c0fd237363\",\"status\":\"Active\",\"current_balance\":10000}', 'usr_fc1b85fb1cfee461', 'br_e87d2b43', 'Disbursed loan', '2026-10-16 01:32:47'),
('audit_6195b0ef6804e883', 'CREATE', 'Share Capital Account Created', 'None', '{\"account_id\":\"sc_51b338f4749c\",\"account_number\":\"CBU-2026-82473\",\"member_id\":\"mem_ee232b0b50e1\",\"branch_id\":\"br_e87d2b43\",\"subscribed_shares\":40,\"subscribed_amount\":4000,\"paid_up_shares\":10,\"paid_up_amount\":1000,\"cash_account_id\":\"cash_b1c0fd237363\",\"cash_gl_account_id\":\"coa_d0999c38a6ca\",\"share_capital_gl_account_id\":\"coa_422b462bc7d8\",\"transaction_id\":\"sctx_475ce696c783\",\"journal_entry_id\":\"je_5beae576cae0\",\"voucher_number\":\"OR-SC-20261016-113AAB\",\"old_cash_balance\":0,\"new_cash_balance\":1000}', 'usr_fc1b85fb1cfee461', 'br_e87d2b43', 'New Share Capital / CBU account created.', '2026-10-16 01:21:45'),
('audit_8658ccca9ae724a6', 'CREATE', 'Loan Application', 'None', '{\"id\":\"la_ae2372741359\",\"application_no\":\"LA-2026-61487\",\"member_id\":\"mem_ee232b0b50e1\",\"loan_product_id\":\"lp_88adac85\",\"branch_id\":\"br_e87d2b43\",\"applied_amount\":10000,\"term_months\":12,\"purpose\":null,\"status\":\"Pending\",\"submitted_date\":\"2026-10-16\"}', 'usr_fc1b85fb1cfee461', 'br_e87d2b43', 'Created loan application', '2026-10-16 01:32:40'),
('audit_94d2918b3000ea0c', 'UPDATE', 'Loan Application', '{\"id\":\"la_ae2372741359\",\"application_no\":\"LA-2026-61487\",\"status\":\"Approved\",\"approved_amount\":\"10000.00\"}', '{\"id\":\"la_ae2372741359\",\"application_no\":\"LA-2026-61487\",\"status\":\"Released\",\"approved_amount\":\"10000.00\"}', 'usr_fc1b85fb1cfee461', 'br_e87d2b43', 'Marked loan application as released after disbursement', '2026-10-16 01:32:47'),
('audit_96383310f232bb41', 'CREATE', 'members', 'None', '{\"id\":\"mem_ee232b0b50e1\",\"member_no\":\"MEM-2026-91286\",\"branch_id\":\"br_e87d2b43\"}', 'usr_fc1b85fb1cfee461', 'br_e87d2b43', 'Member created', '2026-10-16 01:20:42'),
('audit_b47b50fedaeb8483', 'CREATE', 'cash_accounts', 'None', '{\"id\":\"cash_b1c0fd237363\",\"branch_id\":\"br_e87d2b43\",\"account_number\":\"COH-MCAC-TAR-02\"}', 'usr_fc1b85fb1cfee461', 'br_e87d2b43', 'Cash account saved', '2026-10-16 01:18:16');

-- --------------------------------------------------------

--
-- Table structure for table `cooperatives`
--

CREATE TABLE `cooperatives` (
  `id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `cda_registration_no` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `tax_identification_no` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `coop_type` varchar(100) COLLATE utf8mb4_general_ci DEFAULT 'Agricultural',
  `address` text COLLATE utf8mb4_general_ci,
  `contact_phone` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `contact_email` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `fiscal_year_start` varchar(10) COLLATE utf8mb4_general_ci DEFAULT '01-01',
  `base_currency` varchar(10) COLLATE utf8mb4_general_ci DEFAULT 'PHP',
  `status` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `cooperatives`
--

INSERT INTO `cooperatives` (`id`, `name`, `cda_registration_no`, `tax_identification_no`, `coop_type`, `address`, `contact_phone`, `contact_email`, `fiscal_year_start`, `base_currency`, `status`, `created_at`, `updated_at`) VALUES
('coop_9fd7380350aa', 'Mayap Care Agriculture Cooperative', '', '', 'Agriculture', '', '', '', '01-01', 'PHP', 0, '2026-10-15 17:05:57', '2026-10-15 17:05:57');

-- --------------------------------------------------------

--
-- Table structure for table `custom_fields`
--

CREATE TABLE `custom_fields` (
  `id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `entity_type` enum('Member','Loan','Savings','ShareCapital') COLLATE utf8mb4_general_ci NOT NULL,
  `field_key` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `label` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `field_type` enum('Text','Number','Date','Select','Boolean','Phone','Dropdown','File','Image','PDF','Document') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `options` json DEFAULT NULL,
  `is_required` tinyint(1) DEFAULT '0',
  `active` tinyint(1) DEFAULT '1',
  `display_order` int DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `document_requirements`
--

CREATE TABLE `document_requirements` (
  `id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `module` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `is_mandatory` tinyint(1) DEFAULT '1',
  `active` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `feature_toggles`
--

CREATE TABLE `feature_toggles` (
  `id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `feature_key` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `category` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `enabled` tinyint(1) DEFAULT '1',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `fees`
--

CREATE TABLE `fees` (
  `id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `calculation_type` enum('Fixed','Percentage','Percentage of Principal') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `applies_to` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `percentage` int NOT NULL,
  `gl_account_id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `active` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `fees`
--

INSERT INTO `fees` (`id`, `code`, `name`, `calculation_type`, `amount`, `applies_to`, `percentage`, `gl_account_id`, `active`) VALUES
('fee_8d4841e8', 'LOAN-SERVICE-FEE', 'Service Fee', 'Fixed', 250.00, 'Loans', 0, 'coa_d30b923a2737', 1);

-- --------------------------------------------------------

--
-- Table structure for table `general_ledger`
--

CREATE TABLE `general_ledger` (
  `id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `journal_entry_id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `account_id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `posting_date` date NOT NULL,
  `period_id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `branch_id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `debit` decimal(15,2) DEFAULT '0.00',
  `credit` decimal(15,2) DEFAULT '0.00',
  `balance_running` decimal(15,2) DEFAULT '0.00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `journal_entries`
--

CREATE TABLE `journal_entries` (
  `id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `voucher_number` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `branch_id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `posting_date` date NOT NULL,
  `reference_type` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `reference_id` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_general_ci NOT NULL,
  `total_debit` decimal(15,2) NOT NULL,
  `total_credit` decimal(15,2) NOT NULL,
  `period_id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `status` enum('Draft','Pending Approval','Posted','Reversed') COLLATE utf8mb4_general_ci DEFAULT 'Posted',
  `created_by` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `posted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `journal_entries`
--

INSERT INTO `journal_entries` (`id`, `voucher_number`, `branch_id`, `posting_date`, `reference_type`, `reference_id`, `description`, `total_debit`, `total_credit`, `period_id`, `status`, `created_by`, `posted_at`) VALUES
('je_5beae576cae0', 'OR-SC-20261016-113AAB', 'br_e87d2b43', '2026-10-16', 'Share Capital Payment', 'sctx_475ce696c783', 'Initial share capital payment - CBU-2026-82473 - Receipt SC-OR-20261016-8D45', 1000.00, 1000.00, 'period_941f183616ab', 'Posted', 'admin`', '2026-10-16 01:21:45');

-- --------------------------------------------------------

--
-- Table structure for table `journal_lines`
--

CREATE TABLE `journal_lines` (
  `id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `journal_entry_id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `account_id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `debit` decimal(15,2) DEFAULT '0.00',
  `credit` decimal(15,2) DEFAULT '0.00',
  `subsidiary_type` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `subsidiary_id` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `journal_lines`
--

INSERT INTO `journal_lines` (`id`, `journal_entry_id`, `account_id`, `debit`, `credit`, `subsidiary_type`, `subsidiary_id`) VALUES
('jl_a4f715f0bec9', 'je_5beae576cae0', 'coa_422b462bc7d8', 0.00, 1000.00, 'Member', 'mem_ee232b0b50e1'),
('jl_f6ebdf7d56b3', 'je_5beae576cae0', 'coa_d0999c38a6ca', 1000.00, 0.00, 'Member', 'mem_ee232b0b50e1');

-- --------------------------------------------------------

--
-- Table structure for table `loans`
--

CREATE TABLE `loans` (
  `id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `loan_account_no` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `application_id` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `member_id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `loan_product_id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `product_version` int DEFAULT '1',
  `branch_id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `principal_amount` decimal(15,2) NOT NULL,
  `annual_interest_rate` decimal(5,2) NOT NULL,
  `interest_calculation_method` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `term_months` int NOT NULL,
  `payment_frequency` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `disbursement_date` date NOT NULL,
  `first_due_date` date NOT NULL,
  `maturity_date` date NOT NULL,
  `processing_fee` decimal(15,2) DEFAULT '0.00',
  `service_fee` decimal(15,2) DEFAULT '0.00',
  `net_disbursed` decimal(15,2) NOT NULL,
  `disbursed_from_cash_account_id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `status` enum('Draft','Submitted','Approved','Released','Active','Fully Paid','Past Due','Restructured','Pending') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT 'Submitted',
  `current_balance` decimal(15,2) NOT NULL,
  `total_principal_paid` decimal(15,2) DEFAULT '0.00',
  `total_interest_paid` decimal(15,2) DEFAULT '0.00',
  `total_penalty_paid` decimal(15,2) DEFAULT '0.00',
  `total_fees_paid` decimal(15,2) DEFAULT '0.00',
  `approved_by` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `approved_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `loans`
--

INSERT INTO `loans` (`id`, `loan_account_no`, `application_id`, `member_id`, `loan_product_id`, `product_version`, `branch_id`, `principal_amount`, `annual_interest_rate`, `interest_calculation_method`, `term_months`, `payment_frequency`, `disbursement_date`, `first_due_date`, `maturity_date`, `processing_fee`, `service_fee`, `net_disbursed`, `disbursed_from_cash_account_id`, `status`, `current_balance`, `total_principal_paid`, `total_interest_paid`, `total_penalty_paid`, `total_fees_paid`, `approved_by`, `approved_date`, `created_at`) VALUES
('ln_88b29d244064', 'LN-2026-32343', 'la_ae2372741359', 'mem_ee232b0b50e1', 'lp_88adac85', 1, 'br_e87d2b43', 10000.00, 10.00, 'Flat Rate', 12, 'Monthly', '2026-10-16', '2026-11-16', '2027-10-16', 0.00, 0.00, 10000.00, 'cash_b1c0fd237363', 'Active', 8333.34, 1666.66, 166.66, 0.00, 0.00, NULL, '2026-10-16', '2026-10-16 01:32:47');

-- --------------------------------------------------------

--
-- Table structure for table `loan_amortization_schedules`
--

CREATE TABLE `loan_amortization_schedules` (
  `id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `loan_id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
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
  `status` enum('Unpaid','Partially Paid','Paid','Overdue') COLLATE utf8mb4_general_ci DEFAULT 'Unpaid'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `loan_amortization_schedules`
--

INSERT INTO `loan_amortization_schedules` (`id`, `loan_id`, `installment_no`, `due_date`, `principal`, `interest`, `fee`, `total_installment`, `principal_balance`, `paid_principal`, `paid_interest`, `paid_penalty`, `paid_date`, `status`) VALUES
('las_20e3b653ce93', 'ln_88b29d244064', 1, '2026-11-16', 833.33, 83.33, 0.00, 916.67, 9166.67, 833.33, 83.33, 0.00, NULL, 'Paid'),
('las_2ac06b58f612', 'ln_88b29d244064', 10, '2027-08-16', 833.33, 83.33, 0.00, 916.67, 1666.67, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_300514e9677c', 'ln_88b29d244064', 5, '2027-03-16', 833.33, 83.33, 0.00, 916.67, 5833.33, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_42f0e599df85', 'ln_88b29d244064', 7, '2027-05-16', 833.33, 83.33, 0.00, 916.67, 4166.67, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_436d3767cdc8', 'ln_88b29d244064', 12, '2027-10-16', 833.33, 83.33, 0.00, 916.67, 0.00, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_499b53ceb1d9', 'ln_88b29d244064', 2, '2026-12-16', 833.33, 83.33, 0.00, 916.67, 8333.33, 833.33, 83.33, 0.00, NULL, 'Paid'),
('las_5e328057c274', 'ln_88b29d244064', 3, '2027-01-16', 833.33, 83.33, 0.00, 916.67, 7500.00, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_7f16ef179082', 'ln_88b29d244064', 8, '2027-06-16', 833.33, 83.33, 0.00, 916.67, 3333.33, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_96fb05dae730', 'ln_88b29d244064', 4, '2027-02-16', 833.33, 83.33, 0.00, 916.67, 6666.67, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_9cb89b94cdc9', 'ln_88b29d244064', 11, '2027-09-16', 833.33, 83.33, 0.00, 916.67, 833.33, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_b73c7381ae32', 'ln_88b29d244064', 9, '2027-07-16', 833.33, 83.33, 0.00, 916.67, 2500.00, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_c6f5c7df2881', 'ln_88b29d244064', 6, '2027-04-16', 833.33, 83.33, 0.00, 916.67, 5000.00, 0.00, 0.00, 0.00, NULL, 'Unpaid');

-- --------------------------------------------------------

--
-- Table structure for table `loan_applications`
--

CREATE TABLE `loan_applications` (
  `id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `loan_id` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `application_no` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `member_id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `loan_product_id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `branch_id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `applied_amount` decimal(15,2) NOT NULL,
  `term_months` int NOT NULL,
  `purpose` text COLLATE utf8mb4_general_ci,
  `status` enum('Draft','Submitted','Under Review','Approved','Rejected','Released','Pending') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT 'Draft',
  `submitted_date` date DEFAULT NULL,
  `reviewed_by` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `reviewed_date` date DEFAULT NULL,
  `approved_amount` decimal(15,2) DEFAULT NULL,
  `remarks` text COLLATE utf8mb4_general_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `loan_applications`
--

INSERT INTO `loan_applications` (`id`, `loan_id`, `application_no`, `member_id`, `loan_product_id`, `branch_id`, `applied_amount`, `term_months`, `purpose`, `status`, `submitted_date`, `reviewed_by`, `reviewed_date`, `approved_amount`, `remarks`, `created_at`) VALUES
('la_ae2372741359', NULL, 'LA-2026-61487', 'mem_ee232b0b50e1', 'lp_88adac85', 'br_e87d2b43', 10000.00, 12, NULL, 'Released', '2026-10-16', 'admin`', '2026-10-16', 10000.00, 'Approved by Credit Committee after collateral & capacity assessment.', '2026-10-16 01:32:40');

-- --------------------------------------------------------

--
-- Table structure for table `loan_payments`
--

CREATE TABLE `loan_payments` (
  `id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `receipt_no` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `loan_id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `member_id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `payment_date` date NOT NULL,
  `principal_amount` decimal(15,2) DEFAULT '0.00',
  `total_amount` decimal(15,2) NOT NULL,
  `principal_paid` decimal(15,2) DEFAULT '0.00',
  `interest_paid` decimal(15,2) DEFAULT '0.00',
  `cash_account_id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `received_by` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `journal_entry_id` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `loan_amortization_schedule_id` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `loan_payments`
--

INSERT INTO `loan_payments` (`id`, `receipt_no`, `loan_id`, `member_id`, `payment_date`, `principal_amount`, `total_amount`, `principal_paid`, `interest_paid`, `cash_account_id`, `received_by`, `journal_entry_id`, `created_at`, `loan_amortization_schedule_id`) VALUES
('lp_91ad9b5e177c', 'OR-20261016-4968', 'ln_88b29d244064', 'mem_ee232b0b50e1', '2026-10-16', 0.00, 916.66, 833.33, 83.33, 'cash_b1c0fd237363', 'admin`', NULL, '2026-10-16 01:33:05', NULL),
('lp_e7d502dc5449', 'OR-20261016-2204', 'ln_88b29d244064', 'mem_ee232b0b50e1', '2026-10-16', 0.00, 916.66, 833.33, 83.33, 'cash_b1c0fd237363', 'admin`', NULL, '2026-10-16 01:33:33', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `loan_payment_allocations`
--

CREATE TABLE `loan_payment_allocations` (
  `id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `payment_id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `loan_id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `penalty_amount` decimal(15,2) DEFAULT '0.00',
  `interest_amount` decimal(15,2) DEFAULT '0.00',
  `fee_amount` decimal(15,2) DEFAULT '0.00',
  `principal_amount` decimal(15,2) DEFAULT '0.00',
  `allocation_order_applied` json DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `loan_payment_allocations`
--

INSERT INTO `loan_payment_allocations` (`id`, `payment_id`, `loan_id`, `penalty_amount`, `interest_amount`, `fee_amount`, `principal_amount`, `allocation_order_applied`) VALUES
('lpa_0362f9d48ad9', 'lp_91ad9b5e177c', 'ln_88b29d244064', 0.00, 83.33, 0.00, 833.33, '{\"priority\": [\"interest\", \"principal\"], \"fee_amount\": 0, \"schedule_id\": \"las_20e3b653ce93\", \"penalty_amount\": 0, \"interest_amount\": 83.33, \"principal_amount\": 833.33}'),
('lpa_c100794d33b7', 'lp_e7d502dc5449', 'ln_88b29d244064', 0.00, 83.33, 0.00, 833.33, '{\"priority\": [\"interest\", \"principal\"], \"fee_amount\": 0, \"schedule_id\": \"las_499b53ceb1d9\", \"penalty_amount\": 0, \"interest_amount\": 83.33, \"principal_amount\": 833.33}');

-- --------------------------------------------------------

--
-- Table structure for table `loan_products`
--

CREATE TABLE `loan_products` (
  `id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `version` int DEFAULT '1',
  `min_amount` decimal(15,2) NOT NULL,
  `max_amount` decimal(15,2) NOT NULL,
  `min_term_months` int DEFAULT NULL,
  `max_term_months` int DEFAULT NULL,
  `annual_interest_rate` decimal(5,2) NOT NULL,
  `default_term_months` int DEFAULT NULL,
  `interest_calculation_method` enum('Diminishing Balance','Flat Rate','Equal Amortization') COLLATE utf8mb4_general_ci NOT NULL,
  `payment_frequency` enum('Monthly','Semi-monthly','Weekly','Lump Sum') COLLATE utf8mb4_general_ci NOT NULL,
  `grace_period_days` int DEFAULT '0',
  `processing_fee_percentage` decimal(5,2) NOT NULL DEFAULT '0.00',
  `service_fee_fixed` decimal(12,2) NOT NULL DEFAULT '0.00',
  `penalty_rule_id` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `collateral_required` tinyint(1) NOT NULL DEFAULT '0',
  `guarantor_required` tinyint(1) NOT NULL DEFAULT '0',
  `debit_account_id` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `required_documents` json DEFAULT NULL,
  `approval_workflow_id` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `effective_from` date DEFAULT NULL,
  `effective_until` date DEFAULT NULL,
  `penalty_rate_percentage` decimal(5,2) DEFAULT '2.00',
  `gl_receivable_account_id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `gl_interest_income_account_id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `active` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `loan_products`
--

INSERT INTO `loan_products` (`id`, `code`, `name`, `description`, `version`, `min_amount`, `max_amount`, `min_term_months`, `max_term_months`, `annual_interest_rate`, `default_term_months`, `interest_calculation_method`, `payment_frequency`, `grace_period_days`, `processing_fee_percentage`, `service_fee_fixed`, `penalty_rule_id`, `collateral_required`, `guarantor_required`, `debit_account_id`, `required_documents`, `approval_workflow_id`, `effective_from`, `effective_until`, `penalty_rate_percentage`, `gl_receivable_account_id`, `gl_interest_income_account_id`, `active`) VALUES
('lp_88adac85', 'LP-384', 'Regular Loan', '', 1, 10000.00, 250000.00, 1, 12, 10.00, 12, 'Flat Rate', 'Monthly', 5, 0.00, 0.00, NULL, 0, 0, 'acc_1210', '[]', NULL, NULL, NULL, 2.00, 'acc_1210', 'coa_f7da65201479', 1);

-- --------------------------------------------------------

--
-- Table structure for table `loan_product_versions`
--

CREATE TABLE `loan_product_versions` (
  `id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `loan_product_id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `version_number` int NOT NULL,
  `annual_interest_rate` decimal(5,2) NOT NULL,
  `interest_calculation_method` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `effective_from` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `changed_by` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `reason` text COLLATE utf8mb4_general_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `members`
--

CREATE TABLE `members` (
  `id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `member_no` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `branch_id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `member_type_id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `first_name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `last_name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `middle_name` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `gender` enum('Male','Female','Other') COLLATE utf8mb4_general_ci NOT NULL,
  `birthdate` date NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `phone` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `address` text COLLATE utf8mb4_general_ci NOT NULL,
  `status` enum('Active','Pending Approval','Inactive','Terminated','Deceased') COLLATE utf8mb4_general_ci DEFAULT 'Pending Approval',
  `joined_date` date NOT NULL,
  `custom_field_values` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `members`
--

INSERT INTO `members` (`id`, `member_no`, `branch_id`, `member_type_id`, `first_name`, `last_name`, `middle_name`, `gender`, `birthdate`, `email`, `phone`, `address`, `status`, `joined_date`, `custom_field_values`, `created_at`, `updated_at`) VALUES
('mem_ee232b0b50e1', 'MEM-2026-91286', 'br_e87d2b43', 'mt_01204d7aea4d', 'Jhomel', 'Ignacio', '', 'Female', '1992-05-15', 'jhomignacio08@gmail.com', '', 'zone 5', 'Active', '2026-10-16', '{\"notes\": \"\", \"tin_number\": \"\"}', '2026-10-16 01:20:42', '2026-10-16 01:20:42');

-- --------------------------------------------------------

--
-- Table structure for table `member_types`
--

CREATE TABLE `member_types` (
  `id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `coop_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `code` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `voting_rights` tinyint(1) DEFAULT '1',
  `min_share_capital` decimal(15,2) DEFAULT '1000.00',
  `savings_requirement` decimal(15,2) DEFAULT '500.00',
  `loan_eligibility` tinyint(1) DEFAULT '1',
  `required_documents` json DEFAULT NULL,
  `active` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `member_types`
--

INSERT INTO `member_types` (`id`, `coop_id`, `name`, `code`, `description`, `voting_rights`, `min_share_capital`, `savings_requirement`, `loan_eligibility`, `required_documents`, `active`) VALUES
('mt_01204d7aea4d', 'coop_9fd7380350aa', 'Regular Member', 'REG', 'Regular Member Famer', 1, 1000.00, 0.00, 1, '[\"Valid ID\", \"TIN\", \"Farm Lot Area\"]', 1),
('mt_0692232a2b73', 'coop_9fd7380350aa', 'Associate Member', 'ASSOC', 'Associate Member', 0, 1000.00, 0.00, 0, '[\"Valid ID\"]', 1);

-- --------------------------------------------------------

--
-- Table structure for table `numbering_formats`
--

CREATE TABLE `numbering_formats` (
  `id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `branch_id` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `module` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `prefix` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `branch_specific` tinyint(1) DEFAULT '1',
  `include_year` tinyint(1) DEFAULT '1',
  `padding` int DEFAULT '5',
  `next_number` int DEFAULT '1',
  `pattern` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payment_allocation_rules`
--

CREATE TABLE `payment_allocation_rules` (
  `id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `priority_order` json NOT NULL,
  `is_default` tinyint(1) DEFAULT '1',
  `active` tinyint(1) NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payment_frequencies`
--

CREATE TABLE `payment_frequencies` (
  `id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `name` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `days_interval` int NOT NULL,
  `periods_per_year` int NOT NULL,
  `active` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `penalty_rules`
--

CREATE TABLE `penalty_rules` (
  `id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `grace_period_days` int DEFAULT '0',
  `penalty_rate_percentage` decimal(5,2) NOT NULL,
  `calculation_base` enum('Overdue Principal','Total Overdue Installment') COLLATE utf8mb4_general_ci DEFAULT 'Overdue Principal',
  `compounding_frequency` enum('None','Monthly','Daily') COLLATE utf8mb4_general_ci DEFAULT 'None',
  `gl_income_account_id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `savings_accounts`
--

CREATE TABLE `savings_accounts` (
  `id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `account_number` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `member_id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `savings_product_id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `branch_id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `balance` decimal(15,2) DEFAULT '0.00',
  `opened_date` date NOT NULL,
  `status` enum('Active','Dormant','Closed') COLLATE utf8mb4_general_ci DEFAULT 'Active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `savings_products`
--

CREATE TABLE `savings_products` (
  `id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `min_balance_to_earn_interest` decimal(15,2) DEFAULT '1000.00',
  `annual_interest_rate` decimal(5,2) DEFAULT '2.00',
  `interest_calculation_method` varchar(50) COLLATE utf8mb4_general_ci DEFAULT 'Average Daily Balance',
  `min_opening_deposit` decimal(15,2) DEFAULT '500.00',
  `maintaining_balance` decimal(15,2) DEFAULT '500.00',
  `gl_liability_account_id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `gl_interest_expense_account_id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `active` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `savings_transactions`
--

CREATE TABLE `savings_transactions` (
  `id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `transaction_no` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `savings_account_id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `member_id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `type` enum('DEPOSIT','WITHDRAWAL','INTEREST_POSTING','FEE_DEDUCTION') COLLATE utf8mb4_general_ci NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `balance_after` decimal(15,2) NOT NULL,
  `cash_account_id` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `transaction_date` date NOT NULL,
  `notes` text COLLATE utf8mb4_general_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `share_capital_accounts`
--

CREATE TABLE `share_capital_accounts` (
  `id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `account_number` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `member_id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `branch_id` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `subscribed_shares` int NOT NULL,
  `subscribed_amount` decimal(15,2) NOT NULL,
  `paid_up_shares` int NOT NULL,
  `paid_up_amount` decimal(15,2) NOT NULL,
  `status` enum('Active','Withdrawn','Transferred') COLLATE utf8mb4_general_ci DEFAULT 'Active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `share_capital_accounts`
--

INSERT INTO `share_capital_accounts` (`id`, `account_number`, `member_id`, `branch_id`, `subscribed_shares`, `subscribed_amount`, `paid_up_shares`, `paid_up_amount`, `status`, `created_at`) VALUES
('sc_51b338f4749c', 'CBU-2026-82473', 'mem_ee232b0b50e1', 'br_e87d2b43', 40, 4000.00, 10, 1000.00, 'Active', '2026-10-16 01:21:45');

-- --------------------------------------------------------

--
-- Table structure for table `share_capital_settings`
--

CREATE TABLE `share_capital_settings` (
  `id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `cooperative_id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `par_value_per_share` decimal(15,2) DEFAULT '100.00',
  `min_subscription_shares` int DEFAULT '100',
  `min_paid_up_shares` int DEFAULT '25',
  `max_share_holding_percentage` decimal(5,2) DEFAULT '10.00',
  `transfer_fee` decimal(15,2) DEFAULT '100.00',
  `withdrawal_rule` text COLLATE utf8mb4_general_ci,
  `accounting_account_id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `share_capital_settings`
--

INSERT INTO `share_capital_settings` (`id`, `cooperative_id`, `par_value_per_share`, `min_subscription_shares`, `min_paid_up_shares`, `max_share_holding_percentage`, `transfer_fee`, `withdrawal_rule`, `accounting_account_id`) VALUES
('sc_setting_923ec3', 'coop_9fd7380350aa', 100.00, 100, 25, 10.00, 100.00, 'Subject to Board approval and 30-day prior written notice', 'coa_422b462bc7d8');

-- --------------------------------------------------------

--
-- Table structure for table `share_capital_transactions`
--

CREATE TABLE `share_capital_transactions` (
  `id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `receipt_no` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `share_account_id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `member_id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `type` enum('SUBSCRIPTION','PAYMENT','WITHDRAWAL','TRANSFER','DIVIDEND_PATRONAGE') COLLATE utf8mb4_general_ci NOT NULL,
  `shares` int NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `transaction_date` date NOT NULL,
  `cash_account_id` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `share_capital_transactions`
--

INSERT INTO `share_capital_transactions` (`id`, `receipt_no`, `share_account_id`, `member_id`, `type`, `shares`, `amount`, `transaction_date`, `cash_account_id`, `created_at`) VALUES
('sctx_475ce696c783', 'SC-OR-20261016-8D45', 'sc_51b338f4749c', 'mem_ee232b0b50e1', 'PAYMENT', 10, 1000.00, '2026-10-16', 'cash_b1c0fd237363', '2026-10-16 01:21:45');

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
--

CREATE TABLE `system_settings` (
  `id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `setting_key` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `setting_value` text COLLATE utf8mb4_general_ci NOT NULL,
  `setting_group` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `updated_by` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `transaction_types`
--

CREATE TABLE `transaction_types` (
  `id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `module` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `requires_approval` tinyint(1) DEFAULT '0',
  `numbering_format_id` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `active` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `username` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `full_name` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `role_id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `cooperative_id` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `branch_id` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `documents` json DEFAULT NULL,
  `active` tinyint(1) DEFAULT '1',
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password_hash`, `full_name`, `email`, `role_id`, `cooperative_id`, `branch_id`, `documents`, `active`, `last_login`, `created_at`) VALUES
('usr_fc1b85fb1cfee461', 'admin', '$2y$10$dXibI5spumlWn5nEdcT0ROKI/dsqxOY/PfrOrUQ2ZKWNVazDqfpT.', 'admin`', 'admin@gmail.com', 'role_admin', 'coop_9fd7380350aa', 'br_e87d2b43', NULL, 1, '2026-10-16 08:01:59', '2026-10-15 17:07:14');

-- --------------------------------------------------------

--
-- Table structure for table `user_documents`
--

CREATE TABLE `user_documents` (
  `user_id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `doc_key` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `document_data` json DEFAULT NULL,
  `notes` longtext COLLATE utf8mb4_general_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_documents`
--

INSERT INTO `user_documents` (`user_id`, `doc_key`, `document_data`, `notes`) VALUES
('usr_933088ead62c0a82', 'udoc_1791277025076', '{\"name\": \"PENRO - Calamansi.pdf\", \"path\": \"/assets/members/usr_933088ead62c0a82/PENRO_-_Calamansi_1791277025.pdf\", \"size\": 224636, \"type\": \"application/pdf\", \"file_name\": \"PENRO_-_Calamansi_1791277025.pdf\", \"uploaded_at\": \"2026-10-06T08:57:05+00:00\"}', NULL),
('usr_933088ead62c0a82', 'udoc_1791339615037', '{\"name\": \"ETC - MAYAP CARE COOP (4).pdf\", \"path\": \"/assets/members/usr_933088ead62c0a82/ETC_-_MAYAP_CARE_COOP__4_1791339615.pdf\", \"size\": 224833, \"type\": \"application/pdf\", \"file_name\": \"ETC_-_MAYAP_CARE_COOP__4_1791339615.pdf\", \"uploaded_at\": \"2026-10-07T02:20:15+00:00\"}', 'test'),
('usr_933088ead62c0a82', 'udoc_1791356001680', '{\"name\": \"Mayap Care Coop ( Request for Agricultural Machinery ) (2) (1).pdf\", \"path\": \"/assets/members/usr_933088ead62c0a82/Mayap_Care_Coop___Request_for_Agricultural_Machinery____2___1_1a6c4a78e2bc.pdf\", \"size\": 2785725, \"type\": \"application/pdf\", \"file_name\": \"Mayap_Care_Coop___Request_for_Agricultural_Machinery____2___1_1a6c4a78e2bc.pdf\", \"uploaded_at\": \"2026-10-07T06:53:21+00:00\"}', 'Submitted to Senator Camille Villar'),
('usr_933088ead62c0a82', 'udoc_1791389576345', '{\"name\": \"Calma, Jordan I. ( Marriage Certificate ).pdf\", \"path\": \"/assets/members/usr_933088ead62c0a82/Calma__Jordan_I.___Marriage_Certificate_c7a5ff02b26c.pdf\", \"size\": 434551, \"type\": \"application/pdf\", \"file_name\": \"Calma__Jordan_I.___Marriage_Certificate_c7a5ff02b26c.pdf\", \"uploaded_at\": \"2026-10-07T16:12:56+00:00\"}', '');

-- --------------------------------------------------------

--
-- Table structure for table `user_roles`
--

CREATE TABLE `user_roles` (
  `id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `permissions` json NOT NULL,
  `active` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_roles`
--

INSERT INTO `user_roles` (`id`, `name`, `description`, `permissions`, `active`) VALUES
('role_accountant', 'Chief / Branch Accountant', 'General ledger management, journal vouchers, and period close', '[\"manage_accounting\", \"view_gl\", \"post_journals\", \"close_periods\", \"view_reports\"]', 1),
('role_admin', 'System Administrator', 'Full unconstrained platform super-user access', '[\"manage_system\", \"manage_configurations\", \"manage_members\", \"manage_loans\", \"manage_savings\", \"manage_accounting\", \"approve_transactions\", \"view_reports\"]', 1),
('role_bod', 'Board of Directors', 'High-level policy review, macro-reporting, and large-loan approvals', '[\"approve_tier3_loans\", \"view_reports\", \"view_audit_trail\"]', 1),
('role_loan_officer', 'Credit & Loan Evaluation Officer', 'Loan application review, credit investigation, and schedule creation', '[\"manage_loans\", \"view_members\", \"create_schedules\"]', 1),
('role_manager', 'General / Branch Manager', 'Branch operations supervisor with level 2 approval rights', '[\"manage_members\", \"manage_loans\", \"manage_savings\", \"approve_transactions\", \"view_reports\"]', 1),
('role_superadmin', 'Super Admin', 'Has full system-wide access to manage cooperative configurations, branches, user accounts, roles and permissions, system settings, and all modules across the platform.', '[\"manage_system\", \"manage_configurations\", \"manage_members\", \"manage_loans\", \"manage_savings\", \"manage_accounting\", \"approve_transactions\", \"view_reports\"]', 1),
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
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `idx_branches_coop_id` (`coop_id`);

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
  ADD KEY `idx_acc_cat` (`category`),
  ADD KEY `idx_chart_of_accounts_branch_id` (`branch_id`);

--
-- Indexes for table `configuration_audit_trails`
--
ALTER TABLE `configuration_audit_trails`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_configuration_audit_trails_branch_id` (`branch_id`);

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
  ADD KEY `cash_account_id` (`cash_account_id`),
  ADD KEY `fk_loan_payments_amortization_schedule` (`loan_amortization_schedule_id`);

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
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `idx_member_types_coop_id` (`coop_id`);

--
-- Indexes for table `numbering_formats`
--
ALTER TABLE `numbering_formats`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_numbering_formats_branch_id` (`branch_id`);

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
  ADD KEY `idx_users_cooperative_id` (`cooperative_id`),
  ADD KEY `idx_users_branch_id` (`branch_id`);

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
-- Constraints for table `branches`
--
ALTER TABLE `branches`
  ADD CONSTRAINT `fk_branches_cooperatives` FOREIGN KEY (`coop_id`) REFERENCES `cooperatives` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

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
-- Constraints for table `chart_of_accounts`
--
ALTER TABLE `chart_of_accounts`
  ADD CONSTRAINT `fk_chart_of_accounts_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `configuration_audit_trails`
--
ALTER TABLE `configuration_audit_trails`
  ADD CONSTRAINT `fk_configuration_audit_trails_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

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
  ADD CONSTRAINT `fk_loan_payments_amortization_schedule` FOREIGN KEY (`loan_amortization_schedule_id`) REFERENCES `loan_amortization_schedules` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `member_types`
--
ALTER TABLE `member_types`
  ADD CONSTRAINT `fk_member_types_cooperative` FOREIGN KEY (`coop_id`) REFERENCES `cooperatives` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `numbering_formats`
--
ALTER TABLE `numbering_formats`
  ADD CONSTRAINT `fk_numbering_formats_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_users_cooperative` FOREIGN KEY (`cooperative_id`) REFERENCES `cooperatives` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
