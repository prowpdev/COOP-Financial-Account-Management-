# Cooperative Subsidiary Ledger Report & Printable Audit Statements

A comprehensive, audit-grade Subsidiary Ledger (SL) reporting module integrated into the existing Reports & General Ledger Workbench. It provides detailed chronological movement tracking—including principal disbursements, repayments, interest, penalties, and running balances—for Member Loans, Savings Deposits, and Share Capital (CBU), complete with a CDA-compliant printable statement and downloadable PDF.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following product requirements and architectural choices were confirmed during Phase 1 clarification:

- **Account Coverage (Confirmed)**: Full multi-account subsidiary ledger tracking covering **Loans** (principal, amortization repayments, interest collected, penalties, and outstanding balance), **Savings Accounts** (deposits, withdrawals, interest credits, and running balance), and **Share Capital / CBU** (share purchases, subscriptions, refunds, and cumulative equity).
- **Module Placement (Confirmed)**: Embedded directly inside the existing **Reports & General Ledger Workbench** (`ReportsModule.tsx`) as a dedicated interactive Sheet / Workspace tab, preserving consistent accounting period, branch, and member filters.
- **Output Formats (Confirmed)**: High-density interactive tabular workbench, exportable CSV for audit spreadsheet analysis, and an official CDA-standard printable report with direct browser printing and downloadable PDF.
- **Balance Carryover Strategy (Recommended Default)**: Automatic calculation of pre-period opening balance (inception to cutoff start date) so that transaction movement tables show an accurate opening balance row followed by period entries and the ending running balance.

---

## 1. Overview & Core Concept

### What It Does
In cooperative accounting under Cooperative Development Authority (CDA) standards, the General Ledger maintains control accounts (e.g., *1210 Loans Receivable*, *2110 Savings Deposits*, *3110 Paid-up Share Capital*), while the **Subsidiary Ledger** maintains the individual account balances and granular transaction history for each cooperative member.

This feature adds a full-featured **Subsidiary Ledger Report & Statement Generator** that:
1. Allows auditors, accountants, and credit officers to select any member and inspect their individual loan, savings, or share capital accounts.
2. Tracks every movement chronologically: transaction dates, reference / Official Receipt (OR) numbers, voucher numbers, principal debit/credit movements, interest income portions, penalties/fines, and real-time running balances.
3. Renders an official, printable **Member Subsidiary Ledger Statement** formatted for cooperative regulatory audits, credit committee reviews, and member distribution, complete with cooperative letterhead, CDA registration details, and certification signature lines.

### Target Audience & Persona
- **Cooperative Accountants & Bookkeepers**: Reconciling General Ledger control accounts against individual member ledger totals.
- **Credit Committee & Loan Officers**: Reviewing historical borrower repayment consistency, interest contributions, and outstanding exposures before approving renewals.
- **External & Internal Audit Teams**: Verifying audit trails, receipt numbers, interest calculations, and transaction dates.
- **Cooperative Members**: Receiving certified statements of their loan status, paid equity, and accumulated savings.

### Key Value
Eliminates manual ledger book reconciliation by providing instant, automated subsidiary ledger statements linked to the core general ledger and transaction tables, with zero discrepancy between control accounts and sub-ledgers.

---

## 2. User Experience & Visual Design

