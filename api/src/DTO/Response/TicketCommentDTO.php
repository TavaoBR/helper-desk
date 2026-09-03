<?php

namespace App\DTO\Response;

use App\Entity\TicketComment;

readonly class TicketCommentDTO
{
    public function __construct(
        public string $id,
        public string $ticketId,
        public array $author,
        public string $body,
        public string $visibility,
        public string $createdAt
    ) {
    }

    public static function fromEntity(TicketComment $c): self
    {
        return new self(
            id: (string) $c->getId(),
            ticketId: (string) $c->getTicket()->getId(),
            author: [
                'id' => (string) $c->getAuthor()->getId(),
                'name' => $c->getAuthor()->getName(),
                'email' => $c->getAuthor()->getEmail()
            ],
            body: $c->getBody(),
            visibility: $c->getVisibility(),
            createdAt: $c->getCreatedAt()->format(\DateTimeInterface::ATOM)
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
            'author' => $this->author,
            'body' => $this->body,
            'visibility' => $this->visibility,
            'createdAt' => $this->createdAt
        ];
    }
}
