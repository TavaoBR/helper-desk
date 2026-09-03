<?php

namespace App\Repository;

use App\Entity\Pipeline;
use App\Entity\PipelineStage;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<PipelineStage>
 */
class PipelineStageRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, PipelineStage::class);
    }

    public function save(PipelineStage $stage, bool $flush = true): void
    {
        $this->getEntityManager()->persist($stage);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function findByIdAndPipeline(string $id, Pipeline $pipeline): ?PipelineStage
    {
        return $this->findOneBy([
            'id' => $id,
            'pipeline' => $pipeline
        ]);
    }

    /**
     * @return PipelineStage[]
     */
    public function findByPipeline(Pipeline $pipeline): array
    {
        return $this->findBy(
            ['pipeline' => $pipeline, 'isActive' => true],
            ['position' => 'ASC']
        );
    }
}
