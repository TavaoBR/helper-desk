# 04 — System Design

> **Status:** baseline técnica criada antes da análise de um repositório executável.
> Itens marcados como **Planejado** são propostas de arquitetura e não devem ser tratados como já implementados.
> Quando o código existir, `composer.json`, `package.json`, migrations, código-fonte, infraestrutura e testes passam a ser a fonte primária de verificação.


## Arquitetura geral — Planejada

```mermaid
flowchart TB
    Browser[Angular SPA]
    API[Symfony API]
    DB[(Relational DB)]
    Queue[(Message Queue)]
    Worker[Worker]
    Storage[(File/Object Storage)]
    Mail[Email Provider]
    Audit[(Audit Log)]

    Browser -->|HTTPS JSON| API
    API --> DB
    API --> Storage
    API --> Queue
    API --> Audit
    Queue --> Worker
    Worker --> Mail
```

## Módulos

```mermaid
flowchart LR
    Auth[Auth & Access]
    Tenant[Tenant]
    Catalog[Ticket Configuration]
    Ticket[Ticket Core]
    Pipeline[Pipeline]
    Queue[Queues]
    SLA[SLA]
    Notify[Notifications]
    Audit[History & Audit]
    Reports[Reports]

    Auth --> Ticket
    Tenant --> Catalog
    Tenant --> Ticket
    Catalog --> Ticket
    Pipeline --> Ticket
    Ticket --> Queue
    Ticket --> Audit
    Ticket --> Notify
    SLA --> Ticket
    Ticket --> Reports
```

## Responsabilidades do frontend

- telas;
- filtros;
- formulários;
- kanban;
- feedback;
- consumo dos contratos.

Não decide se transição é válida.

## Responsabilidades do backend

- autenticar;
- autorizar;
- resolver tenant;
- validar configuração;
- transicionar;
- persistir;
- garantir concorrência;
- auditar;
- emitir eventos.

## Banco

Relacional para domínio principal. JSON apenas para metadados realmente dinâmicos.

## Filas/jobs

MVP pode operar sem fila avançada. Fase 2:
- e-mail;
- SLA;
- notificações;
- eventos.

Fase 3:
- webhooks;
- WhatsApp;
- automações.

## Cache

Não usar por padrão no MVP.

## Storage

Arquivos fora da tabela principal. Banco armazena metadados e `storage_key`.

## Multi-tenancy

**Decisão pendente.**

Se adotado:

```mermaid
flowchart LR
    Req[Request] --> Auth[User]
    Auth --> Ctx[Tenant Context]
    Ctx --> Repo[Scoped Repository]
    Repo --> DB[(Database)]
```

Não confiar em `tenantId` livre vindo do frontend se ele puder ser inferido da sessão/token.

## Fluxo: criar ticket

```mermaid
sequenceDiagram
    participant U as Usuário
    participant FE as Frontend
    participant API as API
    participant DB as DB
    participant EV as Event Bus

    U->>FE: preenche
    FE->>API: POST /tickets
    API->>API: auth + permission + tenant
    API->>API: valida catálogo
    API->>DB: cria ticket + estágio inicial
    API->>DB: registra timeline
    API->>EV: TicketCreated
    API-->>FE: 201
```

## Fluxo: mover etapa

```mermaid
sequenceDiagram
    participant A as Atendente
    participant API as API
    participant DB as DB

    A->>API: POST /tickets/{id}/transitions
    API->>DB: carrega no tenant
    API->>API: permission + transition
    API->>API: valida versão
    API->>DB: atualiza + histórico
    API-->>A: 200
```

## Integridade

- configurações do mesmo tenant;
- stage pertence ao pipeline;
- transition precisa existir;
- configuração em uso é arquivada;
- histórico preserva referências;
- mudança simultânea deve gerar conflito explícito.

## Decisões arquiteturais

- pipeline dinâmico;
- timeline separada de audit log;
- notificações via eventos;
- API como autoridade;
- DTOs explícitos.

## Pontos encontrados durante a análise

Serviços externos, deploy, cache, queue e estratégia multi-tenant não estão comprovados.
