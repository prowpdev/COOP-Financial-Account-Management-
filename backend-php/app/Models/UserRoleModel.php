<?php

declare(strict_types=1);

namespace App\Models;

use PDO;

class UserRoleModel
{
    protected const TABLE = 'user_roles';

    public function __construct(private PDO $db)
    {
    }

    public function active(): array
    {
        $stmt = $this->db->query('SELECT * FROM user_roles WHERE active = 1');
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
