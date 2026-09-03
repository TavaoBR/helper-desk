<?php

namespace App\Entity;

use App\Repository\PriorityRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: PriorityRepository::class)]
#[ORM\Table(name: 'priorities')]
#[ORM\Index(name: 'idx_pri_tenant', columns: ['tenant_id'])]
class Priority
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    private Uuid $id;

    #[ORM\ManyToOne(targetEntity: Tenant::class)]
    #[ORM\JoinColumn(name: 'tenant_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private Tenant $tenant;

    #[ORM\Column(length: 60)]
    private string $name;

    #[ORM\Column(type: 'integer')]
    private int $weight;

    #[ORM\Column(length: 30, nullable: true)]
    private ?string $colorToken = null;

    #[ORM\Column(type: 'boolean', options: ['default' => true])]
    private bool $isActive = true;

    public function __construct(Tenant $tenant, string $name, int $weight, ?string $colorToken = null)
    {
        $this->id = Uuid::v4();
        $this->tenant = $tenant;
        $this->name = $name;
        $this->weight = $weight;
        $this->colorToken = $colorToken;
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

    public function getWeight(): int
    {
        return $this->weight;
    }

    public function setWeight(int $weight): self
    {
        $this->weight = $weight;
        return $this;
    }

    public function getColorToken(): ?string
    {
        return $this->colorToken;
    }

    public function setColorToken(?string $colorToken): self
    {
        $this->colorToken = $colorToken;
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
}
