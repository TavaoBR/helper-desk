<?php

namespace App\DTO\Request;

use App\Exception\ValidationException;

readonly class AddTicketCommentDTO
{
    public function __construct(
        public string $body,
        public string $visibility = 'public'
    ) {
    }

    /**
     * @param array<string, mixed> $data
     */
    public static function fromArray(array $data): self
    {
        $body = trim((string) ($data['body'] ?? ''));
        $visibility = trim((string) ($data['visibility'] ?? 'public'));
        if (!in_array($visibility, ['public', 'internal'], true)) {
            $visibility = 'public';
        }

        if ($body === '') {
            throw new ValidationException('O corpo do comentário não pode ser vazio.', [
                'body' => 'Escreva uma mensagem para enviar o comentário.'
            ]);
        }

        return new self($body, $visibility);
    }
}
