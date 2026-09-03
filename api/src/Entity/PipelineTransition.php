<?php

namespace App\Entity;

use App\Repository\PipelineTransitionRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: PipelineTransitionRepository::class)]
#[ORM\Table(name: 'pipeline_transitions')]
#[ORM\Index(name: 'idx_trans_pipeline', columns: ['pipeline_id'])]
class PipelineTransition
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    private Uuid $id;

    #[ORM\ManyToOne(targetEntity: Pipeline::class)]
    #[ORM\JoinColumn(name: 'pipeline_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private Pipeline $pipeline;

    #[ORM\ManyToOne(targetEntity: PipelineStage::class)]
    #[ORM\JoinColumn(name: 'from_stage_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private PipelineStage $fromStage;

    #[ORM\ManyToOne(targetEntity: PipelineStage::class)]
    #[ORM\JoinColumn(name: 'to_stage_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private PipelineStage $toStage;

    #[ORM\Column(length: 100, nullable: true)]
    private ?string $name = null;

    #[ORM\Column(type: 'boolean', options: ['default' => true])]
    private bool $isActive = true;

    public function __construct(Pipeline $pipeline, PipelineStage $fromStage, PipelineStage $toStage, ?string $name = null)
    {
        $this->id = Uuid::v4();
        $this->pipeline = $pipeline;
        $this->fromStage = $fromStage;
        $this->toStage = $toStage;
        $this->name = $name;
    }

    public function getId(): Uuid
    {
        return $this->id;
    }

    public function getPipeline(): Pipeline
    {
        return $this->pipeline;
    }

    public function getFromStage(): PipelineStage
    {
        return $this->fromStage;
    }

    public function getToStage(): PipelineStage
    {
        return $this->toStage;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function isActive(): bool
    {
        return $this->isActive;
    }
}
