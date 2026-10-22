<?php
declare(strict_types=1);
namespace App\Controllers;
use App\Services\ConfigService;
use PDO;

class FeeController extends BaseController
{
    private ConfigService $config;
    public function __construct(PDO $db) { parent::__construct($db); $this->config = new ConfigService($db); }

    public function index(): never { $this->success($this->config->getFees()); }
    public function show(string $id): never {
        $fee = $this->config->getFee($id);
        if (!$fee) $this->error('Fee not found.', 404);
        $this->success($fee);
    }
    public function store(): never 
    {
        $input = $this->getRequestBody();
        $input['branch_id'] = $this->getCurrentUserBranchId();
         $this->success($this->config->saveFee($input), 'Fee created successfully.', 201);
    }
    public function update(string $id): never {
        $input = $this->getRequestBody(); $input['id'] = $id;
        $this->success($this->config->saveFee($input), 'Fee updated successfully.');
    }
    public function destroy(string $id): never {
        $this->config->deleteFee($id);
        $this->success(null, 'Fee deleted successfully.');
    }
}
