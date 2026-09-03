<?php

namespace App\Entity;

use App\Repository\SlaTargetRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: SlaTargetRepository::class)]
#[ORM\Table(name: 'sla_targets')]
#[ORM\Index(name: 'idx_target_policy', columns: ['sla_policy_id'])]
#[ORM\Index(name: 'idx_target_priority', columns: ['priority_id'])]
class SlaTarget
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    private Uuid $id;

    #[ORM\ManyToOne(targetEntity: SlaPolicy::class, inversedBy: 'targets')]
    #[ORM\JoinColumn(name: 'sla_policy_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private SlaPolicy $slaPolicy;

    #[ORM\ManyToOne(targetEntity: Priority::class)]
    #[ORM\JoinColumn(name: 'priority_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private Priority $priority;

    #[ORM\Column(type: 'integer')]
    private int $firstResponseMinutes;

    #[ORM\Column(type: 'integer')]
    private int $resolutionMinutes;

    #[ORM\Column(length: 30, options: ['default' => 'business'])]
    private string $businessHoursType = 'business'; // 'business' or 'calendar_24x7'

    public function __construct(
        SlaPolicy $slaPolicy,
        Priority $priority,
        int $firstResponseMinutes,
        int $resolutionMinutes,
        string $businessHoursType = 'business'
    ) {
        $this->id = Uuid::v4();
        $this->slaPolicy = $slaPolicy;
        $this->priority = $priority;
        $this->firstResponseMinutes = $firstResponseMinutes;
        $this->resolutionMinutes = $resolutionMinutes;
        $this->businessHoursType = $businessHoursType;
    }

    public function getId(): Uuid
    {
        return $this->id;
    }

    public function getSlaPolicy(): SlaPolicy
    {
        return $this->slaPolicy;
    }

    public function setSlaPolicy(SlaPolicy $slaPolicy): self
    {
        $this->slaPolicy = $slaPolicy;
        return $this;
    }

    public function getPriority(): Priority
    {
        return $this->priority;
    }

    public function setPriority(Priority $priority): self
    {
        $this->priority = $priority;
        return $this;
    }

    public function getFirstResponseMinutes(): int
    {
        return $this->firstResponseMinutes;
    }

    public function setFirstResponseMinutes(int $firstResponseMinutes): self
    {
        $this->firstResponseMinutes = $firstResponseMinutes;
        return $this;
    }

    public function getResolutionMinutes(): int
    {
        return $this->resolutionMinutes;
    }

    public function setResolutionMinutes(int $resolutionMinutes): self
    {
        $this->resolutionMinutes = $resolutionMinutes;
        return $this;
    }

    public function getBusinessHoursType(): string
    {
        return $this->businessHoursType;
    }

    public function setBusinessHoursType(string $businessHoursType): self
    {
        $this->businessHoursType = $businessHoursType;
        return $this;
    }
}
