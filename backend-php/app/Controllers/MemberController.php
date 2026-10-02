<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Models\MemberRepository;
use PDO;

class MemberController extends BaseController
{
    private MemberRepository $members;

    public function __construct(PDO $db)
    {
        parent::__construct($db);
        $this->members = new MemberRepository($db);
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
        if (empty($input['doc_key']) && empty($input['field_key'])) {
            $this->error('Document key (doc_key or field_key) is required.', 422);
        }

        $docKey = (string)($input['doc_key'] ?? $input['field_key']);
        $docData = [
            'name'        => $input['name'] ?? 'Uploaded Document',
            'type'        => $input['type'] ?? $input['file_type'] ?? 'application/octet-stream',
            'dataUrl'     => $input['dataUrl'] ?? $input['data_url'] ?? '',
            'size'        => (int)($input['size'] ?? 0),
            'uploaded_at' => $input['uploaded_at'] ?? date('c'),
        ];

        $updated = $this->members->updateMemberDocument($id, $docKey, $docData);
        if (!$updated) {
            $this->error('Failed to attach document to member profile.', 400);
        }

        $this->success($updated, 'Document attached to member profile successfully.');
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
