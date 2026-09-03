<?php

namespace App\Tests\Service;

use App\DTO\Request\AssignTicketDTO;
use App\DTO\Request\CreateTicketDTO;
use App\DTO\Request\MoveTicketStageDTO;
use App\Entity\Department;
use App\Entity\Pipeline;
use App\Entity\PipelineStage;
use App\Entity\PipelineTransition;
use App\Entity\Priority;
use App\Entity\Tenant;
use App\Entity\Ticket;
use App\Entity\TicketType;
use App\Entity\User;
use App\Exception\ConcurrencyConflictException;
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
use App\Service\TicketService;
use App\Service\SlaService;
use PHPUnit\Framework\TestCase;

class TicketServiceTest extends TestCase
{
    private TicketRepository $ticketRepo;
    private DepartmentRepository $deptRepo;
    private TicketTypeRepository $typeRepo;
    private CategoryRepository $catRepo;
    private PriorityRepository $priRepo;
    private PipelineRepository $pipeRepo;
    private PipelineStageRepository $stageRepo;
    private PipelineTransitionRepository $transRepo;
    private UserRepository $userRepo;
    private TicketCommentRepository $commentRepo;
    private TicketHistoryRepository $historyRepo;
    private SlaService $slaService;
    private TicketService $service;

    private Tenant $tenant;
    private User $user;
    private Department $dept;
    private TicketType $type;
    private Priority $priority;
    private Pipeline $pipeline;
    private PipelineStage $stage1;
    private PipelineStage $stage2;

    protected function setUp(): void
    {
        $this->ticketRepo = $this->createMock(TicketRepository::class);
        $this->deptRepo = $this->createMock(DepartmentRepository::class);
        $this->typeRepo = $this->createMock(TicketTypeRepository::class);
        $this->catRepo = $this->createMock(CategoryRepository::class);
        $this->priRepo = $this->createMock(PriorityRepository::class);
        $this->pipeRepo = $this->createMock(PipelineRepository::class);
        $this->stageRepo = $this->createMock(PipelineStageRepository::class);
        $this->transRepo = $this->createMock(PipelineTransitionRepository::class);
        $this->userRepo = $this->createMock(UserRepository::class);
        $this->commentRepo = $this->createMock(TicketCommentRepository::class);
        $this->historyRepo = $this->createMock(TicketHistoryRepository::class);
        $this->slaService = $this->createMock(SlaService::class);

        $this->service = new TicketService(
            $this->ticketRepo,
            $this->deptRepo,
            $this->typeRepo,
            $this->catRepo,
            $this->priRepo,
            $this->pipeRepo,
            $this->stageRepo,
            $this->transRepo,
            $this->userRepo,
            $this->commentRepo,
            $this->historyRepo,
            $this->slaService
        );

        $this->tenant = new Tenant('Acme Corp');
        $this->user = new User($this->tenant, 'Carlos', 'carlos@acme.com');
        $this->dept = new Department($this->tenant, 'TI');
        $this->type = new TicketType($this->tenant, $this->dept, 'Acesso');
        $this->priority = new Priority($this->tenant, 'Alta', 80);
        $this->pipeline = new Pipeline($this->tenant, 'Pipeline TI');
        $this->stage1 = new PipelineStage($this->pipeline, 'Triagem', 1, isInitial: true);
        $this->stage2 = new PipelineStage($this->pipeline, 'Em Atendimento', 2);
    }

    public function testAssignThrowsConcurrencyConflict(): void
    {
        $ticket = new Ticket(
            $this->tenant,
            'HD-000001',
            'Problema de Acesso',
            'Não consigo logar',
            $this->user,
            $this->dept,
            $this->type,
            $this->priority,
            $this->pipeline,
            $this->stage1
        );

        $this->ticketRepo
            ->expects($this->once())
            ->method('findByIdAndTenant')
            ->willReturn($ticket);

        // Expected version is 5, but ticket is at version 1
        $dto = new AssignTicketDTO(userId: 'user-uuid', expectedVersion: 5);

        $this->expectException(ConcurrencyConflictException::class);

        $this->service->assign('ticket-uuid', $dto, $this->user);
    }

    public function testMoveStageThrowsWhenTransitionNotAllowed(): void
    {
        $ticket = new Ticket(
            $this->tenant,
            'HD-000001',
            'Problema de Acesso',
            'Não consigo logar',
            $this->user,
            $this->dept,
            $this->type,
            $this->priority,
            $this->pipeline,
            $this->stage1
        );

        $this->ticketRepo
            ->expects($this->once())
            ->method('findByIdAndTenant')
            ->willReturn($ticket);

        $this->stageRepo
            ->expects($this->once())
            ->method('findByIdAndPipeline')
            ->willReturn($this->stage2);

        $this->transRepo
            ->expects($this->once())
            ->method('hasTransitions')
            ->willReturn(true);

        $this->transRepo
            ->expects($this->once())
            ->method('findValidTransition')
            ->with($this->pipeline, $this->stage1, $this->stage2)
            ->willReturn(null); // transition not allowed!

        $dto = new MoveTicketStageDTO(toStageId: 'stage-2-uuid', expectedVersion: 1);

        $this->expectException(InvalidStageTransitionException::class);

        $this->service->moveStage('ticket-uuid', $dto, $this->user);
    }

    public function testCreateTicketSuccessfully(): void
    {
        $dto = new CreateTicketDTO(
            title: 'Computador não liga',
            description: 'A máquina parou de funcionar subitamente',
            departmentId: 'dept-id',
            typeId: 'type-id',
            categoryId: null,
            priorityId: 'pri-id'
        );

        $this->deptRepo->expects($this->once())->method('findByIdAndTenant')->willReturn($this->dept);
        $this->typeRepo->expects($this->once())->method('findByIdAndTenant')->willReturn($this->type);
        $this->priRepo->expects($this->once())->method('findByIdAndTenant')->willReturn($this->priority);
        $this->pipeRepo->expects($this->once())->method('findActiveByTenant')->willReturn($this->pipeline);

        $this->pipeline->getStages()->add($this->stage1);

        $this->ticketRepo
            ->expects($this->once())
            ->method('generateNextProtocol')
            ->willReturn('HD-000002');

        $this->ticketRepo->expects($this->once())->method('save');
        $this->historyRepo->expects($this->once())->method('save');

        $result = $this->service->create($dto, $this->user);

        $this->assertSame('HD-000002', $result->summary->protocol);
        $this->assertSame('Computador não liga', $result->summary->title);
        $this->assertSame('Triagem', $result->summary->stage['name']);
    }
}
