# 09 — Implementation Guidelines

> **Status:** baseline técnica criada antes da análise de um repositório executável.
> Itens marcados como **Planejado** são propostas de arquitetura e não devem ser tratados como já implementados.
> Quando o código existir, `composer.json`, `package.json`, migrations, código-fonte, infraestrutura e testes passam a ser a fonte primária de verificação.


## Backend

### Controllers enxutos

Controller não contém regra central.

### Services/Use Cases

Criação, atribuição, transição e fechamento ficam em casos de uso coesos.

### DTOs

Entrada/saída explícitas.

### Validação

- formato: DTO/validator;
- domínio: use case;
- integridade: banco + domínio.

### Persistência

Estratégia consistente de repositories. Multi-tenant sempre escopado.

### Erros

Exceções de domínio mapeadas para códigos estáveis.

### Regra crítica

Nunca depender apenas do frontend para:
- transição;
- prioridade;
- atribuição;
- tenant;
- permission;
- fechamento;
- upload.

## Frontend

### Pages

Orquestram feature e rota.

### Components

Responsabilidade única, inputs/outputs previsíveis.

### Services

HTTP centralizado por domínio.

### Stores

Somente quando estado compartilhado justificar.

### Formulários

- Reactive Forms;
- validação;
- loading;
- anti-duplo-submit;
- erros de API por campo.

### Modais

Padrão reutilizável.

### Mensagens

Toast para feedback transitório. Erro contextual próximo do componente.

### HTTP

Sem URLs espalhadas.

### Responsividade

Obrigatória antes do merge.

## Integridade frontend/backend

Frontend nunca presume que uma transição exibida continua válida até a API confirmar.

## Testes mínimos

- happy path;
- validação;
- 403;
- 404;
- 409;
- isolamento de tenant.

## Pontos encontrados durante a análise

Sem código não foi possível identificar padrões preexistentes. Esta baseline deverá ser adaptada ao primeiro bootstrap.
