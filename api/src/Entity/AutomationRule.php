<?php

namespace App\Entity;

use App\Repository\AutomationRuleRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: AutomationRuleRepository::class)]
#[ORM\Table(name: 'automation_rules')]
#[ORM\Index(name: 'idx_auto_tenant', columns: ['tenant_id'])]
class AutomationRule
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    private Uuid $id;

    #[ORM\ManyToOne(targetEntity: Tenant::class)]
    #[ORM\JoinColumn(name: 'tenant_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private Tenant $tenant;

    #[ORM\Column(length: 150)]
    private string $name;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $description = null;

    #[ORM\Column(length: 30)]
    private string $category; // 'create', 'assign', 'stage', 'sla'

    #[ORM\Column(length: 120)]
    private string $triggerEvent;

    #[ORM\Column(type: 'text')]
    private string $conditionText;

    #[ORM\Column(type: 'text')]
    private string $actionText;

    #[ORM\Column(type: 'boolean', options: ['default' => true])]
    private bool $isActive = true;

    #[ORM\Column(type: 'integer', options: ['default' => 0])]
    private int $runsCount = 0;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column]
    private \DateTimeImmutable $updatedAt;

    public function __construct(
        Tenant $tenant,
        string $name,
        string $category,
        string $triggerEvent,
        string $conditionText,
        string $actionText,
        ?string $description = null,
        bool $isActive = true
    ) {
        $this->id = Uuid::v4();
        $this->tenant = $tenant;
        $this->name = $name;
        $this->category = $category;
        $this->triggerEvent = $triggerEvent;
        $this->conditionText = $conditionText;
        $this->actionText = $actionText;
        $this->description = $description;
        $this->isActive = $isActive;
        $this->runsCount = 0;
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

    public function getName(): string
    {
        return $this->name;
    }

    public function setName(string $name): self
    {
        $this->name = $name;
        $this->updatedAt = new \DateTimeImmutable();
        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): self
    {
        $this->description = $description;
        $this->updatedAt = new \DateTimeImmutable();
        return $this;
    }

    public function getCategory(): string
    {
        return $this->category;
    }

    public function setCategory(string $category): self
    {
        $this->category = $category;
        $this->updatedAt = new \DateTimeImmutable();
        return $this;
    }

    public function getTriggerEvent(): string
    {
        return $this->triggerEvent;
    }

    public function setTriggerEvent(string $triggerEvent): self
    {
        $this->triggerEvent = $triggerEvent;
        $this->updatedAt = new \DateTimeImmutable();
        return $this;
    }

    public function getConditionText(): string
    {
        return $this->conditionText;
    }

    public function setConditionText(string $conditionText): self
    {
        $this->conditionText = $conditionText;
        $this->updatedAt = new \DateTimeImmutable();
        return $this;
    }

    public function getActionText(): string
    {
        return $this->actionText;
    }

    public function setActionText(string $actionText): self
    {
        $this->actionText = $actionText;
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

    public function getRunsCount(): int
    {
        return $this->runsCount;
    }

    public function incrementRunsCount(): self
    {
        $this->runsCount++;
        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): \DateTimeImmutable
    {
        return $this->updatedAt;
    }
}
