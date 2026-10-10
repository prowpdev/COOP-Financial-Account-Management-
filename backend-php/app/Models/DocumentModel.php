<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\BranchScope;
use PDO;

class DocumentModel
{
    protected const TABLE = 'user_documents';

    public function __construct(private PDO $db)
    {
    }

    public function forUser(string $userId): array
    {
        $sql = '
            SELECT d.doc_key, d.document_data, d.notes
            FROM user_documents d
            INNER JOIN users u ON u.id = d.user_id
            WHERE d.user_id = :user_id
        ';
        $params = ['user_id' => $userId];
        BranchScope::appendCondition($sql, $params, 'u.branch_id');
        $stmt = $this->db->prepare($sql . ' ORDER BY d.doc_key');
        $stmt->execute($params);

        $documents = [];
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $document = json_decode($row['document_data'], true, 512, JSON_THROW_ON_ERROR);
            $document['notes'] = $row['notes'];
            $documents[$row['doc_key']] = $document;
        }

        return $documents;
    }

    public function save(string $userId, string $docKey, array $document, ?string $notes): void
    {
        $stmt = $this->db->prepare('
            INSERT INTO user_documents (user_id, doc_key, document_data, notes)
            VALUES (:user_id, :doc_key, :document_data, :notes)
            ON DUPLICATE KEY UPDATE
                document_data = VALUES(document_data),
                notes = VALUES(notes)
        ');
        $stmt->execute([
            'user_id' => $userId,
            'doc_key' => $docKey,
            'document_data' => json_encode(
                $document,
                JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
            ),
            'notes' => $notes,
        ]);
    }

    public function delete(string $userId, string $docKey): bool
    {
        $stmt = $this->db->prepare(
            'DELETE FROM user_documents WHERE user_id = ? AND doc_key = ?'
        );
        $stmt->execute([$userId, $docKey]);
        return $stmt->rowCount() > 0;
    }
}
