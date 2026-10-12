<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Models\CooperativeModel;
use InvalidArgumentException;
use PDO;
use Throwable;

class CooperativeController extends BaseController
{
    private CooperativeModel $cooperative;

    public function __construct(PDO $db)
    {
        parent::__construct($db);
        $this->cooperative = new CooperativeModel($db);
    }

    /**
     * GET /api/cooperatives
     * List all cooperatives.
     */
    public function index(): never
    {
        $this->success($this->cooperative->all());
    }

    /**
     * GET /api/cooperatives/{id}
     * Show one cooperative.
     */
    public function show(string $id): never
    {
        $cooperative = $this->cooperative->find($id);

        if (!$cooperative) {
            $this->error('Cooperative not found.', 404);
        }

        $this->success($cooperative);
    }

    /**
     * POST /api/cooperatives
     * Create a cooperative.
     */
    public function create(): never
    {
        $input = $this->addTransactionContext(
            $this->getRequestBody()
        );

        if (empty(trim((string) ($input['name'] ?? '')))) {
            $this->error('Cooperative name is required.', 422);
        }

        try {
            $cooperative = $this->cooperative->create($input);

            $this->success(
                $cooperative,
                'Cooperative created successfully.',
                201
            );
        } catch (InvalidArgumentException $e) {
            $this->error($e->getMessage(), 422);
        } catch (Throwable $e) {
            $this->error('Failed to create cooperative.', 500);
        }
    }

    /**
     * PUT/PATCH /api/cooperatives/{id}
     * Update a cooperative.
     */
    public function update(string $id): never
    {
        $input = $this->addTransactionContext(
            $this->getRequestBody()
        );

        if (array_key_exists('name', $input) &&
            trim((string) $input['name']) === '') {
            $this->error('Cooperative name is required.', 422);
        }

        try {
            $cooperative = $this->cooperative->update($id, $input);

            if (!$cooperative) {
                $this->error('Cooperative not found.', 404);
            }

            $this->success(
                $cooperative,
                'Cooperative updated successfully.'
            );
        } catch (InvalidArgumentException $e) {
            $this->error($e->getMessage(), 422);
        } catch (Throwable $e) {
            $this->error('Failed to update cooperative.', 500);
        }
    }

    /**
     * DELETE /api/cooperatives/{id}
     * Delete a cooperative.
     */
    public function delete(string $id): never
    {
        try {
            if (!$this->cooperative->delete($id)) {
                $this->error('Cooperative not found.', 404);
            }

            $this->success(
                ['id' => $id],
                'Cooperative deleted successfully.'
            );
        } catch (Throwable $e) {
            $this->error(
                'Failed to delete cooperative. It may be referenced by other records.',
                409
            );
        }
    }
}
