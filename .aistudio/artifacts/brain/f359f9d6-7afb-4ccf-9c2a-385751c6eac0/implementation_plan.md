# Unified Reports & Ledger Workbench Module Architecture Plan

A dedicated, Excel-like reporting workbench allowing users to filter General Ledger and Member transactions across CDA accounting periods, toggle specific GL accounts via interactive checkboxes, filter by member, and export to CSV and PDF.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following user preferences were confirmed during the interactive clarification phase:

- **Dual Sheets in Excel Grid**: General Ledger transactions and Member transactions will be rendered in a tabbed dual-sheet workbench layout within the same display module.
- **Member Filtering Scope**: Member transactions can be filtered by individual member, member account, or across all active members within the selected period alongside the GL account selection.
- **Navigation Placement**: Accessible via a dedicated "Reports & Ledger Workbench" item in the primary sidebar navigation.

---

## 1. Overview & Core Concept

### What It Does
The **Reports Module** provides finance officers, internal auditors, and branch managers with an interactive Excel-grade reporting workbench. Users select an accounting period (e.g., October 1 – October 31 from the `accounting_periods` table), select which General Ledger accounts to include via multi-select checkboxes, and optionally filter by member. The system populates a dual-sheet spreadsheet with real-time totals, formula sums, and instant export to CSV and audit-ready printable PDF.

### Target Audience & Persona
- **Accountants & Bookkeepers**: Reconciling journal entries against chart-of-accounts balances for closing periods.
- **Internal Auditors & Regulators (CDA)**: Auditing member passbooks, savings, share capital (CBU), and credit schedules against underlying general ledger postings.
- **Branch Managers**: Reviewing monthly operational disbursements, receipts, and member activity.

### Key Value
Eliminates manual multi-step reconciliation between the General Ledger and member subsidiary records by uniting them in an Excel workbench with synchronized period cutoffs and one-click regulatory export.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Period Selection**: The user opens the Reports Module and selects an accounting period from a dropdown populated from the `accounting_periods` database table (displaying period name, date range, and open/closed status).
2. **GL Account Toggling**: A collapsible GL Account Filter panel displays all accounts grouped by class (Assets, Liabilities, Equity, Revenue, Expense) with "Select All", "Clear All", and quick search. The user checks/unchecks specific GL accounts.
3. **Member Filter**: An optional searchable member selector allows narrowing down to specific member transactions or viewing all members active in that period.
4. **Excel Grid Exploration**: 
   - **Sheet 1 (General Ledger Transactions)**: Lists date, voucher number, GL code, account title, reference/description, debit, credit, net balance, and branch.
   - **Sheet 2 (Member Subsidiary Ledger)**: Lists date, member number, member name, product type (Savings, CBU, Loan), receipt/reference, debit/credit amounts, and linked GL account.
5. **Statistics & Summary Bar**: Bottom status bar calculates total rows, total debit, total credit, and variance in tabular figures.
6. **Export**: 
   - **CSV Export**: Downloads a structured CSV file for the active sheet or consolidated data.
   - **PDF Export / Print Preview**: Opens a high-density, print-formatted view with official cooperative letterhead, period metadata, applied filter criteria, balanced summary totals, and signatures block for submission to the Board or CDA.

### Visual Identity & Theme
- **Aesthetic Direction**: High-density enterprise SaaS workbench adhering to the Universal Frontend Design Constitution. Deep slate canvas (`#0F172A`), crisp hairline dividers (`#334155`), and emerald accents (`#10B981`) for positive equilibrium.
- **Typography**: `Plus Jakarta Sans` for clean UI controls, paired with `font-mono tabular-nums` for all amounts, vouchers, dates, and balances to guarantee vertical decimal alignment.
- **Zero-Pill Discipline**: Statuses and metadata use clean, unboxed text separated by subtle middots (`·`). Interactive tabs for sheets (GL Ledger / Member Ledger) use clean segmented control styling.
- **No Mechanical Clutter**: No code comments in headers, no decorative pulsing dots, and no artificial status tickers.

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Dual-Sheet vs. Combined Single Sheet
- **Chosen Approach**: Dual-sheet tabbed structure ("GL Ledger" and "Member Transactions") within the same workbench screen.
- **Why**: General Ledger transactions are double-entry journal lines (debit/credit balancing to zero), whereas Member transactions are subsidiary records (individual passbook deposits, loan amortizations, share capital contributions). Combining them into one flat table creates awkward empty cells and distorted totals. Dual sheets preserve accounting integrity while sharing identical period and account filters.

