<?php

namespace App\Entity;

use App\Repository\PipelineRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: PipelineRepository::class)]
#[ORM\Table(name: 'pipelines')]
#[ORM\Index(name: 'idx_pipe_tenant', columns: ['tenant_id'])]
class Pipeline
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    private Uuid $id;

    #[ORM\ManyToOne(targetEntity: Tenant::class)]
    #[ORM\JoinColumn(name: 'tenant_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private Tenant $tenant;

    #[ORM\Column(length: 120)]
    private string $name;

    #[ORM\Column(type: 'boolean', options: ['default' => true])]
    private bool $isActive = true;

    /** @var Collection<int, PipelineStage> */
    #[ORM\OneToMany(mappedBy: 'pipeline', targetEntity: PipelineStage::class, cascade: ['persist', 'remove'])]
    #[ORM\OrderBy(['position' => 'ASC'])]
    private Collection $stages;

    public function __construct(Tenant $tenant, string $name)
    {
        $this->id = Uuid::v4();
        $this->tenant = $tenant;
        $this->name = $name;
        $this->stages = new ArrayCollection();
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

    public function isActive(): bool
    {
        return $this->isActive;
    }

    public function setIsActive(bool $isActive): self
    {
        $this->isActive = $isActive;
        return $this;
    }

    /**
     * @return Collection<int, PipelineStage>
     */
    public function getStages(): Collection
    {
        return $this->stages;
    }

    public function getInitialStage(): ?PipelineStage
    {
        foreach ($this->stages as $stage) {
            if ($stage->isInitial()) {
                return $stage;
            }
        }
        return null;
    }
}
