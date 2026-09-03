<?php

namespace App\Entity;

use App\Repository\SatisfactionSurveyRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: SatisfactionSurveyRepository::class)]
#[ORM\Table(name: 'satisfaction_surveys')]
#[ORM\Index(name: 'idx_survey_tenant', columns: ['tenant_id'])]
#[ORM\Index(name: 'idx_survey_ticket', columns: ['ticket_id'])]
class SatisfactionSurvey
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    private Uuid $id;

    #[ORM\ManyToOne(targetEntity: Tenant::class)]
    #[ORM\JoinColumn(name: 'tenant_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private Tenant $tenant;

    #[ORM\OneToOne(targetEntity: Ticket::class)]
    #[ORM\JoinColumn(name: 'ticket_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private Ticket $ticket;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private User $user;

    #[ORM\Column(type: 'smallint')]
    private int $score; // 1 to 5

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $comment = null;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    public function __construct(Tenant $tenant, Ticket $ticket, User $user, int $score, ?string $comment = null)
    {
        $this->id = Uuid::v4();
        $this->tenant = $tenant;
        $this->ticket = $ticket;
        $this->user = $user;
        $this->score = max(1, min(5, $score));
        $this->comment = $comment;
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

    public function getTicket(): Ticket
    {
        return $this->ticket;
    }

    public function getUser(): User
    {
        return $this->user;
    }

    public function getScore(): int
    {
        return $this->score;
    }

    public function getComment(): ?string
    {
        return $this->comment;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }
}
