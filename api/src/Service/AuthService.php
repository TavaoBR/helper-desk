<?php

namespace App\Service;

use App\DTO\Request\LoginDTO;
use App\Entity\User;
use App\Entity\UserSession;
use App\Exception\UnauthorizedException;
use App\Repository\UserRepository;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class AuthService
{
    public function __construct(
        private readonly UserRepository $userRepository,
        private readonly UserPasswordHasherInterface $hasher,
        private readonly SessionService $sessionService,
        private readonly TokenService $tokenService
    ) {
    }

    /**
     * @return array{
     *     user: User,
     *     accessToken: string,
     *     plainRefreshToken: string,
     *     xsrfToken: string,
     *     session: UserSession
     * }
     */
    public function login(LoginDTO $dto, Request $request): array
    {
        $user = $this->userRepository->findOneBy(['email' => $dto->email]);

        if ($user === null || !$this->hasher->isPasswordValid($user, $dto->password)) {
            throw new UnauthorizedException('Credenciais inválidas.');
        }

        if (!$user->isActive()) {
            throw new UnauthorizedException('Usuário inativo ou bloqueado.');
        }

        $sessionData = $this->sessionService->createSession(
            $user,
            $request->getClientIp(),
            $request->headers->get('User-Agent'),
            $dto->deviceIdentifier
        );

        $accessToken = $this->tokenService->generateAccessToken($user);
        $xsrfToken = $this->tokenService->generateXsrfToken();

        return [
            'user' => $user,
            'accessToken' => $accessToken,
            'plainRefreshToken' => $sessionData['plainRefreshToken'],
            'xsrfToken' => $xsrfToken,
            'session' => $sessionData['session']
        ];
    }

    /**
     * @return array{
     *     user: User,
     *     accessToken: string,
     *     newPlainRefreshToken: string,
     *     xsrfToken: string,
     *     session: UserSession
     * }
     */
    public function refresh(Request $request): array
    {
        $plainRefreshToken = $this->tokenService->extractRefreshToken($request);

        if ($plainRefreshToken === null || trim($plainRefreshToken) === '') {
            throw new UnauthorizedException('Refresh token não informado.');
        }

        $refreshed = $this->sessionService->refreshSession(
            $plainRefreshToken,
            $request->getClientIp(),
            $request->headers->get('User-Agent')
        );

        $accessToken = $this->tokenService->generateAccessToken($refreshed['user']);
        $xsrfToken = $this->tokenService->generateXsrfToken();

        return [
            'user' => $refreshed['user'],
            'accessToken' => $accessToken,
            'newPlainRefreshToken' => $refreshed['newPlainRefreshToken'],
            'xsrfToken' => $xsrfToken,
            'session' => $refreshed['session']
        ];
    }

    public function logout(Request $request): void
    {
        $plainRefreshToken = $this->tokenService->extractRefreshToken($request);

        if ($plainRefreshToken !== null && trim($plainRefreshToken) !== '') {
            $this->sessionService->revokeByToken($plainRefreshToken);
        }
    }

    public function logoutAll(User $user): int
    {
        return $this->sessionService->revokeAllForUser($user);
    }

    public function getMe(User $user): User
    {
        if (!$user->isActive()) {
            throw new UnauthorizedException('Usuário inativo ou bloqueado.');
        }

        return $user;
    }
}
