<?php

namespace App\DTO\Response;

use App\Entity\Ticket;

readonly class TicketSummaryDTO
{
    public function __construct(
        public string $id,
        public string $protocol,
        public string $title,
        public array $department,
        public array $type,
        public array $priority,
        public array $stage,
        public array $requester,
        public ?array $assignedUser,
        public int $version,
        public string $createdAt,
        public string $updatedAt,
        public ?string $slaDueDate = null,
        public bool $slaBreached = false
    ) {
    }

    public static function fromEntity(Ticket $t): self
    {
        return new self(
            id: (string) $t->getId(),
            protocol: $t->getProtocol(),
            title: $t->getTitle(),
            department: [
                'id' => (string) $t->getDepartment()->getId(),
                'name' => $t->getDepartment()->getName()
            ],
            type: [
                'id' => (string) $t->getType()->getId(),
                'name' => $t->getType()->getName()
            ],
            priority: [
                'id' => (string) $t->getPriority()->getId(),
                'name' => $t->getPriority()->getName(),
                'weight' => $t->getPriority()->getWeight(),
                'colorToken' => $t->getPriority()->getColorToken()
            ],
            stage: [
                'id' => (string) $t->getCurrentStage()->getId(),
                'name' => $t->getCurrentStage()->getName(),
                'isInitial' => $t->getCurrentStage()->isInitial(),
                'isFinal' => $t->getCurrentStage()->isFinal()
            ],
            requester: [
                'id' => (string) $t->getRequester()->getId(),
                'name' => $t->getRequester()->getName()
            ],
            assignedUser: $t->getAssignedUser() ? [
                'id' => (string) $t->getAssignedUser()->getId(),
                'name' => $t->getAssignedUser()->getName()
            ] : null,
            version: $t->getVersion(),
            createdAt: $t->getCreatedAt()->format(\DateTimeInterface::ATOM),
            updatedAt: $t->getUpdatedAt()->format(\DateTimeInterface::ATOM),
            slaDueDate: $t->getSlaDueDate()?->format(\DateTimeInterface::ATOM),
            slaBreached: $t->isSlaBreached()
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'protocol' => $this->protocol,
            'title' => $this->title,
            'department' => $this->department,
            'type' => $this->type,
            'priority' => $this->priority,
            'stage' => $this->stage,
            'requester' => $this->requester,
            'assignedUser' => $this->assignedUser,
            'version' => $this->version,
            'createdAt' => $this->createdAt,
            'updatedAt' => $this->updatedAt,
            'slaDueDate' => $this->slaDueDate,
            'slaBreached' => $this->slaBreached
        ];
    }
}
