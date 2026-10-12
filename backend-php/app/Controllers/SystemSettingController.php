<?php
declare(strict_types=1);
namespace App\Controllers;
use App\Services\ConfigService;
use PDO;

class SystemSettingController extends BaseController
{
    private ConfigService $config;
    public function __construct(PDO $db) { parent::__construct($db); $this->config = new ConfigService($db); }

    public function index(): never { $this->success($this->config->getSystemSettings()); }
    public function update(): never {
        $input = $this->getRequestBody();
        $this->config->updateSystemSettings($input);
        $this->success($input, 'System settings updated successfully.');
    }
}
