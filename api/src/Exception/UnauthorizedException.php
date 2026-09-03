<?php

namespace App\Exception;

class UnauthorizedException extends DomainException
{
    public function __construct(string $message = 'Autenticação necessária ou credenciais inválidas.', array $details = [])
    {
        parent::__construct($message, 'UNAUTHORIZED', 401, $details);
    }
}
