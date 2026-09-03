<?php

namespace App\Service;

use App\Entity\Ticket;
use App\Entity\User;
use App\Exception\ForbiddenException;

class AuthorizationService
{
    /**
     * Map of roles to default capabilities.
     *
     * @var array<string, list<string>>
     */
    private const ROLE_CAPABILITIES = [
        'ROLE_ADMIN' => [
            'ticket.create',
            'ticket.view_all',
            'ticket.view_queue',
            'ticket.assign',
            'ticket.move_pipeline',
            'ticket.comment_public',
            'ticket.comment_internal',
            'request_type.manage',
            'settings.view',
            'settings.manage',
            'user.view',
            'user.manage',
        ],
        'ROLE_AGENT' => [
            'ticket.create',
            'ticket.view_all',
            'ticket.view_queue',
            'ticket.assign',
            'ticket.move_pipeline',
            'ticket.comment_public',
            'ticket.comment_internal',
            'user.view',
        ],
        'ROLE_USER' => [
            'ticket.create',
            'ticket.comment_public',
        ],
    ];

    /**
     * Check whether a user has a specific permission or role capability.
     */
    public function hasPermission(User $user, string $permission): bool
    {
        $userRoles = $user->getRoles();

        // 1. Direct role check (ROLE_ADMIN has super-access)
        if (in_array('ROLE_ADMIN', $userRoles, true)) {
            return true;
        }

        // 2. Direct permission string match in user roles array
        if (in_array($permission, $userRoles, true)) {
            return true;
        }

        // 3. Match against default role matrix
        foreach ($userRoles as $role) {
            if (isset(self::ROLE_CAPABILITIES[$role]) && in_array($permission, self::ROLE_CAPABILITIES[$role], true)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Assert that a user has a specific permission; throws ForbiddenException otherwise.
     *
     * @throws ForbiddenException
     */
    public function assertPermission(User $user, string $permission, ?string $message = null): void
    {
        if (!$this->hasPermission($user, $permission)) {
            throw new ForbiddenException(
                $message ?? "Você não possui a permissão necessária ({$permission}) para executar esta ação."
            );
        }
    }

    /**
     * Check if a user can access a specific ticket.
     * Admins and Agents can access all tickets in their tenant.
     * Solicitantes (ROLE_USER) can only access tickets they opened.
     */
    public function canAccessTicket(User $user, Ticket $ticket): bool
    {
        // Must belong to the same tenant
        if ((string) $user->getTenant()->getId() !== (string) $ticket->getTenant()->getId()) {
            return false;
        }

        // Admin and Agent have broad access within tenant
        if ($this->hasPermission($user, 'ticket.view_all')) {
            return true;
        }

        // Requester can view own ticket
        return (string) $ticket->getRequester()->getId() === (string) $user->getId();
    }

    /**
     * Assert that a user can access a specific ticket.
     *
     * @throws ForbiddenException
     */
    public function assertCanAccessTicket(User $user, Ticket $ticket): void
    {
        if (!$this->canAccessTicket($user, $ticket)) {
            throw new ForbiddenException('Você não possui permissão para visualizar este chamado.');
        }
    }

    /**
     * Check if the user is allowed to view and post internal notes.
     */
    public function canViewInternalComments(User $user): bool
    {
        return $this->hasPermission($user, 'ticket.comment_internal');
    }

    /**
     * Check if the user is strictly a requester (ROLE_USER without agent/admin capabilities).
     */
    public function isRequesterOnly(User $user): bool
    {
        $roles = $user->getRoles();
        return !in_array('ROLE_ADMIN', $roles, true) && !in_array('ROLE_AGENT', $roles, true);
    }
}
