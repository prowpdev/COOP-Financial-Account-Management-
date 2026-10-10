# Financial Reports Real Data & CDA Equilibrium Restoration Plan

A comprehensive solution to resolve data rendering issues in the **Statement of Financial Condition (Balance Sheet)** and **Statement of Operations (Income Statement)** by seeding authentic multi-branch cooperative operational records, fixing double-entry account classification and Net Surplus equity balancing, and providing an active-accounts toggle with CDA-compliant presentation.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions were clarified and confirmed with the user in Phase 1:
>
> - **Operational Dataset**: Seed realistic, CDA-compliant multi-branch operational sample data (active loans, savings deposits, share capital, loan interest, and operating expenses) so all branches reflect live financial activity immediately.
> - **Zero-Balance Display**: Display active accounts with balances by default to eliminate clutter, with an intuitive toggle allowing users to inspect the full Chart of Accounts when desired.
> - **Balance Sheet Equilibrium (A = L + E)**: Dynamically include Current Period Net Surplus from operations within the Equity section as *Undivided Net Surplus* to guarantee mathematical balance (`Total Assets = Total Liabilities + Total Equity`).

---

### 1. Problem Diagnosis & Root Causes

1. **Sparse / Purged Operational Data**:
   - The database currently contains only 2 test cash receipts (`OR-2026-TEST-001` and `002`), leaving `loans: 0`, `savings_accounts: 0`, and `expenses: 0`.
   - Branch filtering (`Urdaneta`, `San Fernando`) returns ₱0 across all reports because initial branch vaults and operating transactions were never posted to the ledger for those branches.
2. **Account Group Mapping Fallback Flaw (`/reports/financial-statements`)**:
   - In `server/routes/api.ts`, `financial_statement_mappings` only defined 7 high-level categories (`Current Assets`, `Non-current Assets`, `Current Liabilities`, `Long-term Liabilities`, `Equity`, `Income`, `Expenses`).
   - Accounts with CDA `report_group` values like `Loans and Receivables`, `Deposit Liabilities`, and `Share Capital` failed explicit grouping and fell back to the first generic type match—dumping all assets into `Current Assets` and failing to classify loan portfolios and deposits cleanly.
3. **Broken Balance Sheet Equilibrium Equation**:
   - Currently, `total_liabilities_and_equity` is computed as `totalLiabilities + totalEquity` without adding `netSurplus` from operations.
   - Any revenue earned (e.g., ₱1,000 membership fee) increases Assets by ₱1,000 without a corresponding credit in Equity, causing an accounting discrepancy (`Assets ₱3,000 vs Liab + Equity ₱2,000`).
4. **Statement of Operations Rendering Gaps**:
   - `FinancialReportsView.tsx` lacked categorized groupings for revenues vs operating expenses and rendered flat account lists where 0-balance lines overwhelmed the display.

---

### 2. Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                   COOPERATIVE FINANCIAL ENGINE                         │
└────────────────────────────────────────────────────────────────────────┘
                                    │
         ┌──────────────────────────┴──────────────────────────┐
         ▼                                                     ▼
┌─────────────────────────────────────┐   ┌─────────────────────────────────────┐
│   General Ledger Journal Postings   │   │     Operational Sub-Ledgers         │
├─────────────────────────────────────┤   ├─────────────────────────────────────┤
│ • Branch Cash Float & Vaults (1110) │   │ • Active Loans Portfolio            │
│ • Bank Clearings (1120 / 1121)      │   │ • Member Savings Deposits           │
│ • Loans Receivable (1210 / 1230)    │   │ • Share Capital (CBU)               │
│ • Deposit Liabilities (2110 / 2120) │   │ • Branch Expense Vouchers           │
│ • Paid-Up Share Capital (3110)      │   └─────────────────────────────────────┘
│ • Loan Interest & Fees (4110 / 4120)│
│ • Operating Expenses (5210 / 5230)  │
└─────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────────────────────────┐
│               GET /api/reports/financial-statements                    │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Filter by branch_id (Consolidated or branch-specific)               │
│ 2. Compute Net Balances for each CDA account code                      │
│ 3. Group by CDA Report Classifications:                                │
│    - Current Assets (Cash, Bank, Tellers)                              │
│    - Loans & Receivables (Principal, Agri, Micro, Allowance)           │
│    - Property & Equipment (Office IT, Depreciation)                    │
│    - Deposit Liabilities (Savings, Time Deposits, Accrued Interest)    │
│    - Share Capital & Statutory Reserves                                │
│    - Current Period Net Surplus (Revenues - Expenses) -> Added to Eq   │
│ 4. Verify A = L + E Equilibrium                                        │
└────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     FinancialReportsView.tsx                           │
├────────────────────────────────────────────────────────────────────────┤
│ • Statement of Financial Condition (Balance Sheet Grid + Summary)      │
│ • Statement of Operations (Gross Revenue, Operating Expenses, Surplus) │
│ • Active Balances vs Full Chart of Accounts Toggle                     │
│ • Consolidated vs Branch Filter Selector                               │
│ • Synchronized CSV Export & Print Layout                               │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 3. Implementation Steps

