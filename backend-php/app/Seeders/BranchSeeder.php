<?php

declare(strict_types=1);

namespace App\Seeders;

use PDO;

class BranchSeeder
{
    public function __construct(private PDO $db)
    {
    }

    public function run(): array
    {
        $branches = [
            [
                'branch_tar',
                'TAR',
                'Main Tarlac Branch',
                'Barangay Care, Tarlac City, Tarlac',
                '+63 (045) 982-1144',
                'Jhomel Ignacio',
                1,
                1,
                '2026-09-12 08:07:46',
            ]
        ];

        $sql = "
            INSERT INTO branches (
                id,
                code,
                name,
                address,
                contact_number,
                manager_name,
                is_main_branch,
                active,
                created_at
            )
            VALUES (
                :id,
                :code,
                :name,
                :address,
                :contact_number,
                :manager_name,
                :is_main_branch,
                :active,
                :created_at
            )
            ON DUPLICATE KEY UPDATE
                code = VALUES(code),
                name = VALUES(name),
                address = VALUES(address),
                contact_number = VALUES(contact_number),
                manager_name = VALUES(manager_name),
                is_main_branch = VALUES(is_main_branch),
                active = VALUES(active)
        ";

        $stmt = $this->db->prepare($sql);

        foreach ($branches as $branch) {
            $stmt->execute([
                ':id'             => $branch[0],
                ':code'           => $branch[1],
                ':name'           => $branch[2],
                ':address'        => $branch[3],
                ':contact_number' => $branch[4],
                ':manager_name'   => $branch[5],
                ':is_main_branch' => $branch[6],
                ':active'         => $branch[7],
                ':created_at'     => $branch[8],
            ]);
        }

        return $this->getAll();
    }

    public function getAll(): array
    {
        $stmt = $this->db->query("
            SELECT *
            FROM branches
            ORDER BY is_main_branch DESC, name ASC
        ");

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}