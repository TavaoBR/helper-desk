<?php

namespace App\Tests\Controller;

use App\Controller\AuthController;
use App\DTO\Request\LoginDTO;
use App\Entity\Tenant;
use App\Entity\User;
use App\Entity\UserSession;
use App\EventListener\CsrfValidationListener;
use App\Exception\ForbiddenException;
use App\Service\AuthService;
use App\Service\SessionService;
use App\Service\TokenService;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\HttpKernelInterface;

class AuthControllerTest extends TestCase
{
    private AuthService $authService;
    private SessionService $sessionService;
    private TokenService $tokenService;
    private AuthController $controller;
    private User $user;

    protected function setUp(): void
    {
        $this->authService = $this->createMock(AuthService::class);
        $this->sessionService = $this->createMock(SessionService::class);
        $jwtManager = $this->createMock(JWTTokenManagerInterface::class);

        $this->tokenService = new TokenService(
            $jwtManager,
            accessTokenTtl: 900,
            refreshTokenTtl: 604800,
            sessionMaxLifetime: 604800,
            cookieSecure: false,
            cookieSameSite: 'lax'
        );

        $this->controller = new AuthController(
            $this->authService,
            $this->sessionService,
            $this->tokenService
        );

        $tenant = new Tenant('Tenant Teste');
        $this->user = new User($tenant, 'Juliana Castro', 'juliana@empresa.com');
    }

    public function testLoginSetsHttpOnlyCookiesAndReturnsUser(): void
    {
        $request = Request::create(
            '/api/auth/login',
            'POST',
            [],
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['email' => 'juliana@empresa.com', 'password' => 'secret123'])
        );

        $session = new UserSession($this->user, 'token-hash', (new \DateTimeImmutable())->modify('+7 days'));

        $this->authService
            ->expects($this->once())
            ->method('login')
            ->willReturn([
                'user' => $this->user,
                'accessToken' => 'jwt.access.token',
                'plainRefreshToken' => 'plain.refresh.token',
                'xsrfToken' => 'xsrf.token.value',
                'session' => $session
            ]);

        $response = $this->controller->login($request);

        $this->assertSame(Response::HTTP_OK, $response->getStatusCode());

        $cookies = $response->headers->getCookies();
        $cookieMap = [];
        foreach ($cookies as $cookie) {
            $cookieMap[$cookie->getName()] = $cookie;
        }

        // ACCESS_TOKEN cookie must be HttpOnly
        $this->assertArrayHasKey('ACCESS_TOKEN', $cookieMap);
        $this->assertTrue($cookieMap['ACCESS_TOKEN']->isHttpOnly());
        $this->assertSame('jwt.access.token', $cookieMap['ACCESS_TOKEN']->getValue());

        // REFRESH_TOKEN cookie must be HttpOnly
        $this->assertArrayHasKey('REFRESH_TOKEN', $cookieMap);
        $this->assertTrue($cookieMap['REFRESH_TOKEN']->isHttpOnly());
        $this->assertSame('plain.refresh.token', $cookieMap['REFRESH_TOKEN']->getValue());

        // XSRF-TOKEN cookie must NOT be HttpOnly (for Angular)
        $this->assertArrayHasKey('XSRF-TOKEN', $cookieMap);
        $this->assertFalse($cookieMap['XSRF-TOKEN']->isHttpOnly());
        $this->assertSame('xsrf.token.value', $cookieMap['XSRF-TOKEN']->getValue());

        $content = json_decode($response->getContent(), true);
        $this->assertSame('juliana@empresa.com', $content['user']['email']);
    }

    public function testRefreshUpdatesCookies(): void
    {
        $request = Request::create(
            '/api/auth/refresh',
            'POST',
            [],
            ['REFRESH_TOKEN' => 'old-refresh-token']
        );

        $session = new UserSession($this->user, 'new-hash', (new \DateTimeImmutable())->modify('+7 days'));

        $this->authService
            ->expects($this->once())
            ->method('refresh')
            ->willReturn([
                'user' => $this->user,
                'accessToken' => 'new.jwt.access.token',
                'newPlainRefreshToken' => 'new.plain.refresh.token',
                'xsrfToken' => 'new.xsrf.token',
                'session' => $session
            ]);

        $response = $this->controller->refresh($request);

        $this->assertSame(Response::HTTP_OK, $response->getStatusCode());

        $cookies = $response->headers->getCookies();
        $cookieMap = [];
        foreach ($cookies as $c) {
            $cookieMap[$c->getName()] = $c;
        }

        $this->assertSame('new.jwt.access.token', $cookieMap['ACCESS_TOKEN']->getValue());
        $this->assertSame('new.plain.refresh.token', $cookieMap['REFRESH_TOKEN']->getValue());
    }

    public function testLogoutClearsAllAuthCookies(): void
    {
        $request = Request::create(
            '/api/auth/logout',
            'POST',
            [],
            ['REFRESH_TOKEN' => 'token-to-logout']
        );

        $this->authService
            ->expects($this->once())
            ->method('logout')
            ->with($request);

        $response = $this->controller->logout($request);

        $this->assertSame(Response::HTTP_OK, $response->getStatusCode());

        $cookies = $response->headers->getCookies();
        foreach ($cookies as $c) {
            $this->assertSame('', $c->getValue());
            $this->assertLessThan(time(), $c->getExpiresTime(), "Cookie {$c->getName()} must be expired in the past on logout");
        }
    }

    public function testCsrfProtectionBlocksInvalidHeaderWhenCookieIsPresent(): void
    {
        $listener = new CsrfValidationListener();

        // Mutating request authenticated via cookie with MISSING X-XSRF-TOKEN header
        $request = Request::create(
            '/api/tickets',
            'POST',
            [],
            ['ACCESS_TOKEN' => 'token-val', 'XSRF-TOKEN' => 'expected-xsrf']
        );

        $kernel = $this->createMock(HttpKernelInterface::class);
        $event = new RequestEvent($kernel, $request, HttpKernelInterface::MAIN_REQUEST);

        $this->expectException(ForbiddenException::class);
        $this->expectExceptionMessage('Falha na validação do token CSRF.');

        $listener($event);
    }

    public function testCsrfProtectionAllowsValidHeaderMatchingCookie(): void
    {
        $listener = new CsrfValidationListener();

        // Mutating request with matching XSRF-TOKEN cookie and header
        $request = Request::create(
            '/api/tickets',
            'POST',
            [],
            ['ACCESS_TOKEN' => 'token-val', 'XSRF-TOKEN' => 'valid-token'],
            [],
            ['HTTP_X_XSRF_TOKEN' => 'valid-token']
        );

        $kernel = $this->createMock(HttpKernelInterface::class);
        $event = new RequestEvent($kernel, $request, HttpKernelInterface::MAIN_REQUEST);

        // Should not throw exception
        $listener($event);
        $this->assertTrue(true);
    }
}
