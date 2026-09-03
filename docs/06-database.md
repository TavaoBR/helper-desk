# 06 — Database

> **Status:** baseline técnica criada antes da análise de um repositório executável.
> Itens marcados como **Planejado** são propostas de arquitetura e não devem ser tratados como já implementados.
> Quando o código existir, `composer.json`, `package.json`, migrations, código-fonte, infraestrutura e testes passam a ser a fonte primária de verificação.


## Banco

**A decidir entre MySQL e PostgreSQL.**

## Estratégia

- migrations versionadas;
- nenhuma alteração manual em produção;
- fixtures apenas em dev/test;
- constraints no banco;
- regras de negócio também no backend.

## Convenções

- tabelas/colunas: `snake_case`;
- FK: `<entity>_id`;
- timestamps: `created_at`, `updated_at`;
- banco em UTC;
- ID preferencialmente UUID/ULID se essa convenção for aprovada.

## Soft delete / arquivamento

Não aplicar genericamente. Para configuração em uso, preferir:
- `is_active`;
- `archived_at`.

## ERD planejado

```mermaid
erDiagram
    TENANT ||--o{ USER : has
    TENANT ||--o{ DEPARTMENT : configures
    TENANT ||--o{ TICKET_TYPE : configures
    TENANT ||--o{ CATEGORY : configures
    TENANT ||--o{ PRIORITY : configures
    TENANT ||--o{ PIPELINE : configures
    TENANT ||--o{ TEAM : has
    TENANT ||--o{ TICKET : owns

    PIPELINE ||--o{ PIPELINE_STAGE : has
    PIPELINE_STAGE ||--o{ PIPELINE_TRANSITION : from
    PIPELINE_STAGE ||--o{ PIPELINE_TRANSITION : to

    DEPARTMENT ||--o{ TICKET : receives
    TICKET_TYPE ||--o{ TICKET : classifies
    CATEGORY ||--o{ TICKET : classifies
    PRIORITY ||--o{ TICKET : prioritizes
    PIPELINE ||--o{ TICKET : governs
    PIPELINE_STAGE ||--o{ TICKET : current_stage

    USER ||--o{ TICKET : requests
    USER ||--o{ TICKET : assigned
    TEAM ||--o{ TICKET : assigned

    TICKET ||--o{ TICKET_COMMENT : has
    TICKET ||--o{ TICKET_ATTACHMENT : has
    TICKET ||--o{ TICKET_HISTORY : has
    TICKET ||--o{ TICKET_ASSIGNMENT : has
    TICKET ||--o{ TICKET_SLA : may_have
```

## Índices planejados

```text
tickets(tenant_id, created_at)
tickets(tenant_id, current_stage_id)
tickets(tenant_id, priority_id)
tickets(tenant_id, assigned_user_id)
tickets(tenant_id, assigned_team_id)
tickets(tenant_id, requester_id)
UNIQUE tickets(tenant_id, protocol)
ticket_history(ticket_id, created_at)
ticket_comments(ticket_id, created_at)
```

## Deletes

Configuração em uso:
- arquivar/desativar;
- bloquear delete físico;
- preservar histórico.

## Multi-tenancy

Se adotado:
- `tenant_id` obrigatório;
- índices compostos;
- repository scope;
- testes de isolamento.

## Concorrência

Adicionar `version` no ticket se optimistic locking for aprovado.

## JSON

Não usar para:
- etapas;
- prioridades;
- categorias;
- usuários;
- histórico relacional.

Pode usar para:
- metadata;
- payload de evento;
- snapshot técnico;
- parâmetros de automação futura.

## Pontos encontrados durante a análise

Schema, migrations, banco, tipo de ID e multi-tenancy ainda não estão comprovados.
