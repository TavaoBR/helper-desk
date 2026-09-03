<?php

namespace App\Exception;

class ForbiddenException extends DomainException
{
    public function __construct(string $message = 'Você não possui permissão para executar esta ação.', array $details = [])
    {
        parent::__construct($message, 'FORBIDDEN', 403, $details);
    }
}
