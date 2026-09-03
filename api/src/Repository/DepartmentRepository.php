<?php

namespace App\Repository;

use App\Entity\Department;
use App\Entity\Tenant;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Department>
 */
class DepartmentRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Department::class);
    }

    public function save(Department $department, bool $flush = true): void
    {
        $this->getEntityManager()->persist($department);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function findByIdAndTenant(string $id, Tenant $tenant): ?Department
    {
        return $this->findOneBy([
            'id' => $id,
            'tenant' => $tenant
        ]);
    }

    /**
     * @return Department[]
     */
    public function findAllActiveByTenant(Tenant $tenant): array
    {
        return $this->findBy(
            ['tenant' => $tenant, 'isActive' => true],
            ['name' => 'ASC']
        );
    }
}
