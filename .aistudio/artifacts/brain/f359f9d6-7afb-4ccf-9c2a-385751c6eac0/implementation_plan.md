# Superadmin Role Governance & Branch Data Isolation Architecture Plan

A comprehensive plan to establish strict role-based access control for **Superadmin** (dedicated governance console, user/role management, branch/cooperative setup, and global audit oversight with complete operational process isolation) and enforce **multi-branch data scoping** across all database tables and operational workflows.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> Key architectural decisions regarding role governance and branch data scoping:
>
> - **Dual Foreign Key Architecture (`branch_id` + `user_id`)**: Main operational tables (members, loans, savings, CBU, journals, GL, cash transactions) will track both `branch_id` (for branch-level tenancy, segregation, and trial balance) and `user_id` / `created_by` (for operator-level auditability and CDA regulatory compliance).
> - **Strict Superadmin Boundary**: The `role_superadmin` role is strictly restricted to platform governance (User Management, User Roles, Cooperative Profile, Branches, and Audit Trail). Superadmin will have zero access to day-to-day cooperative business operations (loans, member deposits, teller drawers, journal vouchers, and financial reports).
> - **Single-Branch User Scoping**: Regular staff users belong to exactly 1 branch and 1 cooperative. All operational views, queries, and mutations are automatically locked and filtered by the logged-in user's `branch_id`.

---

### 1. Overview & Core Concept

- **What It Does**: 
  1. Enforces strict role boundary for **Superadmin**: superadmins only see and manage Users, Roles, Branches, Cooperatives, and the Audit Trail. All regular cooperative operational views are hidden and blocked.
  2. Embeds `branch_id` and `user_id` foreign keys into all main operational records in the database, ensuring strict relational integrity.
  3. Scopes all operational data (members, loans, savings accounts, share capital, journal vouchers, general ledger, and cash transactions) to the authenticated user's assigned `branch_id`.
  4. Delivers a dedicated **Superadmin Governance Module** with user status toggling (Active/Inactive), password modification, role assignment, branch management, cooperative details, and global audit verification.
- **Target Audience / Persona**:
  - **Super Administrator**: Platform owner responsible for onboarding staff, assigning security permissions, setting up branches, and auditing all operations.
  - **Branch Staff (Loan Officers, Tellers, Accountants, Branch Managers)**: Cooperative personnel who must only access and process records belonging to their specific home branch.
- **Key Value**: Guarantees multi-branch data isolation, prevents cross-branch operational leakage, and fulfills CDA statutory audit requirements.

---

### 2. User Experience & Visual Design

#### Key User Flows

1. **Superadmin Login & Governance Navigation**:
   - Superadmin logs in (`role_superadmin`).
   - The navigation sidebar dynamically strips all operational links (Loans, Savings, Share Capital, Accounting, Financial Reports, Workbench).
   - Only 3 navigation items appear: **Platform Governance** (SuperAdmin Console), **Audit Trail** (Global Audit Logs), and **My Profile**.
   - Attempting to access operational tabs via URL redirects immediately to the SuperAdmin Console.
2. **User Management & Role Governance**:
   - Superadmin navigates to the User Management sub-module.
   - Quick filters allow viewing users by branch, role, or active/inactive status.
   - Superadmin can toggle user status (`Active` <-> `Inactive`) with one click, modify user details (name, email, phone, role, branch assignment), and reset passwords.
   - In User Roles, superadmin can inspect and edit permission sets for each role (`role_admin`, `role_manager`, `role_accountant`, `role_loan_officer`, `role_teller`, `role_bod`).
3. **Branch & Cooperative Management**:
   - Superadmin can configure cooperative legal details (CDA registration, address, contact, tax ID).
   - Superadmin can add new branches or edit existing branch details (code, name, address, contact number, active status).
4. **Regular Staff Branch-Scoped Experience**:
   - Operational staff logs in (e.g. Loan Officer assigned to `branch_tar`).
   - The UI locks to their assigned branch (`branch_tar`). Cross-branch selector dropdowns in operational modules are hidden or disabled.
   - All records (Members, Loans, Savings Accounts, Journals, Ledger) display only records where `branch_id === currentUser.branch_id`.
   - New loans, members, or transactions automatically inherit `branch_id: currentUser.branch_id` and `user_id: currentUser.id`.

