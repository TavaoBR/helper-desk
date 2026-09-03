<?php

namespace App\Controller;

use App\DTO\Request\AddTicketCommentDTO;
use App\DTO\Request\AssignTicketDTO;
use App\DTO\Request\CreateTicketDTO;
use App\DTO\Request\MoveTicketStageDTO;
use App\Entity\User;
use App\Exception\ForbiddenException;
use App\Service\AuthorizationService;
use App\Service\TicketService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/tickets')]
class TicketController extends AbstractController
{
    public function __construct(
        private readonly TicketService $ticketService,
        private readonly AuthorizationService $authService
    ) {
    }

    #[Route('', name: 'api_tickets_list', methods: ['GET'])]
    public function list(Request $request, #[CurrentUser] User $user): JsonResponse
    {
        $page = max(1, $request->query->getInt('page', 1));
        $limit = max(1, min(100, $request->query->getInt('limit', 20)));
        $search = $request->query->get('search');
        $departmentId = $request->query->get('departmentId');
        $priorityId = $request->query->get('priorityId');
        $stageId = $request->query->get('stageId');

        // Security: If user is only a requester, strictly restrict query to their own tickets
        if ($this->authService->isRequesterOnly($user)) {
            $requesterId = (string) $user->getId();
            $assignedUserId = null;
        } else {
            $requesterId = $request->query->get('requesterId');
            $assignedUserId = $request->query->get('assignedUserId');
        }

        $result = $this->ticketService->list(
            $user->getTenant(),
            $page,
            $limit,
            $search,
            $departmentId,
            $priorityId,
            $stageId,
            $requesterId,
            $assignedUserId
        );

        return new JsonResponse($result);
    }

    #[Route('', name: 'api_tickets_create', methods: ['POST'])]
    public function create(Request $request, #[CurrentUser] User $user): JsonResponse
    {
        $this->authService->assertPermission($user, 'ticket.create');

        $data = json_decode($request->getContent(), true) ?? [];
        $dto = CreateTicketDTO::fromArray($data);

        $ticket = $this->ticketService->create($dto, $user);

        return new JsonResponse($ticket->toArray(), Response::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'api_tickets_detail', methods: ['GET'])]
    public function getOne(string $id, #[CurrentUser] User $user): JsonResponse
    {
        $ticket = $this->ticketService->getById($id, $user->getTenant());

        // Solicitantes can only view their own tickets
        if ($this->authService->isRequesterOnly($user) && $ticket->requester->id !== (string) $user->getId()) {
            throw new ForbiddenException('Você não possui permissão para visualizar este chamado.');
        }

        return new JsonResponse($ticket->toArray());
    }

    #[Route('/{id}/assignment', name: 'api_tickets_assign', methods: ['POST'])]
    public function assign(string $id, Request $request, #[CurrentUser] User $user): JsonResponse
    {
        $this->authService->assertPermission(
            $user,
            'ticket.assign',
            'Apenas atendentes e administradores podem assumir ou atribuir chamados.'
        );

        $data = json_decode($request->getContent(), true) ?? [];
        $dto = AssignTicketDTO::fromArray($data);

        $ticket = $this->ticketService->assign($id, $dto, $user);

        return new JsonResponse($ticket->toArray());
    }

    #[Route('/{id}/transitions', name: 'api_tickets_move', methods: ['POST'])]
    public function moveStage(string $id, Request $request, #[CurrentUser] User $user): JsonResponse
    {
        $this->authService->assertPermission(
            $user,
            'ticket.move_pipeline',
            'Apenas atendentes e administradores podem alterar a etapa do chamado.'
        );

        $data = json_decode($request->getContent(), true) ?? [];
        $dto = MoveTicketStageDTO::fromArray($data);

        $ticket = $this->ticketService->moveStage($id, $dto, $user);

        return new JsonResponse($ticket->toArray());
    }

    #[Route('/{id}/comments', name: 'api_tickets_comments_list', methods: ['GET'])]
    public function listComments(string $id, #[CurrentUser] User $user): JsonResponse
    {
        // Solicitantes can only view comments on their own tickets and cannot see internal notes
        $isRequester = $this->authService->isRequesterOnly($user);
        if ($isRequester) {
            $ticket = $this->ticketService->getById($id, $user->getTenant());
            if ($ticket->requester->id !== (string) $user->getId()) {
                throw new ForbiddenException('Você não possui permissão para visualizar os comentários deste chamado.');
            }
        }

        $includeInternal = !$isRequester && $this->authService->canViewInternalComments($user);
        $comments = $this->ticketService->getComments($id, $user->getTenant(), $includeInternal);

        return new JsonResponse($comments);
    }

    #[Route('/{id}/comments', name: 'api_tickets_comments_add', methods: ['POST'])]
    public function addComment(string $id, Request $request, #[CurrentUser] User $user): JsonResponse
    {
        $data = json_decode($request->getContent(), true) ?? [];
        $dto = AddTicketCommentDTO::fromArray($data);

        $isRequester = $this->authService->isRequesterOnly($user);
        if ($isRequester) {
            $ticket = $this->ticketService->getById($id, $user->getTenant());
            if ($ticket->requester->id !== (string) $user->getId()) {
                throw new ForbiddenException('Você não possui permissão para interagir neste chamado.');
            }

            if ($dto->visibility === 'internal') {
                throw new ForbiddenException('Solicitantes não possuem permissão para criar notas internas.');
            }
        } else {
            if ($dto->visibility === 'internal') {
                $this->authService->assertPermission($user, 'ticket.comment_internal');
            }
        }

        $comment = $this->ticketService->addComment($id, $dto, $user);

        return new JsonResponse($comment->toArray(), Response::HTTP_CREATED);
    }

    #[Route('/{id}/history', name: 'api_tickets_history', methods: ['GET'])]
    public function history(string $id, #[CurrentUser] User $user): JsonResponse
    {
        if ($this->authService->isRequesterOnly($user)) {
            $ticket = $this->ticketService->getById($id, $user->getTenant());
            if ($ticket->requester->id !== (string) $user->getId()) {
                throw new ForbiddenException('Você não possui permissão para visualizar o histórico deste chamado.');
            }
        }

        $history = $this->ticketService->getHistory($id, $user->getTenant());

        return new JsonResponse($history);
    }
}
