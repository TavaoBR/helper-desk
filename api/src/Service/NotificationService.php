<?php

namespace App\Service;

use App\Entity\InAppNotification;
use App\Entity\NotificationSetting;
use App\Entity\Tenant;
use App\Entity\Ticket;
use App\Entity\User;
use App\Repository\InAppNotificationRepository;
use App\Repository\NotificationSettingRepository;
use Doctrine\ORM\EntityManagerInterface;

class NotificationService
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly NotificationSettingRepository $settingRepo,
        private readonly InAppNotificationRepository $notifRepo
    ) {
    }

    /**
     * @return NotificationSetting[]
     */
    public function getSettings(Tenant $tenant): array
    {
        $this->ensureDefaultSettings($tenant);
        return $this->settingRepo->findByTenant($tenant);
    }

    public function updateSettings(Tenant $tenant, array $settingsData): void
    {
        foreach ($settingsData as $data) {
            if (empty($data['id'])) {
                continue;
            }
            $setting = $this->settingRepo->findOneBy(['id' => $data['id'], 'tenant' => $tenant]);
            if ($setting) {
                if (isset($data['email'])) {
                    $setting->setChannelEmail((bool) $data['email']);
                }
                if (isset($data['inApp'])) {
                    $setting->setChannelInApp((bool) $data['inApp']);
                }
                if (isset($data['push'])) {
                    $setting->setChannelPush((bool) $data['push']);
                }
            }
        }
        $this->em->flush();
    }

    public function notifyUser(Tenant $tenant, User $user, string $title, string $message, ?Ticket $ticket = null): InAppNotification
    {
        $notif = new InAppNotification($tenant, $user, $title, $message, $ticket);
        $this->em->persist($notif);
        $this->em->flush();
        return $notif;
    }

    /**
     * @return array{items: array<int, array<string, mixed>>, unreadCount: int}
     */
    public function getUserNotifications(User $user): array
    {
        $items = $this->notifRepo->findByUser($user, 20);
        $unreadCount = $this->notifRepo->countUnreadByUser($user);

        return [
            'unreadCount' => $unreadCount,
            'items' => array_map(fn(InAppNotification $n) => [
                'id' => (string) $n->getId(),
                'title' => $n->getTitle(),
                'message' => $n->getMessage(),
                'isRead' => $n->isRead(),
                'ticketId' => $n->getTicket() ? (string) $n->getTicket()->getId() : null,
                'ticketProtocol' => $n->getTicket()?->getProtocol(),
                'createdAt' => $n->getCreatedAt()->format(\DateTimeInterface::ATOM)
            ], $items)
        ];
    }

    public function markAsRead(string $id, User $user): bool
    {
        $notif = $this->notifRepo->findOneBy(['id' => $id, 'user' => $user]);
        if ($notif) {
            $notif->setIsRead(true);
            $this->em->flush();
            return true;
        }
        return false;
    }

    public function sendTestNotification(User $user): InAppNotification
    {
        return $this->notifyUser(
            $user->getTenant(),
            $user,
            'Teste de Notificação SupportFlow',
            'Sua central de notificações está operando com sucesso! Disparado em ' . (new \DateTimeImmutable())->format('d/m/Y H:i:s') . '.'
        );
    }

    private function ensureDefaultSettings(Tenant $tenant): void
    {
        $existing = $this->settingRepo->findByTenant($tenant);
        if (!empty($existing)) {
            return;
        }

        $defaults = [
            ['req-created', 'Abertura de Chamado', 'requester', true, true, false],
            ['req-assigned', 'Chamado Atribuído a um Técnico', 'requester', true, true, true],
            ['req-comment', 'Nova Resposta da Equipe de Suporte', 'requester', true, true, true],
            ['req-resolved', 'Chamado Resolvido (com Pesquisa CSAT)', 'requester', true, true, false],
            ['req-closed', 'Encerramento Definitivo', 'requester', false, true, false],
            ['agent-assigned', 'Chamado Atribuído a Você', 'agent', true, true, true],
            ['agent-customer-reply', 'Resposta do Solicitante', 'agent', true, true, true],
            ['agent-sla-warning', 'Alerta Preventivo de SLA (80% do prazo)', 'agent', true, true, true],
            ['agent-sla-breached', 'Violação de Prazo de SLA', 'agent', true, true, true],
        ];

        foreach ($defaults as $d) {
            $setting = new NotificationSetting($tenant, $d[0], $d[2], $d[3], $d[4], $d[5]);
            $this->em->persist($setting);
        }

        $this->em->flush();
    }
}
