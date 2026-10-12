<?php
declare(strict_types=1);
namespace App\Controllers;
use App\Services\ConfigService;
use PDO;

class NumberingFormatController extends BaseController
{
    private ConfigService $config;
    public function __construct(PDO $db) { parent::__construct($db); $this->config = new ConfigService($db); }

    public function store(): never {
        $input = $this->getRequestBody();
        $branchId = $this->getCurrentUserBranchId() ?? $this->getQuery('current_branch_id') ?? $this->getQuery('branch_id');
        $input['branch_id'] = $branchId;
        if (empty($input['module']) || empty($input['prefix']) || empty($input['pattern'])) {
            $this->error('Module, prefix, and pattern are required.', 422);
        }
        $this->success($this->config->saveNumberingFormat($input), 'Numbering format created successfully.', 201);
    }
    public function update(string $id): never {
        $this->success($this->config->updateNumberingFormat($id, $this->getRequestBody()), 'Numbering format updated successfully.');
    }
    public function destroy(string $id): never {
        $this->config->deleteNumberingFormat($id);
        $this->success(null, 'Numbering format deleted successfully.');
    }
}
