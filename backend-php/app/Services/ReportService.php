<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\BranchScope;
use PDO;

class ReportService
{
    public function __construct(private PDO $db) {}

    /**
     * Compute Real-time CDA-compliant Trial Balance
     */

    /**
     * Compute real-time CDA-oriented Trial Balance and
     * financial statement totals from posted General Ledger entries.
     *
     * @param string|null $asOfDate Reporting date (Y-m-d)
     * @param string|null $branchId Optional branch filter
     *
     * @return array
     */
    public function getTrialBalance(
        ?string $asOfDate = null,
        ?string $branchId = null
    ): array {
        $asOfDate = $asOfDate ?? date('Y-m-d');

        /*
     * Get all Chart of Accounts.
     */
        $coaSql = "
        SELECT
            id,
            account_code,
            name,
            category,
            normal_balance
        FROM chart_of_accounts
        ORDER BY account_code ASC
    ";

        $coaStmt = $this->db->prepare($coaSql);
        $coaStmt->execute();

        $accounts = $coaStmt->fetchAll(PDO::FETCH_ASSOC);

        /*
     * Get posted journal lines up to the reporting date.
     * Optionally filter by branch.
     */
        $sql = "
        SELECT
            jl.account_id,
            COALESCE(SUM(jl.debit), 0) AS total_debit,
            COALESCE(SUM(jl.credit), 0) AS total_credit
        FROM journal_lines jl
        INNER JOIN journal_entries je
            ON je.id = jl.journal_entry_id
        WHERE je.status = 'Posted'
          AND je.posting_date <= :as_of_date
    ";

        $params = [
            'as_of_date' => $asOfDate,
        ];

        BranchScope::appendCondition(
            $sql,
            $params,
            'je.branch_id',
            $branchId
        );

        $sql .= "
        GROUP BY jl.account_id
    ";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        $journalBalances = $stmt->fetchAll(PDO::FETCH_ASSOC);

        /*
     * Build account balance lookup.
     */
        $balanceMap = [];

        foreach ($journalBalances as $row) {
            $accountId = (string) $row['account_id'];

            $balanceMap[$accountId] = [
                'debit' => (float) $row['total_debit'],
                'credit' => (float) $row['total_credit'],
            ];
        }

        /*
     * Build Trial Balance.
     */
        $balances = [];

        foreach ($accounts as $account) {
            $accountId = (string) $account['id'];

            $totalAccountDebit =
                $balanceMap[$accountId]['debit'] ?? 0.0;

            $totalAccountCredit =
                $balanceMap[$accountId]['credit'] ?? 0.0;

            // Skip accounts without GL activity.
            if (
                abs($totalAccountDebit) < 0.000001 &&
                abs($totalAccountCredit) < 0.000001
            ) {
                continue;
            }

            $normalBalance = $account['normal_balance'] ?? 'Debit';

            $netDebit = 0.0;
            $netCredit = 0.0;

            /*
         * Calculate net Trial Balance amount based on
         * the account's normal balance.
         */
            if ($normalBalance === 'Debit') {
                $net = $totalAccountDebit - $totalAccountCredit;

                if ($net >= 0) {
                    $netDebit = $net;
                } else {
                    $netCredit = abs($net);
                }
            } else {
                $net = $totalAccountCredit - $totalAccountDebit;

                if ($net >= 0) {
                    $netCredit = $net;
                } else {
                    $netDebit = abs($net);
                }
            }

            $balances[] = [
                'id' => $accountId,
                'code' => $account['account_code'] ?? '',
                'name' => $account['name'] ?? '',
                'type' => $account['category'] ?? 'Asset',
                'category' => $account['category'] ?? 'Asset',
                'normal_balance' => $normalBalance,

                // Net Trial Balance balances.
                'debit' => round($netDebit, 2),
                'credit' => round($netCredit, 2),

                // Original GL movements.
                'gross_debit' => round($totalAccountDebit, 2),
                'gross_credit' => round($totalAccountCredit, 2),
            ];
        }

        /*
     * Sort accounts by account code.
     */
        usort(
            $balances,
            function (array $a, array $b): int {
                return strnatcasecmp(
                    (string) $a['code'],
                    (string) $b['code']
                );
            }
        );

        /*
     * Calculate Trial Balance totals.
     */
        $totalDebit = 0.0;
        $totalCredit = 0.0;

        foreach ($balances as $balance) {
            $totalDebit += (float) $balance['debit'];
            $totalCredit += (float) $balance['credit'];
        }

        $totalDebit = round($totalDebit, 2);
        $totalCredit = round($totalCredit, 2);

        $variance = round($totalDebit - $totalCredit, 2);
        $isBalanced = abs($variance) < 0.01;

        /*
     * Build financial statement data.
     */
        $assets = [];
        $liabilities = [];
        $equity = [];

        $totalAssets = 0.0;
        $totalLiabilities = 0.0;
        $totalEquityAccounts = 0.0;
        $totalRevenue = 0.0;
        $totalExpenses = 0.0;

        foreach ($balances as $balance) {
            $code = trim((string) $balance['code']);
            $category = strtolower(
                trim((string) $balance['category'])
            );

            $debit = (float) $balance['debit'];
            $credit = (float) $balance['credit'];

            /*
         * Determine account type.
         *
         * Prefer the chart-of-accounts category.
         * Use the account code prefix as a fallback.
         */
            if (
                str_contains($category, 'asset')
            ) {
                $group = 'Asset';
            } elseif (
                str_contains($category, 'liabil')
            ) {
                $group = 'Liability';
            } elseif (
                str_contains($category, 'equit')
            ) {
                $group = 'Equity';
            } elseif (
                str_contains($category, 'revenue') ||
                str_contains($category, 'income')
            ) {
                $group = 'Revenue';
            } elseif (
                str_contains($category, 'expense') ||
                str_contains($category, 'cost')
            ) {
                $group = 'Expense';
            } else {
                $group = match (substr($code, 0, 1)) {
                    '1' => 'Asset',
                    '2' => 'Liability',
                    '3' => 'Equity',
                    '4' => 'Revenue',
                    '5', '6', '7', '8', '9' => 'Expense',
                    default => 'Other',
                };
            }

            $row = $balance;

            switch ($group) {
                case 'Asset':
                    // Debit-normal account balance.
                    $amount = round($debit - $credit, 2);

                    if (abs($amount) >= 0.005) {
                        $row['amount'] = $amount;

                        $row['report_group'] =
                            str_starts_with($code, '11')
                            ? 'Current Assets'
                            : 'Non-Current Assets';

                        $assets[] = $row;
                        $totalAssets += $amount;
                    }
                    break;

                case 'Liability':
                    // Credit-normal account balance.
                    $amount = round($credit - $debit, 2);

                    if (abs($amount) >= 0.005) {
                        $row['amount'] = $amount;

                        $row['report_group'] =
                            str_starts_with($code, '21')
                            ? 'Current Liabilities'
                            : 'Non-Current Liabilities';

                        $liabilities[] = $row;
                        $totalLiabilities += $amount;
                    }
                    break;

                case 'Equity':
                    // Credit-normal account balance.
                    $amount = round($credit - $debit, 2);

                    if (abs($amount) >= 0.005) {
                        $row['amount'] = $amount;

                        $row['report_group'] = match (substr($code, 0, 2)) {
                            '31' => 'Share Capital',
                            '32' => 'Reserves',
                            '39' => 'Equity Surplus',
                            default => 'Other Equity',
                        };

                        $equity[] = $row;
                        $totalEquityAccounts += $amount;
                    }
                    break;

                case 'Revenue':
                    // Revenue normally has a credit balance.
                    $totalRevenue += $credit - $debit;
                    break;

                case 'Expense':
                    // Expenses normally have a debit balance.
                    $totalExpenses += $debit - $credit;
                    break;
            }
        }

        /*
     * Calculate current-period surplus or deficit.
     *
     * IMPORTANT:
     * These revenue and expense totals are cumulative from
     * the available posted journal entries through $asOfDate.
     * For a true current-period report, apply the fiscal-period
     * start date to the revenue and expense query.
     */
        $totalAssets = round($totalAssets, 2);
        $totalLiabilities = round($totalLiabilities, 2);
        $totalEquityAccounts = round($totalEquityAccounts, 2);
        $totalRevenue = round($totalRevenue, 2);
        $totalExpenses = round($totalExpenses, 2);

        $netSurplus = round(
            $totalRevenue - $totalExpenses,
            2
        );

        /*
     * Total equity includes the current surplus or deficit.
     */
        $totalEquity = round(
            $totalEquityAccounts + $netSurplus,
            2
        );

        /*
     * Validate the accounting equation:
     * Assets = Liabilities + Equity.
     */
        $balanceSheetDifference = round(
            $totalAssets - $totalLiabilities - $totalEquity,
            2
        );

        $balanceSheetBalanced =
            abs($balanceSheetDifference) < 0.01;

        /*
     * Return Trial Balance and financial statement fields.
     */
        return [
            // Trial Balance
            'balances' => $balances,
            'accounts' => $balances,
            'total_debit' => $totalDebit,
            'total_credit' => $totalCredit,
            'variance' => $variance,
            'difference' => $variance,
            'is_balanced' => $isBalanced,

            // Statement of Financial Condition
            'assets' => $assets,
            'liabilities' => $liabilities,
            'equity' => $equity,

            'total_assets' => $totalAssets,
            'total_liabilities' => $totalLiabilities,
            'total_equity' => $totalEquity,

            // Statement of Operations
            'total_revenue' => $totalRevenue,
            'total_expenses' => $totalExpenses,
            'net_surplus' => $netSurplus,

            // Balance sheet validation
            'balance_sheet_difference' => $balanceSheetDifference,
            'balance_sheet_balanced' => $balanceSheetBalanced,
        ];
    }

