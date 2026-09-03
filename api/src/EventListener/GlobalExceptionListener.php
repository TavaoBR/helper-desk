<?php

namespace App\EventListener;

use App\Exception\DomainException;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\KernelEvents;

#[AsEventListener(event: KernelEvents::EXCEPTION, priority: 10)]
class GlobalExceptionListener
{
    public function __construct(private readonly string $environment = 'dev')
    {
    }

    public function __invoke(ExceptionEvent $event): void
    {
        $request = $event->getRequest();

        // Only format API requests
        if (!str_starts_with($request->getPathInfo(), '/api')) {
            return;
        }

        $throwable = $event->getThrowable();

        if ($throwable instanceof DomainException) {
            $statusCode = $throwable->getStatusCode();
            $payload = [
                'error' => [
                    'code' => $throwable->getErrorCode(),
                    'message' => $throwable->getMessage(),
                    'details' => $throwable->getDetails()
                ]
            ];
        } elseif ($throwable instanceof HttpExceptionInterface) {
            $statusCode = $throwable->getStatusCode();
            $code = match ($statusCode) {
                404 => 'RESOURCE_NOT_FOUND',
                403 => 'FORBIDDEN',
                401 => 'UNAUTHORIZED',
                400 => 'BAD_REQUEST',
                default => 'HTTP_ERROR'
            };

            $payload = [
                'error' => [
                    'code' => $code,
                    'message' => $throwable->getMessage() ?: 'Erro na requisição HTTP.',
                    'details' => []
                ]
            ];
        } else {
            $statusCode = 500;
            $isDatabaseException = $throwable instanceof \PDOException
                || $throwable instanceof \Doctrine\DBAL\Exception;

            $message = 'Ocorreu um erro interno inesperado no servidor.';
            if ($this->environment === 'dev') {
                $message = $isDatabaseException
                    ? 'Erro de comunicação ou operação no banco de dados (detalhes sensíveis e credenciais omitidos por segurança).'
                    : $throwable->getMessage();
            }

            $details = [];
            if ($this->environment === 'dev') {
                $details = [
                    'exception' => get_class($throwable),
                    'file' => $throwable->getFile(),
                    'line' => $throwable->getLine()
                ];
            }

            $payload = [
                'error' => [
                    'code' => 'INTERNAL_SERVER_ERROR',
                    'message' => $message,
                    'details' => $details
                ]
            ];
        }

        $response = new JsonResponse($payload, $statusCode);
        $event->setResponse($response);
    }
}
