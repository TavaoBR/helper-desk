<?php

namespace App\DTO\Response;

use App\Entity\Ticket;

readonly class TicketDetailDTO
{
    public function __construct(
        public TicketSummaryDTO $summary,
        public string $description,
        public ?array $category,
        public array $pipeline,
        public ?string $resolvedAt,
        public ?string $closedAt
    ) {
    }

    public static function fromEntity(Ticket $t): self
    {
        $summary = TicketSummaryDTO::fromEntity($t);

        return new self(
            summary: $summary,
            description: $t->getDescription(),
            category: $t->getCategory() ? [
                'id' => (string) $t->getCategory()->getId(),
                'name' => $t->getCategory()->getName()
            ] : null,
            pipeline: [
                'id' => (string) $t->getPipeline()->getId(),
                'name' => $t->getPipeline()->getName()
            ],
            resolvedAt: $t->getResolvedAt()?->format(\DateTimeInterface::ATOM),
            closedAt: $t->getClosedAt()?->format(\DateTimeInterface::ATOM)
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $data = $this->summary->toArray();
        $data['description'] = $this->description;
        $data['category'] = $this->category;
        $data['pipeline'] = $this->pipeline;
        $data['resolvedAt'] = $this->resolvedAt;
        $data['closedAt'] = $this->closedAt;

        return $data;
    }
}
