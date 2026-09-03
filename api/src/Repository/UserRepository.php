<?php

namespace App\Repository;

use App\Entity\Tenant;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<User>
 */
class UserRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, User::class);
    }

    public function save(User $user, bool $flush = true): void
    {
        $this->getEntityManager()->persist($user);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function findByEmailAndTenant(string $email, Tenant $tenant): ?User
    {
        return $this->findOneBy([
            'email' => $email,
            'tenant' => $tenant
        ]);
    }

    public function existsByEmailAndTenant(string $email, Tenant $tenant): bool
    {
        return $this->findByEmailAndTenant($email, $tenant) !== null;
    }

    public function findByIdAndTenant(string $id, Tenant $tenant): ?User
    {
        return $this->findOneBy([
            'id' => $id,
            'tenant' => $tenant
        ]);
    }

    /**
     * @return User[]
     */
    public function listByTenant(Tenant $tenant): array
    {
        return $this->findBy(
            ['tenant' => $tenant],
            ['name' => 'ASC']
        );
    }
}
