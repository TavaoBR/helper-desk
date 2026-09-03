<?php

namespace App\Controller;

use App\DTO\Request\CreateUserDTO;
use App\Entity\User;
use App\Exception\ForbiddenException;
use App\Service\AuthorizationService;
use App\Service\UserService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/users')]
class UserController extends AbstractController
{
    public function __construct(
        private readonly UserService $userService,
        private readonly AuthorizationService $authService
    ) {
    }

    #[Route('', name: 'api_users_create', methods: ['POST'])]
    public function create(Request $request, #[CurrentUser] User $currentUser): JsonResponse
    {
        $this->authService->assertPermission(
            $currentUser,
            'user.manage',
            'Apenas administradores podem cadastrar novos usuários ou agentes.'
        );

        $data = json_decode($request->getContent(), true) ?? [];
        $dto = CreateUserDTO::fromArray($data);

        $response = $this->userService->create($dto, $currentUser->getTenant());

        return new JsonResponse($response->toArray(), Response::HTTP_CREATED);
    }

    #[Route('', name: 'api_users_list', methods: ['GET'])]
    public function list(#[CurrentUser] User $currentUser): JsonResponse
    {
        $this->authService->assertPermission(
            $currentUser,
            'user.view',
            'Você não possui permissão para listar os usuários do sistema.'
        );

        $users = $this->userService->listByTenant($currentUser->getTenant());

        return new JsonResponse($users);
    }

    #[Route('/{id}', name: 'api_users_detail', methods: ['GET'])]
    public function getOne(string $id, #[CurrentUser] User $currentUser): JsonResponse
    {
        if ($id !== (string) $currentUser->getId()) {
            $this->authService->assertPermission(
                $currentUser,
                'user.view',
                'Você não possui permissão para visualizar dados deste usuário.'
            );
        }

        $user = $this->userService->getById($id, $currentUser->getTenant());

        return new JsonResponse($user->toArray());
    }
}
