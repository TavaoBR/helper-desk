<?php

namespace App\Repository;

use App\Entity\SlaPolicy;
use App\Entity\SlaTarget;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<SlaTarget>
 */
class SlaTargetRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, SlaTarget::class);
    }
}
