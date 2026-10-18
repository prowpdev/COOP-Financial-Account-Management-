<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Models\NotificationModel;
use PDO;
use InvalidArgumentException;

class NotificationController extends BaseController
{
    private NotificationModel $notifications;

    public function __construct(PDO $db)
    {
        parent::__construct($db);

        $this->notifications = new NotificationModel($db);
    }

    public function index(): never
    {
        $userId = $this->getAuthenticatedUserId();
        $branchId = $this->getCurrentUserBranchId();
        $this->success($this->notifications->forBranch($userId,$branchId));
    }

    public function show(string $id): never
    {
        $notification = $this->notifications->find($id);

        if ($notification === null) {
            $this->error('Notification not found.', 404);
        }

        $this->success($notification);
    }

    public function store(): never
    {
        $input = $this->getRequestBody();

        try {
            $notification = $this->notifications->create($input);

            $this->success(
                $notification,
                'Notification created successfully.',
                201
            );
        } catch (InvalidArgumentException $e) {
            $this->error($e->getMessage(), 422);
        }
    }

    public function markAsRead(string $id): never
    {
        $notification = $this->notifications->find($id);

        if ($notification === null) {
            $this->error('Notification not found.', 404);
        }

        $this->notifications->markAsRead($id);

        $this->success(
            $this->notifications->find($id),
            'Notification marked as read.'
        );
    }

    public function updateStatus(string $id): never
    {
        $input = $this->getRequestBody();

        if (empty($input['status'])) {
            $this->error('Notification status is required.', 422);
        }

        try {
            $updated = $this->notifications->updateStatus(
                $id,
                (string) $input['status']
            );

            if (!$updated && $this->notifications->find($id) === null) {
                $this->error('Notification not found.', 404);
            }

            $this->success(
                $this->notifications->find($id),
                'Notification status updated successfully.'
            );
        } catch (InvalidArgumentException $e) {
            $this->error($e->getMessage(), 422);
        }
    }

    public function unreadCount(): never
    {
        $cooperativeId = (string) ($_GET['cooperative_id'] ?? '');
        $branchId = isset($_GET['branch_id'])
            ? (string) $_GET['branch_id']
            : null;
        $userId = isset($_GET['user_id'])
            ? (string) $_GET['user_id']
            : null;

        if ($cooperativeId === '') {
            $this->error('Cooperative ID is required.', 422);
        }

        $this->success([
            'unread_count' => $this->notifications->unreadCount(
                $cooperativeId,
                $branchId,
                $userId
            ),
        ]);
    }

    public function destroy(string $id): never
    {
        if (!$this->notifications->delete($id)) {
            $this->error('Notification not found.', 404);
        }

        $this->success(null, 'Notification deleted successfully.');
    }
}