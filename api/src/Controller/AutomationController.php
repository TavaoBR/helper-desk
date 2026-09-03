<?php

namespace App\Controller;

use App\Entity\AutomationRule;
use App\Entity\User;
use App\Service\AuthorizationService;
use App\Service\AutomationEngineService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/automations')]
class AutomationController extends AbstractController
{
    public function __construct(
        private readonly AutomationEngineService $engineService,
        private readonly AuthorizationService $authService
    ) {
    }

    #[Route('', name: 'api_automations_list', methods: ['GET'])]
    public function list(#[CurrentUser] User $user): JsonResponse
    {
        $this->authService->assertPermission($user, 'settings.view');

        $rules = $this->engineService->listRules($user->getTenant());

        $data = array_map(function (AutomationRule $r) {
            return [
                'id' => (string) $r->getId(),
                'name' => $r->getName(),
                'description' => $r->getDescription(),
                'category' => $r->getCategory(),
                'triggerEvent' => $r->getTriggerEvent(),
                'conditionText' => $r->getConditionText(),
                'actionText' => $r->getActionText(),
                'active' => $r->isActive(),
                'runsCount' => $r->getRunsCount(),
                'createdAt' => $r->getCreatedAt()->format(\DateTimeInterface::ATOM)
            ];
        }, $rules);

        return new JsonResponse(['items' => $data]);
    }

    #[Route('', name: 'api_automations_create', methods: ['POST'])]
    public function create(Request $request, #[CurrentUser] User $user): JsonResponse
    {
        $this->authService->assertPermission($user, 'settings.manage');

        $body = json_decode($request->getContent(), true);
        if (!is_array($body) || empty($body['name'])) {
            return new JsonResponse(['error' => ['message' => 'Nome da regra é obrigatório.']], Response::HTTP_BAD_REQUEST);
        }

        $rule = $this->engineService->createRule($user->getTenant(), $body);

        return new JsonResponse([
            'id' => (string) $rule->getId(),
            'name' => $rule->getName(),
            'description' => $rule->getDescription(),
            'category' => $rule->getCategory(),
            'triggerEvent' => $rule->getTriggerEvent(),
            'conditionText' => $rule->getConditionText(),
            'actionText' => $rule->getActionText(),
            'active' => $rule->isActive(),
            'runsCount' => $rule->getRunsCount(),
            'createdAt' => $rule->getCreatedAt()->format(\DateTimeInterface::ATOM)
        ], Response::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'api_automations_update', methods: ['PUT'])]
    public function update(string $id, Request $request, #[CurrentUser] User $user): JsonResponse
    {
        $this->authService->assertPermission($user, 'settings.manage');

        $body = json_decode($request->getContent(), true);
        if (!is_array($body)) {
            return new JsonResponse(['error' => ['message' => 'Corpo da requisição inválido.']], Response::HTTP_BAD_REQUEST);
        }

        $rule = $this->engineService->updateRule($id, $user->getTenant(), $body);
        if (!$rule) {
            return new JsonResponse(['error' => ['message' => 'Regra de automação não encontrada.']], Response::HTTP_NOT_FOUND);
        }

        return new JsonResponse([
            'id' => (string) $rule->getId(),
            'name' => $rule->getName(),
            'description' => $rule->getDescription(),
            'category' => $rule->getCategory(),
            'triggerEvent' => $rule->getTriggerEvent(),
            'conditionText' => $rule->getConditionText(),
            'actionText' => $rule->getActionText(),
            'active' => $rule->isActive(),
            'runsCount' => $rule->getRunsCount()
        ]);
    }

    #[Route('/{id}/toggle', name: 'api_automations_toggle', methods: ['PATCH'])]
    public function toggle(string $id, #[CurrentUser] User $user): JsonResponse
    {
        $this->authService->assertPermission($user, 'settings.manage');

        $rule = $this->engineService->toggleRule($id, $user->getTenant());
        if (!$rule) {
            return new JsonResponse(['error' => ['message' => 'Regra não encontrada.']], Response::HTTP_NOT_FOUND);
        }

        return new JsonResponse(['id' => (string) $rule->getId(), 'active' => $rule->isActive()]);
    }

    #[Route('/{id}', name: 'api_automations_delete', methods: ['DELETE'])]
    public function delete(string $id, #[CurrentUser] User $user): JsonResponse
    {
        $this->authService->assertPermission($user, 'settings.manage');

        $deleted = $this->engineService->deleteRule($id, $user->getTenant());
        if (!$deleted) {
            return new JsonResponse(['error' => ['message' => 'Regra não encontrada.']], Response::HTTP_NOT_FOUND);
        }

        return new JsonResponse(['success' => true]);
    }
}
