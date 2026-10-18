<?php
declare(strict_types=1);
namespace App\Controllers;
use App\Services\ConfigService;
use PDO;

/**
 * Keep only aggregate/general configuration endpoints here.
 * Resource CRUD endpoints are handled by dedicated controllers.
 */
class ConfigController extends BaseController
{
    private ConfigService $config;
    public function __construct(PDO $db) { parent::__construct($db); $this->config = new ConfigService($db); }
    
    public function all(): never { $this->success($this->config->getAllConfig()); }
    public function auditLogs(): array{$this->success($this->config->getAuditTrails());}
}
