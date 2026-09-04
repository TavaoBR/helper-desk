<?php

namespace App\Tests\Service;

use App\Entity\Tenant;
use App\Entity\User;
use App\Entity\UserSession;
use App\Exception\UnauthorizedException;
use App\Repository\UserSessionRepository;
use App\Service\SessionService;
use App\Service\TokenService;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use PHPUnit\Framework\TestCase;

class SessionServiceTest extends TestCase
{
    private UserSessionRepository $sessionRepository;
    private TokenService $tokenService;
    private SessionService $sessionService;
    private User $user;

    protected function setUp(): void
    {
        $this->sessionRepository = $this->createMock(UserSessionRepository::class);
        $jwtManager = $this->createMock(JWTTokenManagerInterface::class);

        $this->tokenService = new TokenService(
            $jwtManager,
            accessTokenTtl: 900,
            refreshTokenTtl: 604800,
            sessionMaxLifetime: 604800,
            cookieSecure: false,
            cookieSameSite: 'lax'
        );

        $this->sessionService = new SessionService(
            $this->sessionRepository,
            $this->tokenService
        );

        $tenant = new Tenant('Empresa Teste');
        $this->user = new User($tenant, 'Roberto Silva', 'roberto@empresa.com');
    }

    public function testCreateSessionSuccessfully(): void
    {
        $this->sessionRepository
            ->expects($this->once())
            ->method('save')
            ->with($this->isInstanceOf(UserSession::class));

        $result = $this->sessionService->createSession(
            $this->user,
            '10.0.0.1',
            'BrowserAgent',
            'dev-laptop'
        );

        $this->assertArrayHasKey('session', $result);
        $this->assertArrayHasKey('plainRefreshToken', $result);
        $this->assertSame($this->user, $result['session']->getUser());
        $this->assertNotEmpty($result['plainRefreshToken']);
        $this->assertSame('10.0.0.1', $result['session']->getIpAddress());
    }

    public function testCannotCreateSessionForInactiveUser(): void
    {
        $this->user->setIsActive(false);

        $this->expectException(UnauthorizedException::class);
        $this->expectExceptionMessage('Usuário inativo ou bloqueado.');

        $this->sessionService->createSession($this->user);
    }

    public function testRefreshSessionWithTokenRotation(): void
    {
        $plainToken = 'valid-plain-token';
        $tokenHash = $this->tokenService->hashToken($plainToken);
        $now = new \DateTimeImmutable();
        $expiresAt = $now->modify('+7 days');

        $session = new UserSession($this->user, $tokenHash, $expiresAt);

        $this->sessionRepository
            ->expects($this->once())
            ->method('findByPreviousTokenHash')
            ->with($tokenHash)
            ->willReturn(null);

        $this->sessionRepository
            ->expects($this->once())
            ->method('findByTokenHash')
            ->with($tokenHash)
            ->willReturn($session);

        $this->sessionRepository
            ->expects($this->once())
            ->method('save')
            ->with($session);

        $refreshed = $this->sessionService->refreshSession($plainToken, '10.0.0.2', 'UpdatedAgent');

        $this->assertSame($session, $refreshed['session']);
        $this->assertSame($this->user, $refreshed['user']);
        $this->assertNotEquals($plainToken, $refreshed['newPlainRefreshToken']);
        // Previous token hash must have been set to the old token hash
        $this->assertSame($tokenHash, $session->getPreviousTokenHash());
        $this->assertSame('10.0.0.2', $session->getIpAddress());
    }

    public function testDetectsRefreshTokenReuseAndRevokesSession(): void
    {
        $reusedToken = 'already-rotated-token';
        $reusedHash = $this->tokenService->hashToken($reusedToken);
        $now = new \DateTimeImmutable();
        $expiresAt = $now->modify('+7 days');

        // Session where this token was already rotated into previousTokenHash
        $compromisedSession = new UserSession($this->user, 'current-hash', $expiresAt);
        $compromisedSession->rotateToken('another-hash', $now, 604800, 604800);

        $this->sessionRepository
            ->expects($this->once())
            ->method('findByPreviousTokenHash')
            ->with($reusedHash)
            ->willReturn($compromisedSession);

        $this->sessionRepository
            ->expects($this->once())
            ->method('save')
            ->with($compromisedSession);

        $this->expectException(UnauthorizedException::class);
        $this->expectExceptionMessage('Tentativa de reutilização de token detectada. Sessão revogada por segurança.');

        try {
            $this->sessionService->refreshSession($reusedToken);
        } finally {
            $this->assertTrue($compromisedSession->isRevoked(), 'Compromised session must be revoked upon reuse attempt');
        }
    }

