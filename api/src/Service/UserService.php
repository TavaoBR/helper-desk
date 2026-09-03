<?php

namespace App\Service;

use App\DTO\Request\CreateUserDTO;
use App\DTO\Response\UserResponseDTO;
use App\Entity\Tenant;
use App\Entity\User;
use App\Exception\EntityNotFoundException;
use App\Exception\UserAlreadyExistsException;
use App\Repository\UserRepository;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class UserService
{
    public function __construct(
        private readonly UserRepository $userRepository,
        private readonly UserPasswordHasherInterface $hasher
    ) {
    }

    public function create(CreateUserDTO $dto, Tenant $tenant): UserResponseDTO
    {
        // 1. Verificar se o usuário já existe no tenant
        if ($this->userRepository->existsByEmailAndTenant($dto->email, $tenant)) {
            throw new UserAlreadyExistsException($dto->email);
        }

        // 2. Instanciar usuário associado ao tenant
        $user = new User($tenant, $dto->name, $dto->email);

        // 3. Processar hash seguro de senha
        $hashedPassword = $this->hasher->hashPassword($user, $dto->password);
        $user->setPassword($hashedPassword);

        // 4. Tratar roles / permissões
        $user->setRoles($dto->roles);

        // 5. Persistir exclusivamente via UserRepository
        $this->userRepository->save($user);

        return UserResponseDTO::fromEntity($user);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function listByTenant(Tenant $tenant): array
    {
        $users = $this->userRepository->listByTenant($tenant);
        return array_map(fn(User $u) => UserResponseDTO::fromEntity($u)->toArray(), $users);
    }

    public function getById(string $id, Tenant $tenant): UserResponseDTO
    {
        $user = $this->userRepository->findByIdAndTenant($id, $tenant);
        if (!$user) {
            throw new EntityNotFoundException('Usuário não encontrado para este tenant.');
        }

        return UserResponseDTO::fromEntity($user);
    }
}
