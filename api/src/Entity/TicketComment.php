<?php

namespace App\Entity;

use App\Repository\TicketCommentRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: TicketCommentRepository::class)]
#[ORM\Table(name: 'ticket_comments')]
#[ORM\Index(name: 'idx_comment_ticket', columns: ['ticket_id', 'created_at'])]
class TicketComment
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    private Uuid $id;

    #[ORM\ManyToOne(targetEntity: Ticket::class)]
    #[ORM\JoinColumn(name: 'ticket_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private Ticket $ticket;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'author_id', referencedColumnName: 'id', nullable: false)]
    private User $author;

    #[ORM\Column(type: 'text')]
    private string $body;

    #[ORM\Column(length: 20, options: ['default' => 'public'])]
    private string $visibility = 'public';

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    public function __construct(Ticket $ticket, User $author, string $body, string $visibility = 'public')
    {
        $this->id = Uuid::v4();
        $this->ticket = $ticket;
        $this->author = $author;
        $this->body = $body;
        $this->visibility = in_array($visibility, ['public', 'internal'], true) ? $visibility : 'public';
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): Uuid
    {
        return $this->id;
    }

    public function getTicket(): Ticket
    {
        return $this->ticket;
    }

    public function getAuthor(): User
    {
        return $this->author;
    }

    public function getBody(): string
    {
        return $this->body;
    }

    public function getVisibility(): string
    {
        return $this->visibility;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }
}
