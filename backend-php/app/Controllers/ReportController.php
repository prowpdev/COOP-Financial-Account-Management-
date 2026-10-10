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
     * GET /api/reports/trial-balance
     */
    public function trialBalance(): never
    {
        $asOfDate = $this->getQuery('asOfDate');
        $branchId = $this->getCurrentUserBranchId() ?? $this->getQuery('branchId') ?? $this->getQuery('branch_id');

        $tb = $this->reports->getTrialBalance($asOfDate, $branchId);
        $this->success($tb);
    }

    /**
     * GET /api/reports/financial-statements
     */
    public function financialStatements(): never
    {
        $asOfDate = $this->getQuery('asOfDate');
        $branchId = $this->getCurrentUserBranchId() ?? $this->getQuery('branchId') ?? $this->getQuery('branch_id');

        $fs = $this->reports->getFinancialStatements($asOfDate, $branchId);
        $this->success($fs);
    }

    /**
     * GET /api/dashboard/stats
     */
    public function dashboardStats(): never
    {
        $branchId = $this->getCurrentUserBranchId() ?? $this->getQuery('branch_id') ?? $this->getQuery('branchId');
        $stats = $this->reports->getDashboardStats($branchId);
        $this->success($stats);

    }
}
