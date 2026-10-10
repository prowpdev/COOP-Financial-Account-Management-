# Advanced Transaction & Member Filtering for Member Reports and Account Reports

A comprehensive enhancement to the cooperative financial reporting system that introduces granular transaction-type filtering (loan disbursements, principal payments, interest, savings, and share capital) in the **Member Transaction Report**, member-specific subsidiary filtering in the **General Ledger Account Report**, dynamic balance recalculation, and synchronized exports.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions were clarified and confirmed during Phase 1:
>
> - **Confirmed Transaction Type Scope**: Filtering will provide granular operational types (e.g., Loan Releases, Principal Repayments, Interest Payments, Penalties, Savings Deposits, Withdrawals, Share Capital Contributions) in addition to category-level tabs.
> - **Confirmed Account Ledger Integration**: The General Ledger Account Report will include a searchable member selector alongside account and branch filters, linking subsidiary journal lines to members.
> - **Confirmed Balance & Export Behavior**: Running balances, debit/credit totals, and CSV/Print exports will dynamically recalculate and export only the active filtered dataset.

---

### 1. Overview & Core Concept

- **What It Does**:
  - In **Member Transaction Report**: Enables officers to isolate specific transaction types for a given member—such as viewing exclusively loan payments and interest without wading through savings deposits or capital share fees.
  - In **Account Ledger Report**: Enables accountants and auditors to filter any General Ledger account (such as *1210 Loans Receivable*, *2110 Savings Deposits*, or *4110 Interest Income on Loans*) down to transactions involving a specific member or transaction category.
- **Target Audience**: Cooperative loan officers, internal auditors, finance managers, and branch tellers conducting member statement audits and ledger reconciliation.
- **Key Value**: Drastically reduces audit time and dispute resolution by allowing instant extraction of member-specific transaction sub-ledgers.

---

### 2. User Experience & Visual Design

#### A. Member Transaction Report Enhancements
- **Multi-Level Filter Bar**:
  - **Member Search Bar**: Existing searchable member picker with member number and branch.
  - **Transaction Type Selector**: High-density dropdown with categorized options:
    - *All Transaction Types*
    - **Loan Facility**: Loan Release / Disbursement, Principal Amortization, Interest Payment, Loan Charges / Penalties.
    - **Savings & Deposits**: Regular Savings Deposit, Withdrawal, Interest Credited.
    - **Share Capital (CBU)**: Share Subscription Payment, Capital Withdrawal / Transfer.
    - **Journals & Adjustments**: Manual Journal Entries, Debit/Credit Memos.
  - **Quick Filter Chips**: Segmented one-click presets (`All`, `Loan Releases`, `Loan Payments`, `Savings`, `CBU`).
  - **Date Range Picker**: `From Date` and `To Date` inputs.
- **Dynamic KPI Summary Strip**:
  - Live metric counter displaying: *Filtered Entries Count*, *Total Debits*, *Total Credits*, and *Net Transaction Flow*.
- **Synchronized Data Table**:
  - Displays transaction type badge, reference voucher, source, particulars, debit, credit, and running balance.
  - Unmatched rows are cleanly excluded with a zero-state explanation if no rows match the filter combination.
- **Export Consistency**:
  - **CSV Export**: Exports only the filtered lines, appending active filter metadata in the document header.
  - **Print / PDF View**: Formats the printed statement with active filter criteria (e.g., `"Filter: Loan Repayments & Interest | Period: 2026-01-01 to 2026-10-10"`).

#### B. Account Ledger Report Enhancements
- **Member-Aware Ledger Filter Toolbar**:
  - **Account Selector**: Existing searchable chart of accounts dropdown.
  - **Member Filter Dropdown**: Searchable select allowing selection of *All Members* or a specific member (with member code and branch).
  - **Transaction Type / Source Filter**: Quick filter by source (`Loan`, `Payment`, `Savings`, `Capital`, `Manual JV`).
  - **Date Range**: `From Date` and `To Date`.
- **Member Column in Ledger Grid**:
  - Dedicated column or sub-line in *Particulars* identifying the member (`Name` + `Member No.`) associated with the subsidiary line.
- **Dynamic Running Balance**:
  - Opening balance and running ledger balance dynamically recalculate for the filtered member transactions.
- **Export & Print**:
  - Exports contain the selected member filter in the filename and header.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Client-Side vs Server-Side Filtering for Member Reports**
  - *Chosen Approach*: Implement smart client-side filtering on the fetched member transactions while maintaining API parameter support for date ranges and branch scoping.
  - *Why*: The member transaction endpoint already returns the member's complete chronological ledger; instant client-side filtering delivers zero-latency feedback without round-trip lag when toggling between "Loan Payments" and "All".
- **Decision 2: Subsidiary Member Resolution in Account Ledger**
  - *Chosen Approach*: Map journal lines to members using `line.subsidiary_id`, `line.member_id`, or metadata in `journal.reference_id` / `journal.description`.
  - *Why*: Accommodates both structured subsidiary lines and automated loan/savings disbursement journal entries.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        REPORT FILTERING ENGINE                         │
└────────────────────────────────────────────────────────────────────────┘
                                    │
           ┌────────────────────────┴────────────────────────┐
           ▼                                                 ▼
┌─────────────────────────────────────┐   ┌─────────────────────────────────────┐
│    MemberTransactionReport.tsx      │   │       AccountLedgerReport.tsx       │
├─────────────────────────────────────┤   ├─────────────────────────────────────┤
│ • Member Selector (SearchableSelect)│   │ • Account Selector                  │
│ • Transaction Type Filter (Granular)│   │ • Member Selector (SearchableSelect)│
│ • Date Range (From - To)            │   │ • Transaction Source / Type Filter  │
│ • Live KPI Re-calculation           │   │ • Dynamic Running Balance Calculator│
│ • Filtered CSV & Print Generator    │   │ • Member Column in Ledger Grid      │
└─────────────────────────────────────┘   └─────────────────────────────────────┘
                   │                                         │
                   ▼                                         ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     Synchronized Data Exports                          │
│        CSV Generator (Filtered Rows) · Print Statement View            │
└────────────────────────────────────────────────────────────────────────┘
```

#### Key Implementation Steps:
1. **Extend `MemberTransactionReport.tsx`**:
   - Add `selectedTransactionType` state and granular classification helper:
     - Distinguish `Loan Release`, `Loan Payment`, `Loan Interest`, `Savings Deposit`, `Savings Withdrawal`, `CBU Payment`, and `Journal Entry`.
   - Update `filteredTransactions` memo to evaluate `typeFilter`, `dateRange`, and `searchQuery`.
   - Update summary calculation to use filtered records.
   - Update `downloadCSV` and print formatters to export filtered data.
2. **Extend `AccountLedgerReport.tsx`**:
   - Add `selectedMemberId` and `selectedSourceType` states.
   - Integrate `SearchableSelect` for selecting members from the `members` list.
   - Enhance `sourceRows` to extract and link `member_id` / `memberName`.
   - Filter `sourceRows` by `selectedMemberId` and `selectedSourceType`.
   - Recalculate `openingBalance` and running balances strictly for the matched rows.
   - Add a Member column in the table and in the CSV export.
3. **Verify in `AccountingModule.tsx` and `MembersModule.tsx`**:
   - Ensure props (`members`, `branches`, `accounts`, `journals`) are passed cleanly to both report views.
4. **Compile and Verify**:
   - Run compilation and TypeScript checks to ensure zero regressions.
