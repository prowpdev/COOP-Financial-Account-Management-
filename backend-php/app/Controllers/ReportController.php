<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Services\ReportService;
use PDO;

class ReportController extends BaseController
{
    private ReportService $reports;

    public function __construct(PDO $db)
    {
        parent::__construct($db);
        $this->reports = new ReportService($db);
    }

    /**
     * GET /api/accounting-periods
     */
    public function accountingPeriods(): never
    {
        $fiscalYear = $this->getQuery('fiscal_year');
        $periods = $this->reports->getAccountingPeriods($fiscalYear);
        $this->success($periods);
    }

    /**
     * GET /api/reports/trial-balance
     */
    public function trialBalance(): never
    {
        $asOfDate = $this->getQuery('asOfDate');
        $branchId = $this->getCurrentUserBranchId() ?? $this->getQuery('current_branch_id') ?? $this->getQuery('branch_id');

        $tb = $this->reports->getTrialBalance($asOfDate, $branchId);
        $this->success($tb);
    }

    /**
     * GET /api/reports/financial-statements
     */
    public function financialStatements(): never
    {
        $asOfDate = $this->getQuery('asOfDate');
        $branchId = $this->getCurrentUserBranchId() ?? $this->getQuery('current_branch_id') ?? $this->getQuery('branch_id');

        $fs = $this->reports->getFinancialStatements($asOfDate, $branchId);
        $this->success($fs);
    }

    /**
     * GET /api/dashboard/stats
     */
    public function dashboardStats(): never
    {
        $branchId = $this->getCurrentUserBranchId() ?? $this->getQuery('current_branch_id') ?? $this->getQuery('branchId');
        $stats = $this->reports->getDashboardStats();
        $this->success($stats);
    }

    /**
     * GET /api/reports/journal-entries
     * GET /api/reports/journal-entries/:period_id
     */
    public function journalEntries(?string $periodId = null): never
    {
        $periodId = $periodId ?? $this->getQuery('period_id');
        $branchId = $this->getCurrentUserBranchId()
            ?? $this->getQuery('current_branch_id')
            ?? $this->getQuery('branch_id');
        $memberId = $this->getQuery('member_id');
        $startDate = $this->getQuery('start_date');
        $endDate = $this->getQuery('end_date');
        $glAccountsParam = $this->getQuery('gl_account_ids');
        $glAccounts = $glAccountsParam ? explode(',', (string)$glAccountsParam) : null;

        $report = $this->reports->getJournalEntriesReport(
            $periodId,
            $branchId,
            $memberId,
            $startDate,
            $endDate,
            $glAccounts
        );

        $this->success($report);
    }

    /**
     * GET /api/reports/member-transactions
     * GET /api/reports/member-transactions/:period_id
     */
    public function memberTransactions(?string $periodId = null): never
    {
        $periodId = $periodId ?? $this->getQuery('period_id');
        $branchId = $this->getCurrentUserBranchId()
            ?? $this->getQuery('current_branch_id')
            ?? $this->getQuery('branch_id');
        $memberId = $this->getQuery('member_id');
        $startDate = $this->getQuery('start_date');
        $endDate = $this->getQuery('end_date');
        $glAccountsParam = $this->getQuery('gl_account_ids');
        $glAccounts = $glAccountsParam ? explode(',', (string)$glAccountsParam) : null;

        $report = $this->reports->getMemberTransactionsReport(
            $periodId,
            $branchId,
            $memberId,
            $startDate,
            $endDate,
            $glAccounts
        );

        $this->success($report);
    }
}
