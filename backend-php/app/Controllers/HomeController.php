<?php

declare(strict_types=1);

namespace App\Controllers;
use App\Services\ConfigService;

use PDO;


class HomeController extends BaseController
{
    private ConfigService $config;
    public function __construct(PDO $db) {
        parent::__construct($db);
        $this->config = new ConfigService($db);
       
    }
    public function index(): never
    {
        $this->json([
            'status'     => 'online',
            'system'     => 'Mayap Care Agriculture Cooperative API',
            'version'    => '1.0.0',
            'php'        => PHP_VERSION,
            'database'   => 'connected',
            'timestamp'  => date('c')
        ]);
    }

     /**
     * POST /api/branches or /api/config/branches
     */
    public function storeBranch(): never
    {
        $input = $this->getRequestBody();

        if (empty($input['code']) || empty($input['name'])) {
            $this->error('Branch code and name are required.', 422);
        }
        try {
            $branch = $this->config->saveBranch($input);
            $this->success($branch, 'Branch saved successfully.', 201);
        } catch (\Exception $e) {
            $this->error($e->getMessage(), 422);
        }
    }
    
    /**
     * GET /api/branches or /api/config/branches
     */
    public function branches(): never
    {
        $branches = $this->config->getBranches();
        $this->success($branches);
    }
    
 
}
