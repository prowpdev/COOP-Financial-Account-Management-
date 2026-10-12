<?php
declare(strict_types=1);
namespace App\Controllers;
use App\Services\ConfigService;
use PDO;

class PaymentAllocationRuleController extends BaseController
{
    private ConfigService $config;
    public function __construct(PDO $db) { parent::__construct($db); $this->config = new ConfigService($db); }
    public function index(): never { $this->success($this->config->getAllocationRules()); }
    public function update(string $id): never {
        $this->success($this->config->updatePaymentAllocationRule($id, $this->getRequestBody()), 'Payment allocation rule updated successfully.');
    }
}
