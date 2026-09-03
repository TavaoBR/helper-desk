<?php

namespace App\DTO\Request;

use App\Exception\ValidationException;

readonly class MoveTicketStageDTO
{
    public function __construct(
        public string $toStageId,
        public ?int $expectedVersion
    ) {
    }

    /**
     * @param array<string, mixed> $data
     */
    public static function fromArray(array $data): self
    {
        $toStageId = trim((string) ($data['toStageId'] ?? ''));
        $expectedVersion = isset($data['expectedVersion']) ? (int) $data['expectedVersion'] : null;

        if ($toStageId === '') {
            throw new ValidationException('A etapa de destino (toStageId) é obrigatória.', [
                'toStageId' => 'Informe o ID da etapa de destino.'
            ]);
        }

        return new self($toStageId, $expectedVersion);
    }
}
