<?php

namespace App\Entity;

use App\Repository\NotificationSettingRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: NotificationSettingRepository::class)]
#[ORM\Table(name: 'notification_settings')]
#[ORM\Index(name: 'idx_notif_tenant', columns: ['tenant_id'])]
class NotificationSetting
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    private Uuid $id;

    #[ORM\ManyToOne(targetEntity: Tenant::class)]
    #[ORM\JoinColumn(name: 'tenant_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private Tenant $tenant;

    #[ORM\Column(length: 80)]
    private string $eventKey;

    #[ORM\Column(length: 20)]
    private string $recipientType; // 'requester' or 'agent'

    #[ORM\Column(type: 'boolean', options: ['default' => true])]
    private bool $channelEmail = true;

    #[ORM\Column(type: 'boolean', options: ['default' => true])]
    private bool $channelInApp = true;

    #[ORM\Column(type: 'boolean', options: ['default' => false])]
    private bool $channelPush = false;

    #[ORM\Column(type: 'boolean', options: ['default' => true])]
    private bool $isActive = true;

    #[ORM\Column]
    private \DateTimeImmutable $updatedAt;

    public function __construct(
        Tenant $tenant,
        string $eventKey,
        string $recipientType,
        bool $channelEmail = true,
        bool $channelInApp = true,
        bool $channelPush = false
    ) {
        $this->id = Uuid::v4();
        $this->tenant = $tenant;
        $this->eventKey = $eventKey;
        $this->recipientType = $recipientType;
        $this->channelEmail = $channelEmail;
        $this->channelInApp = $channelInApp;
        $this->channelPush = $channelPush;
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function getId(): Uuid
    {
        return $this->id;
    }

    public function getTenant(): Tenant
    {
        return $this->tenant;
    }

    public function getEventKey(): string
    {
        return $this->eventKey;
    }

    public function getRecipientType(): string
    {
        return $this->recipientType;
    }

    public function isChannelEmail(): bool
    {
        return $this->channelEmail;
    }

    public function setChannelEmail(bool $channelEmail): self
    {
        $this->channelEmail = $channelEmail;
        $this->updatedAt = new \DateTimeImmutable();
        return $this;
    }

    public function isChannelInApp(): bool
    {
        return $this->channelInApp;
    }

    public function setChannelInApp(bool $channelInApp): self
    {
        $this->channelInApp = $channelInApp;
        $this->updatedAt = new \DateTimeImmutable();
        return $this;
    }

    public function isChannelPush(): bool
    {
        return $this->channelPush;
    }

    public function setChannelPush(bool $channelPush): self
    {
        $this->channelPush = $channelPush;
        $this->updatedAt = new \DateTimeImmutable();
        return $this;
    }

    public function isActive(): bool
    {
        return $this->isActive;
    }

    public function setIsActive(bool $isActive): self
    {
        $this->isActive = $isActive;
        $this->updatedAt = new \DateTimeImmutable();
        return $this;
    }

    public function getUpdatedAt(): \DateTimeImmutable
    {
        return $this->updatedAt;
    }
}
