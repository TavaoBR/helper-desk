<?php

namespace App\Tests\Service;

use App\Entity\Department;
use App\Entity\Pipeline;
use App\Entity\PipelineStage;
use App\Entity\Priority;
use App\Entity\Tenant;
use App\Entity\Ticket;
use App\Entity\TicketType;
use App\Entity\User;
use App\Exception\ForbiddenException;
use App\Service\AuthorizationService;
use PHPUnit\Framework\TestCase;

class AuthorizationServiceTest extends TestCase
{
    private AuthorizationService $authService;
    private Tenant $tenant;

    protected function setUp(): void
    {
        $this->authService = new AuthorizationService();
        $this->tenant = new Tenant('Acme Corp');
    }

    public function testAdminHasAllPermissions(): void
    {
        $admin = new User($this->tenant, 'Admin', 'admin@test.com');
        $admin->setRoles(['ROLE_ADMIN']);

        $this->assertTrue($this->authService->hasPermission($admin, 'ticket.create'));
        $this->assertTrue($this->authService->hasPermission($admin, 'ticket.assign'));
        $this->assertTrue($this->authService->hasPermission($admin, 'user.manage'));
        $this->assertTrue($this->authService->hasPermission($admin, 'request_type.manage'));
        $this->assertTrue($this->authService->canViewInternalComments($admin));
        $this->assertFalse($this->authService->isRequesterOnly($admin));
    }

    public function testAgentPermissions(): void
    {
        $agent = new User($this->tenant, 'Agent', 'agent@test.com');
        $agent->setRoles(['ROLE_AGENT']);

        $this->assertTrue($this->authService->hasPermission($agent, 'ticket.assign'));
        $this->assertTrue($this->authService->hasPermission($agent, 'ticket.move_pipeline'));
        $this->assertTrue($this->authService->canViewInternalComments($agent));
        $this->assertFalse($this->authService->hasPermission($agent, 'user.manage'));
        $this->assertFalse($this->authService->hasPermission($agent, 'request_type.manage'));
        $this->assertFalse($this->authService->isRequesterOnly($agent));
    }

    public function testRequesterOnlyPermissions(): void
    {
        $user = new User($this->tenant, 'User', 'user@test.com');
        $user->setRoles(['ROLE_USER']);

        $this->assertTrue($this->authService->hasPermission($user, 'ticket.create'));
        $this->assertTrue($this->authService->hasPermission($user, 'ticket.comment_public'));
        $this->assertFalse($this->authService->hasPermission($user, 'ticket.assign'));
        $this->assertFalse($this->authService->hasPermission($user, 'ticket.move_pipeline'));
        $this->assertFalse($this->authService->canViewInternalComments($user));
        $this->assertTrue($this->authService->isRequesterOnly($user));
    }

    public function testAssertPermissionThrowsForbiddenException(): void
    {
        $user = new User($this->tenant, 'User', 'user@test.com');
        $user->setRoles(['ROLE_USER']);

        $this->expectException(ForbiddenException::class);
        $this->authService->assertPermission($user, 'ticket.assign');
    }

    public function testCanAccessTicketRestriction(): void
    {
        $requester = new User($this->tenant, 'Requester 1', 'req1@test.com');
        $otherRequester = new User($this->tenant, 'Requester 2', 'req2@test.com');
        $agent = new User($this->tenant, 'Agent', 'agent@test.com');
        $agent->setRoles(['ROLE_AGENT']);

        $dept = new Department($this->tenant, 'TI');
        $type = new TicketType($this->tenant, $dept, 'Acesso');
        $priority = new Priority($this->tenant, 'Alta', 80);
        $pipeline = new Pipeline($this->tenant, 'Default');
        $stage = new PipelineStage($pipeline, 'Novo', 1);

        $ticket = new Ticket(
            $this->tenant,
            'HD-000001',
            'Teste',
            'Desc',
            $requester,
            $dept,
            $type,
            $priority,
            $pipeline,
            $stage
        );

        $this->assertTrue($this->authService->canAccessTicket($requester, $ticket));
        $this->assertTrue($this->authService->canAccessTicket($agent, $ticket));
        $this->assertFalse($this->authService->canAccessTicket($otherRequester, $ticket));
    }
}