#### Visual Identity & Theme
- **Governance Console**: Enterprise dark/slate design (`bg-slate-900/95`, borders `border-slate-800`), consistent with the cooperative design system.
- **Status Indicators**: Unboxed typography with status dots (`text-emerald-400` for active, `text-rose-400` for inactive) adhering to zero-pill discipline.
- **Interactive Tabs**: Clean segmented controls for switching between Users, Roles, Branches, and Cooperative Profile.
- **Data Tables**: High-density tables with clear typographic hierarchy, search filter bars, and contextual actions.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Foreign Key Structure on Main Operational Tables**
  - *Chosen Approach*: Add and enforce both `branch_id` and `user_id` / `created_by` on all core database records.
  - *Why*: In Philippine cooperative accounting, transactions require both branch segregation (for branch financial condition reports and regulatory compliance) and operator attribution (for teller balancing and audit trails). 
  - *Alternatives Considered*: Storing only `branch_id` would lose operator traceability; storing only `user_id` would require expensive multi-hop joins to resolve branch ownership.
- **Decision 2: Strict Superadmin Operational Segregation**
  - *Chosen Approach*: Completely hide and guard operational modules for `role_superadmin`. Superadmin can only access governance and audit logs.
  - *Why*: Separation of duties is a core internal control principle; platform administrators must not originate loans or post cash transactions.
  - *Alternatives Considered*: Allowing superadmin to view operational data in read-only mode was rejected to maintain the strict boundary requested by the user.
- **Decision 3: Backend & Frontend Defense-in-Depth for Branch Isolation**
  - *Chosen Approach*: Enforce branch filtering on both the client (UI branch locking) and the server (`server/routes/api.ts` filters queries by `branch_id` and rejects cross-branch access).
  - *Why*: Prevents API-level data exposure even if a client-side filter is bypassed.

---

### 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          AUTHENTICATION & ROLE ROUTER                            │
└─────────────────────────────────────────────────────────────────────────────────┘
                                         │
                  ┌──────────────────────┴──────────────────────┐
                  ▼                                             ▼
       ┌──────────────────────┐                     ┌──────────────────────┐
       │   role_superadmin    │                     │  Operational Roles   │
       │  (Platform Owner)    │                     │  (Officer/Cashier)   │
       └──────────────────────┘                     └──────────────────────┘
                  │                                             │
      Restricted to Governance                      Scoped to currentUser.branch_id
                  │                                             │
   ┌──────────────┴──────────────┐               ┌──────────────┴──────────────┐
   ▼                             ▼               ▼                             ▼
┌─────────────────────────┐ ┌──────────────┐  ┌─────────────────────────┐ ┌──────────────┐
│  SuperAdmin Console     │ │  Audit Logs  │  │  Operational Modules    │ │ Sub-Ledgers  │
│  • User Management      │ │  (All Events │  │  • Members (branch-only)│ │ • Cash Vault │
│  • Role Permissions     │ │   & Branches)│  │  • Loans (branch-only)  │ │ • Teller COH │
│  • Branches (CRUD)      │ └──────────────┘  │  • Savings (branch-only)│ │ • GL/Journals│
│  • Cooperative Profile  │                   │  • CBU (branch-only)    │ └──────────────┘
└─────────────────────────┘                   └─────────────────────────┘
                                                           │
                                                           ▼
                                         ┌───────────────────────────────────┐
                                         │        SERVER API ROUTING         │
                                         ├───────────────────────────────────┤
                                         │ • req.query.branch_id enforcement │
                                         │ • Stamp branch_id & created_by    │
                                         │ • Return filtered entity arrays   │
                                         └───────────────────────────────────┘
