<?php

namespace App\Repository;

use App\Entity\SlaPolicy;
use App\Entity\Tenant;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<SlaPolicy>
 */
class SlaPolicyRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, SlaPolicy::class);
    }

    public function save(SlaPolicy $policy, bool $flush = true): void
    {
        $this->getEntityManager()->persist($policy);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(SlaPolicy $policy, bool $flush = true): void
    {
        $this->getEntityManager()->remove($policy);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    /**
     * @return SlaPolicy[]
     */
    public function findAllByTenant(Tenant $tenant): array
    {
        return $this->findBy(
            ['tenant' => $tenant],
            ['isDefault' => 'DESC', 'name' => 'ASC']
        );
    }

    public function findDefaultByTenant(Tenant $tenant): ?SlaPolicy
    {
        return $this->findOneBy([
            'tenant' => $tenant,
            'isDefault' => true,
            'isActive' => true
        ]);
    }
}
