<?php

namespace App\Tests\Service;

use App\DTO\Request\LoginDTO;
use App\Entity\Tenant;
use App\Entity\User;
use App\Entity\UserSession;
use App\Exception\UnauthorizedException;
use App\Repository\UserRepository;
use App\Service\AuthService;
use App\Service\SessionService;
use App\Service\TokenService;
use App\Service\UserService;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class AuthServiceTest extends TestCase
{
    private UserRepository $userRepository;
    private UserPasswordHasherInterface $hasher;
    private SessionService $sessionService;
    private TokenService $tokenService;
    private AuthService $authService;
    private User $user;

    protected function setUp(): void
    {
        $this->userRepository = $this->createMock(UserRepository::class);
        $this->hasher = $this->createMock(UserPasswordHasherInterface::class);
        $this->sessionService = $this->createMock(SessionService::class);
        $this->tokenService = $this->createMock(TokenService::class);

        $this->authService = new AuthService(
            $this->userRepository,
            $this->hasher,
            $this->sessionService,
            $this->tokenService
        );

        $tenant = new Tenant('Tenant Teste');
        $this->user = new User($tenant, 'Ana Lima', 'ana@empresa.com');
        $this->user->setPassword('$2y$hashed');
    }

    public function testLoginSuccess(): void
    {
        $dto = new LoginDTO('ana@empresa.com', 'correct-password', 'device-123');
        $request = Request::create('/api/auth/login', 'POST');

        $this->userRepository
            ->expects($this->once())
            ->method('findOneBy')
            ->with(['email' => 'ana@empresa.com'])
            ->willReturn($this->user);

        $this->hasher
            ->expects($this->once())
            ->method('isPasswordValid')
            ->with($this->user, 'correct-password')
            ->willReturn(true);

        $session = new UserSession($this->user, 'hash', (new \DateTimeImmutable())->modify('+7 days'));
        $this->sessionService
            ->expects($this->once())
            ->method('createSession')
            ->willReturn(['session' => $session, 'plainRefreshToken' => 'plain-refresh']);

        $this->tokenService
            ->expects($this->once())
            ->method('generateAccessToken')
            ->with($this->user)
            ->willReturn('jwt-access-token');

        $this->tokenService
            ->expects($this->once())
            ->method('generateXsrfToken')
            ->willReturn('xsrf-token');

        $result = $this->authService->login($dto, $request);

        $this->assertSame($this->user, $result['user']);
        $this->assertSame('jwt-access-token', $result['accessToken']);
        $this->assertSame('plain-refresh', $result['plainRefreshToken']);
        $this->assertSame('xsrf-token', $result['xsrfToken']);
        $this->assertSame($session, $result['session']);
    }

    public function testLoginFailsOnIncorrectPassword(): void
    {
        $dto = new LoginDTO('ana@empresa.com', 'wrong-password');
        $request = Request::create('/api/auth/login', 'POST');

        $this->userRepository
            ->method('findOneBy')
            ->willReturn($this->user);

        $this->hasher
            ->method('isPasswordValid')
            ->willReturn(false);

        $this->expectException(UnauthorizedException::class);
        $this->expectExceptionMessage('Credenciais inválidas.');

        $this->authService->login($dto, $request);
    }

    public function testLoginFailsWhenUserNotFound(): void
    {
        $dto = new LoginDTO('nonexistent@empresa.com', 'some-password');
        $request = Request::create('/api/auth/login', 'POST');

        $this->userRepository
            ->method('findOneBy')
            ->willReturn(null);

        $this->expectException(UnauthorizedException::class);
        $this->expectExceptionMessage('Credenciais inválidas.');

        $this->authService->login($dto, $request);
    }

    public function testLoginFailsWhenUserIsInactive(): void
    {
        $this->user->setIsActive(false);
        $dto = new LoginDTO('ana@empresa.com', 'correct-password');
        $request = Request::create('/api/auth/login', 'POST');

        $this->userRepository
            ->method('findOneBy')
            ->willReturn($this->user);

        $this->hasher
            ->method('isPasswordValid')
            ->willReturn(true);

        $this->expectException(UnauthorizedException::class);
        $this->expectExceptionMessage('Usuário inativo ou bloqueado.');

        $this->authService->login($dto, $request);
    }

    public function testRefreshSuccess(): void
    {
        $request = Request::create('/api/auth/refresh', 'POST');

        $this->tokenService
            ->expects($this->once())
            ->method('extractRefreshToken')
            ->with($request)
            ->willReturn('valid-plain-token');

        $session = new UserSession($this->user, 'new-hash', (new \DateTimeImmutable())->modify('+7 days'));
        $this->sessionService
            ->expects($this->once())
            ->method('refreshSession')
            ->willReturn([
                'session' => $session,
                'user' => $this->user,
                'newPlainRefreshToken' => 'new-plain-token'
            ]);

        $this->tokenService
            ->expects($this->once())
            ->method('generateAccessToken')
            ->with($this->user)
            ->willReturn('new-jwt');

        $this->tokenService
            ->expects($this->once())
            ->method('generateXsrfToken')
            ->willReturn('new-xsrf');

        $result = $this->authService->refresh($request);

        $this->assertSame($this->user, $result['user']);
        $this->assertSame('new-jwt', $result['accessToken']);
        $this->assertSame('new-plain-token', $result['newPlainRefreshToken']);
        $this->assertSame('new-xsrf', $result['xsrfToken']);
    }

    public function testRefreshFailsWhenTokenNotProvided(): void
    {
        $request = Request::create('/api/auth/refresh', 'POST');

        $this->tokenService
            ->method('extractRefreshToken')
            ->willReturn(null);

        $this->expectException(UnauthorizedException::class);
        $this->expectExceptionMessage('Refresh token não informado.');

        $this->authService->refresh($request);
    }

    public function testLogoutCallsSessionRevoke(): void
    {
        $request = Request::create('/api/auth/logout', 'POST');

        $this->tokenService
            ->expects($this->once())
            ->method('extractRefreshToken')
            ->with($request)
            ->willReturn('token-to-revoke');

        $this->sessionService
            ->expects($this->once())
            ->method('revokeByToken')
            ->with('token-to-revoke');

        $this->authService->logout($request);
    }

    public function testLogoutAllRevokesAllSessions(): void
    {
        $this->sessionService
            ->expects($this->once())
            ->method('revokeAllForUser')
            ->with($this->user)
            ->willReturn(5);

        $count = $this->authService->logoutAll($this->user);
        $this->assertSame(5, $count);
    }

    public function testPasswordChangeInvalidatesAllUserSessions(): void
    {
        $userService = new UserService(
            $this->userRepository,
            $this->hasher,
            $this->sessionService
        );

        $this->hasher
            ->expects($this->once())
            ->method('hashPassword')
            ->with($this->user, 'newSecretPassword')
            ->willReturn('$2y$newHash');

        $this->userRepository
            ->expects($this->once())
            ->method('save')
            ->with($this->user);

        // Crucial security requirement: SessionService must revoke all active sessions on password change
        $this->sessionService
            ->expects($this->once())
            ->method('revokeAllForUser')
            ->with($this->user);

        $userService->changePassword($this->user, 'newSecretPassword');
    }

    public function testUserDeactivationInvalidatesAllSessions(): void
    {
        $userService = new UserService(
            $this->userRepository,
            $this->hasher,
            $this->sessionService
        );

        $this->userRepository
            ->expects($this->once())
            ->method('save')
            ->with($this->user);

        // Crucial security requirement: Deactivating a user must revoke all active sessions immediately
        $this->sessionService
            ->expects($this->once())
            ->method('revokeAllForUser')
            ->with($this->user);

        $userService->setUserActiveStatus($this->user, false);
        $this->assertFalse($this->user->isActive());
    }
}
