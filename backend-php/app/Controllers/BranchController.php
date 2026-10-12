<?php
declare(strict_types=1);
namespace App\Controllers;
use App\Services\ConfigService;
use PDO;

class BranchController extends BaseController
{
    private ConfigService $config;
    public function __construct(PDO $db) { parent::__construct($db); $this->config = new ConfigService($db); }

    public function index(): never { $this->success($this->config->getBranches()); }
    public function store(): never {
        $input = $this->getRequestBody();
        if (empty($input['code']) || empty($input['name'])) $this->error('Branch code and name are required.', 422);
        $this->success($this->config->saveBranch($input), 'Branch saved successfully.', 201);
    }
    public function update(string $id): never {
        $input = $this->getRequestBody(); $input['id'] = $id;
        $this->success($this->config->saveBranch($input), 'Branch updated successfully.');
    }
    public function destroy(string $id): never {
        $this->config->deleteBranch($id);
        $this->success(null, 'Branch deleted successfully.');
    }
}
