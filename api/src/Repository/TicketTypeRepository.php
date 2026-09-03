<?php

namespace App\Repository;

use App\Entity\Tenant;
use App\Entity\TicketType;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<TicketType>
 */
class TicketTypeRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, TicketType::class);
    }

    public function save(TicketType $type, bool $flush = true): void
    {
        $this->getEntityManager()->persist($type);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function findByIdAndTenant(string $id, Tenant $tenant): ?TicketType
    {
        return $this->findOneBy([
            'id' => $id,
            'tenant' => $tenant
        ]);
    }

    /**
     * @return TicketType[]
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
