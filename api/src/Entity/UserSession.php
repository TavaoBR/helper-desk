<?php

namespace App\Entity;

use App\Repository\UserSessionRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: UserSessionRepository::class)]
#[ORM\Table(name: 'user_sessions')]
#[ORM\Index(name: 'idx_user_session_user', columns: ['user_id'])]
#[ORM\Index(name: 'idx_user_session_token_hash', columns: ['refresh_token_hash'])]
#[ORM\Index(name: 'idx_user_session_prev_token_hash', columns: ['previous_token_hash'])]
class UserSession
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    private Uuid $id;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private User $user;

    #[ORM\Column(name: 'refresh_token_hash', length: 64)]
    private string $refreshTokenHash;

    #[ORM\Column(name: 'previous_token_hash', length: 64, nullable: true)]
    private ?string $previousTokenHash = null;

    #[ORM\Column(name: 'created_at')]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(name: 'expires_at')]
    private \DateTimeImmutable $expiresAt;

    #[ORM\Column(name: 'last_used_at')]
    private \DateTimeImmutable $lastUsedAt;

    #[ORM\Column(name: 'revoked_at', nullable: true)]
    private ?\DateTimeImmutable $revokedAt = null;

    #[ORM\Column(name: 'ip_address', length: 45, nullable: true)]
    private ?string $ipAddress = null;

    #[ORM\Column(name: 'user_agent', length: 500, nullable: true)]
    private ?string $userAgent = null;

    #[ORM\Column(name: 'device_identifier', length: 100, nullable: true)]
    private ?string $deviceIdentifier = null;

    public function __construct(
        User $user,
        string $refreshTokenHash,
        \DateTimeImmutable $expiresAt,
        ?string $ipAddress = null,
        ?string $userAgent = null,
        ?string $deviceIdentifier = null
    ) {
        $this->id = Uuid::v4();
        $this->user = $user;
        $this->refreshTokenHash = $refreshTokenHash;
        $this->createdAt = new \DateTimeImmutable();
        $this->lastUsedAt = $this->createdAt;
        $this->expiresAt = $expiresAt;
        $this->ipAddress = $ipAddress !== null ? substr($ipAddress, 0, 45) : null;
        $this->userAgent = $userAgent !== null ? substr($userAgent, 0, 500) : null;
        $this->deviceIdentifier = $deviceIdentifier !== null ? substr($deviceIdentifier, 0, 100) : null;
    }

    public function getId(): Uuid
    {
        return $this->id;
    }

    public function getUser(): User
    {
        return $this->user;
    }

    public function getRefreshTokenHash(): string
    {
        return $this->refreshTokenHash;
    }

    public function getPreviousTokenHash(): ?string
    {
        return $this->previousTokenHash;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getExpiresAt(): \DateTimeImmutable
    {
        return $this->expiresAt;
    }

    public function getLastUsedAt(): \DateTimeImmutable
    {
        return $this->lastUsedAt;
    }

    public function setLastUsedAt(\DateTimeImmutable $lastUsedAt): self
    {
        $this->lastUsedAt = $lastUsedAt;
        return $this;
    }

    public function getRevokedAt(): ?\DateTimeImmutable
    {
        return $this->revokedAt;
    }

    public function getIpAddress(): ?string
    {
        return $this->ipAddress;
    }

    public function setIpAddress(?string $ipAddress): self
    {
        $this->ipAddress = $ipAddress !== null ? substr($ipAddress, 0, 45) : null;
        return $this;
    }

    public function getUserAgent(): ?string
    {
        return $this->userAgent;
    }

    public function setUserAgent(?string $userAgent): self
    {
        $this->userAgent = $userAgent !== null ? substr($userAgent, 0, 500) : null;
        return $this;
    }

    public function getDeviceIdentifier(): ?string
    {
        return $this->deviceIdentifier;
    }

    public function setDeviceIdentifier(?string $deviceIdentifier): self
    {
        $this->deviceIdentifier = $deviceIdentifier !== null ? substr($deviceIdentifier, 0, 100) : null;
        return $this;
    }

    public function isRevoked(): bool
    {
        return $this->revokedAt !== null;
    }

    public function isExpired(?\DateTimeImmutable $now = null): bool
    {
        $now = $now ?? new \DateTimeImmutable();
        return $now >= $this->expiresAt;
    }

    public function isValid(?\DateTimeImmutable $now = null): bool
    {
        return !$this->isRevoked() && !$this->isExpired($now);
    }

    public function revoke(?\DateTimeImmutable $revokedAt = null): self
    {
        $this->revokedAt = $revokedAt ?? new \DateTimeImmutable();
        return $this;
    }

    public function isReusedToken(string $hash): bool
    {
        return $this->previousTokenHash !== null && hash_equals($this->previousTokenHash, $hash);
    }

    public function hasCurrentToken(string $hash): bool
    {
        return hash_equals($this->refreshTokenHash, $hash);
    }

    public function rotateToken(
        string $newHash,
        \DateTimeImmutable $now,
        int $ttlSeconds,
        int $maxLifetimeSeconds = 604800
    ): self {
        $this->previousTokenHash = $this->refreshTokenHash;
        $this->refreshTokenHash = $newHash;
        $this->lastUsedAt = $now;

        $candidateExpiresAt = $now->modify("+{$ttlSeconds} seconds");
        $maxExpiresAt = $this->createdAt->modify("+{$maxLifetimeSeconds} seconds");

        // Never extend beyond maximum absolute session lifetime (e.g. 7 days from creation)
        $this->expiresAt = $candidateExpiresAt > $maxExpiresAt ? $maxExpiresAt : $candidateExpiresAt;

        return $this;
    }
}
