<?php

namespace App\Service;

use App\DTO\Response\CatalogResponseDTO;
use App\Entity\Tenant;
use App\Repository\CategoryRepository;
use App\Repository\DepartmentRepository;
use App\Repository\PipelineRepository;
use App\Repository\PriorityRepository;
use App\Repository\TicketTypeRepository;

class CatalogService
{
    public function __construct(
        private readonly DepartmentRepository $departmentRepository,
        private readonly TicketTypeRepository $ticketTypeRepository,
        private readonly CategoryRepository $categoryRepository,
        private readonly PriorityRepository $priorityRepository,
        private readonly PipelineRepository $pipelineRepository
    ) {
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function getDepartments(Tenant $tenant): array
    {
        $departments = $this->departmentRepository->findAllActiveByTenant($tenant);
        return array_map(fn($d) => CatalogResponseDTO::fromDepartment($d), $departments);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function getTypes(Tenant $tenant, ?string $departmentId = null): array
    {
        $types = $this->ticketTypeRepository->findByTenantAndDepartment($tenant, $departmentId);
        return array_map(fn($t) => CatalogResponseDTO::fromTicketType($t), $types);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function getCategories(Tenant $tenant, ?string $departmentId = null): array
    {
        $categories = $this->categoryRepository->findByTenantAndDepartment($tenant, $departmentId);
        return array_map(fn($c) => CatalogResponseDTO::fromCategory($c), $categories);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function getPriorities(Tenant $tenant): array
    {
        $priorities = $this->priorityRepository->findAllActiveByTenant($tenant);
        return array_map(fn($p) => CatalogResponseDTO::fromPriority($p), $priorities);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function getPipelines(Tenant $tenant): array
    {
        $pipelines = $this->pipelineRepository->findAllByTenant($tenant);
        return array_map(fn($p) => CatalogResponseDTO::fromPipeline($p), $pipelines);
    }

    /**
     * @return array<string, mixed>
     */
    public function createType(Tenant $tenant, string $departmentId, string $name): array
    {
        $department = $this->departmentRepository->findByIdAndTenant($departmentId, $tenant);
        if (!$department) {
            throw new \App\Exception\EntityNotFoundException('Departamento não encontrado.');
        }

        $type = new \App\Entity\TicketType($tenant, $department, trim($name));
        $this->ticketTypeRepository->save($type);

        return CatalogResponseDTO::fromTicketType($type);
    }
}
