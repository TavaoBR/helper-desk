<?php

namespace App\Repository;

use App\Entity\Tenant;
use App\Entity\Ticket;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Ticket>
 */
class TicketRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Ticket::class);
    }

    public function save(Ticket $ticket, bool $flush = true): void
    {
        $this->getEntityManager()->persist($ticket);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function findByIdAndTenant(string $id, Tenant $tenant): ?Ticket
    {
        return $this->findOneBy([
            'id' => $id,
            'tenant' => $tenant
        ]);
    }

    public function countByTenant(Tenant $tenant): int
    {
        return (int) $this->createQueryBuilder('t')
            ->select('COUNT(t.id)')
            ->where('t.tenant = :tenant')
            ->setParameter('tenant', $tenant)
            ->getQuery()
            ->getSingleScalarResult();
    }

    public function generateNextProtocol(Tenant $tenant): string
    {
        $count = $this->countByTenant($tenant);
        return sprintf('HD-%06d', $count + 1);
    }

    /**
     * @return array{items: Ticket[], total: int}
     */
    public function findPaginatedByTenant(
        Tenant $tenant,
        int $page = 1,
        int $limit = 20,
        ?string $search = null,
        ?string $departmentId = null,
        ?string $priorityId = null,
        ?string $stageId = null,
        ?string $requesterId = null,
        ?string $assignedUserId = null
    ): array {
        $qb = $this->createQueryBuilder('t')
            ->where('t.tenant = :tenant')
            ->setParameter('tenant', $tenant)
            ->orderBy('t.createdAt', 'DESC');

        if ($search !== null && trim($search) !== '') {
            $qb->andWhere('t.protocol LIKE :search OR t.title LIKE :search')
               ->setParameter('search', '%' . trim($search) . '%');
        }

        if ($departmentId !== null && trim($departmentId) !== '') {
            $qb->andWhere('t.department = :deptId')
               ->setParameter('deptId', $departmentId);
        }

        if ($priorityId !== null && trim($priorityId) !== '') {
            $qb->andWhere('t.priority = :priId')
               ->setParameter('priId', $priorityId);
        }

        if ($stageId !== null && trim($stageId) !== '') {
            $qb->andWhere('t.currentStage = :stageId')
               ->setParameter('stageId', $stageId);
        }

        if ($requesterId !== null && trim($requesterId) !== '') {
            $qb->andWhere('t.requester = :requesterId')
               ->setParameter('requesterId', $requesterId);
        }

        if ($assignedUserId !== null && trim($assignedUserId) !== '') {
            $qb->andWhere('t.assignedUser = :assignedUserId')
               ->setParameter('assignedUserId', $assignedUserId);
        }

        // Count total matching
        $countQb = clone $qb;
        $countQb->select('COUNT(t.id)');
        $total = (int) $countQb->getQuery()->getSingleScalarResult();

        // Paginate items
        $qb->select('t')
           ->setFirstResult(($page - 1) * $limit)
           ->setMaxResults($limit);

        /** @var Ticket[] $items */
        $items = $qb->getQuery()->getResult();

        return [
            'items' => $items,
            'total' => $total
        ];
    }
}
