<?php

namespace App\Repository;

use App\Entity\InAppNotification;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<InAppNotification>
 */
class InAppNotificationRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, InAppNotification::class);
    }

    /**
     * @return InAppNotification[]
     */
    public function findByUser(User $user, int $limit = 20): array
    {
        return $this->findBy(['user' => $user], ['createdAt' => 'DESC'], $limit);
    }

    public function countUnreadByUser(User $user): int
    {
        return $this->count(['user' => $user, 'isRead' => false]);
    }
}
