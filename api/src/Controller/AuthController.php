<?php

namespace App\Controller;

use App\DTO\Request\LoginDTO;
use App\Entity\User;
use App\Exception\EntityNotFoundException;
use App\Service\AuthService;
use App\Service\SessionService;
use App\Service\TokenService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/auth')]
class AuthController extends AbstractController
{
    public function __construct(
        private readonly AuthService $authService,
        private readonly SessionService $sessionService,
        private readonly TokenService $tokenService
    ) {
    }

    #[Route('/login', name: 'api_auth_login', methods: ['POST'])]
    public function login(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true) ?? [];
        $dto = LoginDTO::fromArray($data);

        $result = $this->authService->login($dto, $request);

        $response = new JsonResponse([
            'user' => $this->formatUser($result['user']),
            'sessionId' => (string) $result['session']->getId(),
            'expiresAt' => $result['session']->getExpiresAt()->format(\DateTimeInterface::ATOM)
        ], Response::HTTP_OK);

        // Attach secure cookies
        $response->headers->setCookie(
            $this->tokenService->createAccessTokenCookie($result['accessToken'])
        );
        $response->headers->setCookie(
            $this->tokenService->createRefreshTokenCookie($result['plainRefreshToken'])
        );
        $response->headers->setCookie(
            $this->tokenService->createXsrfCookie($result['xsrfToken'])
        );

        return $response;
    }

    #[Route('/refresh', name: 'api_auth_refresh', methods: ['POST'])]
    public function refresh(Request $request): JsonResponse
    {
        $result = $this->authService->refresh($request);

        $response = new JsonResponse([
            'user' => $this->formatUser($result['user']),
            'sessionId' => (string) $result['session']->getId(),
            'expiresAt' => $result['session']->getExpiresAt()->format(\DateTimeInterface::ATOM)
        ], Response::HTTP_OK);

        // Attach rotated cookies
        $response->headers->setCookie(
            $this->tokenService->createAccessTokenCookie($result['accessToken'])
        );
        $response->headers->setCookie(
            $this->tokenService->createRefreshTokenCookie($result['newPlainRefreshToken'])
        );
        $response->headers->setCookie(
            $this->tokenService->createXsrfCookie($result['xsrfToken'])
        );

        return $response;
    }

    #[Route('/logout', name: 'api_auth_logout', methods: ['POST'])]
    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout($request);

        $response = new JsonResponse([
            'message' => 'Logout realizado com sucesso.'
        ], Response::HTTP_OK);

        // Clear all auth cookies
        $response->headers->setCookie($this->tokenService->createClearCookie('ACCESS_TOKEN', '/'));
        $response->headers->setCookie($this->tokenService->createClearCookie('REFRESH_TOKEN', '/api/auth'));
        $response->headers->setCookie($this->tokenService->createClearCookie('XSRF-TOKEN', '/'));

        return $response;
    }

    #[Route('/logout-all', name: 'api_auth_logout_all', methods: ['POST'])]
    public function logoutAll(#[CurrentUser] ?User $currentUser): JsonResponse
    {
        if ($currentUser !== null) {
            $this->authService->logoutAll($currentUser);
        }

        $response = new JsonResponse([
            'message' => 'Todas as sessões foram encerradas com sucesso.'
        ], Response::HTTP_OK);

        // Clear cookies
        $response->headers->setCookie($this->tokenService->createClearCookie('ACCESS_TOKEN', '/'));
        $response->headers->setCookie($this->tokenService->createClearCookie('REFRESH_TOKEN', '/api/auth'));
        $response->headers->setCookie($this->tokenService->createClearCookie('XSRF-TOKEN', '/'));

        return $response;
    }

    #[Route('/me', name: 'api_auth_me', methods: ['GET'])]
    public function me(#[CurrentUser] User $currentUser): JsonResponse
    {
        $user = $this->authService->getMe($currentUser);

        return new JsonResponse([
            'user' => $this->formatUser($user)
        ], Response::HTTP_OK);
    }

    #[Route('/sessions', name: 'api_auth_sessions_list', methods: ['GET'])]
    public function listSessions(#[CurrentUser] User $currentUser): JsonResponse
    {
        $sessions = $this->sessionService->getActiveSessions($currentUser);

        return new JsonResponse($sessions, Response::HTTP_OK);
    }

    #[Route('/sessions/{id}', name: 'api_auth_sessions_revoke', methods: ['DELETE'])]
    public function revokeSession(string $id, #[CurrentUser] User $currentUser): JsonResponse
    {
        $revoked = $this->sessionService->revokeSessionByIdAndUser($id, $currentUser);

        if (!$revoked) {
            throw new EntityNotFoundException('Sessão não encontrada para o usuário atual.');
        }

        return new JsonResponse([
            'message' => 'Sessão revogada com sucesso.'
        ], Response::HTTP_OK);
    }

    /**
     * @return array<string, mixed>
     */
    private function formatUser(User $user): array
    {
        return [
            'id' => (string) $user->getId(),
            'name' => $user->getName(),
            'email' => $user->getEmail(),
            'tenantId' => (string) $user->getTenant()->getId(),
            'roles' => $user->getRoles(),
            'isActive' => $user->isActive(),
            'createdAt' => $user->getCreatedAt()->format(\DateTimeInterface::ATOM)
        ];
    }
}
