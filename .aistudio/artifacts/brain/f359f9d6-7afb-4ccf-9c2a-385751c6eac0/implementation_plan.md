# Audit Trail & Verification: Money Destination / Contra GL Accounts

## Overview
Added the **GL account where money goes into** (destination / target account) and offsetting **Contra GL account** to every row across all reports in **Reports & General Ledgers** and **General Ledger & Cooperative Journals**, enabling auditors to verify and balance double-entry transactions row-by-row both in the UI and in exported CSV files.

---

## Changes Implemented

### 1. Backend API Routing (`server/routes/api.ts`)
- **`/reports/journal-entries`**: Enriched each journal line with its counterpart voucher lines:
  - `destination_gl_code`, `destination_gl_name`, `destination_gl_account` (Debit account target where money flowed).
  - `contra_account_code`, `contra_account_name`, `contra_gl_account` (Offsetting Credit account source).
- **`/reports/member-transactions`**: Added `destination_gl_account` and `contra_gl_account` across:
  - Savings Deposits (`1111 - Cash on Hand` / `2110 - Savings Deposits Payable`).
  - Savings Withdrawals (`2110 - Savings Deposits Payable` / `1111 - Cash on Hand`).
  - Share Capital / CBU contributions (`1111 - Cash on Hand` / `3110 - Paid-Up Share Capital`).
  - Loan releases (`1210 - Loans Receivable` / `1111 - Cash on Hand / Cash in Bank`).
  - Loan amortization payments (`1111 - Cash on Hand` / `1210 - Loans Receivable / 4110 - Interest Income`).
  - Member Journal Vouchers.
- **`/reports/subsidiary-ledger`**: Added `destination_gl_account` and `contra_gl_account` to:
  - Loan Beginning Balance entries.
  - Loan Disbursement entries.
  - Loan Amortization Payment entries.
  - Savings Deposits, Withdrawals, Interest Postings, and Service Fee deductions.
  - Share Capital contributions, subscriptions, and share movement entries.

### 2. Reports & General Ledgers (`ReportsModule.tsx`)
- **Journal Ledgers Grid (`glColumns`)**: Added `Money Destination / Contra GL` column (`key: 'destination_gl_account'`).
- **Member Transactions Grid (`memberColumns`)**: Added `Money Destination / Contra GL` column (`key: 'destination_gl_account'`).
- **CSV Export Handler (`handleExportCSV`)**:
  - `journal_ledger`: Added `"Money Destination / Contra GL"` in CSV header and per-row output.
  - `member_ledger`: Added `"Money Destination / Contra GL"` in CSV header and per-row output.

### 3. Subsidiary Ledger Report (`SubsidiaryLedgerReport.tsx`)
- **Excel Grid Table (`entryColumns`)**: Added `Money Destination / Contra GL` column.
- **Account Statement Card View**: Added destination / contra GL indicators under transaction particulars.
- **CSV Export Handler (`handleExportCSV`)**: Added `"Money Destination / Contra GL"` in CSV header and per-row output.

### 4. Account Ledger Drilldown (`AccountLedgerReport.tsx`)
- **`sourceRows` Mapping**: Resolved `destination_gl_account` and `contra_gl_account` from sibling lines of each voucher.
- **Printable Table & UI View**: Added `Money Destination / Contra GL` column.
- **CSV Export Handler (`exportCsv`)**: Added `"Money Destination / Contra GL"` to exported CSV file headers and rows.

### 5. General Ledger & Cooperative Journals (`AccountingModule.tsx`)
- **Itemized General Ledger (`flattenedLedgerLines` & `generalLedgerCols`)**:
  - Enriched each flattened line with `destination_gl_account` and `contra_gl_account`.
  - Added `Money Destination / Contra GL` column in UI table and ExcelGridTable CSV export.
- **General Journal Voucher Register (`generalJournalCols`)**:
  - Added `Money Destination (Debits)` (`destination_accounts`) column.
  - Added `Funding Source (Credits)` (`source_accounts`) column.
  - Updated data mapping with `enrichedJournals` for complete CSV export visibility.

### 6. Specialized Journals (`CashReceiptJournal.tsx` & `CashDisbursementJournal.tsx`)
- **Cash Receipt Journal (CRJ)**:
  - Added `Cash / Money Destination (Debit GL)` (`destination_gl_account`, e.g., `1111 - Cash on Hand`).
  - Added `Funding / Revenue Source (Credit GL)` (`contra_gl_account`, e.g., `1210 - Loans Receivable / 4110 - Interest Income`).
- **Cash Disbursement Journal (CDJ)**:
  - Added `Disbursement Target (Debit GL)` (`destination_gl_account`, e.g., `1210 - Loans Receivable` / `2110 - Savings Deposits Payable`).
  - Added `Cash / Bank Funding Source (Credit GL)` (`contra_gl_account`, e.g., `1111 - Cash on Hand` / `1112 - Cash in Bank`).

### 7. Printable Modals (`PrintableReportModal.tsx` & `PrintableSubsidiaryLedgerModal.tsx`)
- Added `Money Destination / Contra GL` column to official printable statements for audit compliance.

---

## Verification
- `tsc --noEmit`: 0 errors.
- `npm run build`: Successful bundle compilation.
- Dev server restarted and running on port 3000.
