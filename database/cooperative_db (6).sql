-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Oct 12, 2026 at 04:06 PM
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
('period_02e42ac9b864', 'March 2026', 2026, 6, '2026-03-01', '2026-03-31', 'Open', NULL, NULL, '2026-10-12 13:30:46'),
('period_8242cf01847b', 'February 2026', 2026, 5, '2026-02-01', '2026-02-28', 'Open', NULL, NULL, '2026-10-12 13:30:28'),
('period_c4b168f63be3', 'December 2026', 2026, 3, '2026-12-01', '2026-12-31', 'Open', NULL, NULL, '2026-10-11 15:12:45'),
('period_f297ba844d3d', 'October 2026', 2026, 1, '2026-10-01', '2026-10-31', 'Open', NULL, NULL, '2026-10-11 15:11:54'),
('period_f7b75d876199', 'January 2026', 2026, 4, '2026-01-01', '2026-01-31', 'Open', NULL, NULL, '2026-10-12 13:30:03'),
('period_fdd12c153614', 'November 2026', 2026, 2, '2026-11-01', '2026-11-30', 'Open', NULL, NULL, '2026-10-11 15:12:20');

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
('br_5665ba4d', 'coop_89936a99659a', 'MCAC-MAIN', 'MCAC Main Branch', 'Barangay Care ', NULL, 'Jhomel Ignacio', 0, 1, '2026-10-11 14:42:02');

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
('cash_28facd1bc7bf', 'Treasurer Account', 'COH-MCAC-MAIN-02', 'Cash on Hand', 'br_5665ba4d', 'coa_70fb910b28bc', 0.00, 0.00, 'PHP', 1);

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
('coa_00c46f6e6173', 'br_5665ba4d', '40120', 'Service Fees', 'Revenue', 'Credit', 1, NULL, 'Operating Revenue', 'Fees earned for loan processing, servicing, and collection services.', '2026-10-11 15:05:28'),
('coa_033fec3e04a4', 'br_5665ba4d', '21300', 'Accrued Expenses', 'Liability', 'Credit', 1, NULL, 'Deposit Liabilities', 'Expenses incurred but not yet paid at the end of the accounting period.', '2026-10-11 15:02:28'),
('coa_04541587140a', 'br_5665ba4d', '30810', 'Reserve Fund', 'Equity', 'Credit', 1, NULL, 'Share Capital', 'Funds set aside from net surplus for purposes prescribed by cooperative law and regulations.', '2026-10-11 15:03:36'),
('coa_40e0508a557d', 'br_5665ba4d', '11130', 'Cash in Bank', 'Asset', 'Debit', 1, NULL, 'Current Assets', 'Funds deposited in the cooperative\'s bank account and available for regular operating transactions.', '2026-10-11 14:58:30'),
('coa_694dea901b72', 'br_5665ba4d', '21110', 'Saving Deposits', 'Liability', 'Debit', 1, NULL, 'Current Assets', 'Deposits made by members that they can withdraw at their option.', '2026-10-11 15:01:05'),
('coa_70fb910b28bc', 'br_5665ba4d', '11110', 'Cash on Hand', 'Asset', 'Debit', 1, NULL, 'Current Assets', 'Cash funds physically held by the cooperative, including cash held by tellers or cashiers.', '2026-10-11 14:58:06'),
('coa_853041886ad5', 'br_5665ba4d', '72140', 'Salaries and Wages', 'Expense', 'Debit', 1, NULL, 'Administrative Expenses', 'Compensation incurred for employee services, including applicable overtime pay.', '2026-10-11 15:06:40'),
('coa_a504fa03eb41', 'br_5665ba4d', '40620', 'Membership Fee', 'Revenue', 'Credit', 1, NULL, 'Operating Revenue', 'Income from membership fees recognized under the applicable accounting policy.', '2026-10-11 15:05:54'),
('coa_c544594f3794', 'br_5665ba4d', '21210', 'Accounts Payable–Trade', 'Liability', 'Credit', 1, NULL, 'Deposit Liabilities', 'Obligations to suppliers for goods and services intended for sale.', '2026-10-11 15:01:34'),
('coa_c8ca5e62b9a6', 'br_5665ba4d', '73600', 'Bank Charges', 'Expense', 'Debit', 1, NULL, 'Administrative Expenses', 'Bank service fees and other bank-related charges.', '2026-10-11 15:07:02'),
('coa_d48493e7a68b', 'br_5665ba4d', '11210', 'Loans Receivable – Current', 'Asset', 'Debit', 1, NULL, 'Current Assets', 'Outstanding principal amounts of loans granted to cooperative members that remain collectible.', '2026-10-11 14:58:50'),
('coa_dae90c82d498', 'br_5665ba4d', '40110', 'Interest Income from Loans', 'Revenue', 'Credit', 1, NULL, 'Operating Revenue', 'Interest earned on loans granted to members.', '2026-10-11 15:04:49'),
('coa_e3c4c94ab0cf', 'br_5665ba4d', '30130', 'Paid-up Share Capital – Common', 'Equity', 'Credit', 1, NULL, 'Share Capital', 'Collected subscribed common share capital from members.', '2026-10-11 15:03:04'),
('coa_e86c3e622d71', 'br_5665ba4d', '71100', 'Interest Expense on Borrowings', 'Expense', 'Debit', 1, NULL, 'Administrative Expenses', 'Interest incurred on funds borrowed by the cooperative.', '2026-10-11 15:06:16'),
('coa_f86008a44fce', 'br_5665ba4d', '30820', 'Cooperative Education and Training Fund', 'Equity', 'Credit', 1, NULL, 'Share Capital', 'Funds allocated for cooperative education, training, and development.', '2026-10-11 15:04:07');

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
('audit_01abb2375da3de99', 'TRANSACTION', 'loan_payments', '{\"loan_id\":\"ln_27fe92095360\",\"balance\":\"50000.00\"}', '{\"payment_id\":\"lp_c4333bd37574\",\"receipt_no\":\"OR-20261012-8483\",\"loan_id\":\"ln_27fe92095360\",\"member_id\":\"mem_2971e19a1b38\",\"amount\":4583.34,\"principal_paid\":4166.67,\"interest_paid\":416.67}', 'usr_7916daac48330641', 'br_5665ba4d', 'Loan repayment recorded', '2026-10-12 12:40:34'),
('audit_0affb66358943cef', 'TRANSACTION', 'journal_entries', 'None', '{\"id\":\"je_f396f5ee5607\",\"voucher_number\":\"CD-20261012-7179\",\"branch_id\":\"br_5665ba4d\",\"total_debit\":10000,\"total_credit\":10000}', 'usr_7916daac48330641', 'br_5665ba4d', 'Journal entry posted', '2026-10-12 13:27:03'),
('audit_0b6cbbd8403cd25f', 'UPDATE', 'Loan Application', '{\"id\":\"la_bf4d24d4570b\",\"application_no\":\"LA-2026-80408\",\"status\":\"Approved\",\"approved_amount\":\"10000.00\"}', '{\"id\":\"la_bf4d24d4570b\",\"application_no\":\"LA-2026-80408\",\"status\":\"Released\",\"approved_amount\":\"10000.00\"}', 'usr_7916daac48330641', 'br_5665ba4d', 'Marked loan application as released after disbursement', '2026-10-12 12:21:42'),
('audit_46f01b360ed6972f', 'UPDATE', 'Loan Status', 'Pending', '{\"application_id\":\"la_d9129fff2073\",\"approved_amount\":50000,\"status\":\"Approved\",\"approved_by\":\"Jhomel Igacio\",\"remarks\":\"Approved by Credit Committee after collateral & capacity assessment.\"}', 'usr_7916daac48330641', 'br_5665ba4d', 'Approved loan application', '2026-10-12 12:38:36'),
('audit_55d4c2430471ae5e', 'CREATE', 'Loan Application', 'None', '{\"id\":\"la_d9129fff2073\",\"application_no\":\"LA-2026-49298\",\"member_id\":\"mem_2971e19a1b38\",\"loan_product_id\":\"lp_a5e677d3\",\"branch_id\":\"br_5665ba4d\",\"applied_amount\":50000,\"term_months\":12,\"purpose\":null,\"status\":\"Pending\",\"submitted_date\":\"2026-10-12\"}', 'usr_7916daac48330641', 'br_5665ba4d', 'Created loan application', '2026-10-12 12:38:12'),
('audit_5b72219551aae864', 'TRANSACTION', 'journal_entries', 'None', '{\"id\":\"je_2d0bb5b30865\",\"voucher_number\":\"CD-20261012-7142\",\"branch_id\":\"br_5665ba4d\",\"total_debit\":1,\"total_credit\":1}', 'usr_7916daac48330641', 'br_5665ba4d', 'Journal entry posted', '2026-10-12 13:32:24'),
('audit_640bdc3c92d7b030', 'TRANSACTION', 'loan_payments', '{\"loan_id\":\"ln_dbe0d45b4e63\",\"balance\":\"10000.00\"}', '{\"payment_id\":\"lp_a2da3c5a2366\",\"receipt_no\":\"OR-20261012-9388\",\"loan_id\":\"ln_dbe0d45b4e63\",\"member_id\":\"mem_2971e19a1b38\",\"amount\":916.66,\"principal_paid\":833.3299999999999,\"interest_paid\":83.33}', 'usr_7916daac48330641', 'br_5665ba4d', 'Loan repayment recorded', '2026-10-12 12:22:35'),
('audit_7af6fde2aacb1c72', 'UPDATE', 'Loan Application', '{\"id\":\"la_d9129fff2073\",\"application_no\":\"LA-2026-49298\",\"status\":\"Approved\",\"approved_amount\":\"50000.00\"}', '{\"id\":\"la_d9129fff2073\",\"application_no\":\"LA-2026-49298\",\"status\":\"Released\",\"approved_amount\":\"50000.00\"}', 'usr_7916daac48330641', 'br_5665ba4d', 'Marked loan application as released after disbursement', '2026-10-12 12:40:00'),
('audit_91cb304e1c09b323', 'CREATE', 'members', 'None', '{\"id\":\"mem_2971e19a1b38\",\"member_no\":\"MEM-2026-33292\",\"branch_id\":\"br_5665ba4d\"}', 'usr_7916daac48330641', 'br_5665ba4d', 'Member created', '2026-10-12 12:19:09'),
('audit_a9de43401a0845b7', 'CREATE', 'Loan', 'None', '{\"id\":\"ln_27fe92095360\",\"loan_account_no\":\"LN-2026-98509\",\"application_id\":\"la_d9129fff2073\",\"member_id\":\"mem_2971e19a1b38\",\"loan_product_id\":\"lp_a5e677d3\",\"branch_id\":\"br_5665ba4d\",\"principal_amount\":50000,\"annual_interest_rate\":10,\"interest_calculation_method\":\"Diminishing Balance\",\"term_months\":12,\"payment_frequency\":\"Monthly\",\"disbursement_date\":\"2026-10-12\",\"first_due_date\":\"2026-11-12\",\"maturity_date\":\"2027-10-12\",\"processing_fee\":0,\"service_fee\":0,\"net_disbursed\":50000,\"cash_account_id\":\"cash_28facd1bc7bf\",\"status\":\"Active\",\"current_balance\":50000}', 'usr_7916daac48330641', 'br_5665ba4d', 'Disbursed loan', '2026-10-12 12:40:00'),
('audit_b570c2da8ed187bb', 'CREATE', 'cash_accounts', 'None', '{\"id\":\"cash_28facd1bc7bf\",\"branch_id\":\"br_5665ba4d\",\"account_number\":\"COH-MCAC-MAIN-02\"}', 'usr_7916daac48330641', 'br_5665ba4d', 'Cash account saved', '2026-10-11 15:11:15'),
('audit_c361fd7f89eb15c5', 'UPDATE', 'Loan Status', 'Pending', '{\"application_id\":\"la_bf4d24d4570b\",\"approved_amount\":10000,\"status\":\"Approved\",\"approved_by\":\"Jhomel Igacio\",\"remarks\":\"Approved by Credit Committee after collateral & capacity assessment.\"}', 'usr_7916daac48330641', 'br_5665ba4d', 'Approved loan application', '2026-10-12 12:20:55'),
('audit_c836c8c5c2963aa6', 'CREATE', 'users', 'None', '{\"id\":\"usr_7916daac48330641\",\"username\":\"admin\",\"branch_id\":\"br_5665ba4d\",\"cooperative_id\":null}', 'System', NULL, 'User account created', '2026-10-11 14:45:32'),
('audit_e5c1225a517394e8', 'CREATE', 'Loan', 'None', '{\"id\":\"ln_dbe0d45b4e63\",\"loan_account_no\":\"LN-2026-35351\",\"application_id\":\"la_bf4d24d4570b\",\"member_id\":\"mem_2971e19a1b38\",\"loan_product_id\":\"lp_a5e677d3\",\"branch_id\":\"br_5665ba4d\",\"principal_amount\":10000,\"annual_interest_rate\":10,\"interest_calculation_method\":\"Diminishing Balance\",\"term_months\":12,\"payment_frequency\":\"Monthly\",\"disbursement_date\":\"2026-10-12\",\"first_due_date\":\"2026-11-12\",\"maturity_date\":\"2027-10-12\",\"processing_fee\":0,\"service_fee\":0,\"net_disbursed\":10000,\"cash_account_id\":\"cash_28facd1bc7bf\",\"status\":\"Active\",\"current_balance\":10000}', 'usr_7916daac48330641', 'br_5665ba4d', 'Disbursed loan', '2026-10-12 12:21:42'),
('audit_fd8d95e08a9afdf7', 'CREATE', 'Loan Application', 'None', '{\"id\":\"la_bf4d24d4570b\",\"application_no\":\"LA-2026-80408\",\"member_id\":\"mem_2971e19a1b38\",\"loan_product_id\":\"lp_a5e677d3\",\"branch_id\":\"br_5665ba4d\",\"applied_amount\":10000,\"term_months\":12,\"purpose\":null,\"status\":\"Pending\",\"submitted_date\":\"2026-10-12\"}', 'usr_7916daac48330641', 'br_5665ba4d', 'Created loan application', '2026-10-12 12:20:16');

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
('coop_89936a99659a', 'Mayap Care Agriculture Cooperative', '', '', 'Agriculture', '', '', '', '01-01', 'PHP', 0, '2026-10-11 05:39:25', '2026-10-11 05:39:25');

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
('fee_980e268e', 'FEE-REG-LN', 'Service Fee for Loan transactions', 'Fixed', 200.00, 'Loans', 0, 'coa_00c46f6e6173', 1);

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
('je_2d0bb5b30865', 'CD-20261012-7142', 'br_5665ba4d', '2026-01-01', 'CASH_DISBURSEMENT', NULL, 'Disbursement for branch operational supplies testing', 1.00, 1.00, 'period_f7b75d876199', 'Posted', 'Jhomel Igacio', '2026-10-12 13:32:24'),
('je_f396f5ee5607', 'CD-20261012-7179', 'br_5665ba4d', '2026-10-12', 'CASH_DISBURSEMENT', NULL, 'Jhomel Ignacio transaction', 10000.00, 10000.00, 'period_f297ba844d3d', 'Posted', 'Jhomel Igacio', '2026-10-12 13:27:03');

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
('jl_6f1b57257ab4', 'je_2d0bb5b30865', 'coa_70fb910b28bc', 1.00, 0.00, '', ''),
('jl_8119895badec', 'je_f396f5ee5607', 'coa_70fb910b28bc', 0.00, 10000.00, 'Cash', 'cash_01'),
('jl_8f37304a625a', 'je_2d0bb5b30865', 'coa_a504fa03eb41', 0.00, 1.00, 'Cash', 'cash_01'),
('jl_9bc28760d189', 'je_f396f5ee5607', 'coa_d48493e7a68b', 10000.00, 0.00, '', '');

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
('ln_27fe92095360', 'LN-2026-98509', 'la_d9129fff2073', 'mem_2971e19a1b38', 'lp_a5e677d3', 1, 'br_5665ba4d', 50000.00, 10.00, 'Diminishing Balance', 12, 'Monthly', '2026-10-12', '2026-11-12', '2027-10-12', 0.00, 0.00, 50000.00, 'cash_28facd1bc7bf', 'Active', 45833.33, 4166.67, 416.67, 0.00, 0.00, NULL, '2026-10-12', '2026-10-12 12:40:00'),
('ln_dbe0d45b4e63', 'LN-2026-35351', 'la_bf4d24d4570b', 'mem_2971e19a1b38', 'lp_a5e677d3', 1, 'br_5665ba4d', 10000.00, 10.00, 'Diminishing Balance', 12, 'Monthly', '2026-10-12', '2026-11-12', '2027-10-12', 0.00, 0.00, 10000.00, 'cash_28facd1bc7bf', 'Active', 9166.67, 833.33, 83.33, 0.00, 0.00, NULL, '2026-10-12', '2026-10-12 12:21:41');

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
('las_0227232d0e27', 'ln_27fe92095360', 12, '2027-10-12', 4166.67, 34.72, 0.00, 4201.39, 0.00, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_082331137643', 'ln_27fe92095360', 2, '2026-12-12', 4166.67, 381.94, 0.00, 4548.61, 41666.67, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_0dbef943877d', 'ln_27fe92095360', 10, '2027-08-12', 4166.67, 104.17, 0.00, 4270.83, 8333.33, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_1b74c54a5db5', 'ln_27fe92095360', 5, '2027-03-12', 4166.67, 277.78, 0.00, 4444.44, 29166.67, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_24a54024b87c', 'ln_27fe92095360', 7, '2027-05-12', 4166.67, 208.33, 0.00, 4375.00, 20833.33, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_2626e2bce6d1', 'ln_27fe92095360', 9, '2027-07-12', 4166.67, 138.89, 0.00, 4305.56, 12500.00, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_287ea34452dc', 'ln_dbe0d45b4e63', 7, '2027-05-12', 833.33, 41.67, 0.00, 875.00, 4166.67, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_2a0828812f54', 'ln_27fe92095360', 6, '2027-04-12', 4166.67, 243.06, 0.00, 4409.72, 25000.00, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_39d7710c4e89', 'ln_dbe0d45b4e63', 4, '2027-02-12', 833.33, 62.50, 0.00, 895.83, 6666.67, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_506ed9c33c11', 'ln_dbe0d45b4e63', 10, '2027-08-12', 833.33, 20.83, 0.00, 854.17, 1666.67, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_55bd2036afed', 'ln_dbe0d45b4e63', 9, '2027-07-12', 833.33, 27.78, 0.00, 861.11, 2500.00, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_5e77a40b6b63', 'ln_dbe0d45b4e63', 12, '2027-10-12', 833.33, 6.94, 0.00, 840.28, 0.00, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_78cf1237f413', 'ln_dbe0d45b4e63', 11, '2027-09-12', 833.33, 13.89, 0.00, 847.22, 833.33, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_82d6e8a6fdea', 'ln_dbe0d45b4e63', 2, '2026-12-12', 833.33, 76.39, 0.00, 909.72, 8333.33, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_837c692db430', 'ln_dbe0d45b4e63', 3, '2027-01-12', 833.33, 69.44, 0.00, 902.78, 7500.00, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_862150889bb0', 'ln_27fe92095360', 11, '2027-09-12', 4166.67, 69.44, 0.00, 4236.11, 4166.67, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_8df4bc37b4af', 'ln_27fe92095360', 1, '2026-11-12', 4166.67, 416.67, 0.00, 4583.33, 45833.33, 4166.67, 416.67, 0.00, NULL, 'Paid'),
('las_90024615096b', 'ln_27fe92095360', 4, '2027-02-12', 4166.67, 312.50, 0.00, 4479.17, 33333.33, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_9d0494adcf48', 'ln_dbe0d45b4e63', 6, '2027-04-12', 833.33, 48.61, 0.00, 881.94, 5000.00, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_ac29cde13f6d', 'ln_27fe92095360', 3, '2027-01-12', 4166.67, 347.22, 0.00, 4513.89, 37500.00, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_bf327dcb9244', 'ln_dbe0d45b4e63', 5, '2027-03-12', 833.33, 55.56, 0.00, 888.89, 5833.33, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_c15dd1cf0e8a', 'ln_27fe92095360', 8, '2027-06-12', 4166.67, 173.61, 0.00, 4340.28, 16666.67, 0.00, 0.00, 0.00, NULL, 'Unpaid'),
('las_f64eda6f6d69', 'ln_dbe0d45b4e63', 1, '2026-11-12', 833.33, 83.33, 0.00, 916.67, 9166.67, 833.33, 83.33, 0.00, NULL, 'Paid'),
('las_faf8b5622cbb', 'ln_dbe0d45b4e63', 8, '2027-06-12', 833.33, 34.72, 0.00, 868.06, 3333.33, 0.00, 0.00, 0.00, NULL, 'Unpaid');

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
('la_bf4d24d4570b', NULL, 'LA-2026-80408', 'mem_2971e19a1b38', 'lp_a5e677d3', 'br_5665ba4d', 10000.00, 12, NULL, 'Released', '2026-10-12', 'Jhomel Igacio', '2026-10-12', 10000.00, 'Approved by Credit Committee after collateral & capacity assessment.', '2026-10-12 12:20:16'),
('la_d9129fff2073', NULL, 'LA-2026-49298', 'mem_2971e19a1b38', 'lp_a5e677d3', 'br_5665ba4d', 50000.00, 12, NULL, 'Released', '2026-10-12', 'Jhomel Igacio', '2026-10-12', 50000.00, 'Approved by Credit Committee after collateral & capacity assessment.', '2026-10-12 12:38:12');

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
  `total_amount` decimal(15,2) NOT NULL,
  `cash_account_id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `received_by` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `journal_entry_id` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `loan_payments`
--

INSERT INTO `loan_payments` (`id`, `receipt_no`, `loan_id`, `member_id`, `payment_date`, `total_amount`, `cash_account_id`, `received_by`, `journal_entry_id`, `created_at`) VALUES
('lp_a2da3c5a2366', 'OR-20261012-9388', 'ln_dbe0d45b4e63', 'mem_2971e19a1b38', '2026-10-12', 916.66, 'cash_28facd1bc7bf', 'Jhomel Igacio', NULL, '2026-10-12 12:22:35'),
('lp_c4333bd37574', 'OR-20261012-8483', 'ln_27fe92095360', 'mem_2971e19a1b38', '2026-10-12', 4583.34, 'cash_28facd1bc7bf', 'Jhomel Igacio', NULL, '2026-10-12 12:40:34');

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
('lp_a5e677d3', 'LP-01', 'Agricultural Loan', '', 1, 10000.00, 250000.00, 1, 12, 10.00, 12, 'Diminishing Balance', 'Monthly', 5, 0.00, 0.00, NULL, 0, 0, 'coa_d48493e7a68b', '[]', NULL, NULL, NULL, 2.10, 'coa_d48493e7a68b', 'coa_dae90c82d498', 1);

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
('mem_2971e19a1b38', 'MEM-2026-33292', 'br_5665ba4d', 'mt_regular', 'Jhomel', 'Ignacio', 'Luanzon', 'Male', '1992-05-15', 'jhomignacio08@gmail.com', '+6309352989795', 'Barangay Care Tarlac City, Tarlac', 'Active', '2026-10-12', '{\"notes\": \"\", \"tin_number\": \"\"}', '2026-10-12 12:19:09', '2026-10-12 12:19:09');

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
('mt_associate', 'coop_89936a99659a', 'Associate Member', 'ASSOCIATE', 'Non-voting member enjoying savings deposit and credit facilities', 0, 5000.00, 500.00, 1, '[\"Valid Gov ID\", \"2x2 ID Photo\", \"Proof of Billing\"]', 1),
('mt_lab', 'coop_89936a99659a', 'Laboratory / Youth Member', 'LAB_YOUTH', 'Minor/Student savings depositor preparing for future cooperative participation', 0, 500.00, 200.00, 0, '[\"Birth Certificate\", \"Parents Consent Form\"]', 1),
('mt_regular', 'coop_89936a99659a', 'Regular Members', 'REGULAR', 'Full-fledged member with voting rights and dividend participation', 1, 10000.00, 1000.00, 1, '[\"\"]', 1);

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
('sc_setting_01', 'coop_89936a99659a', 100.00, 100, 25, 10.00, 100.00, 'Subject to Board approval and 30-day prior written notice', 'coa_e3c4c94ab0cf');

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
('usr_7916daac48330641', 'admin', '$2y$10$MGSS40txWQrCACh2jdpe0uZpQkz9JxbQvU83/FE25eGGqnJOZs5MG', 'Jhomel Igacio', 'admin@mail.com', 'role_admin', 'coop_89936a99659a', 'br_5665ba4d', NULL, 1, '2026-10-12 15:55:29', '2026-10-11 06:45:32');

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
