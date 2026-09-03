<?php

namespace App\Exception;

class EntityNotFoundException extends DomainException
{
    public function __construct(string $message = 'Recurso não encontrado.', string $errorCode = 'RESOURCE_NOT_FOUND', array $details = [])
    {
        parent::__construct($message, $errorCode, 404, $details);
    }
}
