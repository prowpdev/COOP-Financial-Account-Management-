<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Models\DocumentModel;
use App\Models\UserModel;
use PDO;

class DocumentController extends BaseController
{
    private DocumentModel $documents;
    private UserModel $users;

    public function __construct(PDO $db)
    {
        parent::__construct($db);
        $this->documents = new DocumentModel($db);
        $this->users = new UserModel($db);
    }

    public function index(string $userId): never
    {
        if ($this->users->findById($userId) === null) {
            $this->error('User not found.', 404);
        }

        $this->success($this->documents->forUser($userId));
    }

    public function store(string $userId): never
    {
        $user = $this->users->findById($userId);
        if ($user === null) {
            $this->error('User not found.', 404);
        }

        $input = $this->getRequestBody();
        $docKey = trim((string)($input['doc_key'] ?? $input['field_key'] ?? ''));
        if ($docKey === '') {
            $this->error('Document key (doc_key or field_key) is required.', 422);
        }

        $data = trim((string)($input['dataUrl'] ?? $input['data_url'] ?? $input['url'] ?? $input['path'] ?? ''));
        if ($data === '') {
            $this->error('Document data is required.', 422);
        }

        if (preg_match('/^(?:https?:\/\/|\/|assets\/)/i', $data) === 1) {
            $name = (string)($input['name'] ?? 'uploaded_document');
            $mimeType = strtolower((string)($input['file_type'] ?? $input['type'] ?? 'application/octet-stream'));
            $document = [
                'name' => $name,
                'type' => $mimeType,
                'path' => $data,
                'url' => $data,
                'dataUrl' => $data,
                'size' => (int)($input['size'] ?? 0),
                'uploaded_at' => $input['uploaded_at'] ?? date('c'),
            ];
            $this->documents->save($userId, $docKey, $document, isset($input['notes']) ? (string)$input['notes'] : null);
            $this->success($this->userWithDocuments($user), 'Document attached to user profile successfully.');
        }

        if (!preg_match('/^data:(?<mime>[-\w.+]+\/[\w.+-]+);base64,(?<data>.+)$/s', $data, $matches)) {
            $this->error('Invalid Base64 data URL.', 422);
        }

        $mimeType = strtolower($matches['mime']);
        $extensions = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            'image/gif' => 'gif',
            'application/pdf' => 'pdf',
            'application/msword' => 'doc',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => 'docx',
            'application/vnd.ms-excel' => 'xls',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' => 'xlsx',
        ];
        if (!isset($extensions[$mimeType])) {
            $this->error("File type '{$mimeType}' is not allowed.", 422);
        }

        $binary = base64_decode($matches['data'], true);
        if ($binary === false) {
            $this->error('Invalid Base64 document data.', 422);
        }
        if (strlen($binary) > 10 * 1024 * 1024) {
            $this->error('File size must not exceed 10MB.', 422);
        }

        $directory = dirname(__DIR__, 2)
            . DIRECTORY_SEPARATOR . 'assets'
            . DIRECTORY_SEPARATOR . 'members'
            . DIRECTORY_SEPARATOR . $userId;
        if (!is_dir($directory) && !mkdir($directory, 0755, true) && !is_dir($directory)) {
            $this->error('Unable to create member document directory.', 500);
        }

        $originalName = (string)($input['name'] ?? 'uploaded_document');
        $safeName = preg_replace('/[^a-zA-Z0-9._-]/', '_', pathinfo($originalName, PATHINFO_FILENAME));
        $safeName = trim((string)$safeName, '._-');
        if ($safeName === '') {
            $safeName = 'uploaded_document';
        }
        $fileName = $safeName . '_' . bin2hex(random_bytes(6)) . '.' . $extensions[$mimeType];
        $filePath = $directory . DIRECTORY_SEPARATOR . $fileName;
        if (file_put_contents($filePath, $binary) === false) {
            $this->error('Failed to save document to server.', 500);
        }

        $document = [
            'name' => $originalName,
            'type' => $mimeType,
            'path' => '/assets/members/' . rawurlencode($userId) . '/' . rawurlencode($fileName),
            'file_name' => $fileName,
            'size' => strlen($binary),
            'uploaded_at' => $input['uploaded_at'] ?? date('c'),
        ];

        try {
            $this->documents->save($userId, $docKey, $document, isset($input['notes']) ? (string)$input['notes'] : null);
        } catch (\Throwable $e) {
            if (is_file($filePath) && !unlink($filePath)) {
                throw new \RuntimeException('Document was not saved and its temporary file could not be removed.', 0, $e);
            }
            throw $e;
        }

        $this->success($this->userWithDocuments($user), 'Document attached to user profile successfully.');
    }

    public function destroy(string $userId, string $docKey): never
    {
        $user = $this->users->findById($userId);
        if ($user === null) {
            $this->error('User not found.', 404);
        }
        if (!$this->documents->delete($userId, $docKey)) {
            $this->error('Document not found.', 404);
        }

        $this->success($this->userWithDocuments($user), 'Document deleted successfully.');
    }

    public function destroyLegacy(string $userId): never
    {
        $input = $this->getRequestBody();
        $docKey = trim((string)($input['doc_key'] ?? $input['field_key'] ?? ''));
        if ($docKey === '') {
            $this->error('Document key (doc_key or field_key) is required.', 422);
        }
        $this->destroy($userId, $docKey);
    }

    private function userWithDocuments(array $user): array
    {
        $user['documents'] = $this->documents->forUser($user['id']);
        return $user;
    }
}
