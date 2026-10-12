<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Models\MemberTypeModel;
use PDO;
use PDOException;

class MemberTypeController extends BaseController
{
    private MemberTypeModel $memberTypes;

    public function __construct(PDO $db)
    {
        parent::__construct($db);
        $this->memberTypes = new MemberTypeModel($db);
    }

    /**
     * GET /api/member-types
     */
    public function index(): never
    {
        $coopId = $this->getQuery('coop_id');
        $status = $this->getQuery('status');

        $result = $this->memberTypes->all($coopId);

        $this->json([
            'success' => true,
            'data' => $result,
            'total' => count($result),
        ]);
    }

    /**
     * GET /api/member-types/:id
     */
    public function show(string $id): never
    {
        $memberType = $this->memberTypes->find($id);

        if (!$memberType) {
            $this->error('Member type not found.', 404);
        }

        $this->success($memberType);
    }

    /**
     * POST /api/member-types
     */
    public function store(): never
    {
        $input = $this->getRequestBody();

        $data = $this->validateInput($input);

        try {
            $created = $this->memberTypes->create($data);

            $this->success(
                $created,
                'Member type created successfully.',
                201
            );
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') {
                $this->error(
                    'Member type ID already exists or the cooperative is invalid.',
                    409
                );
            }

            throw $e;
        }
    }

    /**
     * PUT /api/member-types/:id
     */
    public function update(string $id): never
    {
        $existing = $this->memberTypes->find($id);

        if (!$existing) {
            $this->error('Member type not found.', 404);
        }

        $input = $this->getRequestBody();

        $merged = array_merge($existing, $input);
        $data = $this->validateInput($merged);

        try {
            $updated = $this->memberTypes->update($id, $data);

            if (!$updated) {
                $this->error('Member type not found.', 404);
            }

            $this->success(
                $updated,
                'Member type updated successfully.'
            );
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') {
                $this->error(
                    'The cooperative assignment is invalid.',
                    409
                );
            }

            throw $e;
        }
    }

    /**
     * DELETE /api/member-types/:id
     */
    public function destroy(string $id): never
    {
        try {
            $deleted = $this->memberTypes->delete($id);

            if (!$deleted) {
                $this->error('Member type not found.', 404);
            }

            $this->success(
                ['id' => $id],
                'Member type deleted successfully.'
            );
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') {
                $this->error(
                    'This member type is assigned to existing records and cannot be deleted.',
                    409
                );
            }

            throw $e;
        }
    }

/**
 * Validate and normalize member type input.
 */
private function validateInput(array $input): array
{
    $name = trim((string) ($input['name'] ?? ''));
    $code = trim((string) ($input['code'] ?? ''));
    $coopId = trim((string) ($input['coop_id'] ?? ''));
    $description = trim((string) ($input['description'] ?? ''));

    if ($name === '') {
        $this->error('Member type name is required.', 422);
    }

    if ($code === '') {
        $this->error('Member type code is required.', 422);
    }

    if (strlen($code) > 20) {
        $this->error('Member type code must not exceed 20 characters.', 422);
    }

    if ($coopId === '') {
        $this->error('Cooperative assignment is required.', 422);
    }

    $votingRights = filter_var(
        $input['voting_rights'] ?? 1,
        FILTER_VALIDATE_INT
    );

    $loanEligibility = filter_var(
        $input['loan_eligibility'] ?? 1,
        FILTER_VALIDATE_INT
    );

    $active = filter_var(
        $input['active'] ?? 1,
        FILTER_VALIDATE_INT
    );

    foreach ([
        'Voting rights' => $votingRights,
        'Loan eligibility' => $loanEligibility,
        'Active' => $active,
    ] as $label => $value) {
        if ($value === false || !in_array($value, [0, 1], true)) {
            $this->error("$label must be 0 or 1.", 422);
        }
    }

    $minShareCapital = $input['min_share_capital'] ?? 1000;
    $savingsRequirement = $input['savings_requirement'] ?? 500;

    if (
        !is_numeric($minShareCapital) ||
        !is_finite((float) $minShareCapital) ||
        (float) $minShareCapital < 0
    ) {
        $this->error(
            'Minimum share capital must be a non-negative number.',
            422
        );
    }

    if (
        !is_numeric($savingsRequirement) ||
        !is_finite((float) $savingsRequirement) ||
        (float) $savingsRequirement < 0
    ) {
        $this->error(
            'Savings requirement must be a non-negative number.',
            422
        );
    }

    // $requiredDocuments = $input['required_documents'] ?? [];
    $document_array = explode(',', $input['required_documents']);
    $document_array = array_map('trim', $document_array);
    $requiredDocuments = json_encode($document_array);


    if (is_string($requiredDocuments)) {
        $requiredDocuments = json_decode(
            $requiredDocuments,
            true
        );

        if (json_last_error() !== JSON_ERROR_NONE) {
            $this->error(
                'Required documents must contain valid JSON.',
                422
            );
        }
    }

    if (
        !is_array($requiredDocuments) &&
        $requiredDocuments !== null
    ) {
        $this->error(
            'Required documents must be an array or null.',
            422
        );
    }

    return [
        'coop_id' => $coopId,
        'name' => $name,
        'code' => $code,
        'description' => $description !== '' ? $description : null,
        'voting_rights' => $votingRights,
        'min_share_capital' => number_format(
            (float) $minShareCapital,
            2,
            '.',
            ''
        ),
        'savings_requirement' => number_format(
            (float) $savingsRequirement,
            2,
            '.',
            ''
        ),
        'loan_eligibility' => $loanEligibility,
        'required_documents' => $requiredDocuments === null
            ? null
            : json_encode(
                $requiredDocuments,
                JSON_THROW_ON_ERROR
            ),
        'active' => $active,
    ];
}
}