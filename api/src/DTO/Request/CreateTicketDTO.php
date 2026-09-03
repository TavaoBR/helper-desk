<?php

namespace App\DTO\Request;

use App\Exception\ValidationException;

readonly class CreateTicketDTO
{
    public function __construct(
        public string $title,
        public string $description,
        public string $departmentId,
        public string $typeId,
        public ?string $categoryId,
        public string $priorityId
    ) {
    }

    /**
     * @param array<string, mixed> $data
     */
    public static function fromArray(array $data): self
    {
        $title = trim((string) ($data['title'] ?? ''));
        $description = trim((string) ($data['description'] ?? ''));
        $departmentId = trim((string) ($data['departmentId'] ?? ''));
        $typeId = trim((string) ($data['typeId'] ?? ''));
        $categoryId = isset($data['categoryId']) && trim((string) $data['categoryId']) !== '' ? trim((string) $data['categoryId']) : null;
        $priorityId = trim((string) ($data['priorityId'] ?? ''));

        $errors = [];
        if ($title === '') {
            $errors['title'] = 'O título do chamado é obrigatório.';
        } elseif (strlen($title) < 5) {
            $errors['title'] = 'O título deve possuir pelo menos 5 caracteres.';
        }

        if ($description === '') {
            $errors['description'] = 'A descrição do chamado é obrigatória.';
        } elseif (strlen($description) < 10) {
            $errors['description'] = 'A descrição deve possuir pelo menos 10 caracteres.';
        }

        if ($departmentId === '') {
            $errors['departmentId'] = 'Selecione um departamento válido.';
        }

        if ($typeId === '') {
            $errors['typeId'] = 'Selecione um tipo de chamado válido.';
        }

        if ($priorityId === '') {
            $errors['priorityId'] = 'Selecione uma prioridade válida.';
        }

        if (!empty($errors)) {
            throw new ValidationException('Dados inválidos para abertura de chamado.', $errors);
        }

        return new self($title, $description, $departmentId, $typeId, $categoryId, $priorityId);
    }
}
