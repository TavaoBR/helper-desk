<?php

namespace App\Service;

use App\Entity\User;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpFoundation\Request;

class TokenService
{
    public function __construct(
        private readonly JWTTokenManagerInterface $jwtManager,
        #[Autowire('%app.jwt_access_token_ttl%')]
        private readonly int $accessTokenTtl = 900,
        #[Autowire('%app.jwt_refresh_token_ttl%')]
        private readonly int $refreshTokenTtl = 604800,
        #[Autowire('%app.session_max_lifetime%')]
        private readonly int $sessionMaxLifetime = 604800,
        #[Autowire('%app.cookie_secure%')]
        private readonly bool $cookieSecure = false,
        #[Autowire('%app.cookie_samesite%')]
        private readonly string $cookieSameSite = 'lax'
    ) {
    }

    public function generateAccessToken(User $user): string
    {
        return $this->jwtManager->create($user);
    }

    public function generateRefreshToken(): string
    {
        return bin2hex(random_bytes(32));
    }

    public function generateXsrfToken(): string
    {
        return bin2hex(random_bytes(24));
    }

    public function hashToken(string $plainToken): string
    {
        return hash('sha256', $plainToken);
    }

    public function createAccessTokenCookie(string $token): Cookie
    {
        return Cookie::create(
            'ACCESS_TOKEN',
            $token,
            time() + $this->accessTokenTtl,
            '/',
            null,
            $this->cookieSecure,
            true, // httpOnly
            false,
            $this->normalizeSameSite($this->cookieSameSite)
        );
    }

    public function createRefreshTokenCookie(string $token): Cookie
    {
        return Cookie::create(
            'REFRESH_TOKEN',
            $token,
            time() + $this->refreshTokenTtl,
            '/api/auth',
            null,
            $this->cookieSecure,
            true, // httpOnly
            false,
            $this->normalizeSameSite($this->cookieSameSite)
        );
    }

    public function createXsrfCookie(string $xsrfToken): Cookie
    {
        return Cookie::create(
            'XSRF-TOKEN',
            $xsrfToken,
            time() + $this->refreshTokenTtl,
            '/',
            null,
            $this->cookieSecure,
            false, // httpOnly = false so Angular HttpClient can read it
            false,
            $this->normalizeSameSite($this->cookieSameSite)
        );
    }

    public function createClearCookie(string $name, string $path = '/'): Cookie
    {
        return Cookie::create(
            $name,
            '',
            1, // expired in the past
            $path,
            null,
            $this->cookieSecure,
            true,
            false,
            $this->normalizeSameSite($this->cookieSameSite)
        );
    }

    public function extractRefreshToken(Request $request): ?string
    {
        // 1. Check HttpOnly cookie
        $cookieToken = $request->cookies->get('REFRESH_TOKEN');
        if ($cookieToken !== null && trim($cookieToken) !== '') {
            return trim($cookieToken);
        }

        // 2. Fallback to request body if provided
        $content = $request->getContent();
        if ($content) {
            $data = json_decode($content, true);
            if (is_array($data) && !empty($data['refreshToken'])) {
                return trim((string) $data['refreshToken']);
            }
        }

        return null;
    }

    public function getAccessTokenTtl(): int
    {
        return $this->accessTokenTtl;
    }

    public function getRefreshTokenTtl(): int
    {
        return $this->refreshTokenTtl;
    }

    public function getSessionMaxLifetime(): int
    {
        return $this->sessionMaxLifetime;
    }

    public function isCookieSecure(): bool
    {
        return $this->cookieSecure;
    }

    public function getCookieSameSite(): string
    {
        return $this->cookieSameSite;
    }

    private function normalizeSameSite(string $sameSite): string
    {
        $normalized = strtolower(trim($sameSite));
        return in_array($normalized, ['lax', 'strict', 'none'], true) ? $normalized : 'lax';
    }
}
