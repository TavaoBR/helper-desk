<?php

namespace App\Repository;

use App\Entity\Pipeline;
use App\Entity\PipelineStage;
use App\Entity\PipelineTransition;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<PipelineTransition>
 */
class PipelineTransitionRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, PipelineTransition::class);
    }

    public function save(PipelineTransition $transition, bool $flush = true): void
    {
        $this->getEntityManager()->persist($transition);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function findValidTransition(Pipeline $pipeline, PipelineStage $fromStage, PipelineStage $toStage): ?PipelineTransition
    {
        return $this->findOneBy([
            'pipeline' => $pipeline,
            'fromStage' => $fromStage,
            'toStage' => $toStage,
            'isActive' => true
        ]);
    }

    public function hasTransitions(Pipeline $pipeline): bool
    {
        return $this->count(['pipeline' => $pipeline, 'isActive' => true]) > 0;
    }
}
