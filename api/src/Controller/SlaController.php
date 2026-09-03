<?php

namespace App\Controller;

use App\Entity\SlaPolicy;
use App\Entity\SlaTarget;
use App\Entity\User;
use App\Repository\PriorityRepository;
use App\Repository\SlaPolicyRepository;
use App\Service\AuthorizationService;
use App\Service\SlaService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/sla-policies')]
class SlaController extends AbstractController
{
    public function __construct(
        private readonly SlaService $slaService,
        private readonly SlaPolicyRepository $policyRepo,
        private readonly PriorityRepository $priorityRepo,
        private readonly AuthorizationService $authService,
        private readonly EntityManagerInterface $em
    ) {
    }

    #[Route('', name: 'api_sla_list', methods: ['GET'])]
    public function list(#[CurrentUser] User $user): JsonResponse
    {
        $tenant = $user->getTenant();
        $this->slaService->ensureDefaultPolicy($tenant);
        $policies = $this->slaService->listPolicies($tenant);

        $data = array_map(function (SlaPolicy $p) {
            return [
                'id' => (string) $p->getId(),
                'name' => $p->getName(),
                'description' => $p->getDescription(),
                'isDefault' => $p->isDefault(),
                'isActive' => $p->isActive(),
                'createdAt' => $p->getCreatedAt()->format(\DateTimeInterface::ATOM),
                'targets' => array_map(function (SlaTarget $t) {
                    return [
                        'id' => (string) $t->getId(),
                        'priority' => [
                            'id' => (string) $t->getPriority()->getId(),
                            'name' => $t->getPriority()->getName(),
                            'weight' => $t->getPriority()->getWeight(),
                            'colorToken' => $t->getPriority()->getColorToken(),
                        ],
                        'firstResponseMinutes' => $t->getFirstResponseMinutes(),
                        'resolutionMinutes' => $t->getResolutionMinutes(),
                        'businessHoursType' => $t->getBusinessHoursType(),
                    ];
                }, $p->getTargets()->toArray())
            ];
        }, $policies);

        return new JsonResponse(['items' => $data]);
    }

    #[Route('', name: 'api_sla_create', methods: ['POST'])]
    public function create(Request $request, #[CurrentUser] User $user): JsonResponse
    {
        $this->authService->assertPermission($user, 'settings.manage');

        $body = json_decode($request->getContent(), true);
        if (!is_array($body) || empty($body['name'])) {
            return new JsonResponse(['error' => ['message' => 'Nome da política é obrigatório.']], Response::HTTP_BAD_REQUEST);
        }

        $tenant = $user->getTenant();
        $policy = new SlaPolicy(
            $tenant,
            trim($body['name']),
            $body['description'] ?? null,
            !empty($body['isDefault'])
        );

        $this->em->persist($policy);

        // Add targets if provided
        if (!empty($body['targets']) && is_array($body['targets'])) {
            foreach ($body['targets'] as $tData) {
                if (!empty($tData['priorityId'])) {
                    $pri = $this->priorityRepo->find($tData['priorityId']);
                    if ($pri && $pri->getTenant()->getId()->equals($tenant->getId())) {
                        $target = new SlaTarget(
                            $policy,
                            $pri,
                            (int) ($tData['firstResponseMinutes'] ?? 60),
                            (int) ($tData['resolutionMinutes'] ?? 240),
                            $tData['businessHoursType'] ?? 'business'
                        );
                        $policy->addTarget($target);
                        $this->em->persist($target);
                    }
                }
            }
        }

        $this->em->flush();

        return new JsonResponse([
            'id' => (string) $policy->getId(),
            'name' => $policy->getName(),
            'description' => $policy->getDescription(),
            'isDefault' => $policy->isDefault(),
            'isActive' => $policy->isActive()
        ], Response::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'api_sla_delete', methods: ['DELETE'])]
    public function delete(string $id, #[CurrentUser] User $user): JsonResponse
    {
        $this->authService->assertPermission($user, 'settings.manage');

        $tenant = $user->getTenant();
        $policy = $this->policyRepo->findOneBy(['id' => $id, 'tenant' => $tenant]);

        if (!$policy) {
            return new JsonResponse(['error' => ['message' => 'Política de SLA não encontrada.']], Response::HTTP_NOT_FOUND);
        }

        if ($policy->isDefault()) {
            return new JsonResponse(['error' => ['message' => 'Não é permitido excluir a política de SLA padrão.']], Response::HTTP_BAD_REQUEST);
        }

        $this->policyRepo->remove($policy);

        return new JsonResponse(['success' => true]);
    }
}
