<?php

namespace App\Tests\Service;

use App\DTO\Request\CreateUserDTO;
use App\Entity\Tenant;
use App\Entity\User;
use App\Exception\UserAlreadyExistsException;
use App\Exception\ValidationException;
use App\Repository\UserRepository;
use App\Service\UserService;
use PHPUnit\Framework\TestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class UserServiceTest extends TestCase
{
    private UserRepository $userRepository;
    private UserPasswordHasherInterface $hasher;
    private UserService $service;
    private Tenant $tenant;

    protected function setUp(): void
    {
        $this->userRepository = $this->createMock(UserRepository::class);
        $this->hasher = $this->createMock(UserPasswordHasherInterface::class);
        $this->service = new UserService($this->userRepository, $this->hasher);
        $this->tenant = new Tenant('Test Tenant');
    }

    public function testCreateUserSuccessfully(): void
    {
        $dto = new CreateUserDTO(
            name: 'Maria Silva',
            email: 'maria@test.com',
            password: 'secretPassword123',
            roles: ['ROLE_USER']
        );

        $this->userRepository
            ->expects($this->once())
            ->method('existsByEmailAndTenant')
            ->with('maria@test.com', $this->tenant)
            ->willReturn(false);

        $this->hasher
            ->expects($this->once())
            ->method('hashPassword')
            ->willReturn('$2y$13$hashedPasswordValue');

        $this->userRepository
            ->expects($this->once())
            ->method('save')
            ->with($this->isInstanceOf(User::class));

        $response = $this->service->create($dto, $this->tenant);

        $this->assertSame('Maria Silva', $response->name);
        $this->assertSame('maria@test.com', $response->email);
        $this->assertSame(['ROLE_USER'], $response->roles);
    }

    public function testThrowsWhenUserAlreadyExistsInTenant(): void
    {
        $dto = new CreateUserDTO(
            name: 'Maria Duplicada',
            email: 'maria@test.com',
            password: 'secretPassword123'
        );

        $this->userRepository
            ->expects($this->once())
            ->method('existsByEmailAndTenant')
            ->with('maria@test.com', $this->tenant)
            ->willReturn(true);

        $this->expectException(UserAlreadyExistsException::class);

        $this->service->create($dto, $this->tenant);
    }

    public function testValidationFailsForInvalidData(): void
    {
        $this->expectException(ValidationException::class);

        CreateUserDTO::fromArray([
            'name' => '',
            'email' => 'invalid-email',
            'password' => '123' // too short
        ]);
    }
}
