<?php

namespace App\Exception;

class ConcurrencyConflictException extends DomainException
{
    public function __construct(string $message = 'O registro foi modificado por outro usuário ou processo concorrente. Recarregue os dados antes de prosseguir.', array $details = [])
    {
        parent::__construct($message, 'CONCURRENCY_CONFLICT', 409, $details);
    }
}
