import React, { useState } from 'react';
import {
  Database,
  Download,
  Copy,
  Check,
  X,
  Code,
  FileText,
  Layers,
  Server,
  Terminal,
  ExternalLink
} from 'lucide-react';

interface SqlSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SqlSchemaModal: React.FC<SqlSchemaModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'sql' | 'mvc' | 'endpoints'>('sql');
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopySql = () => {
    // Fetch or copy snippet
    fetch('/cooperative_db.sql')
      .then(res => res.text())
      .then(text => {
        navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch(() => {
        navigator.clipboard.writeText('-- Run: mysql -u root -p cooperative_db < cooperative_db.sql');
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      });
  };

  const handleDownloadSql = () => {
    const link = document.createElement('a');
    link.href = '/cooperative_db.sql';
    link.download = 'cooperative_db.sql';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  SQL Database Schema &amp; PHP MVC Backend
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                  Clean Baseline (No Sample Data)
                </span>
              </div>
              <p className="text-xs text-slate-400">
                MySQL / MariaDB schema ready for PHP MVC with CDA Chart of Accounts
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadSql}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .SQL</span>
            </button>
            <button
              onClick={handleCopySql}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition cursor-pointer"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy SQL</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 shrink-0">
          <button
            onClick={() => setActiveTab('sql')}
            className={`flex items-center space-x-2 py-3 px-3 text-xs font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'sql'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>SQL Schema (DDL + Master Seeds)</span>
          </button>
          <button
            onClick={() => setActiveTab('mvc')}
            className={`flex items-center space-x-2 py-3 px-3 text-xs font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'mvc'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>PHP MVC Architecture</span>
          </button>
          <button
            onClick={() => setActiveTab('endpoints')}
            className={`flex items-center space-x-2 py-3 px-3 text-xs font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'endpoints'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>API Endpoint Routing</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'sql' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60 text-xs">
                <div className="flex items-center space-x-2">
                  <Terminal className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-mono text-slate-300">
                    mysql -u root -p cooperative_db &lt; cooperative_db.sql
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">
                  Database: <strong className="text-white">cooperative_db</strong> (utf8mb4)
                </span>
              </div>

              <div className="relative rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-300 overflow-x-auto max-h-[500px]">
                <pre className="text-slate-300 leading-relaxed whitespace-pre font-mono text-[11px]">
{`-- =====================================================================
-- COOPFLEX / MAYAP CARE AGRICULTURE COOPERATIVE
-- PRODUCTION-READY SQL SCHEMA FOR PHP MVC BACKEND ARCHITECTURE
-- Database: cooperative_db | Encoding: utf8mb4_unicode_ci
-- Status: CLEAN BASELINE (0 sample members, 0 loans, 0 vouchers)
-- =====================================================================

CREATE DATABASE IF NOT EXISTS cooperative_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cooperative_db;

-- 1. COOPERATIVES & BRANCHES
CREATE TABLE cooperatives (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    cda_registration_no VARCHAR(100) NOT NULL,
    tax_identification_no VARCHAR(100) NOT NULL,
    coop_type VARCHAR(100) DEFAULT 'Agricultural',
    address TEXT,
    contact_phone VARCHAR(50),
    contact_email VARCHAR(100),
    fiscal_year_start VARCHAR(10) DEFAULT '01-01',
    base_currency VARCHAR(10) DEFAULT 'PHP'
) ENGINE=InnoDB;

CREATE TABLE branches (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    address TEXT NOT NULL,
    contact_number VARCHAR(50),
    manager_name VARCHAR(100),
    is_main_branch BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB;

-- 2. CDA STANDARD CHART OF ACCOUNTS (All 29 accounts pre-seeded)
CREATE TABLE chart_of_accounts (
    id VARCHAR(50) PRIMARY KEY,
    account_code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    category ENUM('Asset', 'Liability', 'Equity', 'Revenue', 'Expense') NOT NULL,
    normal_balance ENUM('Debit', 'Credit') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    report_group VARCHAR(100) NOT NULL,
    description TEXT
) ENGINE=InnoDB;

-- 3. MEMBERS (Clean baseline, custom_field_values in JSON)
CREATE TABLE members (
    id VARCHAR(50) PRIMARY KEY,
    member_no VARCHAR(50) NOT NULL UNIQUE,
    branch_id VARCHAR(50) NOT NULL,
    member_type_id VARCHAR(50) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    gender ENUM('Male', 'Female', 'Other') NOT NULL,
    birthdate DATE NOT NULL,
    email VARCHAR(150),
    phone VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    status ENUM('Active', 'Pending Approval', 'Inactive', 'Terminated', 'Deceased') DEFAULT 'Pending Approval',
    joined_date DATE NOT NULL,
    custom_field_values JSON NULL,
    FOREIGN KEY (branch_id) REFERENCES branches(id)
) ENGINE=InnoDB;

-- 4. LOAN PRODUCTS, VERSIONS, APPLICATIONS & LOANS
CREATE TABLE loan_products (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    version INT DEFAULT 1,
    annual_interest_rate DECIMAL(5,2) NOT NULL,
    interest_calculation_method ENUM('Diminishing Balance', 'Flat Rate', 'Equal Amortization') NOT NULL,
    payment_frequency ENUM('Monthly', 'Semi-monthly', 'Weekly', 'Lump Sum') NOT NULL,
    gl_receivable_account_id VARCHAR(50) NOT NULL,
    gl_interest_income_account_id VARCHAR(50) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE loans (
    id VARCHAR(50) PRIMARY KEY,
    loan_account_no VARCHAR(50) NOT NULL UNIQUE,
    member_id VARCHAR(50) NOT NULL,
    loan_product_id VARCHAR(50) NOT NULL,
    product_version INT DEFAULT 1,
    branch_id VARCHAR(50) NOT NULL,
    principal_amount DECIMAL(15,2) NOT NULL,
    annual_interest_rate DECIMAL(5,2) NOT NULL,
    term_months INT NOT NULL,
    disbursement_date DATE NOT NULL,
    current_balance DECIMAL(15,2) NOT NULL,
    status ENUM('Draft', 'Submitted', 'Approved', 'Released', 'Active', 'Fully Paid', 'Past Due') DEFAULT 'Active',
    FOREIGN KEY (member_id) REFERENCES members(id)
) ENGINE=InnoDB;

CREATE TABLE loan_amortization_schedules (
    id VARCHAR(50) PRIMARY KEY,
    loan_id VARCHAR(50) NOT NULL,
    installment_no INT NOT NULL,
    due_date DATE NOT NULL,
    principal DECIMAL(15,2) NOT NULL,
    interest DECIMAL(15,2) NOT NULL,
    total_installment DECIMAL(15,2) NOT NULL,
    principal_balance DECIMAL(15,2) NOT NULL,
    paid_principal DECIMAL(15,2) DEFAULT 0,
    paid_interest DECIMAL(15,2) DEFAULT 0,
    status ENUM('Unpaid', 'Partially Paid', 'Paid', 'Overdue') DEFAULT 'Unpaid',
    FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. SAVINGS, SHARE CAPITAL (CBU), & CASH ACCOUNTS
CREATE TABLE savings_accounts (
    id VARCHAR(50) PRIMARY KEY,
    account_number VARCHAR(50) NOT NULL UNIQUE,
    member_id VARCHAR(50) NOT NULL,
    savings_product_id VARCHAR(50) NOT NULL,
    branch_id VARCHAR(50) NOT NULL,
    balance DECIMAL(15,2) DEFAULT 0,
    opened_date DATE NOT NULL,
    status ENUM('Active', 'Dormant', 'Closed') DEFAULT 'Active',
    FOREIGN KEY (member_id) REFERENCES members(id)
) ENGINE=InnoDB;

CREATE TABLE share_capital_accounts (
    id VARCHAR(50) PRIMARY KEY,
    account_number VARCHAR(50) NOT NULL UNIQUE,
    member_id VARCHAR(50) NOT NULL,
    subscribed_shares INT NOT NULL,
    subscribed_amount DECIMAL(15,2) NOT NULL,
    paid_up_shares INT NOT NULL,
    paid_up_amount DECIMAL(15,2) NOT NULL,
    status ENUM('Active', 'Withdrawn', 'Transferred') DEFAULT 'Active',
    FOREIGN KEY (member_id) REFERENCES members(id)
) ENGINE=InnoDB;

-- 6. GENERAL LEDGER & JOURNAL VOUCHERS
CREATE TABLE journal_entries (
    id VARCHAR(50) PRIMARY KEY,
    voucher_number VARCHAR(50) NOT NULL UNIQUE,
    branch_id VARCHAR(50) NOT NULL,
    posting_date DATE NOT NULL,
    reference_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    total_debit DECIMAL(15,2) NOT NULL,
    total_credit DECIMAL(15,2) NOT NULL,
    period_id VARCHAR(50) NOT NULL,
    status ENUM('Draft', 'Pending Approval', 'Posted', 'Reversed') DEFAULT 'Posted',
    FOREIGN KEY (branch_id) REFERENCES branches(id)
) ENGINE=InnoDB;

CREATE TABLE journal_lines (
    id VARCHAR(50) PRIMARY KEY,
    journal_entry_id VARCHAR(50) NOT NULL,
    account_id VARCHAR(50) NOT NULL,
    debit DECIMAL(15,2) DEFAULT 0,
    credit DECIMAL(15,2) DEFAULT 0,
    subsidiary_type VARCHAR(50) NULL,
    subsidiary_id VARCHAR(50) NULL,
    FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id)
) ENGINE=InnoDB;

-- (Full schema contains 40+ tables, CDA master seeds, branch matrices, and numbering rules)`}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'mvc' && (
            <div className="space-y-4 text-xs text-slate-300">
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/60 space-y-2">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Server className="w-4 h-4 text-emerald-400" />
                  <span>PHP MVC Architecture Setup Guide</span>
                </h3>
                <p className="text-slate-400">
                  You can set up your PHP MVC application under Apache, Nginx, or Laragon at{' '}
                  <code className="px-1.5 py-0.5 rounded bg-slate-900 text-emerald-300 font-mono">
                    http://cooperative-api.test/api/
                  </code>
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                    1. Directory Structure
                  </span>
                  <pre className="text-[11px] font-mono text-slate-300 leading-relaxed">
{`app/
  Controllers/
    MemberController.php
    LoanController.php
    SavingsController.php
    AccountingController.php
  Models/
    Member.php
    Loan.php
    JournalEntry.php
  Core/
    Database.php
    Router.php
    Response.php
public/
  index.php
  .htaccess`}
                  </pre>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block">
                    2. PDO Database Connection (app/Core/Database.php)
                  </span>
                  <pre className="text-[11px] font-mono text-slate-300 leading-relaxed">
{`namespace App\\Core;
use PDO;

class Database {
  private static ?PDO $instance = null;
  public static function getConnection(): PDO {
    if (!self::$instance) {
      self::$instance = new PDO(
        "mysql:host=127.0.0.1;dbname=cooperative_db;charset=utf8mb4",
        "root", "", [
          PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
          PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
      );
    }
    return self::$instance;
  }
}`}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'endpoints' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Frontend API calls map to the following PHP MVC controllers and routes:
              </p>
              <div className="rounded-xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Method</th>
                      <th className="py-2.5 px-3">Endpoint Route</th>
                      <th className="py-2.5 px-3">PHP MVC Action</th>
                      <th className="py-2.5 px-3">Purpose</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 text-slate-300 font-mono text-[11px]">
                    <tr>
                      <td className="py-2 px-3 text-emerald-400 font-bold">GET</td>
                      <td className="py-2 px-3">/api/members</td>
                      <td className="py-2 px-3 text-blue-300">MemberController@index</td>
                      <td className="py-2 px-3 font-sans text-slate-400">List members with search/filter</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-blue-400 font-bold">POST</td>
                      <td className="py-2 px-3">/api/members</td>
                      <td className="py-2 px-3 text-blue-300">MemberController@store</td>
                      <td className="py-2 px-3 font-sans text-slate-400">Register new member</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-emerald-400 font-bold">GET</td>
                      <td className="py-2 px-3">/api/loans</td>
                      <td className="py-2 px-3 text-blue-300">LoanController@index</td>
                      <td className="py-2 px-3 font-sans text-slate-400">List active loans</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-blue-400 font-bold">POST</td>
                      <td className="py-2 px-3">/api/loans/payments</td>
                      <td className="py-2 px-3 text-blue-300">LoanController@payment</td>
                      <td className="py-2 px-3 font-sans text-slate-400">Loan installment collection</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-emerald-400 font-bold">GET</td>
                      <td className="py-2 px-3">/api/savings/accounts</td>
                      <td className="py-2 px-3 text-blue-300">SavingsController@accounts</td>
                      <td className="py-2 px-3 font-sans text-slate-400">Savings accounts list</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-emerald-400 font-bold">GET</td>
                      <td className="py-2 px-3">/api/accounting/journals</td>
                      <td className="py-2 px-3 text-blue-300">AccountingController@journals</td>
                      <td className="py-2 px-3 font-sans text-slate-400">Journal vouchers & lines</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-emerald-400 font-bold">GET</td>
                      <td className="py-2 px-3">/api/accounting/trial-balance</td>
                      <td className="py-2 px-3 text-blue-300">AccountingController@trialBalance</td>
                      <td className="py-2 px-3 font-sans text-slate-400">Trial Balance report</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span className="flex items-center space-x-1.5">
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>Full guide available at <code>/docs/PHP_MVC_GUIDE.md</code></span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
