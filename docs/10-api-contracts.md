# 10 — API Contracts

> **Status:** baseline técnica criada antes da análise de um repositório executável.
> Itens marcados como **Planejado** são propostas de arquitetura e não devem ser tratados como já implementados.
> Quando o código existir, `composer.json`, `package.json`, migrations, código-fonte, infraestrutura e testes passam a ser a fonte primária de verificação.


> **Todos os endpoints são Planejados.**

Quando o backend existir, este arquivo deve permanecer sincronizado com testes/OpenAPI e ser a fonte de verdade contratual.

## Convenções

Base:

```text
/api
```

Headers:

```http
Authorization: Bearer <token>
Content-Type: application/json
```

Erro:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados inválidos.",
    "details": {}
  }
}
```

Paginação:

```text
?page=1&limit=20
```

## Tickets

### Listar

**Método:** GET  
**Endpoint:** `/api/tickets`  
**Auth:** sim  
**Permission:** `ticket.view` ou equivalente.

Query:
- page;
- limit;
- search;
- departmentId;
- typeId;
- categoryId;
- priorityId;
- stageId;
- assignedUserId;
- assignedTeamId;
- requesterId;
- createdFrom;
- createdTo.

Response:

```json
{
  "items": [
    {
      "id": "uuid",
      "protocol": "HD-000123",
      "title": "Sem acesso ao sistema",
      "priority": {"id": "uuid", "name": "Alta"},
      "stage": {"id": "uuid", "name": "Triagem"},
      "requester": {"id": "uuid", "name": "João"},
      "assignedUser": null,
      "createdAt": "2026-09-03T10:00:00Z"
    }
  ],
  "pagination": {"page": 1, "limit": 20, "total": 1}
}
```

### Criar

**POST** `/api/tickets`  
**Permission:** `ticket.create`

```json
{
  "title": "Sem acesso ao sistema",
  "description": "Não consigo efetuar login.",
  "departmentId": "uuid",
  "typeId": "uuid",
  "categoryId": "uuid",
  "priorityId": "uuid"
}
```

Response: `201`.

Erros: 400, 401, 403, 422.

### Obter

**GET** `/api/tickets/{id}`

Validar tenant e visibilidade.

### Atualizar

**PATCH** `/api/tickets/{id}`

Não usar PATCH genérico para burlar ações de domínio.

### Atribuir

**POST** `/api/tickets/{id}/assignment`

```json
{
  "userId": "uuid",
  "teamId": null,
  "expectedVersion": 4
}
```

Permission: `ticket.assign`.  
Conflito: `409`.

### Mover etapa

**POST** `/api/tickets/{id}/transitions`

```json
{
  "toStageId": "uuid",
  "expectedVersion": 4
}
```

Permission: `ticket.move_pipeline`.

### Alterar prioridade

**POST** `/api/tickets/{id}/priority`

```json
{
  "priorityId": "uuid",
  "expectedVersion": 5
}
```

Permission: `ticket.change_priority`.

## Comentários

```text
GET  /api/tickets/{ticketId}/comments
POST /api/tickets/{ticketId}/comments
```

Request:

```json
{
  "body": "Acesso restabelecido.",
  "visibility": "public"
}
```

Nota interna exige permission adicional.

## Anexos

**POST** `/api/tickets/{ticketId}/attachments`  
`multipart/form-data`.

Validar tamanho, MIME, extensão, nome e autorização.

## Histórico

**GET** `/api/tickets/{ticketId}/history`

Timeline operacional. Audit log técnico deve ser separado.

## Configurações

```text
GET/POST/PATCH/DELETE /api/ticket-settings/departments
GET/POST/PATCH/DELETE /api/ticket-settings/types
GET/POST/PATCH/DELETE /api/ticket-settings/categories
GET/POST/PATCH/DELETE /api/ticket-settings/priorities
GET/POST/PATCH        /api/ticket-settings/pipelines
POST                  /api/ticket-settings/pipelines/{id}/stages
POST                  /api/ticket-settings/pipelines/{id}/transitions
```

DELETE pode representar desativação.

## Filas

**GET** `/api/queues/{id}/tickets`

Ordenação inicial:
1. prioridade por peso;
2. SLA quando existir;
3. tempo de espera;
4. protocolo/id como desempate.

## TicketResponse

```json
{
  "id": "uuid",
  "protocol": "HD-000123",
  "title": "Sem acesso",
  "description": "...",
  "department": {"id": "uuid", "name": "TI"},
  "type": {"id": "uuid", "name": "Acesso"},
  "category": null,
  "priority": {"id": "uuid", "name": "Alta", "weight": 80},
  "pipeline": {"id": "uuid", "name": "Suporte TI"},
  "stage": {"id": "uuid", "name": "Triagem"},
  "assignedUser": null,
  "assignedTeam": null,
  "version": 4,
  "createdAt": "2026-09-03T10:00:00Z",
  "updatedAt": "2026-09-03T10:02:00Z"
}
```

## Regra de compatibilidade

Mudança breaking exige versionamento ou migração coordenada frontend/backend.

## Pontos encontrados durante a análise

Nenhum controller, DTO, OpenAPI ou teste existente pôde ser confrontado. Todos os contratos são propostas.
