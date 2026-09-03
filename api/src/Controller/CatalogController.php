<?php

namespace App\Controller;

use App\Entity\User;
use App\Exception\ValidationException;
use App\Service\AuthorizationService;
use App\Service\CatalogService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/ticket-settings')]
class CatalogController extends AbstractController
{
    public function __construct(
        private readonly CatalogService $catalogService,
        private readonly AuthorizationService $authService
    ) {
    }

    #[Route('/departments', name: 'api_catalog_departments', methods: ['GET'])]
    public function listDepartments(#[CurrentUser] User $user): JsonResponse
    {
        $departments = $this->catalogService->getDepartments($user->getTenant());

        return new JsonResponse($departments);
    }

    #[Route('/types', name: 'api_catalog_types', methods: ['GET'])]
    public function listTypes(Request $request, #[CurrentUser] User $user): JsonResponse
    {
        $departmentId = $request->query->get('departmentId');
        $types = $this->catalogService->getTypes($user->getTenant(), $departmentId);

        return new JsonResponse($types);
    }

    #[Route('/types', name: 'api_catalog_types_create', methods: ['POST'])]
    public function createType(Request $request, #[CurrentUser] User $user): JsonResponse
    {
        $this->authService->assertPermission(
            $user,
            'request_type.manage',
            'Apenas administradores podem criar novos tipos de solicitação.'
        );

        $data = json_decode($request->getContent(), true) ?? [];
        $departmentId = $data['departmentId'] ?? null;
        $name = $data['name'] ?? null;

        if (!$departmentId || !is_string($departmentId)) {
            throw new ValidationException('O departamento é obrigatório.');
        }

        if (!$name || !is_string($name) || trim($name) === '') {
            throw new ValidationException('O nome do tipo de solicitação é obrigatório.');
        }

        $type = $this->catalogService->createType($user->getTenant(), $departmentId, $name);

        return new JsonResponse($type, Response::HTTP_CREATED);
    }

    #[Route('/categories', name: 'api_catalog_categories', methods: ['GET'])]
    public function listCategories(Request $request, #[CurrentUser] User $user): JsonResponse
    {
        $departmentId = $request->query->get('departmentId');
        $categories = $this->catalogService->getCategories($user->getTenant(), $departmentId);

        return new JsonResponse($categories);
    }

    #[Route('/priorities', name: 'api_catalog_priorities', methods: ['GET'])]
    public function listPriorities(#[CurrentUser] User $user): JsonResponse
    {
        $priorities = $this->catalogService->getPriorities($user->getTenant());

        return new JsonResponse($priorities);
    }

    #[Route('/pipelines', name: 'api_catalog_pipelines', methods: ['GET'])]
    public function listPipelines(#[CurrentUser] User $user): JsonResponse
    {
        $pipelines = $this->catalogService->getPipelines($user->getTenant());

        return new JsonResponse($pipelines);
    }
}
