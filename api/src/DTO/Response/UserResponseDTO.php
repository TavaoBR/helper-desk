<?php

namespace App\DTO\Response;

use App\Entity\User;

readonly class UserResponseDTO
{
    /**
     * @param list<string> $roles
     */
    public function __construct(
        public string $id,
        public string $name,
        public string $email,
        public string $tenantId,
        public array $roles,
        public bool $isActive,
        public string $createdAt
    ) {
    }

    public static function fromEntity(User $user): self
    {
        return new self(
            id: (string) $user->getId(),
            name: $user->getName(),
            email: $user->getEmail(),
            tenantId: (string) $user->getTenant()->getId(),
            roles: $user->getRoles(),
            isActive: $user->isActive(),
            createdAt: $user->getCreatedAt()->format(\DateTimeInterface::ATOM)
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'tenantId' => $this->tenantId,
            'roles' => $this->roles,
            'isActive' => $this->isActive,
            'createdAt' => $this->createdAt
        ];
    }
}
