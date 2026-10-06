<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Models\ConfigRepository;
use PDO;

class ConfigController extends BaseController
{
    private ConfigRepository $config;

    public function __construct(PDO $db)
    {
        parent::__construct($db);
        $this->config = new ConfigRepository($db);
    }
    public function notifications(): never
    {
        $this->success([],'No notifications available.');
    }
    public function loanProduct(string $id): never
    {
        $product = $this->config->getLoanProduct($id);
        if (!$product) {
            $this->error('Loan product not found.', 404);
        }
        $this->success($product);
    }

    
    public function getLoanProduct(string $id): array
    {
        $stmt = $this->db->prepare('SELECT * FROM loan_products WHERE id = ?');
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
    }
    
    /**
     * GET /api/config/all
     */
    public function all(): never
    {
        $data = $this->config->getAllConfig();
        $this->success($data);
    }

    /**
     * GET /api/audit-logs or /api/configuration_audit_trails
     */
    public function auditLogs(): never
    {
        $stmt = $this->db->query("SELECT * FROM configuration_audit_trails ORDER BY created_at DESC");
        $logs = $stmt ? $stmt->fetchAll(PDO::FETCH_ASSOC) : [];
        $this->success($logs);
    }

    /**
     * POST /api/audit-logs
     */
    public function recordAuditLog(): never
    {
        $input = $this->getRequestBody();
        if (empty($input['setting'])) {
            $this->error('Setting or action description is required.', 422);
        }
        $id = 'audit_' . bin2hex(random_bytes(8));
        $now = date('c');
        $stmt = $this->db->prepare("
            INSERT INTO configuration_audit_trails (id, setting, old_value, new_value, changed_by, created_at, reason)
            VALUES (:id, :setting, :old_value, :new_value, :changed_by, :created_at, :reason)
        ");
        $stmt->execute([
            'id' => $id,
            'setting' => $input['setting'],
            'old_value' => (string)($input['old_value'] ?? 'None'),
            'new_value' => (string)($input['new_value'] ?? 'None'),
            'changed_by' => (string)($input['changed_by'] ?? 'Administrator'),
            'created_at' => $now,
            'reason' => (string)($input['reason'] ?? 'System event')
        ]);
        $this->success(['id' => $id, 'created_at' => $now], 'Audit log recorded successfully.', 201);
    }

    /**
     * GET /api/branches or /api/config/branches
     */
    public function branches(): never
    {
        $branches = $this->config->getBranches();
        $this->success($branches);
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

        $branch = $this->config->saveBranch($input);
        $this->success($branch, 'Branch saved successfully.', 201);
    }

    /**
     * POST /api/config/documents
     *
     * Accepts multipart/form-data with a "file" field and either
     * "branch_name" or "coop_name".
     */
    public function uploadDocument(): never
    {
        print_r($this->getRequestBody());
        $folderName = $_POST['branch_name'] ?? $_POST['coop_name'] ?? '';
        if (!is_string($folderName) || trim($folderName) === '') {
            $this->error('A branch_name or coop_name is required.', 422);
        }

        $folderName = trim($folderName);
        $safeFolderName = preg_replace('/[^a-zA-Z0-9_-]+/', '_', $folderName);
        $safeFolderName = trim($safeFolderName, '_-');
        if ($safeFolderName === '') {
            $this->error('The branch or cooperative name is invalid.', 422);
        }

        $file = $_FILES['file'] ?? null;
        if (!is_array($file) || !isset($file['error'], $file['tmp_name'], $file['name'], $file['size'])) {
            $this->error('A file is required in the "file" field.', 422);
        }

        if ($file['error'] !== UPLOAD_ERR_OK) {
            $this->error('The file upload failed.', 422, ['upload_error' => $file['error']]);
        }

        $maxSize = 10 * 1024 * 1024;
        if (!is_int($file['size']) || $file['size'] < 1 || $file['size'] > $maxSize) {
            $this->error('File size must be between 1 byte and 10MB.', 422);
        }

        if (!is_uploaded_file($file['tmp_name'])) {
            $this->error('The uploaded file is invalid.', 422);
        }

        $originalName = basename(str_replace('\\', '/', (string)$file['name']));
        $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
        $fileTypes = [
            'jpg' => ['image/jpeg', "\xFF\xD8\xFF"],
            'jpeg' => ['image/jpeg', "\xFF\xD8\xFF"],
            'png' => ['image/png', "\x89PNG\r\n\x1A\n"],
            'webp' => ['image/webp', 'RIFF'],
            'gif' => ['image/gif', 'GIF'],
            'pdf' => ['application/pdf', '%PDF-'],
            'doc' => ['application/msword', "\xD0\xCF\x11\xE0\xA1\xB1\x1A\xE1"],
            'xls' => ['application/vnd.ms-excel', "\xD0\xCF\x11\xE0\xA1\xB1\x1A\xE1"],
            'docx' => ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', "PK\x03\x04"],
            'xlsx' => ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', "PK\x03\x04"],
        ];

        if (!isset($fileTypes[$extension])) {
            $this->error('This file type is not allowed.', 422);
        }

        $signature = file_get_contents($file['tmp_name'], false, null, 0, 12);
        $signatureMatches = is_string($signature)
            && str_starts_with($signature, $fileTypes[$extension][1]);
        if ($extension === 'gif' && is_string($signature)) {
            $signatureMatches = str_starts_with($signature, 'GIF87a')
                || str_starts_with($signature, 'GIF89a');
        } elseif ($extension === 'webp' && is_string($signature)) {
            $signatureMatches = str_starts_with($signature, 'RIFF')
                && substr($signature, 8, 4) === 'WEBP';
        }

        if (!$signatureMatches) {
            $this->error('The file content does not match its extension.', 422);
        }

        $safeFileName = preg_replace(
            '/[^a-zA-Z0-9_-]+/',
            '_',
            pathinfo($originalName, PATHINFO_FILENAME)
        );
        $safeFileName = trim($safeFileName, '_-');
        if ($safeFileName === '') {
            $safeFileName = 'document';
        }

        $fileName = $safeFileName . '_' . bin2hex(random_bytes(6)) . '.' . $extension;
        $assetsDirectory = dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'assets';
        $targetDirectory = $assetsDirectory . DIRECTORY_SEPARATOR . $safeFolderName;

        if (!is_dir($targetDirectory)
            && !mkdir($targetDirectory, 0755, true)
            && !is_dir($targetDirectory)
        ) {
            $this->error('Unable to create the document directory.', 500);
        }

        $targetPath = $targetDirectory . DIRECTORY_SEPARATOR . $fileName;
        if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
            $this->error('Failed to save the uploaded document.', 500);
        }

        $relativePath = '/assets/' . rawurlencode($safeFolderName) . '/' . rawurlencode($fileName);
        $this->success([
            'name' => $originalName,
            'file_name' => $fileName,
            'type' => $fileTypes[$extension][0],
            'size' => $file['size'],
            'path' => $relativePath,
        ], 'Document uploaded successfully.', 201);
    }