#### Step 1: Seed Realistic Multi-Branch Operational Records
- In `server/db/seed.ts` & an initialization migration in `server/routes/api.ts`:
  - **Cash & Bank Float**: Seed initial branch cash vaults and banks across Tarlac, Urdaneta, and San Fernando branches.
  - **Members & Share Capital**: Seed representative members with active Paid-Up Share Capital (`acc_3110`).
  - **Loans Portfolio**: Seed active loans with disbursements (`acc_1210`), amortizations, collected interest income (`acc_4110`), and service fees (`acc_4120`).
  - **Savings Deposits**: Seed member savings accounts with active deposit balances (`acc_2110`).
  - **Operating Expenses**: Post realistic operational expenses (Salaries & Benefits `acc_5210`, Office Rent & Utilities `acc_5230`, and Office Supplies `acc_5220`).
  - **General Ledger Synchronization**: Generate balanced double-entry journal vouchers in `journal_entries` and `journal_lines` for all seeded operations.

#### Step 2: Fix Backend Financial Statement API (`server/routes/api.ts`)
- Update `GET /reports/financial-statements`:
  - Accurately map account lines by matching both `acc.id` and `acc.code`.
  - Group accounts into CDA-compliant structured categories:
    - *Assets*: `Current Assets`, `Loans and Receivables`, `Property, Plant & Equipment`.
    - *Liabilities*: `Deposit Liabilities`, `Current Liabilities`.
    - *Equity*: `Share Capital`, `Statutory Reserves`, and dynamically computed `Current Period Undivided Net Surplus`.
    - *Revenues*: `Interest Income on Loans`, `Service & Processing Fees`, `Membership Fees`.
    - *Expenses*: `Administrative Expenses`, `Financial Expenses`, `Credit Losses`.
  - Enforce Balance Sheet equilibrium:
    - `total_equity = share_capital + reserves + net_surplus`
    - `total_liabilities_and_equity = total_liabilities + total_equity`
    - Verify `Math.abs(total_assets - total_liabilities_and_equity) < 0.01`.
  - Ensure correct branch scoping when `branch_id` is supplied.

#### Step 3: Align Frontend Service Adapter (`src/services/api.ts`)
- In `getFinancialReport`:
  - Return structured category breakdowns and accounts for both `balance_sheet` and `income_statement`.
  - Include categorized subtotals (`current_assets`, `loans_receivable`, `deposit_liabilities`, `share_capital`, `net_surplus`).

#### Step 4: Enhance Financial Reports View (`src/components/reports/FinancialReportsView.tsx`)
- Add **Zero-Balance Toggle**:
  - State `showZeroBalances` (default `false`) with an accessible toggle switch (*"Show Active Accounts Only"* vs *"Show All CDA Accounts"*).
- **Statement of Financial Condition UI**:
  - Present categorized cards for *Current Assets*, *Loans & Receivables*, *Deposit Liabilities*, and *Members' Equity & Retained Surplus*.
  - Show explicit line for *Current Period Net Surplus* in the Equity section.
  - Equilibrium status pill confirming *Balanced (₱X = ₱X)*.
- **Statement of Operations UI**:
  - Present categorized sections: *Gross Operating Revenues* vs *Operating Expenses*.
  - Prominent *Net Operating Surplus for Allocation* card.
- Synchronize CSV export and Print/PDF layout to include the active view and branch scope.

---

### 4. Verification & Testing Checklist

- [ ] `compile_applet` passes with 0 TypeScript/build errors.
- [ ] `lint_applet` confirms clean syntax and imports.
- [ ] `GET /api/reports/financial-statements` returns non-zero assets, liabilities, equity, revenues, and expenses for consolidated and per-branch views.
- [ ] Statement of Financial Condition verifies that `Total Assets === Total Liabilities + Total Equity`.
- [ ] Statement of Operations verifies that `Net Surplus === Total Gross Revenue - Total Operating Expenses`.
- [ ] Toggle switch between "Active Accounts with Balances" and "Full CDA Chart" functions instantaneously on both statements.
- [ ] CSV Export and Print preview format correctly with active data and branch headers.
