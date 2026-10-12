<?php
declare(strict_types=1);
namespace App\Controllers;
use App\Services\ConfigService;
use PDO;

class SavingsProductController extends BaseController
{
    private ConfigService $config;
    public function __construct(PDO $db) { parent::__construct($db); $this->config = new ConfigService($db); }

    public function index(): never { $this->success($this->config->getSavingsProducts()); }
    public function store(): never {
        $input = $this->getRequestBody();
        if (empty($input['name'])) $this->error('Savings product name is required.', 422);
        $this->success($this->config->saveSavingsProduct($input), 'Savings product created successfully.', 201);
    }
    public function update(string $id): never {
        $input = $this->getRequestBody(); $input['id'] = $id;
        $this->success($this->config->saveSavingsProduct($input), 'Savings product updated successfully.');
    }
    public function destroy(string $id): never {
        $this->config->deleteSavingsProduct($id);
        $this->success(null, 'Savings product deleted successfully.');
    }
}
