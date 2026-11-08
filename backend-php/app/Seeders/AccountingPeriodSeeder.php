<?php

declare(strict_types=1);

namespace App\Seeders;

use PDO;

class AccountingPeriodSeeder
{
    public function __construct(private PDO $db)
    {
    }

    public function run(?int $fiscalYear = 2026): array
    {
        $year = $fiscalYear ?? 2026;
        $monthNames = [
            1 => 'January', 2 => 'February', 3 => 'March', 4 => 'April',
            5 => 'May', 6 => 'June', 7 => 'July', 8 => 'August',
            9 => 'September', 10 => 'October', 11 => 'November', 12 => 'December'
        ];

        $hasBranchCol = false;
        try {
            $checkCol = $this->db->query("SHOW COLUMNS FROM `accounting_periods` LIKE 'branch_id'");
            $hasBranchCol = (bool) $checkCol->fetch();
        } catch (\Throwable) {
            $hasBranchCol = false;
        }

        if ($hasBranchCol) {
            $sql = "
                INSERT INTO accounting_periods (
                    id, name, fiscal_year, period_number, start_date, end_date, branch_id, status, created_at
                )
                VALUES (
                    :id, :name, :fiscal_year, :period_number, :start_date, :end_date, :branch_id, :status, :created_at
                )
                ON DUPLICATE KEY UPDATE
                    name = VALUES(name),
                    start_date = VALUES(start_date),
                    end_date = VALUES(end_date)
            ";
        } else {
            $sql = "
                INSERT INTO accounting_periods (
                    id, name, fiscal_year, period_number, start_date, end_date, status, created_at
                )
                VALUES (
                    :id, :name, :fiscal_year, :period_number, :start_date, :end_date, :status, :created_at
                )
                ON DUPLICATE KEY UPDATE
                    name = VALUES(name),
                    start_date = VALUES(start_date),
                    end_date = VALUES(end_date)
            ";
        }

        $stmt = $this->db->prepare($sql);

        for ($month = 1; $month <= 12; $month++) {
            $startDate = sprintf('%04d-%02d-01', $year, $month);
            $daysInMonth = (int)(new \DateTimeImmutable($startDate))->format('t');
            $endDate = sprintf('%04d-%02d-%02d', $year, $month, $daysInMonth);
            $periodId = sprintf('period_%04d_%02d', $year, $month);
            $name = $monthNames[$month] . ' ' . $year;

            $params = [
                ':id'            => $periodId,
                ':name'          => $name,
                ':fiscal_year'   => $year,
                ':period_number' => $month,
                ':start_date'    => $startDate,
                ':end_date'      => $endDate,
                ':status'        => 'Open',
                ':created_at'    => sprintf('%04d-01-01 00:00:00', $year),
            ];
            if ($hasBranchCol) {
                $params[':branch_id'] = 'branch_01';
            }

            $stmt->execute($params);
        }

        return $this->getAll();
    }

    public function getAll(): array
    {
        $stmt = $this->db->query("
            SELECT *
            FROM accounting_periods
            ORDER BY fiscal_year ASC, period_number ASC
        ");

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}