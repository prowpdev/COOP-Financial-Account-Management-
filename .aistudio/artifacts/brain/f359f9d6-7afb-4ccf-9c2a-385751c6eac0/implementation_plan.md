# Reports & General Ledgers Filter & Layout Overhaul

A comprehensive refinement of the **Reports & General Ledgers** module (`ReportsModule.tsx`) and its submodules (`SubsidiaryLedgerReport.tsx`, `AccountLedgerReport.tsx`, `Journal Ledgers`), resolving accounting period selection bugs, eliminating duplicate and conflicting filter controls, and streamlining the report workbench according to CDA Philippine cooperative accounting standards.

---

## 1. Accounting Periods & Date Scope Fixes

1. **All Accounting Periods (Complete History / All Dates)**:
   - Added `all` as the top option: `All Accounting Periods (Complete History / All Dates)` in the universal Accounting Period selector.
   - Organized individual periods under `<optgroup label="2026 Fiscal Periods">` with explicit status indicators (`[Open]`, `[Closed]`).
   - Defaulted `selectedPeriodId` to `'all'` so users immediately see their cooperative's complete financial history instead of an empty closed cutoff.
   - Expanded backend periods in `data/coop_database.json` and `server/db/seed.ts` to include all 12 calendar fiscal periods for 2026 (`period_2026_01` through `period_2026_12`).

2. **Fixed `activePeriod` Fallback Glitch**:
   - Previously, if `selectedPeriodId === 'all'` or was empty, `activePeriod` fell back to `periods[0]` (January 2026, closed period with no transactions).
   - Now, `activePeriod` correctly resolves to `null` when `selectedPeriodId === 'all'`, and the query sets `startDate` and `endDate` to `undefined`, allowing full historical retrieval across the entire ledger.

3. **Backend API Route Date Filtering Parity**:
   - In `server/routes/api.ts`:
     - `/reports/journal-entries`: Corrected `selectedPeriod` to `(period_id && period_id !== 'all') ? periods.find(p => p.id === period_id) : null`, allowing all postings when `'all'` is chosen.
     - `/reports/member-transactions`: Updated `selectedPeriod` to `(period_id && period_id !== 'all') ? periods.find(p => p.id === period_id) : null`.
     - `/reports/subsidiary-ledger`: Dynamically computes `date_scope` so that when `effectiveStart` and `effectiveEnd` are provided, it filters by date range, and defaults to `'all'` when no date restrictions are set.

---

## 2. Universal Header vs. Submodule Filter De-duplication

1. **Subsidiary Ledgers (`SubsidiaryLedgerReport.tsx`)**:
   - When embedded inside `ReportsModule` (`hideHeader={true}`):
     - **Removed the duplicate "Filter by Member" dropdown** that repeated the universal header's Member Search.
     - **Removed the conflicting "Ledger Movement Scope" dropdown** that defaulted to `all` and overrode the parent's chosen accounting cutoff.
     - Replaced with a clean, streamlined secondary bar:
       - Contextual `Account Status` filter (All, Active, Approved, Released, Fully Paid, Past Due).
       - Contextual `Particulars / Ref Search` input.
       - Inherited filter status indicator confirming active synchronization with the universal header: `Branch: [Branch] · Period: [Period] · Member: [Member]`.
     - `activeDateScope` is automatically derived from the parent's period/dates: if a specific period or date range is active, it enforces `'period'`; if `all` is chosen, it provides `'all'`.

2. **Account Ledger Drilldown (`AccountLedgerReport.tsx`)**:
   - Added support for parent-injected filter props: `selectedMemberId`, `onSelectMember`, `startDate`, `endDate`, `selectedAccountId`, `onSelectAccount`, and `hideHeaderFilters`.
   - When `hideHeaderFilters={true}`:
     - **Suppressed the redundant 4-column filter card** (duplicate Member selector, duplicate From/To date picker, and duplicate Branch select).
     - Rendered a focused drilldown sub-toolbar:
       - Searchable GL Account switcher with full badges and categories.
       - Transaction Type / Source filter (`LOAN_RELEASE`, `LOAN_PAYMENT`, `SAVINGS`, `SHARE_CAPITAL`, `CASH_RECEIPT`, `DISBURSEMENT`, `JOURNAL_ENTRY`).
       - Memo/particulars search input.
       - Inherited synchronization indicator confirming linkage to the universal header.

---

## 3. Verification & Build Status

- `lint_applet` (`tsc --noEmit`): Passed with 0 errors.
- `compile_applet` (`npm run build`): Production build succeeded.
- Development server restarted cleanly.
