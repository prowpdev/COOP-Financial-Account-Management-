<?php
declare(strict_types=1);
namespace App\Controllers;
use App\Services\ConfigService;
use PDO;

class FeatureToggleController extends BaseController
{
    private ConfigService $config;
    public function __construct(PDO $db) { parent::__construct($db); $this->config = new ConfigService($db); }

    public function index(): never { $this->success($this->config->getFeatureToggles()); }
    public function update(): never {
        $input = $this->getRequestBody();
        $key = $input['feature_key'] ?? $input['key'] ?? null;
        $enabled = isset($input['enabled']) ? (bool)$input['enabled'] : (isset($input['value']) ? (bool)$input['value'] : null);
        if (!$key || $enabled === null) $this->error('Feature key and enabled status are required.', 422);
        $updated = $this->config->updateFeatureToggle($key, $enabled);
        $this->success(['updated' => $updated, 'feature_key' => $key, 'enabled' => $enabled], 'Feature toggle updated.');
    }
}
