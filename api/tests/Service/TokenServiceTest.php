<?php

namespace App\Tests\Service;

use App\Entity\Tenant;
use App\Entity\User;
use App\Service\TokenService;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Request;

class TokenServiceTest extends TestCase
{
    private JWTTokenManagerInterface $jwtManager;
    private User $user;

    protected function setUp(): void
    {
        $this->jwtManager = $this->createMock(JWTTokenManagerInterface::class);
        $tenant = new Tenant('Tenant Test');
        $this->user = new User($tenant, 'Maria Santos', 'maria@empresa.com');
    }

    public function testGenerateAccessTokenCallsJwtManager(): void
    {
        $this->jwtManager
            ->expects($this->once())
            ->method('create')
            ->with($this->user)
            ->willReturn('signed.jwt.token');

        $tokenService = new TokenService(
            $this->jwtManager,
            accessTokenTtl: 900,
            refreshTokenTtl: 604800,
            sessionMaxLifetime: 604800,
            cookieSecure: false,
            cookieSameSite: 'lax'
        );

        $token = $tokenService->generateAccessToken($this->user);
        $this->assertSame('signed.jwt.token', $token);
    }

    public function testGenerateRefreshTokenIsCryptographicallyRandomAndUnique(): void
    {
        $tokenService = new TokenService($this->jwtManager);

        $t1 = $tokenService->generateRefreshToken();
        $t2 = $tokenService->generateRefreshToken();

        $this->assertNotEmpty($t1);
        $this->assertNotEmpty($t2);
        $this->assertNotEquals($t1, $t2);
        $this->assertSame(64, strlen($t1)); // 32 bytes in hex = 64 chars
    }

    public function testHashTokenUsesSha256(): void
    {
        $tokenService = new TokenService($this->jwtManager);
        $plain = 'my-super-secret-token';
        $hash = $tokenService->hashToken($plain);

        $this->assertSame(hash('sha256', $plain), $hash);
    }

    public function testCreateAccessTokenCookieAttributes(): void
    {
        $tokenService = new TokenService(
            $this->jwtManager,
            accessTokenTtl: 900,
            refreshTokenTtl: 604800,
            sessionMaxLifetime: 604800,
            cookieSecure: true, // Secure = true
            cookieSameSite: 'strict'
        );

        $cookie = $tokenService->createAccessTokenCookie('token-xyz');

        $this->assertSame('ACCESS_TOKEN', $cookie->getName());
        $this->assertSame('token-xyz', $cookie->getValue());
        $this->assertSame('/', $cookie->getPath());
        $this->assertTrue($cookie->isHttpOnly(), 'Access token cookie must be HttpOnly');
        $this->assertTrue($cookie->isSecure(), 'Access token cookie must be Secure in production');
        $this->assertSame('strict', $cookie->getSameSite());
    }

    public function testCreateRefreshTokenCookieAttributes(): void
    {
        $tokenService = new TokenService(
            $this->jwtManager,
            accessTokenTtl: 900,
            refreshTokenTtl: 604800,
            sessionMaxLifetime: 604800,
            cookieSecure: true,
            cookieSameSite: 'lax'
        );

        $cookie = $tokenService->createRefreshTokenCookie('refresh-xyz');

        $this->assertSame('REFRESH_TOKEN', $cookie->getName());
        $this->assertSame('refresh-xyz', $cookie->getValue());
        $this->assertSame('/api/auth', $cookie->getPath(), 'Refresh token path restricted to /api/auth');
        $this->assertTrue($cookie->isHttpOnly(), 'Refresh token cookie must be HttpOnly');
        $this->assertTrue($cookie->isSecure(), 'Refresh token cookie must be Secure');
        $this->assertSame('lax', $cookie->getSameSite());
    }

    public function testCreateXsrfCookieIsNotHttpOnlySoAngularCanReadIt(): void
    {
        $tokenService = new TokenService($this->jwtManager);
        $cookie = $tokenService->createXsrfCookie('xsrf-12345');

        $this->assertSame('XSRF-TOKEN', $cookie->getName());
        $this->assertSame('xsrf-12345', $cookie->getValue());
        $this->assertFalse($cookie->isHttpOnly(), 'XSRF cookie must NOT be HttpOnly so client JS can read it');
    }

    public function testCreateClearCookieExpiresInPast(): void
    {
        $tokenService = new TokenService($this->jwtManager);
        $cookie = $tokenService->createClearCookie('ACCESS_TOKEN', '/');

        $this->assertSame('ACCESS_TOKEN', $cookie->getName());
        $this->assertSame('', $cookie->getValue());
        $this->assertLessThan(time(), $cookie->getExpiresTime());
    }

    public function testExtractRefreshTokenFromCookieOrBody(): void
    {
        $tokenService = new TokenService($this->jwtManager);

        // 1. From cookie
        $req1 = Request::create('/api/auth/refresh', 'POST', [], ['REFRESH_TOKEN' => 'from-cookie']);
        $this->assertSame('from-cookie', $tokenService->extractRefreshToken($req1));

        // 2. From body
        $req2 = Request::create(
            '/api/auth/refresh',
            'POST',
            [],
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['refreshToken' => 'from-body'])
        );
        $this->assertSame('from-body', $tokenService->extractRefreshToken($req2));

        // 3. Neither
        $req3 = Request::create('/api/auth/refresh', 'POST');
        $this->assertNull($tokenService->extractRefreshToken($req3));
    }
}
