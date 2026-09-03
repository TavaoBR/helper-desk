<?php

namespace App\Repository;

use App\Entity\Pipeline;
use App\Entity\Tenant;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Pipeline>
 */
class PipelineRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Pipeline::class);
    }

    public function save(Pipeline $pipeline, bool $flush = true): void
    {
        $this->getEntityManager()->persist($pipeline);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function findByIdAndTenant(string $id, Tenant $tenant): ?Pipeline
    {
        return $this->findOneBy([
            'id' => $id,
            'tenant' => $tenant
        ]);
    }

    public function findActiveByTenant(Tenant $tenant): ?Pipeline
    {
        return $this->findOneBy([
            'tenant' => $tenant,
            'isActive' => true
        ]);
    }

    /**
     * @return Pipeline[]
     */
    public function findAllByTenant(Tenant $tenant): array
    {
        return $this->findBy(
            ['tenant' => $tenant],
            ['name' => 'ASC']
        );
    }
}