```

#### Entity Relational Mapping & Foreign Keys

| Entity Table | Primary Key | Foreign Key 1 (`branch_id`) | Foreign Key 2 (`user_id` / `created_by`) | Scope Enforced |
|---|---|---|---|---|
| `users` | `id` | `branch_id` | N/A | Superadmin manages; user belongs to 1 branch |
| `members` | `id` | `branch_id` | `created_by` | Filtered by user's `branch_id` |
| `loans` | `id` | `branch_id` | `created_by` / `approved_by` | Filtered by user's `branch_id` |
| `loan_applications`| `id` | `branch_id` | `submitted_by` | Filtered by user's `branch_id` |
| `loan_payments` | `id` | `branch_id` | `received_by` | Filtered by user's `branch_id` |
| `savings_accounts` | `id` | `branch_id` | `created_by` | Filtered by user's `branch_id` |
| `savings_transactions`| `id` | `branch_id` | `teller_id` / `user_id` | Filtered by user's `branch_id` |
| `share_capital_accounts`| `id` | `branch_id` | `created_by` | Filtered by user's `branch_id` |
| `share_capital_transactions`| `id` | `branch_id` | `posted_by` | Filtered by user's `branch_id` |
| `journal_entries` | `id` | `branch_id` | `created_by` | Filtered by user's `branch_id` |
| `journal_lines` | `id` | `branch_id` | `created_by` | Filtered by user's `branch_id` |
| `cash_accounts` | `id` | `branch_id` | `assigned_user_id` | Filtered by user's `branch_id` |
| `cash_transactions`| `id` | `branch_id` | `user_id` | Filtered by user's `branch_id` |
| `user_documents` | `id` | `branch_id` | `user_id` | Filtered by user's `branch_id` |
| `audit_logs` | `id` | `branch_id` | `user_id` | Global for Superadmin, filtered for branch |

---

### 5. Implementation Steps

#### Step 1: Database Migration & Schema Verification (`server/db/branchMigration.ts` & `database.ts`)
- Verify and enforce `branch_id` and `user_id` on all existing and new records across all tables.
- Ensure `role_superadmin` exists in `user_roles` with platform governance permissions.
- Ensure at least one default superadmin user account exists (`superadmin`).
- Ensure all users have `branch_id` and `cooperative_id` fields properly populated.

#### Step 2: Backend API Routes Scoping & Protection (`server/routes/api.ts`)
- Update `GET /members`, `GET /loans`, `GET /savings-accounts`, `GET /share-capital-accounts`, `GET /journal-entries`, `GET /general-ledger`, `GET /cash-accounts`, and `GET /dashboard/stats` to filter strictly by `branch_id` when supplied via query param or user context.
- Update creation endpoints (`POST /members`, `POST /loans`, `POST /savings-accounts`, `POST /journal-entries`, `POST /cash-transactions`) to automatically inject `branch_id` and `user_id` / `created_by`.
- Ensure Superadmin endpoints (`/users`, `/user-roles`, `/branches`, `/cooperative`, `/audit-logs`) provide complete CRUD and audit access.

#### Step 3: SuperAdmin Governance Module (`src/components/admin/SuperAdminConsole.tsx`)
- Enhance the dedicated module with clean tabbed navigation:
  - **User Management**: View, search, filter by branch/role/status, create user, edit user details (role, branch, email, phone, name), quick toggle Active/Inactive status, and password reset.
  - **User Roles**: View all system roles, inspect permissions, edit role description and permission checklist.
  - **Branches**: View all branches, create new branch, edit branch details (code, name, address, contact, active status).
  - **Cooperative Profile**: Manage cooperative legal identity, CDA registration, address, and tax information.
  - **Audit Trail Link**: Direct access to view and filter system-wide transaction and configuration audit logs.

#### Step 4: Frontend Navigation & Route Guards (`src/components/Sidebar.tsx` & `src/App.tsx`)
- In `Sidebar.tsx`:
  - When `currentUser.role_id === 'role_superadmin'`, render ONLY SuperAdmin Console, Audit Logs, and User Profile.
  - When regular operational user is logged in, hide SuperAdmin Console completely.
- In `App.tsx`:
  - Enforce tab guard: If `isSuperAdmin`, redirect any unauthorized tab to `superadmin_console`.
  - For regular operational users, lock `selectedBranchId` to `currentUser.branch_id` and pass `selectedBranchId` to all API queries.

---

### 6. Verification Checklist

- [ ] `compile_applet` succeeds with 0 TypeScript/build errors.
- [ ] `lint_applet` passes without errors.
- [ ] Logging in as `superadmin` restricts sidebar navigation strictly to SuperAdmin Console, Audit Logs, and User Profile.
- [ ] In SuperAdmin Console, user status toggle switches between Active and Deactivated immediately with live feedback.
- [ ] SuperAdmin can edit user roles, branch assignments, passwords, and create new users and branches.
- [ ] Logging in as an operational user (e.g. Loan Officer at Tarlac Branch) scopes members, loans, savings, and ledger records strictly to `branch_tar`.
- [ ] Operational records created by the user automatically store `branch_id` and `user_id`.
- [ ] Audit logs record all actions with `branch_id` and operator details.
