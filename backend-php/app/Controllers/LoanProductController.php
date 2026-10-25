<?php
declare(strict_types=1);
namespace App\Controllers;
use App\Services\ConfigService;
use PDO;

class LoanProductController extends BaseController
{
    private ConfigService $config;
    public function __construct(PDO $db) { parent::__construct($db); $this->config = new ConfigService($db); }

    public function index(): never { $this->success($this->config->getLoanProducts()); }
    public function show(string $id): never {
        $product = $this->config->getLoanProduct($id);
        if (!$product) $this->error('Loan product not found.', 404);
        $this->success($product);
    }
    public function store(): never {
        $input = $this->getRequestBody();
        if (empty($input['name'])) $this->error('Loan product name is required.', 422);
        $input['branch_id'] = $this->getCurrentUserBranchId();
        $this->success($this->config->saveLoanProduct($input), 'Loan product created successfully.', 201);
    }
    public function update(string $id): never {
        $input = $this->getRequestBody(); $input['id'] = $id;
        $this->success($this->config->saveLoanProduct($input), 'Loan product updated successfully.');
    }
    public function destroy(string $id): never {
        $this->config->deleteLoanProduct($id);
        $this->success(null, 'Loan product deleted successfully.');
    }

    public function exportCsv(): never {
        $csv = $this->config->exportLoanProducts();
        $filename = 'coopflex_loan_products_' . date('Y-m-d') . '.csv';
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        echo $csv;
        exit;
    }

    public function importCsv(): never {
        $input = $this->getRequestBody();
        try {
            $result = $this->config->importLoanProducts($input);
            $this->success($result, 'Loan products imported successfully.');
        } catch (\Throwable $e) {
            $this->error($e->getMessage(), 400);
        }
    }
}
