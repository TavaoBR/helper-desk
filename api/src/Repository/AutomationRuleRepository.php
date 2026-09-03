<?php

namespace App\Repository;

use App\Entity\AutomationRule;
use App\Entity\Tenant;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<AutomationRule>
 */
class AutomationRuleRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, AutomationRule::class);
    }

    public function save(AutomationRule $rule, bool $flush = true): void
    {
        $this->getEntityManager()->persist($rule);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(AutomationRule $rule, bool $flush = true): void
    {
        $this->getEntityManager()->remove($rule);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    /**
     * @return AutomationRule[]
     */
    public function findByTenant(Tenant $tenant): array
    {
        return $this->findBy(['tenant' => $tenant], ['createdAt' => 'DESC']);
    }
}
