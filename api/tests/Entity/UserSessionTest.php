<?php

namespace App\Tests\Entity;

use App\Entity\Tenant;
use App\Entity\User;
use App\Entity\UserSession;
use PHPUnit\Framework\TestCase;

class UserSessionTest extends TestCase
{
    private User $user;

    protected function setUp(): void
    {
        $tenant = new Tenant('Tenant Teste');
        $this->user = new User($tenant, 'Carlos Silva', 'carlos@empresa.com');
    }

    public function testSessionCreationAndInitialState(): void
    {
        $now = new \DateTimeImmutable();
        $expiresAt = $now->modify('+7 days');
        $tokenHash = hash('sha256', 'plain-refresh-token-123');

        $session = new UserSession(
            $this->user,
            $tokenHash,
            $expiresAt,
            '192.168.1.10',
            'Mozilla/5.0 Chrome',
            'desktop-chrome'
        );

        $this->assertSame($this->user, $session->getUser());
        $this->assertSame($tokenHash, $session->getRefreshTokenHash());
        $this->assertNull($session->getPreviousTokenHash());
        $this->assertNull($session->getRevokedAt());
        $this->assertFalse($session->isRevoked());
        $this->assertFalse($session->isExpired($now));
        $this->assertTrue($session->isValid($now));
        $this->assertSame('192.168.1.10', $session->getIpAddress());
        $this->assertSame('Mozilla/5.0 Chrome', $session->getUserAgent());
        $this->assertSame('desktop-chrome', $session->getDeviceIdentifier());
        $this->assertTrue($session->hasCurrentToken($tokenHash));
        $this->assertFalse($session->isReusedToken($tokenHash));
    }

    public function testSessionExpiration(): void
    {
        $now = new \DateTimeImmutable();
        $expiresAt = $now->modify('-1 minute'); // already expired
        $tokenHash = hash('sha256', 'expired-token');

        $session = new UserSession($this->user, $tokenHash, $expiresAt);

        $this->assertTrue($session->isExpired($now));
        $this->assertFalse($session->isValid($now));
    }

    public function testSessionRevocation(): void
    {
        $now = new \DateTimeImmutable();
        $expiresAt = $now->modify('+7 days');
        $tokenHash = hash('sha256', 'token-to-revoke');

        $session = new UserSession($this->user, $tokenHash, $expiresAt);
        $this->assertFalse($session->isRevoked());

        $session->revoke();

        $this->assertTrue($session->isRevoked());
        $this->assertFalse($session->isValid($now));
        $this->assertNotNull($session->getRevokedAt());
    }

    public function testTokenRotationAndReuseDetection(): void
    {
        $now = new \DateTimeImmutable();
        $expiresAt = $now->modify('+7 days');
        $initialHash = hash('sha256', 'initial-token');

        $session = new UserSession($this->user, $initialHash, $expiresAt);

        $rotatedHash = hash('sha256', 'rotated-token');
        $session->rotateToken($rotatedHash, $now, 604800, 604800);

        // Previous token hash must now be the initial hash
        $this->assertSame($initialHash, $session->getPreviousTokenHash());
        // Current token hash must be the rotated hash
        $this->assertSame($rotatedHash, $session->getRefreshTokenHash());

        // Reusing the initial hash must be detected as reuse!
        $this->assertTrue($session->isReusedToken($initialHash));
        $this->assertFalse($session->isReusedToken($rotatedHash));
        $this->assertTrue($session->hasCurrentToken($rotatedHash));
    }

    public function testRotationCannotExceedMaximum7DaysSessionLifetime(): void
    {
        $createdAt = new \DateTimeImmutable('2026-09-01 00:00:00');
        $tokenHash = hash('sha256', 'token');
        $expiresAt = $createdAt->modify('+7 days'); // 2026-09-08 00:00:00

        $session = new UserSession($this->user, $tokenHash, $expiresAt);

        // Simulate reflection or property to simulate created 6 days ago
        $ref = new \ReflectionClass($session);
        $prop = $ref->getProperty('createdAt');
        $prop->setValue($session, $createdAt);

        // Rotate on day 6 with 7 days TTL
        $rotationTime = $createdAt->modify('+6 days'); // 2026-09-07 00:00:00
        $newHash = hash('sha256', 'new-token');
        $session->rotateToken($newHash, $rotationTime, 604800, 604800); // 7 days = 604800s

        // Expiration MUST be capped at createdAt + 7 days (2026-09-08 00:00:00)
        $expectedMax = $createdAt->modify('+7 days');
        $this->assertEquals($expectedMax, $session->getExpiresAt());
    }
}
