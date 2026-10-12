<?php
declare(strict_types=1);
namespace App\Controllers;
use App\Core\BranchScope;
use App\Core\AuditLogger;
use PDO;

class ConfigurationAuditTrailController extends BaseController
{
    public function __construct(PDO $db) { parent::__construct($db); }

    public function index(): never {
        $sql = 'SELECT * FROM configuration_audit_trails';
        $params = [];
        BranchScope::appendCondition($sql, $params, 'branch_id');
        $stmt = $this->db->prepare($sql . ' ORDER BY created_at DESC');
        $stmt->execute($params);
        $this->success($stmt->fetchAll(PDO::FETCH_ASSOC));
    }
    public function store(): never {
        $input = $this->getRequestBody();
        if (empty($input['setting'])) $this->error('Setting or action description is required.', 422);
        $id = (new AuditLogger($this->db))->recordAuditTrail(
            (string)$input['setting'],
            $input['old_value'] ?? 'None',
            $input['new_value'] ?? 'None',
            (string)($input['changed_by'] ?? 'Administrator'),
            (string)($input['reason'] ?? 'System event'),
            (string)($input['action'] ?? 'UPDATE')
        );
        $this->success(['id' => $id], 'Audit log recorded successfully.', 201);
    }
}
