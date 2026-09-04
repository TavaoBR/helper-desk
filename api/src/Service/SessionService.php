<?php

namespace App\Service;

use App\Entity\User;
use App\Entity\UserSession;
use App\Exception\UnauthorizedException;
use App\Repository\UserSessionRepository;

class SessionService
{
    public function __construct(
        private readonly UserSessionRepository $sessionRepository,
        private readonly TokenService $tokenService
    ) {
    }

    /**
     * @return array{session: UserSession, plainRefreshToken: string}
     */
    public function createSession(
        User $user,
        ?string $ipAddress = null,
        ?string $userAgent = null,
        ?string $deviceIdentifier = null
    ): array {
        if (!$user->isActive()) {
            throw new UnauthorizedException('Usuário inativo ou bloqueado.');
        }

        $plainRefreshToken = $this->tokenService->generateRefreshToken();
        $refreshTokenHash = $this->tokenService->hashToken($plainRefreshToken);

        $now = new \DateTimeImmutable();
        $expiresAt = $now->modify("+{$this->tokenService->getRefreshTokenTtl()} seconds");

        $session = new UserSession(
            $user,
            $refreshTokenHash,
            $expiresAt,
            $ipAddress,
            $userAgent,
            $deviceIdentifier
        );

        $this->sessionRepository->save($session);

        return [
            'session' => $session,
            'plainRefreshToken' => $plainRefreshToken
        ];
    }

    /**
     * @return array{session: UserSession, user: User, newPlainRefreshToken: string}
     */
    public function refreshSession(
        string $plainRefreshToken,
        ?string $ipAddress = null,
        ?string $userAgent = null
    ): array {
        $incomingHash = $this->tokenService->hashToken($plainRefreshToken);

        // 1. Detect token reuse: if token matches a previously rotated token, someone may have compromised the session
        $reusedSession = $this->sessionRepository->findByPreviousTokenHash($incomingHash);
        if ($reusedSession !== null) {
            // Revoke the session immediately to prevent further unauthorized access
            $reusedSession->revoke();
            $this->sessionRepository->save($reusedSession);

            throw new UnauthorizedException(
                'Tentativa de reutilização de token detectada. Sessão revogada por segurança.'
            );
        }

        // 2. Look up session by active refresh token hash
        $session = $this->sessionRepository->findByTokenHash($incomingHash);
        if ($session === null) {
            throw new UnauthorizedException('Sessão não encontrada ou token inválido.');
        }

        // 3. Verify session is not revoked
        if ($session->isRevoked()) {
            throw new UnauthorizedException('Sessão revogada.');
        }

        $now = new \DateTimeImmutable();

        // 4. Verify session expiration (token expiration)
        if ($session->isExpired($now)) {
            $session->revoke($now);
            $this->sessionRepository->save($session);
            throw new UnauthorizedException('Sessão expirada.');
        }

        // 5. Verify maximum absolute session lifetime (7 days from creation)
        $maxAllowedExpiresAt = $session->getCreatedAt()->modify("+{$this->tokenService->getSessionMaxLifetime()} seconds");
        if ($now >= $maxAllowedExpiresAt) {
            $session->revoke($now);
            $this->sessionRepository->save($session);
            throw new UnauthorizedException('Sessão atingiu o limite máximo de 7 dias.');
        }

        // 6. Verify user is active
        $user = $session->getUser();
        if (!$user->isActive()) {
            $session->revoke($now);
            $this->sessionRepository->save($session);
            throw new UnauthorizedException('Usuário inativo ou bloqueado.');
        }

        // 7. Token rotation: generate new refresh token, archive old hash into previousTokenHash
        $newPlainRefreshToken = $this->tokenService->generateRefreshToken();
        $newHash = $this->tokenService->hashToken($newPlainRefreshToken);

        $session->rotateToken(
            $newHash,
            $now,
            $this->tokenService->getRefreshTokenTtl(),
            $this->tokenService->getSessionMaxLifetime()
        );

        if ($ipAddress !== null) {
            $session->setIpAddress($ipAddress);
        }
        if ($userAgent !== null) {
            $session->setUserAgent($userAgent);
        }

        $this->sessionRepository->save($session);

        return [
            'session' => $session,
            'user' => $user,
            'newPlainRefreshToken' => $newPlainRefreshToken
        ];
    }

    public function revokeSession(UserSession $session): void
    {
        $session->revoke();
        $this->sessionRepository->save($session);
    }

    public function revokeByToken(string $plainRefreshToken): void
    {
        $hash = $this->tokenService->hashToken($plainRefreshToken);
        $session = $this->sessionRepository->findByTokenHash($hash);
        if ($session !== null) {
            $this->revokeSession($session);
        }
    }

    public function revokeAllForUser(User $user): int
    {
        return $this->sessionRepository->revokeAllForUser($user);
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function getActiveSessions(User $user, ?string $currentSessionId = null): array
    {
        $sessions = $this->sessionRepository->findActiveByUser($user);

        return array_map(function (UserSession $s) use ($currentSessionId) {
            $idStr = (string) $s->getId();
            return [
                'id' => $idStr,
                'createdAt' => $s->getCreatedAt()->format(\DateTimeInterface::ATOM),
                'lastUsedAt' => $s->getLastUsedAt()->format(\DateTimeInterface::ATOM),
                'expiresAt' => $s->getExpiresAt()->format(\DateTimeInterface::ATOM),
                'ipAddress' => $s->getIpAddress(),
                'userAgent' => $s->getUserAgent(),
                'deviceIdentifier' => $s->getDeviceIdentifier(),
                'isCurrent' => $currentSessionId !== null && $idStr === $currentSessionId
            ];
        }, $sessions);
    }

    public function revokeSessionByIdAndUser(string $sessionId, User $user): bool
    {
        $session = $this->sessionRepository->findByIdAndUser($sessionId, $user);
        if ($session === null) {
            return false;
        }

        $this->revokeSession($session);
        return true;
    }
}
