<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Services\MemberService;
use PDO;

class MemberController extends BaseController
{
    private MemberService $members;

    public function __construct(PDO $db)
    {
        parent::__construct($db);
        $this->members = new MemberService($db);
    }

    /**
     * GET /api/members
     */
    public function index(): never
    {
        $branchId = $this->getQuery('branchId');
        $status   = $this->getQuery('status');
        $search   = $this->getQuery('search');

        $result = $this->members->all($branchId, $status, $search);
        $this->json([
            'success' => true,
            'data'    => $result,
            'total'   => count($result)
        ]);
    }

    /**
     * GET /api/members/:id
     */
    public function show(string $id): never
    {
        $member = $this->members->find($id);
        if (!$member) {
            $this->error('Member not found', 404);
        }

        $this->success($member);
    }

    /**
     * POST /api/members
     */
    public function store(): never
    {
        $input = $this->getRequestBody();

        if (empty($input['first_name']) || empty($input['last_name'])) {
            $this->error('First name and last name are required.', 422);
        }

        if (empty($input['branch_id'])) {
            $this->error('Branch assignment is required.', 422);
        }

        $created = $this->members->create($input);
        $this->success($created, 'Member registered successfully.', 201);
    }

    /**
     * PUT /api/members/:id
     */
    public function update(string $id): never
    {
        $input = $this->getRequestBody();
        $updated = $this->members->update($id, $input);

        if (!$updated) {
            $this->error('Member not found or no changes made.', 404);
        }

        $this->success($updated, 'Member updated successfully.');
    }

    /**
     * DELETE /api/members/:id
     */
    public function destroy(string $id): never
    {
        $deleted = $this->members->delete($id);
        if (!$deleted) {
            $this->error('Failed to delete member or member not found.', 400);
        }

        $this->success(['id' => $id], 'Member deleted successfully.');
    }

    /**
     * GET /api/members/:id/report
     */
    public function report(string $id): never
    {
        $report = $this->members->getMemberReport($id);
        if (empty($report)) {
            $this->error('Member not found.', 404);
        }

        $this->success($report);
    }

    /**
     * GET /api/members/:id/profile
     */
    public function profile(string $id): never
    {
        $profile = $this->members->getMemberProfile($id);
        if (empty($profile)) {
            $this->error('Member not found.', 404);
        }

        $this->success($profile);
    }