    /**
     * GET /api/loan-products or /api/config/loan-products
     */
    public function loanProducts(): never
    {
        $products = $this->config->getLoanProducts();
        $this->success($products);
    }

    /**
     * GET /api/savings-products or /api/config/savings-products
     */
    public function savingsProducts(): never
    {
        $products = $this->config->getSavingsProducts();
        $this->success($products);
    }

    /**
     * GET /api/feature-toggles or /api/config/feature-toggles
     */
    public function featureToggles(): never
    {
        $toggles = $this->config->getFeatureToggles();
        $this->success($toggles);
    }

    /**
     * POST /api/feature-toggles
     * POST /api/config/feature-toggles/toggle
     */
    public function updateToggle(): never
    {
        $input = $this->getRequestBody();
        $key = $input['feature_key'] ?? $input['key'] ?? null;
        $enabled = isset($input['enabled']) ? (bool)$input['enabled'] : (isset($input['value']) ? (bool)$input['value'] : null);

        if (!$key || $enabled === null) {
            $this->error('Feature key and enabled status are required.', 422);
        }

        $success = $this->config->updateFeatureToggle($key, $enabled);
        $this->success(['updated' => $success, 'feature_key' => $key, 'enabled' => $enabled], 'Feature toggle updated.');
    }

    public function toggleFeature(): never
    {
        $this->updateToggle();
    }

    /**
     * GET /api/system-settings or /api/config/system-settings
     */
    public function systemSettings(): never
    {
        $settings = $this->config->getSystemSettings();
        $this->success($settings);
    }

    /**
     * PUT /api/config/system-settings
     */
    public function updateSystemSettings(): never
    {
        $input = $this->getRequestBody();
        $this->config->updateSystemSettings($input);
        $this->success($input, 'System settings updated successfully.');
    }

    /**
     * POST /api/config/loan-products
     */
    public function storeLoanProduct(): never
    {
        $input = $this->getRequestBody();
        if (empty($input['name'])) {
            $this->error('Loan product name is required.', 422);
        }
        $saved = $this->config->saveLoanProduct($input);
        $this->success($saved, 'Loan product created successfully.', 201);
    }

    /**
     * PUT /api/config/loan-products/:id
     */
    public function updateLoanProduct(string $id): never
    {
        $input = $this->getRequestBody();
        $input['id'] = $id;
        $saved = $this->config->saveLoanProduct($input);
        $this->success($saved, 'Loan product updated successfully.');
    }

    /**
     * DELETE /api/config/loan-products/:id
     */
    public function destroyLoanProduct(string $id): never
    {
        $this->config->deleteLoanProduct($id);
        $this->success(null, 'Loan product deleted successfully.');
    }