    /**
     * Format the trial balance data for reporting purposes
     */
    private function formatTrialBalanceResponse(array $data): array
    {
        $totalDebit = (float) ($data['total_debit'] ?? 0);
        $totalCredit = (float) ($data['total_credit'] ?? 0);

        $variance = array_key_exists('variance', $data)
            ? (float) $data['variance']
            : round($totalDebit - $totalCredit, 2);

        $difference = array_key_exists('difference', $data)
            ? (float) $data['difference']
            : round($totalDebit - $totalCredit, 2);

        return [
            'as_of_date' => $data['as_of_date'] ?? null,

            // Frontend expects balances
            'balances' => $data['accounts'] ?? [],

            // Keep accounts for backward compatibility
            'accounts' => $data['accounts'] ?? [],

            'total_debit' => round($totalDebit, 2),

            'total_credit' => round($totalCredit, 2),

            'variance' => round($variance, 2),

            'difference' => round($difference, 2),

            'is_balanced' => $data['is_balanced']
                ?? (abs($totalDebit - $totalCredit) < 0.01),
        ];
    }

    /**
     * Compute Financial Statements
     * Compatible with TypeScript getFinancialReport()
     */
    public function getFinancialStatements(
        ?string $asOfDate = null,
        ?string $branchId = null
    ): array {
        $tb = $this->getTrialBalance($asOfDate, $branchId);

        $assets = [];
        $liabilities = [];
        $equity = [];
        $revenue = [];
        $expense = [];

        $totalAssets = 0.0;
        $totalLiabilities = 0.0;
        $totalEquity = 0.0;
        $totalRevenue = 0.0;
        $totalExpense = 0.0;

        foreach ($tb['accounts'] as $acc) {
            $cat = $acc['category'];
            $bal = (float) $acc['net_balance'];

            switch ($cat) {
                case 'Asset':
                    $assets[] = $acc;
                    $totalAssets += $bal;
                    break;

                case 'Liability':
                    $liabilities[] = $acc;
                    $totalLiabilities += $bal;
                    break;

                case 'Equity':
                    $equity[] = $acc;
                    $totalEquity += $bal;
                    break;

                case 'Revenue':
                    $revenue[] = $acc;
                    $totalRevenue += $bal;
                    break;

                case 'Expense':
                    $expense[] = $acc;
                    $totalExpense += $bal;
                    break;
            }
        }

        $netSurplus = $totalRevenue - $totalExpense;

        $totalLiabilitiesAndEquity =
            $totalLiabilities + $totalEquity + $netSurplus;

        return [
            'as_of_date' => $asOfDate ?? date('Y-m-d'),

            // Matches TypeScript: res.data.statement_of_financial_position
            'statement_of_financial_position' => [
                'categories' => [
                    [
                        'category' => 'Asset',
                        'accounts' => $assets
                    ],
                    [
                        'category' => 'Liability',
                        'accounts' => $liabilities
                    ],
                    [
                        'category' => 'Equity',
                        'accounts' => $equity
                    ]
                ],

                'total_assets' => round($totalAssets, 2),

                'total_liabilities' => round($totalLiabilities, 2),

                'total_equity' => round($totalEquity, 2),

                'net_surplus' => round($netSurplus, 2),

                'total_liabilities_and_equity' =>
                round($totalLiabilitiesAndEquity, 2),

                'balanced' => abs(
                    $totalAssets - $totalLiabilitiesAndEquity
                ) < 0.01
            ],

            // Matches TypeScript: res.data.statement_of_operations
            'statement_of_operations' => [
                'categories' => [
                    [
                        'category' => 'Income',
                        'accounts' => $revenue
                    ],
                    [
                        'category' => 'Expenses',
                        'accounts' => $expense
                    ]
                ],

                'revenue' => $revenue,

                'total_income' => round($totalRevenue, 2),

                'expenses' => $expense,

                'total_expenses' => round($totalExpense, 2),

                'net_surplus' => round($netSurplus, 2)
            ]
        ];
    }




