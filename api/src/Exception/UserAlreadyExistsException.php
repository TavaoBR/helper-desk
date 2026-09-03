<?php

namespace App\Exception;

class UserAlreadyExistsException extends DomainException
{
    public function __construct(string $email, array $details = [])
    {
        parent::__construct(
            sprintf('Já existe um usuário cadastrado com o e-mail "%s" neste tenant.', $email),
            'USER_ALREADY_EXISTS',
            409,
            $details
        );
    }
}