    /**
     * POST /api/members/:id/documents
     */
public function uploadDocument(string $id): never
{
    $input = $this->getRequestBody();

    // Support both doc_key and field_key
    $docKey = trim((string)($input['doc_key'] ?? $input['field_key'] ?? ''));

    if ($docKey === '') {
        $this->error(
            'Document key (doc_key or field_key) is required.',
            422
        );
    }

    $dataUrl = trim((string)($input['dataUrl'] ?? $input['data_url'] ?? $input['url'] ?? $input['path'] ?? ''));

    if ($dataUrl === '') {
        $this->error('Document data is required.', 422);
    }

    $isDirectPath = preg_match('/^(?:https?:\/\/|\/|assets\/)/i', $dataUrl) === 1;

    if ($isDirectPath) {
        $originalName = (string)($input['name'] ?? 'uploaded_document');
        $mimeType = strtolower((string)($input['file_type'] ?? $input['type'] ?? 'application/octet-stream'));
        $docData = [
            'name'        => $originalName,
            'type'        => $mimeType,
            'path'        => $dataUrl,
            'url'         => $dataUrl,
            'dataUrl'     => $dataUrl,
            'size'        => (int)($input['size'] ?? 0),
            'uploaded_at' => $input['uploaded_at'] ?? date('c'),
        ];

        $updated = $this->members->updateMemberDocument($id, $docKey, $docData);
        if (!$updated) {
            $this->error('Failed to attach document to member profile.', 400);
        }

        $this->success($updated, 'Document attached to member profile successfully.');
    }

    // Validate data URL
    if (!preg_match(
        '/^data:(?<mime>[-\w.+]+\/[\w.+-]+);base64,(?<data>.+)$/s',
        $dataUrl,
        $matches
    )) {
        $this->error('Invalid Base64 data URL.', 422);
    }

    $mimeType = strtolower($matches['mime']);
    $base64   = $matches['data'];

    // Allowed file types
    $allowedMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (!in_array($mimeType, $allowedMimeTypes, true)) {
        $this->error(
            "File type '{$mimeType}' is not allowed.",
            422
        );
    }

    // Decode Base64
    $binary = base64_decode($base64, true);

    if ($binary === false) {
        $this->error('Invalid Base64 document data.', 422);
    }

    // Limit file size: 10MB
    $maxSize = 10 * 1024 * 1024;

    if (strlen($binary) > $maxSize) {
        $this->error('File size must not exceed 10MB.', 422);
    }

    // File extension
    $extensions = [
        'image/jpeg' => 'jpg',
        'image/png'  => 'png',
        'image/webp' => 'webp',
        'image/gif'  => 'gif',

        'application/pdf' => 'pdf',

        'application/msword' =>
            'doc',

        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' =>
            'docx',

        'application/vnd.ms-excel' =>
            'xls',

        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' =>
            'xlsx',
    ];

    $extension = $extensions[$mimeType] ?? 'bin';

    /*
     * assets/
     *   members/
     *      {member_id}/
     *          marriage_certificate.pdf
     */
    $memberDirectory = dirname(__DIR__, 2)
        . DIRECTORY_SEPARATOR . 'assets'
        . DIRECTORY_SEPARATOR . 'members'
        . DIRECTORY_SEPARATOR . $id;

    if (!is_dir($memberDirectory)) {
        if (!mkdir($memberDirectory, 0755, true) && !is_dir($memberDirectory)) {
            $this->error(
                'Unable to create member document directory.',
                500
            );
        }
    }

    // Original filename
    $originalName = (string)($input['name'] ?? 'uploaded_document');

    // Remove dangerous characters
    $safeName = preg_replace(
        '/[^a-zA-Z0-9._-]/',
        '_',
        pathinfo($originalName, PATHINFO_FILENAME)
    );

    $safeName = trim($safeName, '._-');

    if ($safeName === '') {
        $safeName = 'uploaded_document';
    }

    // Prevent duplicate filenames
    $fileName = $safeName . '_' . time() . '.' . $extension;

    $filePath = $memberDirectory . DIRECTORY_SEPARATOR . $fileName;

    if (file_put_contents($filePath, $binary) === false) {
        $this->error(
            'Failed to save document to server.',
            500
        );
    }

    /*
     * Store a web-accessible path instead of Base64.
     *
     * Adjust this depending on your API/public directory structure.
     */
    $relativePath = '/assets/members/' . rawurlencode($id) . '/' . rawurlencode($fileName);

    $docData = [
        'name'        => $originalName,
        'type'        => $mimeType,
        'path'        => $relativePath,
        'file_name'   => $fileName,
        'size'        => strlen($binary),
        'uploaded_at' => $input['uploaded_at'] ?? date('c'),
    ];

    $updated = $this->members->updateMemberDocument(
        $id,
        $docKey,
        $docData
    );

    if (!$updated) {
        // Remove physical file if DB update fails
        if (is_file($filePath)) {
            unlink($filePath);
        }

        $this->error(
            'Failed to attach document to member profile.',
            400
        );
    }

    $this->success(
        $updated,
        'Document attached to member profile successfully.'
    );
}

    /**
     * DELETE /api/members/:id/documents/:docKey
     */
    public function deleteDocument(string $id, string $docKey): never
    {
        $updated = $this->members->deleteMemberDocument($id, $docKey);
        if (!$updated) {
            $this->error('Failed to remove document or member not found.', 400);
        }

        $this->success($updated, 'Document removed successfully.');
    }
}
