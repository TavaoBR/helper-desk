<?php

namespace App\Repository;

use App\Entity\Tenant;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Tenant>
 */
class TenantRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Tenant::class);
    }

    public function save(Tenant $tenant, bool $flush = true): void
    {
        $this->getEntityManager()->persist($tenant);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function findById(string $id): ?Tenant
    {
        return $this->find($id);
    }

    public function findByName(string $name): ?Tenant
    {
        return $this->findOneBy(['name' => $name]);
    }
}
