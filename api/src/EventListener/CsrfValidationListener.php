<?php

namespace App\EventListener;

use App\Exception\ForbiddenException;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;

#[AsEventListener(event: KernelEvents::REQUEST, priority: 30)]
class CsrfValidationListener
{
    private const EXCLUDED_PATHS = [
        '/api/auth/login',
        '/api/auth/refresh',
        '/api/health'
    ];

    public function __invoke(RequestEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();
        $path = $request->getPathInfo();

        if (!str_starts_with($path, '/api')) {
            return;
        }

        // Only validate mutating methods
        $method = strtoupper($request->getMethod());
        if (!in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
            return;
        }

        // Skip excluded paths
        foreach (self::EXCLUDED_PATHS as $excluded) {
            if ($path === $excluded || str_starts_with($path, $excluded)) {
                return;
            }
        }

        // CSRF validation is only required when the request is authenticated via cookie
        $hasAuthCookie = $request->cookies->has('ACCESS_TOKEN') || $request->cookies->has('REFRESH_TOKEN');
        if (!$hasAuthCookie) {
            return;
        }

        $cookieXsrf = $request->cookies->get('XSRF-TOKEN');
        $headerXsrf = $request->headers->get('X-XSRF-TOKEN')
            ?? $request->headers->get('X-CSRF-TOKEN')
            ?? $request->headers->get('X-XSRF-Token');

        if ($cookieXsrf === null || $headerXsrf === null || !hash_equals($cookieXsrf, $headerXsrf)) {
            throw new ForbiddenException('Falha na validação do token CSRF. Requisição bloqueada por segurança.');
        }
    }
}
