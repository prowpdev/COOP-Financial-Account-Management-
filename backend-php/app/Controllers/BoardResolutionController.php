<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Models\BoardResolutionModel;
use App\Models\UserModel;
use PDO;

class BoardResolutionController extends BaseController
{
    private BoardResolutionModel $documents;
    private UserModel $users;

    public function __construct(PDO $db)
    {
        parent::__construct($db);
        $this->documents = new BoardResolutionModel($db);
        $this->users = new UserModel($db);
    }

    /**
     * GET /api/user-documents or /api/users/:id/documents
     * Retrieve user documents filtered by the current_user branch, enriched with user details.
     */
    public function getUserdocuments(?string $userId = null,?string $category = null): never
    {
        $targetUserId = $this->getCurrentUserId();
        $search = $this->getQuery('search');
        $branchId = $this->getCurrentUserBranchId();

        // 1. If a specific user ID is requested
        if ($targetUserId && $category == null) {
           
            $user = $this->users->findById($targetUserId);
            if ($user === null) {
                $this->error('User not found.', 404);
            }

            // Enforce branch tenancy: target user must belong to current user's branch
            if ($branchId && $branchId !== 'all' && !empty($user['branch_id']) && $user['branch_id'] !== $branchId) {
                $this->error('Access denied. User belongs to a different branch.', 403);
            }

            $userBranch = $branchId ?: ($user['branch_id'] ?? null);
            $docsList = $this->documents->forBranch($userBranch, $targetUserId, $search);
            $docsKeyed = $this->documents->forUser($targetUserId);

            unset($user['password_hash']);
            $this->json([
                'success' => true,
                'user' => [
                    'id' => $user['id'],
                    'username' => $user['username'],
                    'name' => $user['full_name'],
                    'full_name' => $user['full_name'],
                    'email' => $user['email'],
                    'role_name' => $user['role_name'] ?? 'Staff',
                    'branch_id' => $user['branch_id'] ?? null,
                    'branch_name' => $user['branch_name'] ?? null,
                ],
                'data' => $docsList,
                'documents' => $docsKeyed,
                'count' => count($docsList),
            ]);
        }
        
       
        $docsList = $this->documents->forBranch($branchId, null, $search); 
        
        // 2. Fetch all user documents for current_user branch
    

        $currentUser = $this->getCurrentUser();
        $this->json([
            'success' => true,
            'current_user_branch' => $branchId,
            'user' => $currentUser ? [
                'id' => $currentUser['id'],
                'username' => $currentUser['username'] ?? '',
                'name' => $currentUser['full_name'] ?? $currentUser['name'] ?? '',
                'email' => $currentUser['email'] ?? '',
                'role_name' => $currentUser['role_name'] ?? 'Staff',
                'branch_id' => $currentUser['branch_id'] ?? $branchId,
                'branch_name' => $currentUser['branch_name'] ?? null,
            ] : null,
            'data' => $docsList,
            'documents' => $docsList,
            'count' => count($docsList),
        ]);
    }

    public function bodIndex(?string $userId = null): never
    {
        $this->getUserdocuments($userId,'bod_files');
    }

    public function index(?string $userId = null): never
    {
        $this->getUserdocuments($userId);
    }

