<?php

namespace App\Repository;

use App\Entity\Ticket;
use App\Entity\TicketHistory;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<TicketHistory>
 */
class TicketHistoryRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, TicketHistory::class);
    }

    public function save(TicketHistory $history, bool $flush = true): void
    {
        $this->getEntityManager()->persist($history);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    /**
     * @return TicketHistory[]
     */
    public function findByTicket(Ticket $ticket): array
    {
        return $this->findBy(
            ['ticket' => $ticket],
            ['createdAt' => 'DESC']
        );
    }
}
