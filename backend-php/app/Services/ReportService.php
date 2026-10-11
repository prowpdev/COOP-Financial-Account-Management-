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
            'outstanding_portfolio'   => round($loanPortfolio, 2),
            'total_savings_deposits'  => round($savingsTotal, 2),
            'total_share_capital'     => round($shareCapitalTotal, 2),
            'total_cash_and_bank'     => round($cashVaultTotal, 2),
            'total_interest_collected' => round($interestIncomeEarned, 2),
            'total_journal_vouchers'  => $totalJournalVouchers,
        ];
    }
}
