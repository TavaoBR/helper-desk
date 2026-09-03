<?php

namespace App\Service;

use App\DTO\Request\AddTicketCommentDTO;
use App\DTO\Request\AssignTicketDTO;
use App\DTO\Request\CreateTicketDTO;
use App\DTO\Request\MoveTicketStageDTO;
use App\DTO\Response\PaginatedResponseDTO;
use App\DTO\Response\TicketCommentDTO;
use App\DTO\Response\TicketDetailDTO;
use App\DTO\Response\TicketHistoryDTO;
use App\DTO\Response\TicketSummaryDTO;
use App\Entity\Category;
use App\Entity\Department;
use App\Entity\Pipeline;
use App\Entity\PipelineStage;
use App\Entity\Priority;
use App\Entity\Tenant;
use App\Entity\Ticket;
use App\Entity\TicketComment;
use App\Entity\TicketHistory;
use App\Entity\TicketType;
use App\Entity\User;
use App\Exception\ConcurrencyConflictException;
use App\Exception\EntityNotFoundException;
use App\Exception\InvalidStageTransitionException;
use App\Repository\CategoryRepository;
use App\Repository\DepartmentRepository;
use App\Repository\PipelineRepository;
use App\Repository\PipelineStageRepository;
use App\Repository\PipelineTransitionRepository;
use App\Repository\PriorityRepository;
use App\Repository\TicketCommentRepository;
use App\Repository\TicketHistoryRepository;
use App\Repository\TicketRepository;
use App\Repository\TicketTypeRepository;
use App\Repository\UserRepository;

class TicketService
{
    public function __construct(
        private readonly TicketRepository $ticketRepository,
        private readonly DepartmentRepository $departmentRepository,
        private readonly TicketTypeRepository $ticketTypeRepository,
        private readonly CategoryRepository $categoryRepository,
        private readonly PriorityRepository $priorityRepository,
        private readonly PipelineRepository $pipelineRepository,
        private readonly PipelineStageRepository $pipelineStageRepository,
        private readonly PipelineTransitionRepository $pipelineTransitionRepository,
        private readonly UserRepository $userRepository,
        private readonly TicketCommentRepository $ticketCommentRepository,
        private readonly TicketHistoryRepository $ticketHistoryRepository,
        private readonly SlaService $slaService
    ) {
    }

    /**
     * @return array<string, mixed>
     */
    public function list(
        Tenant $tenant,
        int $page = 1,
        int $limit = 20,
        ?string $search = null,
        ?string $departmentId = null,
        ?string $priorityId = null,
        ?string $stageId = null,
        ?string $requesterId = null,
        ?string $assignedUserId = null
    ): array {
        $result = $this->ticketRepository->findPaginatedByTenant(
            $tenant,
            $page,
            $limit,
            $search,
            $departmentId,
            $priorityId,
            $stageId,
            $requesterId,
            $assignedUserId
        );

        $items = array_map(
            fn(Ticket $t) => TicketSummaryDTO::fromEntity($t)->toArray(),
            $result['items']
        );

        return PaginatedResponseDTO::format($items, $page, $limit, $result['total']);
    }

    public function create(CreateTicketDTO $dto, User $requester): TicketDetailDTO
    {
        $tenant = $requester->getTenant();

        // 1. Validar e obter entidades relacionadas no escopo do tenant
        $department = $this->departmentRepository->findByIdAndTenant($dto->departmentId, $tenant);
        if (!$department) {
            throw new EntityNotFoundException('Departamento não encontrado ou inativo.');
        }

        $type = $this->ticketTypeRepository->findByIdAndTenant($dto->typeId, $tenant);
        if (!$type) {
            throw new EntityNotFoundException('Tipo de chamado não encontrado.');
        }

        $priority = $this->priorityRepository->findByIdAndTenant($dto->priorityId, $tenant);
        if (!$priority) {
            throw new EntityNotFoundException('Prioridade selecionada não encontrada.');
        }

        $category = null;
        if ($dto->categoryId !== null) {
            $category = $this->categoryRepository->findByIdAndTenant($dto->categoryId, $tenant);
            if (!$category) {
                throw new EntityNotFoundException('Categoria selecionada não encontrada.');
            }
        }

        // 2. Obter pipeline dinâmico e estágio inicial
        $pipeline = $this->pipelineRepository->findActiveByTenant($tenant);
        if (!$pipeline) {
            throw new EntityNotFoundException('Nenhum fluxo/pipeline de atendimento configurado para a organização.');
        }

        $initialStage = $pipeline->getInitialStage();
        if (!$initialStage) {
            $initialStage = $pipeline->getStages()->first() ?: null;
        }

        if (!$initialStage) {
            throw new EntityNotFoundException('O pipeline ativo não possui nenhuma etapa cadastrada.');
        }

        // 3. Gerar protocolo sequencial via Repository
        $protocol = $this->ticketRepository->generateNextProtocol($tenant);

        // 4. Instanciar agregado central Ticket
        $ticket = new Ticket(
            $tenant,
            $protocol,
            $dto->title,
            $dto->description,
            $requester,
            $department,
            $type,
            $priority,
            $pipeline,
            $initialStage
        );

        if ($category !== null) {
            $ticket->setCategory($category);
        }

        // 5. Registrar histórico inicial
        $history = new TicketHistory(
            $ticket,
            $requester,
            'abriu o chamado na etapa ' . $initialStage->getName(),
            null,
            ['stage' => $initialStage->getName(), 'protocol' => $protocol]
        );

        // 6. Aplicar política e prazos de SLA
        $this->slaService->applySlaToTicket($ticket);

        // 7. Persistir via Repositories
        $this->ticketRepository->save($ticket);
        $this->ticketHistoryRepository->save($history);

        return TicketDetailDTO::fromEntity($ticket);
    }