    /**
     * POST /api/user-documents or /api/users/:id/documents
     * Upload user document and store to user_documents table
     */
    public function uploadUserdocuments(?string $userId = null): never
    {
        $input = $this->getRequestBody();
        $targetUserId = $userId ?: (string)($input['user_id'] ?? $input['userId'] ?? '');
        if ($targetUserId === '') {
            $current = $this->getCurrentUser();
            $targetUserId = $current['id'] ?? '';
        }

        if ($targetUserId === '') {
            $this->error('Target user ID is required.', 422);
        }

        $user = $this->users->findById($targetUserId);
        if ($user === null) {
            $this->error('User not found.', 404);
        }

        // Enforce branch tenancy check
        $branchId = $this->getCurrentUserBranchId();
        if ($branchId && $branchId !== 'all' && !empty($user['branch_id']) && $user['branch_id'] !== $branchId) {
            $this->error('Access denied. Cannot upload documents for a user in another branch.', 403);
        }

        $docKey = trim((string)($input['doc_key'] ?? $input['field_key'] ?? $input['field_name'] ?? ''));
        if ($docKey === '') {
            $docKey = 'doc_' . time() . '_' . substr(bin2hex(random_bytes(4)), 0, 6);
        }

        $data = trim((string)($input['dataUrl'] ?? $input['data_url'] ?? $input['url'] ?? $input['path'] ?? ''));
        if ($data === '') {
            $this->error('Document data is required.', 422);
        }

        $title = (string)($input['title'] ?? $input['name'] ?? $input['file_name'] ?? 'uploaded_document');

        if (preg_match('/^(?:https?:\/\/|\/|assets\/)/i', $data) === 1) {
            $name = (string)($input['name'] ?? $input['file_name'] ?? $title);
            $mimeType = strtolower((string)($input['file_type'] ?? $input['type'] ?? 'application/octet-stream'));
            $document = [
                'name' => $name,
                'title' => $title,
                'type' => $mimeType,
                'file_type' => $mimeType,
                'path' => $data,
                'url' => $data,
                'dataUrl' => $data,
                'size' => (int)($input['size'] ?? $input['file_size'] ?? 0),
                'uploaded_at' => $input['uploaded_at'] ?? date('c'),
            ];
            $this->documents->save($targetUserId, $docKey, $document, isset($input['notes']) ? (string)$input['notes'] : null, (string)$input['category']);
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
            . DIRECTORY_SEPARATOR . $targetUserId;
        if (!is_dir($directory) && !mkdir($directory, 0755, true) && !is_dir($directory)) {
            $this->error('Unable to create member document directory.', 500);
        }

        $originalName = (string)($input['name'] ?? $input['file_name'] ?? $title);
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
        // Replace the old $document array and save block with this:
        $document = $this->buildResolutionMetadata(
            $input,
            $targetUserId,
            $docKey,
            $originalName,
            $mimeType,
            '/assets/members/' . rawurlencode($targetUserId)
                . '/' . rawurlencode($fileName),
            strlen($binary)
        );

        try {
            $this->documents->save(
                $targetUserId,
                $docKey,
                $document,
                isset($input['notes'])
                    ? (string)$input['notes']
                    : null,
                $document['category']
            );
        } catch (\Throwable $e) {
            if (is_file($filePath) && !unlink($filePath)) {
                throw new \RuntimeException(
                    'Document was not saved and its temporary file could not be removed.',
                    0,
                    $e
                );
            }

            throw $e;
        }

        $this->success(
            $this->userWithDocuments($user),
            'Board resolution uploaded successfully.'
        );
    }

    public function store(): never
    {
        $userId = $this->getAuthenticatedUserId();
        $this->uploadUserdocuments($userId);
    }

    public function destroy(string $docKey): never
    {
        $userId = $this->getAuthenticatedUserId();
        $user = $this->users->findById($userId);
        if ($user === null) {
            $this->error('User not found.', 404);
        }
        if (!$this->documents->delete($userId, $docKey)) {
            $this->error('Document not found.', 404);
        }

        $this->success($this->userWithDocuments($user), 'Document deleted successfully.');
    }

    public function destroyLegacy(string $docKey): never
    {
        $userId = $this->getAuthenticatedUserId();
        if ($docKey === '') {
            $this->error('Document key doc_key is required.', 422);
        }
        $this->destroy($userId, $docKey);
    }

    private function userWithDocuments(array $user): array
    {
        $user['documents'] = $this->documents->forUser($user['id']);
        return $user;
    }
    
    private function buildResolutionMetadata(
        array $input,
        string $userId,
        string $docKey,
        string $originalName,
        string $mimeType,
        string $path,
        int $fileSize
    ): array {
        $allowedStatuses = [
            'Approved',
            'Adopted',
            'Pending Signature',
            'Superseded',
        ];

        $status = (string)($input['status'] ?? 'Pending Signature');

        if (!in_array($status, $allowedStatuses, true)) {
            $this->error('Invalid resolution status.', 422);
        }

        $fieldType = match (true) {
            $mimeType === 'application/pdf' => 'PDF',
            str_starts_with($mimeType, 'image/') => 'Image',
            in_array($mimeType, [
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'text/plain',
                'application/rtf',
            ], true) => 'Document',
            default => 'File',
        };

        $category = (string)($input['category'] ?? 'General');

        return [
            'id' => (string)($input['id'] ?? $docKey),
            'user_id' => $userId,
            'doc_key' => $docKey,

            'resolution_no' => (string)($input['resolution_no'] ?? ''),
            'title' => (string)(
                $input['title'] ?? pathinfo($originalName, PATHINFO_FILENAME)
            ),
            'resolution_date' => (string)($input['resolution_date'] ?? ''),
            'meeting_type' => (string)($input['meeting_type'] ?? ''),
            'category' => $category,
            'status' => $status,
            'signatories' => $input['signatories'] ?? null,

            'name' => $originalName,
            'file_name' => (string)($input['file_name'] ?? $originalName),
            'file_type' => $mimeType,
            'field_type' => (string)($input['field_type'] ?? $fieldType),
            'file_size' => $fileSize,
            'size' => $fileSize,

            'path' => $path,
            'url' => $path,
            'data_url' => $path,

            'notes' => $input['notes'] ?? null,
            'uploaded_at' => $input['uploaded_at'] ?? date('c'),
            'uploaded_by' => $input['uploaded_by'] ?? $userId,
            'tags' => is_array($input['tags'] ?? null)
                ? $input['tags']
                : [],
        ];
    }

}
