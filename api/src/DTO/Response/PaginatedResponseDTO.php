<?php

namespace App\DTO\Response;

readonly class PaginatedResponseDTO
{
    /**
     * @param array<int, mixed> $items
     * @return array<string, mixed>
     */
    public static function format(array $items, int $page, int $limit, int $total): array
    {
        return [
            'items' => $items,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total
            ]
        ];
    }
}
