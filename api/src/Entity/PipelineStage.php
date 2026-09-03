<?php

namespace App\Entity;

use App\Repository\PipelineStageRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: PipelineStageRepository::class)]
#[ORM\Table(name: 'pipeline_stages')]
#[ORM\Index(name: 'idx_stage_pipeline', columns: ['pipeline_id'])]
class PipelineStage
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    private Uuid $id;

    #[ORM\ManyToOne(targetEntity: Pipeline::class, inversedBy: 'stages')]
    #[ORM\JoinColumn(name: 'pipeline_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private Pipeline $pipeline;

    #[ORM\Column(length: 80)]
    private string $name;

    #[ORM\Column(type: 'integer')]
    private int $position = 0;

    #[ORM\Column(type: 'boolean', options: ['default' => false])]
    private bool $isInitial = false;

    #[ORM\Column(type: 'boolean', options: ['default' => false])]
    private bool $isFinal = false;

    #[ORM\Column(type: 'boolean', options: ['default' => true])]
    private bool $isActive = true;

    public function __construct(Pipeline $pipeline, string $name, int $position = 0, bool $isInitial = false, bool $isFinal = false)
    {
        $this->id = Uuid::v4();
        $this->pipeline = $pipeline;
        $this->name = $name;
        $this->position = $position;
        $this->isInitial = $isInitial;
        $this->isFinal = $isFinal;
    }

    public function getId(): Uuid
    {
        return $this->id;
    }

    public function getPipeline(): Pipeline
    {
        return $this->pipeline;
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

    public function getPosition(): int
    {
        return $this->position;
    }

    public function setPosition(int $position): self
    {
        $this->position = $position;
        return $this;
    }

    public function isInitial(): bool
    {
        return $this->isInitial;
    }

    public function setIsInitial(bool $isInitial): self
    {
        $this->isInitial = $isInitial;
        return $this;
    }

    public function isFinal(): bool
    {
        return $this->isFinal;
    }

    public function setIsFinal(bool $isFinal): self
    {
        $this->isFinal = $isFinal;
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
