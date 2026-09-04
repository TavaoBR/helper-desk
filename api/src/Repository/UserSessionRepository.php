<?php

namespace App\Repository;

use App\Entity\User;
use App\Entity\UserSession;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

/**
 * @extends ServiceEntityRepository<UserSession>
 */
class UserSessionRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, UserSession::class);
    }

    public function save(UserSession $session): void
    {
        $em = $this->getEntityManager();
        $em->persist($session);
        $em->flush();
    }

    public function delete(UserSession $session): void
    {
        $em = $this->getEntityManager();
        $em->remove($session);
        $em->flush();
    }

    public function findByTokenHash(string $hash): ?UserSession
    {
        return $this->findOneBy(['refreshTokenHash' => $hash]);
    }

    public function findByPreviousTokenHash(string $hash): ?UserSession
    {
        return $this->findOneBy(['previousTokenHash' => $hash]);
    }

    /**
     * @return list<UserSession>
     */
    public function findActiveByUser(User $user): array
    {
        return $this->createQueryBuilder('s')
            ->andWhere('s.user = :user')
            ->andWhere('s.revokedAt IS NULL')
            ->andWhere('s.expiresAt > :now')
            ->setParameter('user', $user)
            ->setParameter('now', new \DateTimeImmutable())
            ->orderBy('s.lastUsedAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findByIdAndUser(string|Uuid $id, User $user): ?UserSession
    {
        $uuid = is_string($id) ? Uuid::fromString($id) : $id;

        return $this->createQueryBuilder('s')
            ->andWhere('s.id = :id')
            ->andWhere('s.user = :user')
            ->setParameter('id', $uuid->toBinary())
            ->setParameter('user', $user)
            ->getQuery()
            ->getOneOrNullResult();
    }

    public function revokeAllForUser(User $user, ?\DateTimeImmutable $revokedAt = null): int
    {
        $now = $revokedAt ?? new \DateTimeImmutable();

        return (int) $this->createQueryBuilder('s')
            ->update()
            ->set('s.revokedAt', ':now')
            ->andWhere('s.user = :user')
            ->andWhere('s.revokedAt IS NULL')
            ->setParameter('now', $now)
            ->setParameter('user', $user)
            ->getQuery()
            ->execute();
    }

    public function deleteExpired(\DateTimeImmutable $now): int
    {
        return (int) $this->createQueryBuilder('s')
            ->delete()
            ->andWhere('s.expiresAt <= :now OR s.revokedAt IS NOT NULL')
            ->setParameter('now', $now)
            ->getQuery()
            ->execute();
    }
}
