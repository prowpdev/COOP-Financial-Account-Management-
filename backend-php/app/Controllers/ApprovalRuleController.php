<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Services\ConfigService;
use PDO;

class ApprovalRuleController extends BaseController
{
    private ConfigService $config;
    public function __construct(PDO $db)
    {
        parent::__construct($db);
        $this->config = new ConfigService($db);
    }
    public function index(): never
    {
        $this->success($this->config->getApprovalRules());
    }
    public function store(): never
    {
        $this->success($this->config->saveApprovalRule($this->getRequestBody()), 'Approval rule created successfully.', 201);
    }
    public function update(string $id): never
    {
        $input = $this->getRequestBody();
        $input['id'] = $id;
        $this->success($this->config->saveApprovalRule($input), 'Approval rule updated successfully.');
    }
    public function destroy(string $id): never
    {
        $this->config->deleteApprovalRule($id);
        $this->success(null, 'Approval rule deleted successfully.');
    }
}
