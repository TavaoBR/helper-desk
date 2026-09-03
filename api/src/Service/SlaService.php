<?php

namespace App\Service;

use App\Entity\Priority;
use App\Entity\SlaPolicy;
use App\Entity\SlaTarget;
use App\Entity\Tenant;
use App\Entity\Ticket;
use App\Repository\PriorityRepository;
use App\Repository\SlaPolicyRepository;
use App\Repository\SlaTargetRepository;
use Doctrine\ORM\EntityManagerInterface;

class SlaService
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly SlaPolicyRepository $slaPolicyRepository,
        private readonly SlaTargetRepository $slaTargetRepository,
        private readonly PriorityRepository $priorityRepository
    ) {
    }

    /**
     * @return SlaPolicy[]
     */
    public function listPolicies(Tenant $tenant): array
    {
        return $this->slaPolicyRepository->findAllByTenant($tenant);
    }

    public function getPolicyById(string $id, Tenant $tenant): ?SlaPolicy
    {
        return $this->slaPolicyRepository->findOneBy(['id' => $id, 'tenant' => $tenant]);
    }

    /**
     * Calculate and apply SLA deadlines to a ticket.
     */
    public function applySlaToTicket(Ticket $ticket): void
    {
        $tenant = $ticket->getTenant();
        $policy = $ticket->getSlaPolicy() ?? $this->slaPolicyRepository->findDefaultByTenant($tenant);

        if (!$policy) {
            return;
        }

        $ticket->setSlaPolicy($policy);
        $priority = $ticket->getPriority();

        // Find target for priority
        $target = null;
        foreach ($policy->getTargets() as $t) {
            if ($t->getPriority()->getId()->equals($priority->getId())) {
                $target = $t;
                break;
            }
        }

        $createdAt = $ticket->getCreatedAt();

        if ($target) {
            $firstResponseMinutes = $target->getFirstResponseMinutes();
            $resolutionMinutes = $target->getResolutionMinutes();
            $is24x7 = $target->getBusinessHoursType() === 'calendar_24x7';

            $firstResponseDue = $this->calculateDeadline($createdAt, $firstResponseMinutes, $is24x7);
            $resolutionDue = $this->calculateDeadline($createdAt, $resolutionMinutes, $is24x7);

            $ticket->setSlaFirstResponseDueDate($firstResponseDue);
            $ticket->setSlaDueDate($resolutionDue);
        } else {
            // Default fallback calculation based on priority weight
            $resolutionMinutes = match (true) {
                $priority->getWeight() >= 90 => 120, // 2h
                $priority->getWeight() >= 70 => 240, // 4h
                $priority->getWeight() >= 40 => 480, // 8h
                default => 1440                      // 24h
            };
            $firstResponseMinutes = (int) ($resolutionMinutes / 4);

            $ticket->setSlaFirstResponseDueDate($this->calculateDeadline($createdAt, $firstResponseMinutes, false));
            $ticket->setSlaDueDate($this->calculateDeadline($createdAt, $resolutionMinutes, false));
        }
    }

    /**
     * Calculate deadline taking business hours into account if requested.
     */
    public function calculateDeadline(\DateTimeImmutable $start, int $minutes, bool $is24x7 = false): \DateTimeImmutable
    {
        if ($is24x7 || $minutes <= 60) {
            return $start->modify("+{$minutes} minutes");
        }

        // Business hours calculation (08:00 to 18:00, Mon-Fri = 10 hours per day)
        $current = \DateTime::createFromImmutable($start);
        $remainingMinutes = $minutes;

        while ($remainingMinutes > 0) {
            $dayOfWeek = (int) $current->format('N'); // 1 (Mon) to 7 (Sun)
            $hour = (int) $current->format('G');
            $minute = (int) $current->format('i');

            // If weekend, advance to Monday 08:00
            if ($dayOfWeek >= 6) {
                $daysToAdd = 8 - $dayOfWeek;
                $current->modify("+{$daysToAdd} days");
                $current->setTime(8, 0, 0);
                continue;
            }

            // If before 08:00, set to 08:00
            if ($hour < 8) {
                $current->setTime(8, 0, 0);
                continue;
            }

            // If after 18:00, advance to next day 08:00
            if ($hour >= 18) {
                $current->modify('+1 day');
                $current->setTime(8, 0, 0);
                continue;
            }

            // Current day business minutes remaining until 18:00
            $minutesUntilClose = ((18 - $hour) * 60) - $minute;

            if ($remainingMinutes <= $minutesUntilClose) {
                $current->modify("+{$remainingMinutes} minutes");
                $remainingMinutes = 0;
            } else {
                $remainingMinutes -= $minutesUntilClose;
                $current->modify('+1 day');
                $current->setTime(8, 0, 0);
            }
        }

        return \DateTimeImmutable::createFromMutable($current);
    }

    /**
     * Create or seed a default SLA policy for a tenant if none exists.
     */
    public function ensureDefaultPolicy(Tenant $tenant): SlaPolicy
    {
        $existing = $this->slaPolicyRepository->findDefaultByTenant($tenant);
        if ($existing) {
            return $existing;
        }

        $policy = new SlaPolicy(
            $tenant,
            'Política Corporativa Geral',
            'Acordo padrão corporativo aplicado a todos os chamados da organização.',
            true
        );
        $this->em->persist($policy);

        $priorities = $this->priorityRepository->findAllActiveByTenant($tenant);
        foreach ($priorities as $pri) {
            $firstResp = match (true) {
                $pri->getWeight() >= 90 => 15,
                $pri->getWeight() >= 70 => 30,
                $pri->getWeight() >= 40 => 120,
                default => 240
            };
            $resol = match (true) {
                $pri->getWeight() >= 90 => 120, // 2h
                $pri->getWeight() >= 70 => 240, // 4h
                $pri->getWeight() >= 40 => 480, // 8h
                default => 1440                 // 24h
            };
            $is24x7 = $pri->getWeight() >= 90 ? 'calendar_24x7' : 'business';

            $target = new SlaTarget($policy, $pri, $firstResp, $resol, $is24x7);
            $policy->addTarget($target);
            $this->em->persist($target);
        }

        $this->em->flush();
        return $policy;
    }
}
