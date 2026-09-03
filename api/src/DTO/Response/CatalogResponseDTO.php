<?php

namespace App\DTO\Response;

use App\Entity\Category;
use App\Entity\Department;
use App\Entity\Pipeline;
use App\Entity\Priority;
use App\Entity\TicketType;

readonly class CatalogResponseDTO
{
    /**
     * @return array<string, mixed>
     */
    public static function fromDepartment(Department $d): array
    {
        return [
            'id' => (string) $d->getId(),
            'name' => $d->getName(),
            'description' => $d->getDescription(),
            'isActive' => $d->isActive(),
            'createdAt' => $d->getCreatedAt()->format(\DateTimeInterface::ATOM)
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function fromTicketType(TicketType $t): array
    {
        return [
            'id' => (string) $t->getId(),
            'departmentId' => (string) $t->getDepartment()->getId(),
            'name' => $t->getName(),
            'isActive' => $t->isActive()
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function fromCategory(Category $c): array
    {
        return [
            'id' => (string) $c->getId(),
            'departmentId' => $c->getDepartment() ? (string) $c->getDepartment()->getId() : null,
            'typeId' => $c->getType() ? (string) $c->getType()->getId() : null,
            'parentId' => $c->getParent() ? (string) $c->getParent()->getId() : null,
            'name' => $c->getName(),
            'isActive' => $c->isActive()
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function fromPriority(Priority $p): array
    {
        return [
            'id' => (string) $p->getId(),
            'name' => $p->getName(),
            'weight' => $p->getWeight(),
            'colorToken' => $p->getColorToken(),
            'isActive' => $p->isActive()
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function fromPipeline(Pipeline $p): array
    {
        return [
            'id' => (string) $p->getId(),
            'name' => $p->getName(),
            'isActive' => $p->isActive(),
            'stages' => array_map(fn($s) => [
                'id' => (string) $s->getId(),
                'name' => $s->getName(),
                'position' => $s->getPosition(),
                'isInitial' => $s->isInitial(),
                'isFinal' => $s->isFinal(),
                'isActive' => $s->isActive()
            ], $p->getStages()->toArray())
        ];
    }
}