    public function testRefreshFailsWhenSessionNotFound(): void
    {
        $token = 'unknown-token';
        $hash = $this->tokenService->hashToken($token);

        $this->sessionRepository
            ->expects($this->once())
            ->method('findByPreviousTokenHash')
            ->with($hash)
            ->willReturn(null);

        $this->sessionRepository
            ->expects($this->once())
            ->method('findByTokenHash')
            ->with($hash)
            ->willReturn(null);

        $this->expectException(UnauthorizedException::class);
        $this->expectExceptionMessage('Sessão não encontrada ou token inválido.');

        $this->sessionService->refreshSession($token);
    }

    public function testRefreshFailsWhenSessionIsAlreadyRevoked(): void
    {
        $token = 'token-for-revoked-session';
        $hash = $this->tokenService->hashToken($token);
        $session = new UserSession($this->user, $hash, (new \DateTimeImmutable())->modify('+7 days'));
        $session->revoke();

        $this->sessionRepository
            ->method('findByPreviousTokenHash')
            ->willReturn(null);

        $this->sessionRepository
            ->method('findByTokenHash')
            ->willReturn($session);

        $this->expectException(UnauthorizedException::class);
        $this->expectExceptionMessage('Sessão revogada.');

        $this->sessionService->refreshSession($token);
    }

    public function testRefreshFailsWhenSessionIsExpired(): void
    {
        $token = 'expired-token';
        $hash = $this->tokenService->hashToken($token);
        $past = (new \DateTimeImmutable())->modify('-1 hour');
        $session = new UserSession($this->user, $hash, $past);

        $this->sessionRepository
            ->method('findByPreviousTokenHash')
            ->willReturn(null);

        $this->sessionRepository
            ->method('findByTokenHash')
            ->willReturn($session);

        $this->expectException(UnauthorizedException::class);
        $this->expectExceptionMessage('Sessão expirada.');

        $this->sessionService->refreshSession($token);
    }

    public function testRefreshFailsWhenSessionExceedsMax7Days(): void
    {
        $token = 'old-session-token';
        $hash = $this->tokenService->hashToken($token);
        // Created 8 days ago
        $createdAt = (new \DateTimeImmutable())->modify('-8 days');
        $session = new UserSession($this->user, $hash, (new \DateTimeImmutable())->modify('+1 day'));

        $ref = new \ReflectionClass($session);
        $prop = $ref->getProperty('createdAt');
        $prop->setValue($session, $createdAt);

        $this->sessionRepository
            ->method('findByPreviousTokenHash')
            ->willReturn(null);

        $this->sessionRepository
            ->method('findByTokenHash')
            ->willReturn($session);

        $this->expectException(UnauthorizedException::class);
        $this->expectExceptionMessage('Sessão atingiu o limite máximo de 7 dias.');

        $this->sessionService->refreshSession($token);
    }

    public function testRefreshFailsWhenUserWasBlockedOrDeactivated(): void
    {
        $token = 'token-for-inactive-user';
        $hash = $this->tokenService->hashToken($token);
        $session = new UserSession($this->user, $hash, (new \DateTimeImmutable())->modify('+7 days'));

        // User was blocked
        $this->user->setIsActive(false);

        $this->sessionRepository
            ->method('findByPreviousTokenHash')
            ->willReturn(null);

        $this->sessionRepository
            ->method('findByTokenHash')
            ->willReturn($session);

        $this->expectException(UnauthorizedException::class);
        $this->expectExceptionMessage('Usuário inativo ou bloqueado.');

        $this->sessionService->refreshSession($token);
    }

    public function testRevokeByToken(): void
    {
        $token = 'token-to-revoke';
        $hash = $this->tokenService->hashToken($token);
        $session = new UserSession($this->user, $hash, (new \DateTimeImmutable())->modify('+7 days'));

        $this->sessionRepository
            ->expects($this->once())
            ->method('findByTokenHash')
            ->with($hash)
            ->willReturn($session);

        $this->sessionRepository
            ->expects($this->once())
            ->method('save')
            ->with($session);

        $this->sessionService->revokeByToken($token);
        $this->assertTrue($session->isRevoked());
    }

    public function testRevokeAllForUser(): void
    {
        $this->sessionRepository
            ->expects($this->once())
            ->method('revokeAllForUser')
            ->with($this->user)
            ->willReturn(3);

        $count = $this->sessionService->revokeAllForUser($this->user);
        $this->assertSame(3, $count);
    }
}