    public function getById(string $id, Tenant $tenant): TicketDetailDTO
    {
        $ticket = $this->ticketRepository->findByIdAndTenant($id, $tenant);
        if (!$ticket) {
            throw new EntityNotFoundException('Chamado não encontrado.');
        }

        return TicketDetailDTO::fromEntity($ticket);
    }

    public function assign(string $id, AssignTicketDTO $dto, User $actor): TicketDetailDTO
    {
        $tenant = $actor->getTenant();
        $ticket = $this->ticketRepository->findByIdAndTenant($id, $tenant);
        if (!$ticket) {
            throw new EntityNotFoundException('Chamado não encontrado.');
        }

        // Concorrência Otimista
        if ($dto->expectedVersion !== null && $ticket->getVersion() !== $dto->expectedVersion) {
            throw new ConcurrencyConflictException();
        }

        $assignedUser = null;
        if ($dto->userId !== null) {
            $assignedUser = $this->userRepository->findByIdAndTenant($dto->userId, $tenant);
            if (!$assignedUser) {
                throw new EntityNotFoundException('Usuário para atribuição não encontrado no tenant.');
            }
        }

        $ticket->setAssignedUser($assignedUser);

        $actionDesc = $assignedUser !== null
            ? 'atribuiu o atendimento para ' . $assignedUser->getName()
            : 'removeu a atribuição de responsável';

        $history = new TicketHistory($ticket, $actor, $actionDesc);

        $this->ticketRepository->save($ticket);
        $this->ticketHistoryRepository->save($history);

        return TicketDetailDTO::fromEntity($ticket);
    }

    public function moveStage(string $id, MoveTicketStageDTO $dto, User $actor): TicketDetailDTO
    {
        $tenant = $actor->getTenant();
        $ticket = $this->ticketRepository->findByIdAndTenant($id, $tenant);
        if (!$ticket) {
            throw new EntityNotFoundException('Chamado não encontrado.');
        }

        // Concorrência Otimista
        if ($dto->expectedVersion !== null && $ticket->getVersion() !== $dto->expectedVersion) {
            throw new ConcurrencyConflictException();
        }

        $toStage = $this->pipelineStageRepository->findByIdAndPipeline($dto->toStageId, $ticket->getPipeline());
        if (!$toStage) {
            throw new EntityNotFoundException('A etapa de destino informada não pertence ao pipeline do chamado.');
        }

        // Validação da máquina de estados no PipelineTransitionRepository
        if ($this->pipelineTransitionRepository->hasTransitions($ticket->getPipeline())) {
            $validTransition = $this->pipelineTransitionRepository->findValidTransition(
                $ticket->getPipeline(),
                $ticket->getCurrentStage(),
                $toStage
            );

            if (!$validTransition) {
                throw new InvalidStageTransitionException(
                    $ticket->getCurrentStage()->getName(),
                    $toStage->getName()
                );
            }
        }

        $oldStageName = $ticket->getCurrentStage()->getName();
        $ticket->setCurrentStage($toStage);

        $history = new TicketHistory(
            $ticket,
            $actor,
            "moveu a etapa de '{$oldStageName}' para '{$toStage->getName()}'"
        );

        $this->ticketRepository->save($ticket);
        $this->ticketHistoryRepository->save($history);

        return TicketDetailDTO::fromEntity($ticket);
    }

    public function addComment(string $ticketId, AddTicketCommentDTO $dto, User $author): TicketCommentDTO
    {
        $tenant = $author->getTenant();
        $ticket = $this->ticketRepository->findByIdAndTenant($ticketId, $tenant);
        if (!$ticket) {
            throw new EntityNotFoundException('Chamado não encontrado.');
        }

        $comment = new TicketComment($ticket, $author, $dto->body, $dto->visibility);

        $historyAction = $dto->visibility === 'internal'
            ? 'adicionou uma nota interna'
            : 'adicionou um comentário';
        $history = new TicketHistory($ticket, $author, $historyAction);

        $this->ticketCommentRepository->save($comment);
        $this->ticketHistoryRepository->save($history);

        return TicketCommentDTO::fromEntity($comment);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function getComments(string $ticketId, Tenant $tenant, bool $includeInternal = true): array
    {
        $ticket = $this->ticketRepository->findByIdAndTenant($ticketId, $tenant);
        if (!$ticket) {
            throw new EntityNotFoundException('Chamado não encontrado.');
        }

        $comments = $this->ticketCommentRepository->findByTicket($ticket);

        if (!$includeInternal) {
            $comments = array_values(array_filter($comments, fn(TicketComment $c) => $c->getVisibility() !== 'internal'));
        }

        return array_map(fn(TicketComment $c) => TicketCommentDTO::fromEntity($c)->toArray(), $comments);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function getHistory(string $ticketId, Tenant $tenant): array
    {
        $ticket = $this->ticketRepository->findByIdAndTenant($ticketId, $tenant);
        if (!$ticket) {
            throw new EntityNotFoundException('Chamado não encontrado.');
        }

        $history = $this->ticketHistoryRepository->findByTicket($ticket);
        return array_map(fn(TicketHistory $h) => TicketHistoryDTO::fromEntity($h)->toArray(), $history);
    }
}
