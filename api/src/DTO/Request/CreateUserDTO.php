<?php

namespace App\DTO\Request;

use App\Exception\ValidationException;

readonly class CreateUserDTO
{
    /**
     * @param list<string> $roles
     */
    public function __construct(
        public string $name,
        public string $email,
        public string $password,
        public array $roles = ['ROLE_USER']
    ) {
    }

    /**
     * @param array<string, mixed> $data
     */
    public static function fromArray(array $data): self
    {
        $name = trim((string) ($data['name'] ?? ''));
        $email = trim(strtolower((string) ($data['email'] ?? '')));
        $password = (string) ($data['password'] ?? '');
        $roles = isset($data['roles']) && is_array($data['roles']) ? array_values($data['roles']) : ['ROLE_USER'];

        $errors = [];
        if ($name === '') {
            $errors['name'] = 'O nome do usuário é obrigatório.';
        }
        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'Informe um endereço de e-mail corporativo válido.';
        }
        if (strlen($password) < 6) {
            $errors['password'] = 'A senha deve possuir no mínimo 6 caracteres.';
        }

        if (!empty($errors)) {
            throw new ValidationException('Dados inválidos para cadastro de usuário.', $errors);
        }

        return new self($name, $email, $password, $roles);
    }
}
