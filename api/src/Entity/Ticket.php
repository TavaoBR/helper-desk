<?php

namespace App\Entity;

use App\Repository\TicketRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: TicketRepository::class)]
#[ORM\Table(name: 'tickets')]
#[ORM\UniqueConstraint(name: 'uniq_ticket_tenant_protocol', columns: ['tenant_id', 'protocol'])]
#[ORM\Index(name: 'idx_ticket_tenant_created', columns: ['tenant_id', 'created_at'])]
#[ORM\Index(name: 'idx_ticket_tenant_stage', columns: ['tenant_id', 'current_stage_id'])]
#[ORM\Index(name: 'idx_ticket_tenant_priority', columns: ['tenant_id', 'priority_id'])]
#[ORM\Index(name: 'idx_ticket_tenant_assigned', columns: ['tenant_id', 'assigned_user_id'])]
#[ORM\Index(name: 'idx_ticket_tenant_requester', columns: ['tenant_id', 'requester_id'])]
class Ticket
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    private Uuid $id;

    #[ORM\ManyToOne(targetEntity: Tenant::class)]
    #[ORM\JoinColumn(name: 'tenant_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private Tenant $tenant;

    #[ORM\Column(length: 40)]
    private string $protocol;

    #[ORM\Column(length: 200)]
    private string $title;

    #[ORM\Column(type: 'text')]
    private string $description;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'requester_id', referencedColumnName: 'id', nullable: false)]
    private User $requester;

    #[ORM\ManyToOne(targetEntity: Department::class)]
    #[ORM\JoinColumn(name: 'department_id', referencedColumnName: 'id', nullable: false)]
    private Department $department;

    #[ORM\ManyToOne(targetEntity: TicketType::class)]
    #[ORM\JoinColumn(name: 'type_id', referencedColumnName: 'id', nullable: false)]
    private TicketType $type;

    #[ORM\ManyToOne(targetEntity: Category::class)]
    #[ORM\JoinColumn(name: 'category_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?Category $category = null;

    #[ORM\ManyToOne(targetEntity: Priority::class)]
    #[ORM\JoinColumn(name: 'priority_id', referencedColumnName: 'id', nullable: false)]
    private Priority $priority;

    #[ORM\ManyToOne(targetEntity: Pipeline::class)]
    #[ORM\JoinColumn(name: 'pipeline_id', referencedColumnName: 'id', nullable: false)]
    private Pipeline $pipeline;

    #[ORM\ManyToOne(targetEntity: PipelineStage::class)]
    #[ORM\JoinColumn(name: 'current_stage_id', referencedColumnName: 'id', nullable: false)]
    private PipelineStage $currentStage;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'assigned_user_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?User $assignedUser = null;

    #[ORM\Version]
    #[ORM\Column(type: 'integer')]
    private int $version = 1;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column]
    private \DateTimeImmutable $updatedAt;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $resolvedAt = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $closedAt = null;

    #[ORM\ManyToOne(targetEntity: SlaPolicy::class)]
    #[ORM\JoinColumn(name: 'sla_policy_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?SlaPolicy $slaPolicy = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $slaDueDate = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $slaFirstResponseDueDate = null;

    #[ORM\Column(type: 'boolean', options: ['default' => false])]
    private bool $slaBreached = false;

    public function __construct(
        Tenant $tenant,
        string $protocol,
        string $title,
        string $description,
        User $requester,
        Department $department,
        TicketType $type,
        Priority $priority,
        Pipeline $pipeline,
        PipelineStage $currentStage
    ) {
        $this->id = Uuid::v4();
        $this->tenant = $tenant;
        $this->protocol = $protocol;
        $this->title = $title;
        $this->description = $description;
        $this->requester = $requester;
        $this->department = $department;
        $this->type = $type;
        $this->priority = $priority;
        $this->pipeline = $pipeline;
        $this->currentStage = $currentStage;
        $this->version = 1;
        $this->createdAt = new \DateTimeImmutable();
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

    public function getProtocol(): string
    {
        return $this->protocol;
    }

    public function getTitle(): string
    {
        return $this->title;
    }

    public function setTitle(string $title): self
    {
        $this->title = $title;
        $this->updatedAt = new \DateTimeImmutable();
        return $this;
    }

    public function getDescription(): string
    {
        return $this->description;
    }

    public function setDescription(string $description): self
    {
        $this->description = $description;
        $this->updatedAt = new \DateTimeImmutable();
        return $this;
    }

    public function getRequester(): User
    {
        return $this->requester;
    }

    public function getDepartment(): Department
    {
        return $this->department;
    }

    public function setDepartment(Department $department): self
    {
        $this->department = $department;
        $this->updatedAt = new \DateTimeImmutable();
        return $this;
    }

    public function getType(): TicketType
    {
        return $this->type;
    }

    public function setType(TicketType $type): self
    {
        $this->type = $type;
        $this->updatedAt = new \DateTimeImmutable();
        return $this;
    }

    public function getCategory(): ?Category
    {
        return $this->category;
    }

    public function setCategory(?Category $category): self
    {
        $this->category = $category;
        $this->updatedAt = new \DateTimeImmutable();
        return $this;
    }

    public function getPriority(): Priority
    {
        return $this->priority;
    }

    public function setPriority(Priority $priority): self
    {
        $this->priority = $priority;
        $this->updatedAt = new \DateTimeImmutable();
        return $this;
    }

    public function getPipeline(): Pipeline
    {
        return $this->pipeline;
    }

    public function getCurrentStage(): PipelineStage
    {
        return $this->currentStage;
    }

    public function setCurrentStage(PipelineStage $currentStage): self
    {
        $this->currentStage = $currentStage;
        $this->updatedAt = new \DateTimeImmutable();
        if ($currentStage->isFinal() && $this->resolvedAt === null) {
            $this->resolvedAt = new \DateTimeImmutable();
        }
        return $this;
    }

    public function getAssignedUser(): ?User
    {
        return $this->assignedUser;
    }

    public function setAssignedUser(?User $assignedUser): self
    {
        $this->assignedUser = $assignedUser;
        $this->updatedAt = new \DateTimeImmutable();
        return $this;
    }

    public function getVersion(): int
    {
        return $this->version;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): \DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function getResolvedAt(): ?\DateTimeImmutable
    {
        return $this->resolvedAt;
    }

    public function getClosedAt(): ?\DateTimeImmutable
    {
        return $this->closedAt;
    }

    public function getSlaPolicy(): ?SlaPolicy
    {
        return $this->slaPolicy;
    }

    public function setSlaPolicy(?SlaPolicy $slaPolicy): self
    {
        $this->slaPolicy = $slaPolicy;
        return $this;
    }

    public function getSlaDueDate(): ?\DateTimeImmutable
    {
        return $this->slaDueDate;
    }

    public function setSlaDueDate(?\DateTimeImmutable $slaDueDate): self
    {
        $this->slaDueDate = $slaDueDate;
        return $this;
    }

    public function getSlaFirstResponseDueDate(): ?\DateTimeImmutable
    {
        return $this->slaFirstResponseDueDate;
    }

    public function setSlaFirstResponseDueDate(?\DateTimeImmutable $slaFirstResponseDueDate): self
    {
        $this->slaFirstResponseDueDate = $slaFirstResponseDueDate;
        return $this;
    }

    public function isSlaBreached(): bool
    {
        return $this->slaBreached;
    }

    public function setSlaBreached(bool $slaBreached): self
    {
        $this->slaBreached = $slaBreached;
        return $this;
    }
}