    /**
     * Dashboard operational & portfolio statistics
     * Matches the TypeScript /dashboard/stats response.
     */
    public function getDashboardStats(): array
    {
        // Get branch filter from query string
        $branchId = BranchScope::currentBranchId();

        // Build the branch filter
        $branchFilter = '';
        $params = [];

        if ($branchId !== null) {
            $branchFilter = ' AND branch_id = :branch_id';
            $params[':branch_id'] = $branchId;
        }

        // Helper function for executing aggregate queries
        $query = function (string $sql) use ($branchFilter, $params) {
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchColumn();
        };

        // Members
        $totalMembers = (int)$query(
            "SELECT COUNT(*) FROM members
         WHERE 1=1 $branchFilter"
        );

        // Loans
        $loansActive = (int)$query(
            "SELECT COUNT(*) FROM loans
         WHERE status = 'Active' $branchFilter"
        );

        $loanPortfolio = (float)$query(
            "SELECT COALESCE(SUM(current_balance), 0)
         FROM loans
         WHERE status = 'Active' $branchFilter"
        );

        // Savings
        $savingsTotal = (float)$query(
            "SELECT COALESCE(SUM(balance), 0)
         FROM savings_accounts
         WHERE 1=1 $branchFilter"
        );

        // Share Capital
        // Filter by branch through the member's branch_id,
        // matching the TypeScript implementation.
        if ($branchId !== null) {
            $shareCapitalParams = [':branch_id' => $branchId];

            $stmt = $this->db->prepare(
                "SELECT COALESCE(SUM(sc.paid_up_amount), 0)
             FROM share_capital_accounts sc
             INNER JOIN members m ON m.id = sc.member_id
             WHERE m.branch_id = :branch_id"
            );

            $stmt->execute($shareCapitalParams);
            $shareCapitalTotal = (float)$stmt->fetchColumn();
        } else {
            $shareCapitalTotal = (float)$query(
                "SELECT COALESCE(SUM(paid_up_amount), 0)
             FROM share_capital_accounts
             WHERE 1=1"
            );
        }

        // Cash and Bank Accounts
        $cashVaultTotal = (float)$query(
            "SELECT COALESCE(SUM(current_balance), 0)
         FROM cash_accounts
         WHERE 1=1 $branchFilter"
        );

        // Total interest collected from all loans
        // (Not limited to active loans, matching TypeScript.)
        $interestIncomeEarned = (float)$query(
            "SELECT COALESCE(SUM(total_interest_paid), 0)
         FROM loans
         WHERE 1=1 $branchFilter"
        );

        // Total journal vouchers
        $totalJournalVouchers = (int)$query(
            "SELECT COUNT(*) FROM journal_entries
         WHERE 1=1 $branchFilter"
        );

        return [
            'total_members'           => $totalMembers,
            'active_loans_count'      => $loansActive,
        return [
            'total_members'           => $totalMembers,
            'active_loans_count'      => $loansActive,
            'outstanding_portfolio'   => round($loanPortfolio, 2),
            'total_savings_deposits'  => round($savingsTotal, 2),
            'total_share_capital'     => round($shareCapitalTotal, 2),
            'total_cash_and_bank'     => round($cashVaultTotal, 2),
            'total_interest_collected' => round($interestIncomeEarned, 2),
            'total_journal_vouchers'  => $totalJournalVouchers,
        ];
    }

    /**
     * Get accounting periods list
     */
    public function getAccountingPeriods(?string $fiscalYear = null): array
    {
        $sql = "SELECT * FROM accounting_periods WHERE 1=1";
        $params = [];
        if (!empty($fiscalYear)) {
            $sql .= " AND fiscal_year = :fiscal_year";
            $params['fiscal_year'] = $fiscalYear;
        }
        $sql .= " ORDER BY fiscal_year DESC, period_number DESC, start_date DESC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // generate report base on the period id
    public function getJournalEntries(?string $periodId = null, ?string $branchId = null): array 
    {
        $sql = "
            SELECT
                je.id,
                je.voucher_number,
                je.branch_id,
                je.posting_date,
                je.reference_type,
                je.description,
                je.total_debit,
                je.total_credit,
                je.period_id,
                je.status,
                je.created_by,
                je.posted_at,
                ap.name AS period_name,
                ap.fiscal_year,
                ap.period_number,
                ap.start_date AS period_start_date,
                ap.end_date AS period_end_date
            FROM journal_entries je
            INNER JOIN accounting_periods ap
                ON ap.id = je.period_id
            WHERE 1 = 1
        ";

        $params = [];

        if (!empty($periodId)) {
            $sql .= " AND je.period_id = :period_id";
            $params['period_id'] = $periodId;
        }

        if (!empty($branchId)) {
            $sql .= " AND je.branch_id = :branch_id";
            $params['branch_id'] = $branchId;
        }

        $sql .= "
            ORDER BY
                ap.fiscal_year DESC,
                ap.period_number DESC,
                je.posting_date DESC,
                je.posted_at DESC
        ";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get comprehensive Journal Entries & GL Lines report filtered by period, branch, member, and GL accounts
     */
    public function getJournalEntriesReport(
        ?string $periodId = null,
        ?string $branchId = null,
        ?string $memberId = null,
        ?string $startDate = null,
        ?string $endDate = null,
        ?array $glAccounts = null
    ): array {
        $period = null;
        if (!empty($periodId) && $periodId !== 'all') {
            $periodStmt = $this->db->prepare("SELECT * FROM accounting_periods WHERE id = :id LIMIT 1");
            $periodStmt->execute(['id' => $periodId]);
            $period = $periodStmt->fetch(PDO::FETCH_ASSOC) ?: null;
        }

        $effectiveStart = $startDate ?: ($period['start_date'] ?? null);
        $effectiveEnd = $endDate ?: ($period['end_date'] ?? null);

        $sql = "
            SELECT
                jl.id,
                jl.journal_entry_id,
                je.voucher_number,
                COALESCE(je.reference_type, 'JV') AS voucher_type,
                je.posting_date,
                je.description,
                je.reference_type,
                je.reference_id,
                je.status,
                je.created_by,
                jl.account_id,
                coa.account_code,
                coa.name AS account_name,
                coa.category AS account_category,
                coa.normal_balance,
                jl.debit,
                jl.credit,
                jl.subsidiary_type,
                jl.subsidiary_id,
                m.member_no AS member_number,
                CONCAT(m.first_name, ' ', m.last_name) AS member_name,
                je.branch_id,
                COALESCE(b.name, 'Main Branch') AS branch_name
            FROM journal_lines jl
            INNER JOIN journal_entries je ON je.id = jl.journal_entry_id
            INNER JOIN chart_of_accounts coa ON coa.id = jl.account_id
            LEFT JOIN members m ON m.id = jl.subsidiary_id
            LEFT JOIN branches b ON b.id = je.branch_id
            WHERE 1 = 1
        ";

        $params = [];

        if (!empty($branchId) && $branchId !== 'all') {
            $sql .= " AND je.branch_id = :branch_id";
            $params['branch_id'] = $branchId;
        }

        if (!empty($periodId) && !empty($period)) {
            $sql .= " AND je.period_id = :period_id";
            $params['period_id'] = $periodId;
        } elseif (!empty($effectiveStart) && !empty($effectiveEnd)) {
            $sql .= " AND je.posting_date >= :start_date AND je.posting_date <= :end_date";
            $params['start_date'] = $effectiveStart;
            $params['end_date'] = $effectiveEnd;
        }

        if (!empty($memberId) && $memberId !== 'all') {
            $sql .= " AND jl.subsidiary_id = :member_id";
            $params['member_id'] = $memberId;
        }

        if (!empty($glAccounts) && count($glAccounts) > 0) {
            $glClauses = [];
            foreach ($glAccounts as $idx => $code) {
                $pName = "gl_" . $idx;
                $glClauses[] = "(coa.account_code = :{$pName} OR jl.account_id = :{$pName})";
                $params[$pName] = trim((string)$code);
            }
            $sql .= " AND (" . implode(" OR ", $glClauses) . ")";
        }

        $sql .= " ORDER BY je.posting_date ASC, je.id ASC, jl.id ASC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $rawLines = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $runningBalance = 0.0;
        $totalDebit = 0.0;
        $totalCredit = 0.0;
        $lines = [];

        foreach ($rawLines as $line) {
            $debit = (float)($line['debit'] ?? 0);
            $credit = (float)($line['credit'] ?? 0);
            $runningBalance += ($debit - $credit);
            $totalDebit += $debit;
            $totalCredit += $credit;

            $lines[] = [
                'id' => $line['id'],
                'journal_entry_id' => $line['journal_entry_id'],
                'voucher_number' => $line['voucher_number'] ?: $line['journal_entry_id'],
                'voucher_type' => $line['voucher_type'] ?: 'JV',
                'posting_date' => $line['posting_date'] ?? '',
                'description' => $line['description'] ?? '',
                'reference_type' => $line['reference_type'] ?? '',
                'reference_id' => $line['reference_id'] ?? '',
                'status' => $line['status'] ?? 'Posted',
                'created_by' => $line['created_by'] ?? '',
                'account_id' => $line['account_id'],
                'account_code' => $line['account_code'] ?: $line['account_id'],
                'account_name' => $line['account_name'] ?: 'General Ledger Account',
                'account_category' => $line['account_category'] ?: 'Other',
                'normal_balance' => $line['normal_balance'] ?: 'Debit',
                'debit' => round($debit, 2),
                'credit' => round($credit, 2),
                'net_change' => round($debit - $credit, 2),
                'running_balance' => round($runningBalance, 2),
                'subsidiary_type' => $line['subsidiary_type'],
                'subsidiary_id' => $line['subsidiary_id'],
                'member_name' => $line['member_name'] ? trim($line['member_name']) : null,
                'member_number' => $line['member_number'] ?: null,
                'branch_id' => $line['branch_id'] ?: 'branch_tar',
                'branch_name' => $line['branch_name'] ?: 'Main Branch'
            ];
        }

        return [
            'period' => $period ?: ($effectiveStart ? [
                'name' => "{$effectiveStart} to {$effectiveEnd}",
                'start_date' => $effectiveStart,
                'end_date' => $effectiveEnd
            ] : null),
            'count' => count($lines),
            'total_debit' => round($totalDebit, 2),
            'total_credit' => round($totalCredit, 2),
            'net_balance' => round($totalDebit - $totalCredit, 2),
            'lines' => $lines
        ];
    }

    /**
     * Get member transactions report (Savings, Share Capital CBU, Loan payments)
     * filtered by period, branch, member, and GL accounts
     */
    public function getMemberTransactionsReport(
        ?string $periodId = null,
        ?string $branchId = null,
        ?string $memberId = null,
        ?string $startDate = null,
        ?string $endDate = null,
        ?array $glAccounts = null
    ): array {
        $period = null;
        if (!empty($periodId) && $periodId !== 'all') {
            $periodStmt = $this->db->prepare("SELECT * FROM accounting_periods WHERE id = :id LIMIT 1");
            $periodStmt->execute(['id' => $periodId]);
            $period = $periodStmt->fetch(PDO::FETCH_ASSOC) ?: null;
        }

        $effectiveStart = $startDate ?: ($period['start_date'] ?? null);
        $effectiveEnd = $endDate ?: ($period['end_date'] ?? null);

        $coaStmt = $this->db->query("SELECT id, account_code, name FROM chart_of_accounts");
        $coaRows = $coaStmt ? $coaStmt->fetchAll(PDO::FETCH_ASSOC) : [];
        $coaMap = [];
        foreach ($coaRows as $c) {
            $code = $c['account_code'] ?: $c['id'];
            $coaMap[$code] = $c['name'];
            $coaMap[$c['id']] = $c['name'];
        }

        $savingsGlCode = '2110';
        $savingsGlName = $coaMap['2110'] ?? 'Savings Deposits Payable';

        $cbuGlCode = '3110';
        $cbuGlName = $coaMap['3110'] ?? 'Paid-Up Share Capital';

        $loanGlCode = '1210';
        $loanGlName = $coaMap['1210'] ?? 'Loans Receivable';

        $results = [];

        // 1. Savings Transactions
        $sqlSavings = "
            SELECT
                st.id,
                st.transaction_no,
                st.savings_account_id,
                st.member_id,
                st.type,
                st.amount,
                st.balance_after,
                st.transaction_date,
                st.notes,
                m.member_no,
                m.first_name,
                m.last_name,
                m.branch_id,
                COALESCE(b.name, 'Main Branch') AS branch_name
            FROM savings_transactions st
            INNER JOIN members m ON m.id = st.member_id
            LEFT JOIN branches b ON b.id = m.branch_id
            WHERE 1 = 1
        ";
        $savParams = [];
        if (!empty($branchId) && $branchId !== 'all') {
            $sqlSavings .= " AND m.branch_id = :branch_id";
            $savParams['branch_id'] = $branchId;
        }
        if (!empty($memberId) && $memberId !== 'all') {
            $sqlSavings .= " AND st.member_id = :member_id";
            $savParams['member_id'] = $memberId;
        }
        if (!empty($effectiveStart) && !empty($effectiveEnd)) {
            $sqlSavings .= " AND st.transaction_date >= :start_date AND st.transaction_date <= :end_date";
            $savParams['start_date'] = $effectiveStart;
            $savParams['end_date'] = $effectiveEnd;
        }

        $stmtSavings = $this->db->prepare($sqlSavings);
        $stmtSavings->execute($savParams);
        $savRows = $stmtSavings->fetchAll(PDO::FETCH_ASSOC);

        foreach ($savRows as $st) {
            $isDeposit = str_contains(strtolower((string)$st['type']), 'deposit');
            $amt = (float)($st['amount'] ?? 0);
            $results[] = [
                'id' => $st['id'],
                'date' => substr((string)$st['transaction_date'], 0, 10),
                'member_id' => $st['member_id'],
                'member_no' => $st['member_no'] ?: 'MEM-N/A',
                'member_name' => trim(($st['first_name'] ?? '') . ' ' . ($st['last_name'] ?? '')) ?: 'Unknown Member',
                'product_type' => 'Savings Deposit',
                'account_number' => $st['savings_account_id'],
                'reference_no' => $st['transaction_no'] ?: $st['id'],
                'description' => $st['notes'] ?: "Savings {$st['type']}",
                'transaction_type' => $st['type'],
                'debit' => !$isDeposit ? round($amt, 2) : 0.0,
                'credit' => $isDeposit ? round($amt, 2) : 0.0,
                'balance_after' => round((float)($st['balance_after'] ?? 0), 2),
                'gl_code' => $savingsGlCode,
                'gl_name' => $savingsGlName,
                'branch_id' => $st['branch_id'] ?: 'branch_tar',
                'branch_name' => $st['branch_name'] ?: 'Main Branch'
            ];
        }

        // 2. Share Capital (CBU) Transactions
        $sqlCbu = "
            SELECT
                sct.id,
                sct.receipt_no,
                sct.share_account_id,
                sct.member_id,
                sct.type,
                sct.shares,
                sct.amount,
                sct.transaction_date,
                m.member_no,
                m.first_name,
                m.last_name,
                m.branch_id,
                COALESCE(b.name, 'Main Branch') AS branch_name
            FROM share_capital_transactions sct
            INNER JOIN members m ON m.id = sct.member_id
            LEFT JOIN branches b ON b.id = m.branch_id
            WHERE 1 = 1
        ";
        $cbuParams = [];
        if (!empty($branchId) && $branchId !== 'all') {
            $sqlCbu .= " AND m.branch_id = :branch_id";
            $cbuParams['branch_id'] = $branchId;
        }
        if (!empty($memberId) && $memberId !== 'all') {
            $sqlCbu .= " AND sct.member_id = :member_id";
            $cbuParams['member_id'] = $memberId;
        }
        if (!empty($effectiveStart) && !empty($effectiveEnd)) {
            $sqlCbu .= " AND sct.transaction_date >= :start_date AND sct.transaction_date <= :end_date";
            $cbuParams['start_date'] = $effectiveStart;
            $cbuParams['end_date'] = $effectiveEnd;
        }

        $stmtCbu = $this->db->prepare($sqlCbu);
        $stmtCbu->execute($cbuParams);
        $cbuRows = $stmtCbu->fetchAll(PDO::FETCH_ASSOC);

        foreach ($cbuRows as $ct) {
            $amt = (float)($ct['amount'] ?? 0);
            $results[] = [
                'id' => $ct['id'],
                'date' => substr((string)$ct['transaction_date'], 0, 10),
                'member_id' => $ct['member_id'],
                'member_no' => $ct['member_no'] ?: 'MEM-N/A',
                'member_name' => trim(($ct['first_name'] ?? '') . ' ' . ($ct['last_name'] ?? '')) ?: 'Unknown Member',
                'product_type' => 'Share Capital (CBU)',
                'account_number' => $ct['share_account_id'],
                'reference_no' => $ct['receipt_no'] ?: $ct['id'],
                'description' => "CBU {$ct['type']} (" . ($ct['shares'] ?? 0) . " shares)",
                'transaction_type' => $ct['type'],
                'debit' => 0.0,
                'credit' => round($amt, 2),
                'balance_after' => 0.0,
                'gl_code' => $cbuGlCode,
                'gl_name' => $cbuGlName,
                'branch_id' => $ct['branch_id'] ?: 'branch_tar',
                'branch_name' => $ct['branch_name'] ?: 'Main Branch'
            ];
        }

        // 3. Loan Payments (GL 1210)
        $sqlLp = "
            SELECT
                lp.id,
                lp.receipt_no,
                lp.loan_id,
                lp.member_id,
                lp.payment_date,
                lp.total_amount,
                m.member_no,
                m.first_name,
                m.last_name,
                m.branch_id,
                COALESCE(b.name, 'Main Branch') AS branch_name,
                l.loan_account_no
            FROM loan_payments lp
            INNER JOIN members m ON m.id = lp.member_id
            LEFT JOIN loans l ON l.id = lp.loan_id
            LEFT JOIN branches b ON b.id = m.branch_id
            WHERE 1 = 1
        ";
        $lpParams = [];
        if (!empty($branchId) && $branchId !== 'all') {
            $sqlLp .= " AND m.branch_id = :branch_id";
            $lpParams['branch_id'] = $branchId;
        }
        if (!empty($memberId) && $memberId !== 'all') {
            $sqlLp .= " AND lp.member_id = :member_id";
            $lpParams['member_id'] = $memberId;
        }
        if (!empty($effectiveStart) && !empty($effectiveEnd)) {
            $sqlLp .= " AND lp.payment_date >= :start_date AND lp.payment_date <= :end_date";
            $lpParams['start_date'] = $effectiveStart;
            $lpParams['end_date'] = $effectiveEnd;
        }

        $stmtLp = $this->db->prepare($sqlLp);
        $stmtLp->execute($lpParams);
        $lpRows = $stmtLp->fetchAll(PDO::FETCH_ASSOC);

        foreach ($lpRows as $lp) {
            $amt = (float)($lp['total_amount'] ?? 0);
            $results[] = [
                'id' => $lp['id'],
                'date' => substr((string)$lp['payment_date'], 0, 10),
                'member_id' => $lp['member_id'],
                'member_no' => $lp['member_no'] ?: 'MEM-N/A',
                'member_name' => trim(($lp['first_name'] ?? '') . ' ' . ($lp['last_name'] ?? '')) ?: 'Unknown Member',
                'product_type' => 'Loan Amortization',
                'account_number' => $lp['loan_id'],
                'reference_no' => $lp['receipt_no'] ?: $lp['id'],
                'description' => "Amortization payment for Loan " . ($lp['loan_account_no'] ?: $lp['loan_id']),
                'transaction_type' => 'Loan Payment',
                'debit' => 0.0,
                'credit' => round($amt, 2),
                'balance_after' => 0.0,
                'gl_code' => $loanGlCode,
                'gl_name' => $loanGlName,
                'branch_id' => $lp['branch_id'] ?: 'branch_tar',
                'branch_name' => $lp['branch_name'] ?: 'Main Branch'
            ];
        }

        // Filter by gl_accounts if specified
        $finalResults = $results;
        if (!empty($glAccounts) && count($glAccounts) > 0) {
            $glLookup = array_flip(array_map('strval', $glAccounts));
            $finalResults = array_values(array_filter($results, function ($r) use ($glLookup) {
                $code = (string)($r['gl_code'] ?? '');
                return isset($glLookup[$code]) || isset($glLookup["acc_{$code}"]);
            }));
        }

        // Sort by date ascending
        usort($finalResults, function ($a, $b) {
            return strcmp((string)$a['date'], (string)$b['date']);
        });

        $totalDebit = 0.0;
        $totalCredit = 0.0;
        foreach ($finalResults as $r) {
            $totalDebit += (float)$r['debit'];
            $totalCredit += (float)$r['credit'];
        }

        return [
            'period' => $period ?: ($effectiveStart ? [
                'name' => "{$effectiveStart} to {$effectiveEnd}",
                'start_date' => $effectiveStart,
                'end_date' => $effectiveEnd
            ] : null),
            'count' => count($finalResults),
            'total_debit' => round($totalDebit, 2),
            'total_credit' => round($totalCredit, 2),
            'transactions' => $finalResults
        ];
    }
}
