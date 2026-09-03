<?php

namespace App\Repository;

use App\Entity\Ticket;
use App\Entity\TicketComment;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<TicketComment>
 */
class TicketCommentRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, TicketComment::class);
    }

    public function save(TicketComment $comment, bool $flush = true): void
    {
        $this->getEntityManager()->persist($comment);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    /**
     * @return TicketComment[]
     */
    public function findByTicket(Ticket $ticket): array
    {
        return $this->findBy(
            ['ticket' => $ticket],
            ['createdAt' => 'DESC']
        );
    }
}
