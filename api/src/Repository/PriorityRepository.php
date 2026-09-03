<?php

namespace App\Repository;

use App\Entity\Priority;
use App\Entity\Tenant;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Priority>
 */
class PriorityRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Priority::class);
    }

    public function save(Priority $priority, bool $flush = true): void
    {
        $this->getEntityManager()->persist($priority);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function findByIdAndTenant(string $id, Tenant $tenant): ?Priority
    {
        return $this->findOneBy([
            'id' => $id,
            'tenant' => $tenant
        ]);
    }

    /**
     * @return Priority[]
     */
    public function findAllActiveByTenant(Tenant $tenant): array
    {
        return $this->findBy(
            ['tenant' => $tenant, 'isActive' => true],
            ['weight' => 'DESC']
        );
    }
}
