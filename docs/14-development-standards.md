# 14 — Development Standards

> **Status:** baseline técnica criada antes da análise de um repositório executável.
> Itens marcados como **Planejado** são propostas de arquitetura e não devem ser tratados como já implementados.
> Quando o código existir, `composer.json`, `package.json`, migrations, código-fonte, infraestrutura e testes passam a ser a fonte primária de verificação.


## Nomenclatura

### Backend

- classes: `PascalCase`;
- métodos/variáveis: `camelCase`;
- tabelas/colunas: `snake_case`;
- DTO: sufixos `Request`/`Response`.

### Frontend

Seguir Angular CLI/convenção única. Não usar abreviações ambíguas.

## Organização

Feature mantém próximos:
- page;
- components;
- service;
- models;
- tests.

Evitar `utils` gigante.

## Branches

Proposta:

```text
main
develop (opcional)
feature/<descricao>
fix/<descricao>
chore/<descricao>
docs/<descricao>
```

Escolher estratégia e registrar.

## Commits

Conventional Commits recomendado:

```text
feat: add ticket assignment
fix: prevent cross-tenant ticket access
docs: document pipeline transitions
test: cover optimistic locking
refactor: extract transition policy
```

## Pull Requests

Deve conter:
- objetivo;
- contexto;
- mudanças;
- screenshots em UI;
- migrations;
- riscos;
- testes;
- checklist tenant/security.

## Erros

Códigos de domínio estáveis. Não expor exceptions internas.

## Logs

Estruturados, sem secrets, com correlation id quando adotado.

## Testes backend

Obrigatórios:
- permission;
- tenant;
- transition;
- assignment;
- configuração;
- concorrência;
- validação.

## Testes frontend

- componentes com regra;
- formulários;
- guards/services;
- erro/loading;
- fluxos críticos.

## Código limpo

Priorizar:
- legibilidade;
- simplicidade;
- testabilidade;
- baixo acoplamento;
- previsibilidade;
- reutilização sensata.

## Documentação

Atualizar na mesma PR quando mudar:
- endpoint;
- entidade;
- permission;
- migration;
- fluxo;
- ADR;
- env.

## Segurança no review

Verificar:
- tenant scope;
- permission;
- mass assignment;
- upload;
- dados sensíveis;
- logs;
- concorrência.

## Definition of Done

Feature pronta quando:
- funciona;
- testes passam;
- backend autoriza;
- tenant protegido;
- loading/error/empty tratados;
- responsiva;
- docs atualizadas;
- sem secrets;
- migration revisada.

## Pontos encontrados durante a análise

Git, CI, lint, formatter e estratégia de branches reais ainda não puderam ser verificados.
