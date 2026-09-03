<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\TicketRepository;
use App\Service\AuthorizationService;
use App\Service\ReportService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/reports')]
class ReportController extends AbstractController
{
    public function __construct(
        private readonly ReportService $reportService,
        private readonly AuthorizationService $authService,
        private readonly TicketRepository $ticketRepo
    ) {
    }

    #[Route('/kpis', name: 'api_reports_kpis', methods: ['GET'])]
    public function kpis(Request $request, #[CurrentUser] User $user): JsonResponse
    {
        $this->authService->assertPermission($user, 'settings.view');

        $period = $request->query->get('period', '30d');
        $dept = $request->query->get('department');

        $data = $this->reportService->getKpis($user->getTenant(), $period, $dept);

        return new JsonResponse($data);
    }

    #[Route('/volume', name: 'api_reports_volume', methods: ['GET'])]
    public function volume(Request $request, #[CurrentUser] User $user): JsonResponse
    {
        $this->authService->assertPermission($user, 'settings.view');

        $period = $request->query->get('period', '30d');
        $data = $this->reportService->getVolumeTrends($user->getTenant(), $period);

        return new JsonResponse($data);
    }

    #[Route('/departments', name: 'api_reports_departments', methods: ['GET'])]
    public function departments(#[CurrentUser] User $user): JsonResponse
    {
        $this->authService->assertPermission($user, 'settings.view');

        $data = $this->reportService->getDepartmentMetrics($user->getTenant());

        return new JsonResponse(['items' => $data]);
    }

    #[Route('/agents', name: 'api_reports_agents', methods: ['GET'])]
    public function agents(#[CurrentUser] User $user): JsonResponse
    {
        $this->authService->assertPermission($user, 'settings.view');

        $data = $this->reportService->getAgentMetrics($user->getTenant());

        return new JsonResponse(['items' => $data]);
    }

    #[Route('/csat', name: 'api_reports_csat', methods: ['GET'])]
    public function csat(#[CurrentUser] User $user): JsonResponse
    {
        $this->authService->assertPermission($user, 'settings.view');

        $data = $this->reportService->getCsatBreakdown($user->getTenant());

        return new JsonResponse($data);
    }

    #[Route('/surveys', name: 'api_reports_survey_create', methods: ['POST'])]
    public function submitSurvey(Request $request, #[CurrentUser] User $user): JsonResponse
    {
        $body = json_decode($request->getContent(), true);
        if (!is_array($body) || empty($body['ticketId']) || empty($body['score'])) {
            return new JsonResponse(['error' => ['message' => 'ticketId e score são obrigatórios.']], Response::HTTP_BAD_REQUEST);
        }

        $ticket = $this->ticketRepo->findByIdAndTenant($body['ticketId'], $user->getTenant());
        if (!$ticket) {
            return new JsonResponse(['error' => ['message' => 'Chamado não encontrado.']], Response::HTTP_NOT_FOUND);
        }

        $survey = $this->reportService->submitSurvey(
            $user->getTenant(),
            $ticket,
            $user,
            (int) $body['score'],
            $body['comment'] ?? null
        );

        return new JsonResponse([
            'id' => (string) $survey->getId(),
            'score' => $survey->getScore(),
            'comment' => $survey->getComment(),
            'createdAt' => $survey->getCreatedAt()->format(\DateTimeInterface::ATOM)
        ], Response::HTTP_CREATED);
    }
}