### Key User Flows

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           REPORTS & GL WORKBENCH                                │
├────────────────────────┬──────────────────────────┬─────────────────────────────┤
│ Sheet 1: General Ledger│ Sheet 2: Member GL Lines │ Sheet 3: Subsidiary Ledger  │
│      Transactions      │      Consolidated        │ (Loans, Savings & Capital)  │
└────────────────────────┴──────────────────────────┴─────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ FILTERS & ACCOUNT SELECTOR STRIP                                                │
│ ┌──────────────────────┐ ┌───────────────┐ ┌──────────────┐ ┌─────────────────┐ │
│ │ Ledger: [Loans   ▼]  │ │ Member: [All] │ │ Period: 2026 │ │ Branch: Main    │ │
│ └──────────────────────┘ └───────────────┘ └──────────────┘ └─────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ FINANCIAL SUMMARY CARDS (Monospace Tabular Figures)                             │
│ ┌──────────────────┐ ┌──────────────────┐ ┌────────────────┐ ┌────────────────┐ │
│ │ Opening Balance  │ │ Principal Repaid │ │ Interest Paid  │ │ Ending Balance │ │
│ │ ₱150,000.00      │ │ ₱45,000.00       │ │ ₱6,750.00      │ │ ₱105,000.00    │ │
│ └──────────────────┘ └──────────────────┘ └────────────────┘ └────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ SUBSIDIARY LEDGER INTERACTIVE DATA GRID                                         │
│ Date       | Ref / OR # | Particulars        | Debit | Credit | Int. | Balance  │
│ 2026-01-15 | LN-2026-01 | Loan Disbursement  | 150k  | -      | -    | 150k     │
│ 2026-02-15 | OR-98412   | Monthly Amortization| -    | 15,000 | 2,250| 135k     │
│ 2026-03-15 | OR-98765   | Monthly Amortization| -    | 15,000 | 2,250| 120k     │
└─────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
                       [ Print Official Statement / PDF ]
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ PRINTABLE / PDF MODAL (Clean Paper Layout, Zero Dark-Mode Bleed)                │
│ • Cooperative Header, CDA Reg. #, Tax Identification Number (TIN)               │
│ • Member ID, Full Name, Contact, Address, Branch Location                       │
│ • Account Specification (Loan Product, Interest Rate %, Term, Maturity Date)   │
│ • Chronological Movements Table with Running Balances                           │
│ • Sign-off blocks: Prepared By, Verified By, Member Conforme                   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Visual Identity & Theme
- **Aesthetic Direction**: Utilitarian, dense financial dashboard following the `SaaS & Dashboards` domain guidelines with high-contrast legibility, subtle hairline borders, and zero decorative fluff.
- **Color Palette & Discipline**:
  - Dominant Neutral Canvas (60%): Clean dark slate (`#0B1120` / `#0F172A`) on web, transitioning seamlessly to pure crisp white (`#FFFFFF`) in print view.
  - Structural Surfaces (30%): Hairline borders (`border-slate-800` / `border-neutral-200`) and subtle slate row alternations.
  - Accent Budget (10%): High-intent Emerald (`#059669` / `#10B981`) for active tabs, positive repayments, and primary PDF actions; Rose (`#E11D48`) for overdue interest or penalties.
- **Typography & Tabular Discipline**:
  - Display & Headings: `Plus Jakarta Sans` for clean titles and tab labels.
  - Body: `DM Sans` / `Public Sans` for readable descriptions and account particulars.
  - Financial Figures & Numerals: Strict tabular monospace (`font-mono tabular-nums`) across all currency fields, voucher numbers, and dates to ensure vertical decimal alignment.
- **Interactive Feedback & States**:
  - Loading skeleton matching table rows.
  - Empty state with guidance when no member or account transactions exist in the selected period.
  - Responsive print styling (`@media print`) stripping sidebar, navigation, and dark styling to produce professional A4/Letter cooperative statements.

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Integrated Sheet vs. Isolated New Navigation Module
- **Chosen Approach**: Integrate Subsidiary Ledger as **Sheet 3** in the primary `ReportsModule.tsx` alongside General Ledger and Member Transactions, with an option to link directly to it from Member details and Loan details.
- **Why**: Keeps all financial reporting, accounting period cutoffs, branch consolidation, and GL account filters unified in a single workflow. Users do not have to reselect the accounting period or branch when moving between general and subsidiary ledgers.
- **Alternatives Considered**: Creating a completely disconnected standalone module would duplicate the period selection logic, branch filters, and GL lookup tables.

### Decision 2: Multi-Type Ledger Architecture (Loans, Savings, Share Capital)
- **Chosen Approach**: Unified subsidiary ledger schema that normalizes loan repayments (principal + interest + penalty), savings deposits/withdrawals, and share capital contributions into a coherent ledger movement structure with domain-specific column adapters.
- **Why**: Gives the user one standardized interface while preserving the specialized fields required for loans (interest rate, amortization breakdown, remaining balance) vs. deposits (interest credited, balance).
- **Alternatives Considered**: Restricting to loans only would leave cooperatives without a way to audit savings passbooks or share capital ledgers against member accounts.

