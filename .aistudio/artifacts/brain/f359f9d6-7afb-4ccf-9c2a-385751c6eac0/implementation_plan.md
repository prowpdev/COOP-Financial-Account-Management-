# Cooperative Subsidiary Ledger Report & Chart of Accounts CSV Features

A comprehensive suite of accounting features for the cooperative platform, including an audit-grade Subsidiary Ledger (SL) reporting module with Excel View and Printable Statements, plus bidirectional CSV Import & Export for the Chart of Accounts (CDA Standard COA).

---

## 1. Feature 1: Subsidiary Ledger Report & Excel View

### Key Features Delivered
1. **Interactive Excel-Grade Subsidiary Ledger View**:
   - Integrated as **Sheet 3: Subsidiary Ledger** in `ReportsModule.tsx` and as dedicated interactive view in `SubsidiaryLedgerReport.tsx`.
   - Dual presentation modes: High-density interactive Excel Grid table and structured audit statement view.
   - Live sorting, filtering by member, account type (Loans, Savings, Share Capital), period, and branch.
   - KPI metrics: Opening balance, total principal additions/disbursements, repayments/credits, interest collections, penalties, and closing balance.
2. **CDA-Compliant Printable Statement & PDF**:
   - Dedicated `PrintableSubsidiaryLedgerModal.tsx` formatted for official cooperative regulatory audits, credit committee reviews, and member statements.
   - Clean paper styling (`@media print`) stripping dark themes and navigation, with official cooperative letterhead, CDA registration details, and certification signature lines.
3. **Direct Spreadsheet Export**:
   - One-click CSV and Excel export capturing all chronological entries, references, payment allocations, and running balances.

---

## 2. Feature 2: Chart of Accounts CSV Import & Export

### Key Features Delivered
1. **CDA Standard CSV Format**:
   - Standard columns: `account_code`, `name`, `category`, `report_group`, `normal_balance`, `parent_account_code`, `description`, `is_active`.
   - Intelligent auto-derivation:
     - Normal balance derived automatically if omitted (`Asset`/`Expense` -> `Debit`, `Liability`/`Equity`/`Revenue` -> `Credit`).
     - Category normalization (`Income` / `Revenue` alias handling).
     - Two-pass parent account code resolution (`parent_account_code` automatically resolves to `parent_account_id`).
2. **Interactive Import Modal (`ChartOfAccountsImportModal.tsx`)**:
   - Drag-and-drop file upload with CSV format validation and live file info.
   - Built-in "Download CDA CSV Template" generating a ready-to-fill sample template with sample assets, liabilities, equity, revenues, and expenses.
   - Direct raw CSV text paste mode for fast copy-pasting from existing spreadsheets.
   - Client-side pre-flight parsing and tabular validation preview with row-level error tags.
   - Real-time status counters: Total records, New accounts, Updates/Overwrites, and Format errors.
   - Safe Upsert Mode toggle (update existing account matching `account_code` or create new).
3. **Dual Export Options**:
   - Client-side fast export with parent code lookup and timestamped filename (`chart_of_accounts_YYYY-MM-DD.csv`).
   - Server-side CSV export endpoints with RFC 4180 escaping and attachment headers.
4. **Backend Parity**:
   - **Node.js**:
     - `GET /api/config/chart-of-accounts/export-csv` & `GET /api/accounting/chart/export-csv`
     - `POST /api/config/chart-of-accounts/import-csv` & `POST /api/accounting/chart/import-csv`
     - `DELETE /api/config/chart-of-accounts/:id` with journal validation.
   - **PHP / PDO**:
     - `backend-php/app/Services/AccountingService.php`: `importChartOfAccounts()` and `exportChartOfAccounts()`.
     - `backend-php/app/Controllers/AccountingController.php`: `importChart()` and `exportChart()`.
     - `backend-php/routes/api.php`: `/api/accounting/chart/import-csv`, `/api/config/chart-of-accounts/import-csv`, etc.
5. **UI Touchpoints**:
   - Available directly in the **Chart of Accounts** tab of the **Configuration Center** (`ConfigCenter.tsx`).
   - Also integrated into the **Excel Spreadsheet Workbench** (`ExcelWorkbench.tsx`) toolbar when viewing the Chart of Accounts sheet.

---

## 3. Verification & Build Status

- `lint_applet` (`tsc --noEmit`): Passed with 0 errors.
- `compile_applet` (`npm run build`): Passed successfully.
