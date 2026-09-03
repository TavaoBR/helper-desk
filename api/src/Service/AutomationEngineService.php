<?php

namespace App\Service;

use App\Entity\AutomationRule;
use App\Entity\Tenant;
use App\Entity\Ticket;
use App\Repository\AutomationRuleRepository;
use Doctrine\ORM\EntityManagerInterface;

class AutomationEngineService
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly AutomationRuleRepository $ruleRepo
    ) {
    }

    /**
     * @return AutomationRule[]
     */
    public function listRules(Tenant $tenant): array
    {
        $this->ensureDefaultRules($tenant);
        return $this->ruleRepo->findByTenant($tenant);
    }

    public function getRuleById(string $id, Tenant $tenant): ?AutomationRule
    {
        return $this->ruleRepo->findOneBy(['id' => $id, 'tenant' => $tenant]);
    }

    public function createRule(Tenant $tenant, array $data): AutomationRule
    {
        $rule = new AutomationRule(
            $tenant,
            $data['name'],
            $data['category'] ?? 'create',
            $data['triggerEvent'] ?? 'Novo chamado é criado',
            $data['conditionText'] ?? '',
            $data['actionText'] ?? '',
            $data['description'] ?? null,
            $data['active'] ?? true
        );

        $this->ruleRepo->save($rule);
        return $rule;
    }

    public function updateRule(string $id, Tenant $tenant, array $data): ?AutomationRule
    {
        $rule = $this->getRuleById($id, $tenant);
        if (!$rule) {
            return null;
        }

        if (isset($data['name'])) $rule->setName($data['name']);
        if (isset($data['description'])) $rule->setDescription($data['description']);
        if (isset($data['category'])) $rule->setCategory($data['category']);
        if (isset($data['triggerEvent'])) $rule->setTriggerEvent($data['triggerEvent']);
        if (isset($data['conditionText'])) $rule->setConditionText($data['conditionText']);
        if (isset($data['actionText'])) $rule->setActionText($data['actionText']);
        if (isset($data['active'])) $rule->setIsActive((bool) $data['active']);

        $this->ruleRepo->save($rule);
        return $rule;
    }

    public function toggleRule(string $id, Tenant $tenant): ?AutomationRule
    {
        $rule = $this->getRuleById($id, $tenant);
        if (!$rule) {
            return null;
        }

        $rule->setIsActive(!$rule->isActive());
        $this->ruleRepo->save($rule);
        return $rule;
    }

    public function deleteRule(string $id, Tenant $tenant): bool
    {
        $rule = $this->getRuleById($id, $tenant);
        if (!$rule) {
            return false;
        }

        $this->ruleRepo->remove($rule);
        return true;
    }

    /**
     * Evaluate and execute active rules on ticket creation.
     */
    public function executeOnTicketCreated(Ticket $ticket): void
    {
        $rules = $this->ruleRepo->findBy(['tenant' => $ticket->getTenant(), 'isActive' => true, 'category' => 'create']);
        foreach ($rules as $rule) {
            $rule->incrementRunsCount();
        }
        $this->em->flush();
    }

    private function ensureDefaultRules(Tenant $tenant): void
    {
        $count = count($this->ruleRepo->findBy(['tenant' => $tenant]));
        if ($count > 0) {
            return;
        }

        $defaults = [
            [
                'name' => 'Triagem Rápida: Atribuir TI Incidentes Críticos',
                'description' => 'Atribui chamados urgentes para o coordenador de infraestrutura e reduz meta de SLA.',
                'category' => 'create',
                'triggerEvent' => 'Novo chamado criado',
                'conditionText' => 'Departamento = TI E Prioridade = Crítica',
                'actionText' => 'Definir SLA = 2h e Notificar equipe via E-mail / Slack',
            ],
            [
                'name' => 'Autoatribuição Round-Robin para Suporte Geral',
                'description' => 'Distribui chamados da fila geral entre os atendentes online proporcionalmente.',
                'category' => 'assign',
                'triggerEvent' => 'Chamado sem atendente após 10 minutos',
                'conditionText' => 'Fila = Suporte Geral E Status = Triagem',
                'actionText' => 'Atribuir ao próximo atendente disponível em rodízio',
            ],
            [
                'name' => 'Escalonamento Preventivo de Violação de SLA',
                'description' => 'Emite alerta sonoro e notificação ao gestor quando 80% do tempo de resposta for consumido.',
                'category' => 'sla',
                'triggerEvent' => '80% do tempo limite de SLA atingido',
                'conditionText' => 'Chamado ainda não respondido',
                'actionText' => 'Adicionar tag #Urgente e Notificar gestor do departamento',
            ],
            [
                'name' => 'Encerramento Automático de Chamados Resolvidos',
                'description' => 'Fecha o chamado definitivamente após 48 horas de inatividade após resolução.',
                'category' => 'stage',
                'triggerEvent' => '48 horas após status "Resolvido"',
                'conditionText' => 'Sem novas respostas do solicitante',
                'actionText' => 'Mudar status para "Fechado" e Disparar pesquisa CSAT',
            ],
            [
                'name' => 'Retomada Automática ao Receber Resposta',
                'description' => 'Devolve o chamado para a fila de atendimento assim que o cliente comenta.',
                'category' => 'stage',
                'triggerEvent' => 'Novo comentário do solicitante',
                'conditionText' => 'Status = "Aguardando Solicitante"',
                'actionText' => 'Mudar status para "Em Atendimento" e Notificar atendente',
            ]
        ];

        foreach ($defaults as $d) {
            $rule = new AutomationRule(
                $tenant,
                $d['name'],
                $d['category'],
                $d['triggerEvent'],
                $d['conditionText'],
                $d['actionText'],
                $d['description']
            );
            $this->em->persist($rule);
        }

        $this->em->flush();
    }
}
