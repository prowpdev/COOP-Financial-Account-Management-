<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Services\MemberService;
use PDO;

class MemberDocumentController extends BaseController
{
    private MemberService $members;

    public function __construct(PDO $db)
    {
        parent::__construct($db);
        $this->members = new MemberService($db);
    }

    /**
     * POST /api/members/:id/documents
     */
    public function uploadDocument(string $id): never
    {
        $input = $this->getRequestBody();

        $docKey = trim((string) (
            $input['doc_key'] ?? $input['field_key'] ?? ''
        ));

        if ($docKey === '') {
            $this->error(
                'Document key (doc_key or field_key) is required.',
                422
            );
        }

        $dataUrl = trim((string) (
            $input['dataUrl']
            ?? $input['data_url']
            ?? $input['url']
            ?? $input['path']
            ?? ''
        ));

        if ($dataUrl === '') {
            $this->error('Document data is required.', 422);
        }

        // Support attaching an existing URL or server path.
        $isDirectPath = preg_match(
            '~^(?:https?://|/|assets/)~i',
            $dataUrl
        ) === 1;

        if ($isDirectPath) {
            $originalName = (string) (
                $input['name'] ?? 'uploaded_document'
            );

            $mimeType = strtolower((string) (
                $input['file_type']
                ?? $input['type']
                ?? 'application/octet-stream'
            ));

            $docData = [
                'name'        => $originalName,
                'type'        => $mimeType,
                'path'        => $dataUrl,
                'url'         => $dataUrl,
                'dataUrl'     => $dataUrl,
                'size'        => (int) ($input['size'] ?? 0),
                'uploaded_at' => $input['uploaded_at'] ?? date('c'),
            ];

            $updated = $this->members->updateMemberDocument(
                $id,
                $docKey,
                $docData
            );

            if (!$updated) {
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

        // Validate Base64 data URL.
        if (!preg_match(
            '~^data:(?<mime>[\w.+-]+/[\w.+-]+);base64,(?<data>.+)$~s',
            $dataUrl,
            $matches
        )) {
            $this->error('Invalid Base64 data URL.', 422);
        }

        $mimeType = strtolower($matches['mime']);
        $base64 = $matches['data'];

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

        $binary = base64_decode($base64, true);

        if ($binary === false) {
            $this->error('Invalid Base64 document data.', 422);
        }

        $maxSize = 10 * 1024 * 1024;

        if (strlen($binary) > $maxSize) {
            $this->error(
                'File size must not exceed 10MB.',
                422
            );
        }

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

        $extension = $extensions[$mimeType];

        // Save under assets/members/{member_id}/.
        $memberDirectory = dirname(__DIR__, 2)
            . DIRECTORY_SEPARATOR . 'assets'
            . DIRECTORY_SEPARATOR . 'members'
            . DIRECTORY_SEPARATOR . $id;

        if (
            !is_dir($memberDirectory)
            && !mkdir($memberDirectory, 0755, true)
            && !is_dir($memberDirectory)
        ) {
            $this->error(
                'Unable to create member document directory.',
                500
            );
        }

        $originalName = (string) (
            $input['name'] ?? 'uploaded_document'
        );

        $safeName = preg_replace(
            '/[^a-zA-Z0-9._-]/',
            '_',
            pathinfo($originalName, PATHINFO_FILENAME)
        );

        $safeName = trim((string) $safeName, '._-');

        if ($safeName === '') {
            $safeName = 'uploaded_document';
        }

        $fileName = $safeName . '_' . bin2hex(random_bytes(8))
            . '.' . $extension;

        $filePath = $memberDirectory
            . DIRECTORY_SEPARATOR . $fileName;

        if (file_put_contents($filePath, $binary) === false) {
            $this->error(
                'Failed to save document to server.',
                500
            );
        }

        $relativePath = '/assets/members/'
            . rawurlencode($id)
            . '/'
            . rawurlencode($fileName);

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
    public function deleteDocument(
        string $id,
        string $docKey
    ): never {
        $updated = $this->members->deleteMemberDocument(
            $id,
            $docKey
        );

        if (!$updated) {
            $this->error(
                'Failed to remove document or member not found.',
                400
            );
        }

        $this->success(
            $updated,
            'Document removed successfully.'
        );
    }
}