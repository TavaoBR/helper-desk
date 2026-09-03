<?php

namespace App\DTO\Response;

use App\Entity\TicketHistory;

readonly class TicketHistoryDTO
{
    public function __construct(
        public string $id,
        public string $ticketId,
        public array $actor,
        public string $action,
        public ?array $beforeState,
        public ?array $afterState,
        public ?array $metadata,
        public string $createdAt
    ) {
    }

    public static function fromEntity(TicketHistory $h): self
    {
        return new self(
            id: (string) $h->getId(),
            ticketId: (string) $h->getTicket()->getId(),
            actor: [
                'id' => (string) $h->getActor()->getId(),
                'name' => $h->getActor()->getName()
            ],
            action: $h->getAction(),
            beforeState: $h->getBeforeState(),
            afterState: $h->getAfterState(),
            metadata: $h->getMetadata(),
            createdAt: $h->getCreatedAt()->format(\DateTimeInterface::ATOM)
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'ticketId' => $this->ticketId,
            'actor' => $this->actor,
            'action' => $this->action,
            'beforeState' => $this->beforeState,
            'afterState' => $this->afterState,
            'metadata' => $this->metadata,
            'createdAt' => $this->createdAt
        ];
    }
}
