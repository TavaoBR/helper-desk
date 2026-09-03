<?php

namespace App\Exception;

class ValidationException extends DomainException
{
    /**
     * @param array<string, string> $details
     */
    public function __construct(string $message = 'Os dados informados contêm inconsistências.', array $details = [])
    {
        parent::__construct($message, 'VALIDATION_ERROR', 422, $details);
    }
}
