<?php

namespace App\Controller;

use App\Entity\NotificationSetting;
use App\Entity\User;
use App\Service\AuthorizationService;
use App\Service\NotificationService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/notifications')]
class NotificationController extends AbstractController
{
    public function __construct(
        private readonly NotificationService $notifService,
        private readonly AuthorizationService $authService
    ) {
    }

    #[Route('/settings', name: 'api_notif_settings_list', methods: ['GET'])]
    public function listSettings(#[CurrentUser] User $user): JsonResponse
    {
        $this->authService->assertPermission($user, 'settings.view');

        $settings = $this->notifService->getSettings($user->getTenant());

        $data = array_map(function (NotificationSetting $s) {
            return [
                'id' => (string) $s->getId(),
                'eventKey' => $s->getEventKey(),
                'recipientType' => $s->getRecipientType(),
                'email' => $s->isChannelEmail(),
                'inApp' => $s->isChannelInApp(),
                'push' => $s->isChannelPush(),
                'isActive' => $s->isActive()
            ];
        }, $settings);

        return new JsonResponse(['items' => $data]);
    }

    #[Route('/settings', name: 'api_notif_settings_update', methods: ['PUT'])]
    public function updateSettings(Request $request, #[CurrentUser] User $user): JsonResponse
    {
        $this->authService->assertPermission($user, 'settings.manage');

        $body = json_decode($request->getContent(), true);
        if (!is_array($body) || !isset($body['items'])) {
            return new JsonResponse(['error' => ['message' => 'Lista de configurações inválida.']], Response::HTTP_BAD_REQUEST);
        }

        $this->notifService->updateSettings($user->getTenant(), $body['items']);

        return new JsonResponse(['success' => true]);
    }

    #[Route('/in-app', name: 'api_notif_user_list', methods: ['GET'])]
    public function userNotifications(#[CurrentUser] User $user): JsonResponse
    {
        $result = $this->notifService->getUserNotifications($user);
        return new JsonResponse($result);
    }

    #[Route('/in-app/{id}/read', name: 'api_notif_mark_read', methods: ['PATCH'])]
    public function markAsRead(string $id, #[CurrentUser] User $user): JsonResponse
    {
        $success = $this->notifService->markAsRead($id, $user);
        if (!$success) {
            return new JsonResponse(['error' => ['message' => 'Notificação não encontrada.']], Response::HTTP_NOT_FOUND);
        }
        return new JsonResponse(['success' => true]);
    }

    #[Route('/test', name: 'api_notif_send_test', methods: ['POST'])]
    public function sendTest(#[CurrentUser] User $user): JsonResponse
    {
        $notif = $this->notifService->sendTestNotification($user);

        return new JsonResponse([
            'success' => true,
            'notification' => [
                'id' => (string) $notif->getId(),
                'title' => $notif->getTitle(),
                'message' => $notif->getMessage(),
                'createdAt' => $notif->getCreatedAt()->format(\DateTimeInterface::ATOM)
            ]
        ]);
    }
}
