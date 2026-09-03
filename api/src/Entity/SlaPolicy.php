<?php

namespace App\Entity;

use App\Repository\SlaPolicyRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: SlaPolicyRepository::class)]
#[ORM\Table(name: 'sla_policies')]
#[ORM\Index(name: 'idx_sla_tenant', columns: ['tenant_id'])]
class SlaPolicy
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    private Uuid $id;

    #[ORM\ManyToOne(targetEntity: Tenant::class)]
    #[ORM\JoinColumn(name: 'tenant_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private Tenant $tenant;

    #[ORM\Column(length: 120)]
    private string $name;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $description = null;

    #[ORM\Column(type: 'boolean', options: ['default' => false])]
    private bool $isDefault = false;

    #[ORM\Column(type: 'boolean', options: ['default' => true])]
    private bool $isActive = true;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    /**
     * @var Collection<int, SlaTarget>
     */
    #[ORM\OneToMany(mappedBy: 'slaPolicy', targetEntity: SlaTarget::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $targets;

    public function __construct(Tenant $tenant, string $name, ?string $description = null, bool $isDefault = false)
    {
        $this->id = Uuid::v4();
        $this->tenant = $tenant;
        $this->name = $name;
        $this->description = $description;
        $this->isDefault = $isDefault;
        $this->createdAt = new \DateTimeImmutable();
        $this->targets = new ArrayCollection();
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
        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): self
    {
        $this->description = $description;
        return $this;
    }

    public function isDefault(): bool
    {
        return $this->isDefault;
    }

    public function setIsDefault(bool $isDefault): self
    {
        $this->isDefault = $isDefault;
        return $this;
    }

    public function isActive(): bool
    {
        return $this->isActive;
    }

    public function setIsActive(bool $isActive): self
    {
        $this->isActive = $isActive;
        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    /**
     * @return Collection<int, SlaTarget>
     */
    public function getTargets(): Collection
    {
        return $this->targets;
    }

    public function addTarget(SlaTarget $target): self
    {
        if (!$this->targets->contains($target)) {
            $this->targets->add($target);
            $target->setSlaPolicy($this);
        }
        return $this;
    }

    public function removeTarget(SlaTarget $target): self
    {
        $this->targets->removeElement($target);
        return $this;
    }
}
