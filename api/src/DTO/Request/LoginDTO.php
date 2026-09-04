<?php

namespace App\DTO\Request;

use App\Exception\ValidationException;

readonly class LoginDTO
{
    public function __construct(
        public string $email,
        public string $password,
        public ?string $deviceIdentifier = null
    ) {
    }

    /**
     * @param array<string, mixed> $data
     */
    public static function fromArray(array $data): self
    {
        $email = trim(strtolower((string) ($data['email'] ?? '')));
        $password = (string) ($data['password'] ?? '');
        $deviceIdentifier = isset($data['deviceIdentifier']) ? trim((string) $data['deviceIdentifier']) : null;

        $errors = [];
        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'Informe um endereço de e-mail válido.';
        }
        if ($password === '') {
            $errors['password'] = 'A senha é obrigatória.';
        }

        if (!empty($errors)) {
            throw new ValidationException('Dados de login inválidos.', $errors);
        }

        return new self($email, $password, $deviceIdentifier);
    }
}
