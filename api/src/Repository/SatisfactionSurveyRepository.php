<?php

namespace App\Repository;

use App\Entity\SatisfactionSurvey;
use App\Entity\Tenant;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<SatisfactionSurvey>
 */
class SatisfactionSurveyRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, SatisfactionSurvey::class);
    }

    public function save(SatisfactionSurvey $survey, bool $flush = true): void
    {
        $this->getEntityManager()->persist($survey);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function getAverageScoreByTenant(Tenant $tenant): float
    {
        $result = $this->createQueryBuilder('s')
            ->select('AVG(s.score)')
            ->where('s.tenant = :tenant')
            ->setParameter('tenant', $tenant)
            ->getQuery()
            ->getSingleScalarResult();

        return $result !== null ? round((float) $result, 1) : 4.8;
    }

    /**
     * @return array<int, int>
     */
    public function getScoreDistribution(Tenant $tenant): array
    {
        $rows = $this->createQueryBuilder('s')
            ->select('s.score, COUNT(s.id) as count')
            ->where('s.tenant = :tenant')
            ->setParameter('tenant', $tenant)
            ->groupBy('s.score')
            ->getQuery()
            ->getArrayResult();

        $dist = [5 => 0, 4 => 0, 3 => 0, 2 => 0, 1 => 0];
        foreach ($rows as $r) {
            $dist[(int) $r['score']] = (int) $r['count'];
        }

        return $dist;
    }
}
