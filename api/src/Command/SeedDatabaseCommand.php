<?php

namespace App\Command;

use App\Entity\Department;
use App\Entity\Pipeline;
use App\Entity\PipelineStage;
use App\Entity\PipelineTransition;
use App\Entity\Priority;
use App\Entity\Tenant;
use App\Entity\Ticket;
use App\Entity\TicketHistory;
use App\Entity\TicketType;
use App\Entity\User;
use App\Repository\DepartmentRepository;
use App\Repository\TenantRepository;
use App\Repository\TicketTypeRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

#[AsCommand(
    name: 'app:seed',
    description: 'Populates the database with initial catalog, admin user and sample pipeline',
)]
class SeedDatabaseCommand extends Command
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly UserPasswordHasherInterface $hasher,
        private readonly TenantRepository $tenantRepository,
        private readonly DepartmentRepository $departmentRepository,
        private readonly TicketTypeRepository $ticketTypeRepository
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        // Check if tenant already exists
        $existingTenant = $this->tenantRepository->findByName('Acme Corporation');
        if ($existingTenant) {
            $io->info('Tenant Acme Corporation já existe. Verificando e sincronizando tipos de solicitação para todos os departamentos...');
            $this->syncMissingTicketTypes($existingTenant, $io);
            $io->success('Catálogo de tipos de chamado sincronizado com sucesso!');
            return Command::SUCCESS;
        }

        $io->info('Criando Tenant demonstrativo...');
        $tenant = new Tenant('Acme Corporation');
        $this->em->persist($tenant);

        $io->info('Criando Usuários...');
        $admin = new User($tenant, 'Administrador SupportFlow', 'admin@supportflow.local');
        $admin->setPassword($this->hasher->hashPassword($admin, 'secret123'));
        $admin->setRoles(['ROLE_ADMIN', 'ticket.create', 'ticket.assign', 'ticket.move_pipeline']);
        $this->em->persist($admin);

        $agent = new User($tenant, 'Carlos Atendente', 'atendente@supportflow.local');
        $agent->setPassword($this->hasher->hashPassword($agent, 'secret123'));
        $agent->setRoles(['ROLE_AGENT', 'ticket.create', 'ticket.assign', 'ticket.move_pipeline']);
        $this->em->persist($agent);

        $requester = new User($tenant, 'João Solicitante', 'joao@supportflow.local');
        $requester->setPassword($this->hasher->hashPassword($requester, 'secret123'));
        $requester->setRoles(['ROLE_USER', 'ticket.create']);
        $this->em->persist($requester);

        $io->info('Criando Departamentos...');
        $deptTi = new Department($tenant, 'Tecnologia da Informação (TI)', 'Atendimento a sistemas, infraestrutura, acessos e suporte aos usuários.');
        $deptRh = new Department($tenant, 'Recursos Humanos (RH)', 'Dúvidas de ponto, benefícios, férias e admissão.');
        $deptFin = new Department($tenant, 'Financeiro', 'Contas a pagar, faturamento e reembolso.');
        $deptFac = new Department($tenant, 'Facilities / Manutenção', 'Manutenção predial, ar-condicionado e suprimentos.');

        $this->em->persist($deptTi);
        $this->em->persist($deptRh);
        $this->em->persist($deptFin);
        $this->em->persist($deptFac);

        $io->info('Criando Tipos de Chamado para todos os departamentos...');
        $this->createDepartmentTicketTypes($tenant, $deptTi, [
            'Acesso e Contas',
            'Falha de Equipamento / Hardware',
            'Rede / Internet / Wi-Fi',
            'Instalação de Software',
            'Sistemas Internos / ERP'
        ]);

        $this->createDepartmentTicketTypes($tenant, $deptRh, [
            'Férias e Afastamentos',
            'Admissão e Integração',
            'Benefícios e Vale-Transporte',
            'Folha de Pagamento e Holerite',
            'Dúvidas de Ponto e Escala'
        ]);

        $this->createDepartmentTicketTypes($tenant, $deptFin, [
            'Reembolso de Despesas',
            'Emissão de Notas Fiscais',
            'Pagamento a Fornecedores',
            'Adiantamento Financeiro',
            'Prestação de Contas'
        ]);

        $this->createDepartmentTicketTypes($tenant, $deptFac, [
            'Manutenção Predial / Elétrica',
            'Ar-condicionado e Climatização',
            'Troca de Lâmpadas / Iluminação',
            'Mudança de Mobiliário e Layout',
            'Solicitação de Suprimentos / Copa'
        ]);

        $io->info('Criando Prioridades...');
        $priLow = new Priority($tenant, 'Baixa', 20, 'badge-success');
        $priMed = new Priority($tenant, 'Média', 50, 'badge-info');
        $priHigh = new Priority($tenant, 'Alta', 80, 'badge-warning');
        $priCrit = new Priority($tenant, 'Crítica / Urgente', 100, 'badge-danger');

        $this->em->persist($priLow);
        $this->em->persist($priMed);
        $this->em->persist($priHigh);
        $this->em->persist($priCrit);

        $io->info('Criando Pipeline Dinâmico e Etapas...');
        $pipeline = new Pipeline($tenant, 'Esteira de Suporte Geral');
        $this->em->persist($pipeline);

        $stageTriagem = new PipelineStage($pipeline, 'Triagem', 1, isInitial: true, isFinal: false);
        $stageAtendimento = new PipelineStage($pipeline, 'Em Atendimento', 2, isInitial: false, isFinal: false);
        $stageEspera = new PipelineStage($pipeline, 'Aguardando Solicitante', 3, isInitial: false, isFinal: false);
        $stageResolvido = new PipelineStage($pipeline, 'Resolvido', 4, isInitial: false, isFinal: true);
        $stageFechado = new PipelineStage($pipeline, 'Fechado', 5, isInitial: false, isFinal: true);

        $this->em->persist($stageTriagem);
        $this->em->persist($stageAtendimento);
        $this->em->persist($stageEspera);
        $this->em->persist($stageResolvido);
        $this->em->persist($stageFechado);

        // Transições válidas
        $t1 = new PipelineTransition($pipeline, $stageTriagem, $stageAtendimento, 'Iniciar Atendimento');
        $t2 = new PipelineTransition($pipeline, $stageAtendimento, $stageEspera, 'Aguardar Resposta');
        $t3 = new PipelineTransition($pipeline, $stageEspera, $stageAtendimento, 'Retomar Atendimento');
        $t4 = new PipelineTransition($pipeline, $stageAtendimento, $stageResolvido, 'Concluir Solução');
        $t5 = new PipelineTransition($pipeline, $stageResolvido, $stageFechado, 'Encerrar Chamado');

        $this->em->persist($t1);
        $this->em->persist($t2);
        $this->em->persist($t3);
        $this->em->persist($t4);
        $this->em->persist($t5);

        $io->info('Criando Chamado Inicial de Demonstração...');
        $firstType = $this->ticketTypeRepository->findByTenantAndDepartment($tenant, (string) $deptTi->getId())[0] ?? null;
        if (!$firstType) {
            $firstType = new TicketType($tenant, $deptTi, 'Acesso e Contas');
            $this->em->persist($firstType);
        }

        $ticket = new Ticket(
            $tenant,
            'HD-000001',
            'Bloqueio de acesso ao sistema financeiro após troca periódica de senha',
            "Olá equipe de suporte,\n\nAo tentar acessar o módulo financeiro hoje pela manhã com a nova senha redefinida, o sistema apresenta a mensagem 'Usuário Bloqueado por Tentativas Excessivas'. Solicito desbloqueio urgente para emissão de relatórios.",
            $requester,
            $deptTi,
            $firstType,
            $priHigh,
            $pipeline,
            $stageTriagem
        );

        $history = new TicketHistory(
            $ticket,
            $requester,
            'abriu o chamado na etapa Triagem',
            null,
            ['stage' => 'Triagem', 'protocol' => 'HD-000001']
        );

        $this->em->persist($ticket);
        $this->em->persist($history);

        $this->em->flush();

        $io->success('Banco de dados semeado com sucesso!');
        $io->table(
            ['Usuário', 'E-mail', 'Senha', 'Perfil'],
            [
                ['Administrador', 'admin@supportflow.local', 'secret123', 'ROLE_ADMIN'],
                ['Atendente', 'atendente@supportflow.local', 'secret123', 'ROLE_AGENT'],
                ['Solicitante', 'joao@supportflow.local', 'secret123', 'ROLE_USER']
            ]
        );

        return Command::SUCCESS;
    }

    /**
     * @param string[] $names
     */
    private function createDepartmentTicketTypes(Tenant $tenant, Department $dept, array $names): void
    {
        foreach ($names as $name) {
            $type = new TicketType($tenant, $dept, $name);
            $this->em->persist($type);
        }
    }

    private function syncMissingTicketTypes(Tenant $tenant, SymfonyStyle $io): void
    {
        $departments = $this->departmentRepository->findAllActiveByTenant($tenant);

        $typeCatalog = [
            'Tecnologia da Informação (TI)' => [
                'Acesso e Contas',
                'Falha de Equipamento / Hardware',
                'Rede / Internet / Wi-Fi',
                'Instalação de Software',
                'Sistemas Internos / ERP'
            ],
            'Recursos Humanos (RH)' => [
                'Férias e Afastamentos',
                'Admissão e Integração',
                'Benefícios e Vale-Transporte',
                'Folha de Pagamento e Holerite',
                'Dúvidas de Ponto e Escala'
            ],
            'Financeiro' => [
                'Reembolso de Despesas',
                'Emissão de Notas Fiscais',
                'Pagamento a Fornecedores',
                'Adiantamento Financeiro',
                'Prestação de Contas'
            ],
            'Facilities / Manutenção' => [
                'Manutenção Predial / Elétrica',
                'Ar-condicionado e Climatização',
                'Troca de Lâmpadas / Iluminação',
                'Mudança de Mobiliário e Layout',
                'Solicitação de Suprimentos / Copa'
            ],
        ];

        $addedCount = 0;
        foreach ($departments as $dept) {
            $deptName = $dept->getName();
            if (!isset($typeCatalog[$deptName])) {
                continue;
            }

            $existingTypes = $this->ticketTypeRepository->findByTenantAndDepartment($tenant, (string) $dept->getId());
            $existingNames = array_map(fn($t) => $t->getName(), $existingTypes);

            foreach ($typeCatalog[$deptName] as $typeName) {
                if (!in_array($typeName, $existingNames, true)) {
                    $type = new TicketType($tenant, $dept, $typeName);
                    $this->em->persist($type);
                    $addedCount++;
                    $io->writeln("  + Adicionado: [{$deptName}] {$typeName}");
                }
            }
        }

        if ($addedCount > 0) {
            $this->em->flush();
            $io->info("Total de novos tipos adicionados: {$addedCount}");
        } else {
            $io->info('Todos os departamentos já possuem os tipos configurados.');
        }
    }
}
