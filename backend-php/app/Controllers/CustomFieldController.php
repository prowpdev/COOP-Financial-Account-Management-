<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Services\ConfigService;
use PDO;

class CustomFieldController extends BaseController
{
    private ConfigService $config;
    public function __construct(PDO $db)
    {
        parent::__construct($db);
        $this->config = new ConfigService($db);
    }
    public function index(): never
    {
        $this->success($this->config->getCustomFields());
    }
    public function store(): never
    {
        $this->success($this->config->saveCustomField($this->getRequestBody()), 'Custom field saved successfully.', 201);
    }
    public function update(string $id): never
    {
        $this->success($this->config->updateCustomField($id, $this->getRequestBody()), 'Custom field updated successfully.');
    }
    public function destroy(string $id): never
    {
        $this->config->deleteCustomField($id);
        $this->success(null, 'Custom field deleted successfully.');
    }
}
