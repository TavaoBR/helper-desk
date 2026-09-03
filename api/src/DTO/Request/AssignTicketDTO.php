<?php

namespace App\DTO\Request;

readonly class AssignTicketDTO
{
    public function __construct(
        public ?string $userId,
        public ?int $expectedVersion
    ) {
    }

    /**
     * @param array<string, mixed> $data
     */
    public static function fromArray(array $data): self
    {
        $userId = isset($data['userId']) && trim((string) $data['userId']) !== '' ? trim((string) $data['userId']) : null;
        $expectedVersion = isset($data['expectedVersion']) ? (int) $data['expectedVersion'] : null;

        return new self($userId, $expectedVersion);
    }
}
