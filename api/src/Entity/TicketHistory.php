<?php

namespace App\Entity;

use App\Repository\TicketHistoryRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: TicketHistoryRepository::class)]
#[ORM\Table(name: 'ticket_history')]
#[ORM\Index(name: 'idx_history_ticket', columns: ['ticket_id', 'created_at'])]
class TicketHistory
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    private Uuid $id;

    #[ORM\ManyToOne(targetEntity: Ticket::class)]
    #[ORM\JoinColumn(name: 'ticket_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private Ticket $ticket;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'actor_id', referencedColumnName: 'id', nullable: false)]
    private User $actor;

    #[ORM\Column(length: 80)]
    private string $action;

    /** @var array<string, mixed>|null */
    #[ORM\Column(type: 'json', nullable: true)]
    private ?array $beforeState = null;

    /** @var array<string, mixed>|null */
    #[ORM\Column(type: 'json', nullable: true)]
    private ?array $afterState = null;

    /** @var array<string, mixed>|null */
    #[ORM\Column(type: 'json', nullable: true)]
    private ?array $metadata = null;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    public function __construct(
        Ticket $ticket,
        User $actor,
        string $action,
        ?array $beforeState = null,
        ?array $afterState = null,
        ?array $metadata = null
    ) {
        $this->id = Uuid::v4();
        $this->ticket = $ticket;
        $this->actor = $actor;
        $this->action = $action;
        $this->beforeState = $beforeState;
        $this->afterState = $afterState;
        $this->metadata = $metadata;
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): Uuid
    {
        return $this->id;
    }

    public function getTicket(): Ticket
    {
        return $this->ticket;
    }

    public function getActor(): User
    {
        return $this->actor;
    }

    public function getAction(): string
    {
        return $this->action;
    }

    public function getBeforeState(): ?array
    {
        return $this->beforeState;
    }

    public function getAfterState(): ?array
    {
        return $this->afterState;
    }

    public function getMetadata(): ?array
    {
        return $this->metadata;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }
}
