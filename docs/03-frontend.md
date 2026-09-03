# 03 — Frontend

> **Status:** baseline técnica criada antes da análise de um repositório executável.
> Itens marcados como **Planejado** são propostas de arquitetura e não devem ser tratados como já implementados.
> Quando o código existir, `composer.json`, `package.json`, migrations, código-fonte, infraestrutura e testes passam a ser a fonte primária de verificação.


## Responsabilidade

O frontend implementa experiência, navegação, estado de tela e consumo de API sem duplicar regras críticas.

## Stack

**Planejado:** Angular + TypeScript.

## Estrutura recomendada

```text
src/app/
├── core/
│   ├── auth/
│   ├── guards/
│   ├── interceptors/
│   └── services/
├── shared/
│   ├── components/
│   ├── directives/
│   ├── pipes/
│   └── models/
├── features/
│   ├── dashboard/
│   ├── tickets/
│   ├── queues/
│   ├── settings/
│   ├── users/
│   └── reports/
└── app.routes.ts
```

Preferir lazy loading por feature.

## Estado

Priorizar Signals/recursos nativos e estado local previsível. Store global apenas para estado realmente compartilhado.

## HTTP

Services de domínio centralizam chamadas:

```text
TicketApiService
- list(filters)
- get(id)
- create(payload)
- update(id, payload)
- assign(id, payload)
- move(id, payload)
- addComment(id, payload)
```

## Interceptors

Planejados:
- auth;
- correlation id, se adotado;
- tratamento técnico de 401;
- headers comuns.

## Autenticação

Frontend pode controlar UX, mas backend sempre valida autorização.

## Rotas planejadas

```text
/login
/dashboard
/tickets
/tickets/new
/tickets/:id
/queues
/settings/departments
/settings/types
/settings/categories
/settings/priorities
/settings/pipelines
```

## Componentes

Exemplos:
- `TicketListPage`;
- `TicketDetailsPage`;
- `TicketForm`;
- `TicketPriorityBadge`;
- `TicketTimeline`;
- `TicketAssignmentPanel`;
- `PipelineBoard`.

## Formulários

Usar Reactive Forms.

Regras:
- validação consistente;
- erro de backend por campo quando possível;
- bloquear duplo submit;
- loading;
- preservar dados após falha.

## Erros

Diferenciar:
- 400/422;
- 401;
- 403;
- 404;
- 409;
- 5xx;
- rede.

## Estados obrigatórios

```text
loading
empty
error
success
forbidden
```

## Responsividade

Tabelas podem virar cards no mobile. Kanban pode usar scroll horizontal.

## Acessibilidade

- label real;
- foco visível;
- teclado;
- contraste;
- não depender apenas de cor.

## Pontos encontrados durante a análise

Nenhum workspace Angular foi localizado; versão, state manager, biblioteca visual e rotas reais ainda não podem ser confirmados.