### Decision 2: Accounting Period Source & Custom Override
- **Chosen Approach**: Pull dropdown options directly from `accounting_periods` table, displaying fiscal year and start/end dates, with an optional custom date range toggle for non-standard audit queries.
- **Why**: Follows CDA accounting standards where books close on formal periods, preventing date-entry errors.

### Decision 3: Client-Side + Server-Side Hybrid Filtering
- **Chosen Approach**: Fetch journal entries and member transactions for the selected accounting period via optimized backend endpoints, then execute immediate client-side GL checkbox toggling and member search for instant 0ms latency responses without refetching.
- **Why**: Allows instant checkbox responsiveness as the user toggles accounts without loading spinners on every click.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Sidebar Navigation                              │
│             [Reports & Ledger Workbench] (Tab: 'reports_module')       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        ReportsModule (Workbench)                       │
├────────────────────────────────────────────────────────────────────────┤
│ Controls Bar:                                                          │
│  ├── [Period Dropdown] (from accounting_periods: Oct 1 - Oct 31, 2026) │
│  ├── [Branch Selector] (Consolidated or specific branch)               │
│  ├── [Member Filter] (Searchable Select: All or specific member)       │
│  └── [Actions] -> [Export CSV] [Export PDF / Print] [Refresh]          │
├────────────────────────────────────────────────────────────────────────┤
│ GL Account Checkbox Bar / Drawer:                                      │
│  ├── Quick Buttons: [Select All] [Deselect All] [Assets] [Liab] etc.   │
│  └── Checkbox Badges for each GL Account (Code + Title)                │
├────────────────────────────────────────────────────────────────────────┤
│ Dual-Sheet Tab Switcher:                                               │
│  ├── Sheet 1: General Ledger Transactions (Journal lines)              │
│  └── Sheet 2: Member Transactions (Savings, CBU, Loans subsidiary)     │
├────────────────────────────────────────────────────────────────────────┤
│ ExcelGridTable Engine:                                                 │
│  ├── High-density tabular grid with column sorting & search filters    │
│  └── Monospace tabular-nums currency rendering                         │
├────────────────────────────────────────────────────────────────────────┤
│ Bottom Accounting Summary Bar:                                         │
│  └── Total Transactions | Total Debit (₱) | Total Credit (₱) | Net (₱) │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                 ┌──────────────────┴──────────────────┐
                 ▼                                     ▼
┌─────────────────────────────────┐   ┌──────────────────────────────────┐
│  Node / Express Backend API     │   │  PHP Backend Compatibility       │
│  GET /api/reports/journal-      │   │  GET /api/reports/journal-       │
│      entries?period_id=...      │   │      entries?period_id=...       │
│  GET /api/reports/member-       │   │  GET /api/reports/financial-     │
│      transactions?period_id=... │   │      statements                  │
└─────────────────────────────────┘   └──────────────────────────────────┘
```

### Key Components to Build & Update
1. **`src/components/reports/ReportsModule.tsx`**:
   - Primary container housing the period selector, GL checkbox toggle panel, member search filter, dual-sheet switcher, ExcelGridTable integration, and export handlers.
2. **`src/components/reports/PrintableReportModal.tsx`**:
   - Clean, professional print/PDF layout supporting official cooperative headers, period dates, applied GL accounts list, and signature lines.
3. **`src/components/Sidebar.tsx`**:
   - Register `'reports_module'` with `FileSpreadsheet` icon in `navItems`.
4. **`src/types/index.ts`**:
   - Add `'reports_module'` to `TabKey` type definition.
5. **`src/App.tsx`**:
   - Add route branch for `activeTab === 'reports_module'` rendering `<ReportsModule />`.
6. **`src/services/api.ts` & `server/routes/api.ts`**:
   - Implement `getJournalEntriesByPeriod(periodId, branchId)` and `getMemberTransactionsByPeriod(periodId, branchId, memberId)` in both frontend API service and server routes.
