<?php

namespace App\Entity;

use App\Repository\InAppNotificationRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: InAppNotificationRepository::class)]
#[ORM\Table(name: 'in_app_notifications')]
#[ORM\Index(name: 'idx_notif_user', columns: ['user_id', 'is_read'])]
#[ORM\Index(name: 'idx_notif_created', columns: ['created_at'])]
class InAppNotification
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    private Uuid $id;

    #[ORM\ManyToOne(targetEntity: Tenant::class)]
    #[ORM\JoinColumn(name: 'tenant_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private Tenant $tenant;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private User $user;

    #[ORM\ManyToOne(targetEntity: Ticket::class)]
    #[ORM\JoinColumn(name: 'ticket_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?Ticket $ticket = null;

    #[ORM\Column(length: 150)]
    private string $title;

    #[ORM\Column(type: 'text')]
    private string $message;

    #[ORM\Column(type: 'boolean', options: ['default' => false])]
    private bool $isRead = false;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    public function __construct(Tenant $tenant, User $user, string $title, string $message, ?Ticket $ticket = null)
    {
        $this->id = Uuid::v4();
        $this->tenant = $tenant;
        $this->user = $user;
        $this->title = $title;
        $this->message = $message;
        $this->ticket = $ticket;
        $this->isRead = false;
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): Uuid
    {
        return $this->id;
    }

    public function getTenant(): Tenant
    {
        return $this->tenant;
    }

    public function getUser(): User
    {
        return $this->user;
    }

    public function getTicket(): ?Ticket
    {
        return $this->ticket;
    }

    public function getTitle(): string
    {
        return $this->title;
    }

    public function getMessage(): string
    {
        return $this->message;
    }

    public function isRead(): bool
    {
        return $this->isRead;
    }

    public function setIsRead(bool $isRead): self
    {
        $this->isRead = $isRead;
        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }
}
