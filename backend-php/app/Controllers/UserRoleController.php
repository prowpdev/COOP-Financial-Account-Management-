<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Models\UserRoleModel;
use PDO;

class UserRoleController extends BaseController
{
    private UserRoleModel $roles;

    public function __construct(PDO $db)
    {
        parent::__construct($db);
        $this->roles = new UserRoleModel($db);
    }

    public function index(): never
    {
        $this->success($this->roles->active());
    }
}
