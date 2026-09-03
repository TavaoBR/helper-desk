# 13 — Architecture Decision Records

> **Status:** Atualizado após aprovação de stack técnica nativa e início do bootstrap executável.

Status possíveis: `Proposed`, `Accepted`, `Deprecated`, `Superseded`.

## ADR-001 — Frontend SPA com Angular e TypeScript

**Status:** Accepted  
**Decisão:** Frontend SPA desenvolvido em Angular (versão 21+) com TypeScript estrito (`strict: true`).  
**Motivo:** UI corporativa rica, gerenciamento de estado local com Signals, formulários reativos tipados, validação rigorosa de contratos e suporte a Kanban.  
**Consequência:** Contratos da API espelhados em modelos TypeScript no frontend em `core/models/`, autenticação via Bearer JWT com HttpInterceptor e tratamento de CORS via NelmioCorsBundle.

## ADR-002 — REST com DTOs explícitos

**Status:** Accepted  
**Decisão:** API REST/JSON; entidades Doctrine não são serializadas diretamente nos endpoints públicos.  
**Motivo:** Desacoplamento entre esquema interno de banco e contrato externo consumido pelo frontend.  
**Consequência:** Previne vazamento de atributos internos e permite evolução independente das tabelas.

## ADR-003 — Pipeline dinâmico em banco

**Status:** Accepted  
**Decisão:** Etapas (`PipelineStage`) e transições (`PipelineTransition`) persistidas em tabelas relacionais com chaves estrangeiras, em vez de `enums` estáticos em código.  
**Motivo:** Cada departamento/tipo de atendimento possui esteiras operacionais distintas (ex: suporte TI x admissão RH).  
**Consequência:** Validação obrigatória da máquina de estados no backend em cada transição (`POST /api/tickets/{id}/transitions`).

## ADR-004 — Timeline separada de Audit Log

**Status:** Accepted  
**Decisão:** Separação entre a tabela `ticket_history` (timeline operacional voltada aos usuários) e a tabela de auditoria técnica.  
**Motivo:** Audiências e propósitos diferentes: usuários necessitam de linguagem legível e contextual; conformidade e segurança demandam detalhes de requisição e infraestrutura.

## ADR-005 — Notificações orientadas a eventos

**Status:** Accepted  
**Decisão:** O domínio principal dispara eventos de ciclo de vida do chamado (`TicketCreated`, `TicketAssigned`, `TicketTransitioned`), enquanto listeners e workers de mensageria processam canais de saída.  
**Consequência:** Desacoplamento total entre persistência de regras de negócio e envio de e-mails/webhooks.

## ADR-006 — Banco de Dados Relacional MySQL 8.0

**Status:** Accepted  
**Decisão:** Uso do MySQL 8.0 em execução nativa na porta 3306 com Doctrine ORM.  
**Motivo:** Garantia de integridade referencial ACID, índices compostos multi-coluna por tenant, suporte a UUIDs binários/textuais e timestamps UTC.

## ADR-007 — Multi-tenancy com Banco Compartilhado e Tenant ID

**Status:** Accepted  
**Decisão:** Arquitetura multi-tenant com banco de dados compartilhado, onde cada tabela de domínio contém a coluna `tenant_id` obrigatória e índices compostos.  
**Consequência:** Todas as consultas da API filtram rigorosamente pelo tenant do usuário autenticado no token JWT.

## ADR-008 — Concorrência Otimista (Optimistic Locking)

**Status:** Accepted  
**Decisão:** Coluna `version` gerenciada pelo Doctrine em `Ticket` e verificação de `expectedVersion` em operações de transição, atribuição e priorização.  
**Consequência:** Atualizações simultâneas retornam `409 Conflict`, instruindo o frontend Angular a recarregar o chamado atualizado antes de nova submissão.

## ADR-009 — Arquivar configurações em uso

**Status:** Accepted  
**Decisão:** Configurações vinculadas a chamados existentes (departamentos, tipos, categorias, prioridades) são desativadas (`isActive = false`) e não excluídas fisicamente.  
**Motivo:** Preservação da integridade histórica e relatórios retrospectivos.

## ADR-010 — Sem motor genérico de automação no MVP

**Status:** Accepted  
**Motivo:** Foco nas regras centrais do MVP (abertura, triagem, atendimento, concorrência e transição de esteira), evitando complexidade desnecessária na fase inicial.
