<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\BranchScope;
use PDO;

class BoardResolutionModel
{
    protected const TABLE = 'board_resolution_documents';

    public function __construct(private PDO $db)
    {
    }

    /**
     * Return all board resolution documents for one user.
     */
    public function forUser(string $userId): array
    {
        $sql = '
            SELECT
                d.user_id,
                d.doc_key,
                d.category AS db_category,
                d.document_data,
                d.notes
            FROM ' . self::TABLE . ' d
            INNER JOIN users u ON u.id = d.user_id
            WHERE d.user_id = :user_id
        ';

        $params = ['user_id' => $userId];

        BranchScope::appendCondition($sql, $params, 'u.branch_id');

        $stmt = $this->db->prepare($sql . ' ORDER BY d.doc_key');
        $stmt->execute($params);

        return $this->mapDocuments($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    /**
     * Return documents belonging to a branch, optionally filtered by user
     * and search term.
     */
    public function forBranch(
        ?string $userBranch,
        ?string $userId,
        ?string $search
    ): array {
        $sql = '
            SELECT
                d.user_id,
                d.doc_key,
                d.category AS db_category,
                d.document_data,
                d.notes
            FROM ' . self::TABLE . ' d
            INNER JOIN users u ON u.id = d.user_id
            WHERE 1 = 1
        ';

        $params = [];

        if ($userId !== null && $userId !== '') {
            $sql .= ' AND d.user_id = :user_id';
            $params['user_id'] = $userId;
        }

        if ($userBranch !== null && $userBranch !== '' && $userBranch !== 'all') {
            $sql .= ' AND u.branch_id = :branch_id';
            $params['branch_id'] = $userBranch;
        }

        if ($search !== null && trim($search) !== '') {
            $sql .= ' AND (
                d.doc_key LIKE :search_key
                OR d.notes LIKE :search_notes
                OR d.document_data LIKE :search_data
            )';

            $term = '%' . trim($search) . '%';
            $params['search_key'] = $term;
            $params['search_notes'] = $term;
            $params['search_data'] = $term;
        }

        $stmt = $this->db->prepare($sql . ' ORDER BY d.doc_key');
        $stmt->execute($params);

        return $this->mapDocuments($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    /**
     * Return board files belonging to a specific user and category.
     */
    public function forBodFiles(
        string $userId,
        ?string $category
    ): array {
        $sql = '
            SELECT
                d.user_id,
                d.doc_key,
                d.category AS db_category,
                d.document_data,
                d.notes
            FROM ' . self::TABLE . ' d
            INNER JOIN users u ON u.id = d.user_id
            WHERE d.user_id = :user_id
        ';

        $params = ['user_id' => $userId];

        if ($category !== null && $category !== '') {
            $sql .= ' AND d.category = :category';
            $params['category'] = $category;
        }

        BranchScope::appendCondition($sql, $params, 'u.branch_id');

        $stmt = $this->db->prepare($sql . ' ORDER BY d.doc_key');
        $stmt->execute($params);

        return $this->mapDocuments($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    /**
     * Save a complete resolution record in document_data.
     */
    public function save(
        string $userId,
        string $docKey,
        array $document,
        ?string $notes,
        ?string $category
    ): void {
        $document['id'] = (string)($document['id'] ?? $docKey);
        $document['user_id'] = $userId;
        $document['doc_key'] = $docKey;
        $document['category'] = $category
            ?? ($document['category'] ?? 'General');
        $document['notes'] = $notes ?? ($document['notes'] ?? null);

        $document['resolution_no'] =
            (string)($document['resolution_no'] ?? '');

        $document['title'] =
            (string)($document['title'] ?? $document['name'] ?? '');

        $document['resolution_date'] =
            (string)($document['resolution_date'] ?? '');

        $document['meeting_type'] =
            (string)($document['meeting_type'] ?? '');

        $document['status'] =
            (string)($document['status'] ?? 'Pending Signature');

        $document['signatories'] =
            $document['signatories'] ?? null;

        $document['file_name'] =
            (string)($document['file_name'] ?? $document['name'] ?? '');

        $document['file_type'] =
            $document['file_type'] ?? $document['type'] ?? null;

        $document['field_type'] =
            $document['field_type'] ?? $this->resolveFieldType(
                (string)($document['file_type'] ?? '')
            );

        $document['file_size'] =
            (int)($document['file_size'] ?? $document['size'] ?? 0);

        $document['size'] = (int)($document['size']
            ?? $document['file_size']);

        $document['uploaded_at'] =
            (string)($document['uploaded_at'] ?? date('c'));

        $document['uploaded_by'] =
            $document['uploaded_by'] ?? $userId;

        $document['tags'] = is_array($document['tags'] ?? null)
            ? $document['tags']
            : [];

        $stmt = $this->db->prepare('
            INSERT INTO ' . self::TABLE . '
                (user_id, board_resolution_no, doc_key, category, document_data, notes)
            VALUES
                (:user_id, :board_resolution_no, :doc_key, :category, :document_data, :notes)
            ON DUPLICATE KEY UPDATE
                category = VALUES(category),
                document_data = VALUES(document_data),
                notes = VALUES(notes)
        ');

        $stmt->execute([
            'user_id' => $userId,
            'doc_key' => $docKey,
            'category' => $document['category'],
            'board_resolution_no' => $document['resolution_no'],
            'document_data' => json_encode(
                $document,
                JSON_THROW_ON_ERROR
                    | JSON_UNESCAPED_SLASHES
                    | JSON_UNESCAPED_UNICODE
            ),
            'notes' => $document['notes'],
        ]);
    }

    public function delete(string $userId, string $docKey): bool
    {
        $stmt = $this->db->prepare(
            'DELETE FROM ' . self::TABLE . '
             WHERE user_id = :user_id AND doc_key = :doc_key'
        );

        $stmt->execute([
            'user_id' => $userId,
            'doc_key' => $docKey,
        ]);

        return $stmt->rowCount() > 0;
    }

    /**
     * Convert stored JSON records into consistent BoardResolution objects.
     */
    private function mapDocuments(array $rows): array
    {
        $documents = [];

        foreach ($rows as $row) {
            $document = json_decode(
                $row['document_data'] ?? '{}',
                true,
                512,
                JSON_THROW_ON_ERROR
            );

            if (!is_array($document)) {
                continue;
            }

            $document['id'] = (string)(
                $document['id'] ?? $row['doc_key']
            );

            $document['user_id'] = (string)$row['user_id'];
            $document['doc_key'] = (string)$row['doc_key'];

            $document['category'] = (string)(
                $document['category']
                ?? $row['db_category']
                ?? 'General'
            );

            $document['resolution_no'] =
                (string)($document['resolution_no'] ?? '');

            $document['title'] = (string)(
                $document['title'] ?? $document['name'] ?? ''
            );

            $document['resolution_date'] =
                (string)($document['resolution_date'] ?? '');

            $document['meeting_type'] =
                (string)($document['meeting_type'] ?? '');

            $validStatuses = [
                'Approved',
                'Adopted',
                'Pending Signature',
                'Superseded',
            ];

            if (!in_array($document['status'] ?? null, $validStatuses, true)) {
                $document['status'] = 'Pending Signature';
            }

            $document['signatories'] =
                $document['signatories'] ?? null;

            $document['file_name'] = (string)(
                $document['file_name'] ?? $document['name'] ?? ''
            );

            $document['file_type'] =
                $document['file_type'] ?? $document['type'] ?? null;

            $document['field_type'] =
                $document['field_type'] ?? $this->resolveFieldType(
                    (string)($document['file_type'] ?? '')
                );

            $document['file_size'] = (int)(
                $document['file_size'] ?? $document['size'] ?? 0
            );

            $document['size'] = (int)(
                $document['size'] ?? $document['file_size']
            );

            $document['uploaded_at'] =
                (string)($document['uploaded_at'] ?? '');

            $document['uploaded_by'] =
                $document['uploaded_by'] ?? null;

            $document['notes'] =
                $row['notes'] ?? $document['notes'] ?? null;

            $document['tags'] = is_array($document['tags'] ?? null)
                ? $document['tags']
                : [];

            $documents[] = $document;
        }

        return $documents;
    }

    private function resolveFieldType(string $mimeType): string
    {
        $mimeType = strtolower($mimeType);

        if ($mimeType === 'application/pdf') {
            return 'PDF';
        }

        if (str_starts_with($mimeType, 'image/')) {
            return 'Image';
        }

        if (in_array($mimeType, [
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'application/rtf',
        ], true)) {
            return 'Document';
        }

        return 'File';
    }
}
