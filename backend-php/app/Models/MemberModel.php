<?php

declare(strict_types=1);

namespace App\Models;
use PDO;

class MemberModel extends TableModel
{
    protected const TABLE = 'members';
    public function __construct(private PDO $db)
    {
    }


}
