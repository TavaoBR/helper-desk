# 11 — Security

> **Status:** baseline técnica criada antes da análise de um repositório executável.
> Itens marcados como **Planejado** são propostas de arquitetura e não devem ser tratados como já implementados.
> Quando o código existir, `composer.json`, `package.json`, migrations, código-fonte, infraestrutura e testes passam a ser a fonte primária de verificação.


## Princípio central

**Nenhuma permissão pode depender apenas de ocultar elementos no frontend.**

Toda autorização é validada no backend.

## Autenticação

Mecanismo exato: **a decidir**.

Requisitos:
- HTTPS;
- expiração;
- revogação quando aplicável;
- credenciais protegidas.

## Autorização

Validar:
1. autenticação;
2. tenant;
3. permission;
4. acesso ao recurso.

## Tenant isolation

Testes obrigatórios:
- A não lista ticket B;
- A não lê ticket B por UUID;
- A não usa configuração B;
- A não atribui usuário/equipe B.

## Input

Validar formato, tamanho, relacionamento e domínio.

## SQL Injection

ORM/query builder parametrizado. Nunca concatenar input.

## XSS

- escapar saída;
- sanitizar HTML rico;
- preferir texto puro no MVP.

## CSRF

Depende da estratégia de autenticação. Cookie exige avaliação explícita de CSRF.

## Rate limiting

Aplicar em:
- login;
- reset;
- upload;
- endpoints públicos futuros.

## Brute force

Rate limit/backoff + logs.

## Token/session

Nunca:
- logar token;
- usar token sem expiração;
- armazenar secrets no frontend além do necessário.

Refresh token: decisão pendente.

## Senhas

- hash robusto do framework;
- não usar criptografia reversível;
- reset de uso único e curto.

## Secrets

- `.env.example` sem segredo;
- secret manager/variáveis em produção;
- rotação.

## Logs/auditoria

Registrar:
- login/falhas relevantes;
- permissões;
- atribuição;
- prioridade;
- transição;
- fechamento;
- configuração crítica.

## Uploads

Validar:
- MIME;
- extensão;
- tamanho;
- nome gerado;
- path traversal;
- autorização;
- scan quando disponível.

## CORS

Somente origens necessárias.

## Headers

Planejar:
- HSTS;
- CSP;
- `X-Content-Type-Options`;
- referrer policy.

## Dependências

CI deve verificar vulnerabilidades.

## Pontos encontrados durante a análise

Auth, CORS, token, upload e headers reais não puderam ser verificados.