    /**
     * POST /api/config/savings-products
     */
    public function storeSavingsProduct(): never
    {
        $input = $this->getRequestBody();
        if (empty($input['name'])) {
            $this->error('Savings product name is required.', 422);
        }
        $saved = $this->config->saveSavingsProduct($input);
        $this->success($saved, 'Savings product created successfully.', 201);
    }

    /**
     * PUT /api/config/savings-products/:id
     */
    public function updateSavingsProduct(string $id): never
    {
        $input = $this->getRequestBody();
        $input['id'] = $id;
        $saved = $this->config->saveSavingsProduct($input);
        $this->success($saved, 'Savings product updated successfully.');
    }

    /**
     * DELETE /api/config/savings-products/:id
     */
    public function destroySavingsProduct(string $id): never
    {
        $this->config->deleteSavingsProduct($id);
        $this->success(null, 'Savings product deleted successfully.');
    }

    /**
     * PUT /api/config/branches/:id
     */
    public function updateBranch(string $id): never
    {
        $input = $this->getRequestBody();
        $input['id'] = $id;
        $saved = $this->config->saveBranch($input);
        $this->success($saved, 'Branch updated successfully.');
    }

    /**
     * GET /api/config/fees
     */
    public function fees(): never
    {
        $fees = $this->config->getFees();
        $this->success($fees);
    }

    /**
     * POST /api/config/fees
     */
    public function storeFee(): never
    {
        $input = $this->getRequestBody();
        $saved = $this->config->saveFee($input);
        $this->success($saved, 'Fee created successfully.', 201);
    }

    /**
     * PUT /api/config/fees/:id
     */
    public function updateFee(string $id): never
    {
        $input = $this->getRequestBody();
        $input['id'] = $id;
        $saved = $this->config->saveFee($input);
        $this->success($saved, 'Fee updated successfully.');
    }

    /**
     * GET /api/config/fees/:id
     */
    public function fee(string $id): never
    {
        $fee = $this->config->getFee($id);
        if (!$fee) {
            $this->error('Fee not found.', 404);
        }
        $this->success($fee);
    }

     /**
     * DELETE /api/config/fees/:id
     */
    public function destroyFee(string $id): never
    {
        $this->config->deleteFee($id);
        $this->success(null, 'Fee deleted successfully.');
    }


    /**
     * GET /api/config/approval-workflows
     */
    public function approvalWorkflows(): never
    {
        $this->success($this->config->getApprovalWorkflows());
    }

    /**
     * GET /api/config/approval-rules
     */
    public function approvalRules(): never
    {
        $this->success($this->config->getApprovalRules());
    }

    /**
     * POST /api/config/approval-rules
     */
    public function storeApprovalRule(): never
    {
        $input = $this->getRequestBody();
        $saved = $this->config->saveApprovalRule($input);
        $this->success($saved, 'Approval rule created successfully.', 201);
    }

    /**
     * PUT /api/config/approval-rules/:id
     */
    public function updateApprovalRule(string $id): never
    {
        $input = $this->getRequestBody();
        $input['id'] = $id;
        $saved = $this->config->saveApprovalRule($input);
        $this->success($saved, 'Approval rule updated successfully.');
    }

    /**
     * GET /api/config/custom-fields
     */
    public function customFields(): never
    {
        $this->success($this->config->getCustomFields());
    }

    /**
     * DELETE /api/config/custom-fields/:id
     */
    public function deleteCustomField(string $id): never
    {
        $this->config->deleteCustomField($id);
        $this->success(null, 'Custom field deleted successfully.');
    }

    /**
     * POST /api/config/custom-fields
     */
    public function storeCustomField(): never
    {
        $input = $this->getRequestBody();
        $saved = $this->config->saveCustomField($input);
        $this->success($saved, 'Custom field saved successfully.', 201);
    }
    /**
     * PUT /api/config/custom-fields/:id
     */
    public function updateCustomField(string $id):never
    {
        $input = $this->getRequestBody();
        $saved = $this->config->updateCustomField($id, $input);
        $this->success($saved, 'Numbering format updated successfully.');
    }
    /**
     * PUT /api/config/numbering-formats/:id
     */
    public function updateNumberingFormat(string $id): never
    {
        $input = $this->getRequestBody();
        $saved = $this->config->updateNumberingFormat($id, $input);
        $this->success($saved, 'Numbering format updated successfully.');
    }

    /**
     * PUT /api/config/payment-allocation-rules/:id
     */
    public function updatePaymentAllocationRule(string $id): never
    {
        $input = $this->getRequestBody();
        $saved = $this->config->updatePaymentAllocationRule($id, $input);
        $this->success($saved, 'Payment allocation rule updated successfully.');
    }

    /**
     * GET /api/config/payment-allocation-rules/alloc_cda_std
     */
    public function getAllocationRules(): never
    {
        $this->success($this->config->getAllocationRules());
    }
}
