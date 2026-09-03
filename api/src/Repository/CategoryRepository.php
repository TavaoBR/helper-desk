<?php

namespace App\Repository;

use App\Entity\Category;
use App\Entity\Tenant;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Category>
 */
class CategoryRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Category::class);
    }

    public function save(Category $category, bool $flush = true): void
    {
        $this->getEntityManager()->persist($category);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function findByIdAndTenant(string $id, Tenant $tenant): ?Category
    {
        return $this->findOneBy([
            'id' => $id,
            'tenant' => $tenant
        ]);
    }

    /**
     * @return Category[]
     */
    public function findByTenantAndDepartment(Tenant $tenant, ?string $departmentId = null): array
    {
        $criteria = ['tenant' => $tenant, 'isActive' => true];
        if ($departmentId) {
            $criteria['department'] = $departmentId;
        }

        return $this->findBy($criteria, ['name' => 'ASC']);
    }
}