### Decision 3: PDF Generation via Print-Optimized CSS & Browser Engine
- **Chosen Approach**: Implement a dedicated `PrintableSubsidiaryLedgerModal` using high-fidelity CSS print media queries (`@media print`), enabling immediate high-resolution "Save as PDF" and direct physical printing without heavy third-party canvas or WASM PDF dependencies that bloat bundle size or fail font rendering.
- **Why**: Zero external bundle overhead, native vector typography, crisp multi-page table formatting with `page-break-inside: avoid` on signature blocks, and guaranteed cross-platform compatibility.
- **Alternatives Considered**: Pure client-side rasterizing libraries (like `html2canvas`) generate blurry text and struggle with multi-page pagination.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             REACT FRONTEND                                  │
│                                                                             │
│   src/components/reports/ReportsModule.tsx                                  │
│   ├── Sheet 1: General Ledger Transactions                                  │
│   ├── Sheet 2: Member GL Transactions                                       │
│   └── Sheet 3: Subsidiary Ledger Explorer [NEW]                             │
│         ├── Sub-Ledger Type Filter (Loans | Savings | Share Capital | All)  │
│         ├── Member & Account Dropdown Selectors                             │
│         ├── Account Financial Metric Summary Bar                            │
│         ├── High-Density ExcelGridTable / Movements Grid                    │
│         └── PrintableSubsidiaryLedgerModal.tsx [NEW]                        │
│               └── Official Print / PDF Template                             │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTP GET
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           API & SERVER LAYER                                │
│                                                                             │
│   backend-php/app/Controllers/ReportController.php                          │
│   ├── subsidiaryLedger(?string $periodId = null): never                     │
│                                                                             │
│   backend-php/app/Services/ReportService.php                                │
│   ├── getSubsidiaryLedgerReport($type, $periodId, $memberId, ...)           │
│         ├── Queries `loans`, `loan_payments`, `loan_payment_allocations`    │
│         ├── Queries `savings_accounts`, `savings_transactions`              │
│         ├── Queries `share_capital_accounts`, `share_capital_transactions`  │
│         └── Computes running principal, interest, and ending balances       │
│                                                                             │
│   server/routes/api.ts (Node proxy/fallback parity)                         │
│   └── router.get('/api/reports/subsidiary-ledger', ...)                     │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ PDO / SQL
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             DATABASE LAYER                                  │
│   • loans, loan_products, loan_payments, loan_payment_allocations           │
│   • savings_accounts, savings_transactions                                  │
│   • share_capital_accounts, share_capital_transactions                      │
│   • members, branches, accounting_periods, chart_of_accounts                │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Model & Ledger Structure

Each subsidiary ledger movement record will return:

```typescript
interface SubsidiaryLedgerEntry {
  id: string;
  date: string;
  ref_no: string;              // Receipt #, Voucher #, or Disbursement Ref
  type: string;                // DISBURSEMENT, PAYMENT, DEPOSIT, WITHDRAWAL, INTEREST
  product_type: 'loan' | 'savings' | 'share_capital';
  account_id: string;
  account_number: string;
  member_id: string;
  member_no: string;
  member_name: string;
  description: string;
  
  // Financial Movements
  debit: number;               // Principal Disbursed / Withdrawal
  credit: number;              // Principal Paid / Deposit
  interest_amount?: number;    // Interest collected/applied
  penalty_amount?: number;     // Fines/Penalties collected
  fee_amount?: number;         // Processing / admin fees
  running_balance: number;     // Current balance after this movement
  
  // Audit & Context
  gl_code?: string;
  branch_id: string;
  branch_name: string;
  posted_by?: string;
}
```

### Key Implementation Steps
1. **Backend Service & Controller (`backend-php`)**:
   - Add `getSubsidiaryLedgerReport(...)` in `backend-php/app/Services/ReportService.php`.
   - Add `subsidiaryLedger()` route handler in `backend-php/app/Controllers/ReportController.php`.
   - Register route `/api/reports/subsidiary-ledger` in `backend-php/routes/api.php`.
2. **Server Parity (`server/routes/api.ts`)**:
   - Mirror `/api/reports/subsidiary-ledger` and `/reports/subsidiary-ledger` in the Node development server for full-stack consistency.
3. **Frontend API Client (`src/services/api.ts`)**:
   - Add `getReportSubsidiaryLedger(params)` helper with full query filtering.
4. **Printable Modal (`src/components/reports/PrintableSubsidiaryLedgerModal.tsx`)**:
   - Design official statement header with cooperative crest/logo, registration, contact details.
   - Account metadata block (Interest rate, original loan amount, loan term, savings balance).
   - Clean tabular statement with debit, credit, interest, penalty, and running balance.
   - Certification and signatory section (Prepared by, Checked by, Approved by, Member Conforme).
5. **Reports Module Integration (`src/components/reports/ReportsModule.tsx`)**:
   - Add **Sheet 3: Subsidiary Ledger** tab with badge counter.
   - Add sub-ledger type segmented controls (Loans, Savings, Share Capital, All).
   - Add Member and Account specific selectors.
   - Add summary KPI cards (Opening Balance, Total Debits, Total Credits, Total Interest, Ending Balance).
   - Hook up CSV Export and Printable PDF Modal launcher.
6. **Build Verification**:
   - Run compilation and TypeScript validation to ensure clean builds.
