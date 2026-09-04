# SupportFlow — Enterprise Multi-Tenant Help Desk & Service Desk Platform

<div align="center">

---

## 📌 Visão Geral

O **SupportFlow** é um sistema completo de **Help Desk / Service Desk corporativo** desenvolvido para resolver o problema crítico de solicitações internas dispersas (mensagens de WhatsApp, e-mails não monitorados, planilhas avulsas e falta de padronização).

Projetado com arquitetura limpa, separação de responsabilidades e foco em alta performance e segurança corporativa, o sistema permite que empresas configurem departamentos (TI, RH, Financeiro, Facilities, etc.), fluxos de atendimento com máquinas de estado (pipelines), políticas dinâmicas de SLA e permissões granulares por função (RBAC).

---

## ✨ Diferenciais Técnicos

### 🏢 Multi-Tenancy Nativo

- Isolamento estrito de dados por organização (`Tenant`) em nível de banco de dados e repositório.
- Nenhuma consulta ou operação vaza dados entre clientes ou empresas diferentes.

### 🔄 Pipelines Dinâmicos & Máquina de Estados

- Cada departamento possui seus próprios tipos de chamado, categorias e estágios de pipeline (ex: *Aberto* $\to$ *Em Triagem* $\to$ *Em Atendimento* $\to$ *Aguardando Solicitante* $\to$ *Resolvido* $\to$ *Fechado*).
- Validação estrita de transições autorizadas com histórico imutável de movimentação e comentários.

### ⏱️ Motor de SLA com Alvos Dinâmicos

- Regras de prazo para **Primeira Resposta** e **Resolução** calculadas automaticamente com base no departamento, tipo de chamado e prioridade (Baixa, Média, Alta, Crítica).
- Rastreamento em tempo real de conformidade e violação de SLA.

### 🛡️ Segurança de Nível Bancário & Gestão Ativa de Sessões

- **Autenticação Híbrida JWT + Cookies HttpOnly**: Os tokens de acesso e de atualização trafegam através de cookies com flags `HttpOnly`, `SameSite=Lax` e `Secure`, tornando a aplicação imune ao roubo de tokens via vulnerabilidades de XSS (Cross-Site Scripting).
- **Proteção CSRF (Double-Submit Cookie)**: Listener centralizado (`CsrfValidationListener`) valida requisições mutantes (`POST`, `PUT`, `PATCH`, `DELETE`) contra cabeçalhos `X-XSRF-TOKEN`.
- **Rastreamento Ativo de Dispositivos (`UserSession`)**: Cada login gera um registro persistente com identificador único, IP, User-Agent e data de expiração, permitindo ao usuário consultar sessões ativas e revogar acessos remotamente.
- **Revogação Instantânea de Sessões**: Alterações de senha ou bloqueio/desativação de conta invalidam automaticamente todas as sessões ativas do usuário em todos os dispositivos.
- **Auto-Refresh Transparente no Frontend**: Interceptor Angular inteligente intercepta erros `401 Unauthorized`, efetua o refresh do token em segundo plano, enfileira requisições concorrentes sem quebrar chamadas em andamento e redireciona com mensagem amigável caso a sessão expire definitivamente.

### ⚡ Frontend Moderno (Angular 21 + Signals)

- Desenvolvido com **Angular 21** utilizando componentes *Standalone*, injeção de dependência funcional (`inject()`) e reatividade com **Angular Signals** (`signal`, `computed`).
- **Design System próprio em Vanilla CSS**: Interface refinada, leve, rápida e moderna (harmoniosa, responsiva, com suporte a microinterações e skeleton loading), sem dependência de frameworks CSS externos pesados.

---

## 🏛️ Arquitetura do Sistema

O projeto segue os princípios de **Clean Architecture** e **Domain-Driven Design (DDD)** simplificado, garantindo desacoplamento entre regras de negócio, infraestrutura e apresentação.

### Diagrama de Blocos

```mermaid
flowchart TB
    subgraph Frontend["Frontend SPA (Angular 21)"]
        UI[Components & Pages]
        Signals[State Management / Signals]
        AuthSvc[AuthService & Session Tracking]
        Interceptor[AuthInterceptor / Refresh Queue]
        APIClient[ApiService / HttpClient]
        UI --> Signals
        UI --> AuthSvc
        AuthSvc --> APIClient
        APIClient --> Interceptor
    end

    subgraph Backend["API Backend (Symfony 7.4)"]
        Router[Router & Firewall]
        Csrf[CsrfValidationListener]
        Controllers[REST API Controllers]
        DTOs[Request/Response DTOs + Validator]
        Services[Domain & Business Services]
        Repos[Entity Repositories]
        ORM[Doctrine ORM 3.6]
      
        Router --> Csrf
        Csrf --> Controllers
        Controllers --> DTOs
        Controllers --> Services
        Services --> Repos
        Repos --> ORM
    end

    subgraph Storage["Camada de Persistência"]
        DB[(Banco Relacional: MySQL / PostgreSQL / SQLite)]
    end

    Interceptor -- "HTTPS / Cookies HttpOnly + X-XSRF-TOKEN" --> Router
    ORM --> DB
```

### Fluxo de Autenticação Segura & Auto-Refresh

```mermaid
sequenceDiagram
    autonumber
    actor User as Usuário / Browser
    participant App as Angular App (AuthInterceptor)
    participant API as Symfony API (AuthController)
    participant DB as Banco de Dados (UserSession)

    User->>App: Submete credenciais (email/senha)
    App->>API: POST /api/auth/login { email, password }
    API->>DB: Valida credenciais e cria UserSession ativa
    API-->>App: 200 OK (Set-Cookie: ACCESS_TOKEN, REFRESH_TOKEN HttpOnly; XSRF-TOKEN)
    App-->>User: Redireciona para Dashboard

    Note over App,API: Requisições subsequentes autenticadas via Cookie HttpOnly
    App->>API: GET /api/tickets (com cookie HttpOnly)
    API-->>App: 200 OK (Dados de tickets)

    Note over App,API: Token de Acesso expirou (900s)
    App->>API: GET /api/tickets/1
    API-->>App: 401 Unauthorized
    App->>API: POST /api/auth/refresh (solicita novo token em background)
    API->>DB: Valida sessão ativa no banco
    API-->>App: 200 OK (Novo ACCESS_TOKEN renovado)
    App->>API: Re-executa GET /api/tickets/1 com sucesso
    API-->>App: 200 OK (Dados retornados sem deslogar o usuário)
```

---

## 💻 Pré-requisitos

Para executar o projeto localmente, certifique-se de ter instalado em seu ambiente:

| Ferramenta                           | Versão Mínima                                    | Descrição                                                                                                |
| :----------------------------------- | :------------------------------------------------- | :--------------------------------------------------------------------------------------------------------- |
| **PHP**                        | `8.2` ou superior                                | Com as extensões:`pdo_mysql`, `pdo_sqlite`, `openssl`, `mbstring`, `ctype`, `iconv`, `curl` |
| **Composer**                   | `2.2` ou superior                                | Gerenciador de dependências PHP                                                                           |
| **Node.js**                    | `20.x` LTS ou superior                           | Ambiente de execução JavaScript                                                                          |
| **npm**                        | `10.x` ou superior                               | Gerenciador de pacotes Node                                                                                |
| **Banco de Dados**             | `MySQL 8.0+`, `PostgreSQL 14+` ou `SQLite 3` | *Dica: SQLite funciona imediatamente sem instalar nenhum servidor de banco!*                             |
| **Symfony CLI** *(Opcional)* | Mais recente                                       | Utilitário para iniciar o servidor de desenvolvimento da API                                              |

---

## 🚀 Como Executar o Projeto (Passo a Passo)

### 1. Clonar o Repositório

```bash
git clone https://github.com/TavaoBR/helper-desk.git
cd helper-desk
```

---

### 2. Configurar e Iniciar o Backend (API)

Entre na pasta da API:

```bash
cd api
```

Instale as dependências do Symfony via Composer:

```bash
composer install
```

Crie o arquivo de configuração local `.env.local` copiando o modelo de ambiente:

```bash
cp .env.example .env.local
```

> [!TIP]
> **Execução Ultra-Rápida com SQLite (Zero Configuração de Banco)**:
> Se você não quiser configurar um servidor MySQL ou Docker agora, basta definir no `.env.local`:
>
> ```env
> DATABASE_URL="sqlite:///%kernel.project_dir%/var/data.db"
> ```
>
> O banco será criado automaticamente em um arquivo local!

Crie o banco de dados e execute as migrations:

```bash
php bin/console doctrine:database:create --if-not-exists
php bin/console doctrine:migrations:migrate --no-interaction
```

Popule o banco com a massa de dados inicial (tenants, usuários, departamentos, pipelines e SLAs):

```bash
php bin/console app:seed
```

Inicie o servidor de desenvolvimento da API (Porta `8000`):

```bash
# Opção A: Utilizando o Symfony CLI (Recomendado)
symfony server:start --port=8000

# Opção B: Utilizando o servidor embutido do PHP
php -S 127.0.0.1:8000 -t public
```

A API estará respondendo em: **`http://localhost:8000/api`**
*(Healthcheck público disponível em: `http://localhost:8000/api/health`)*

---

### 3. Configurar e Iniciar o Frontend (Aplicação Angular)

Abra outro terminal e acesse o diretório do frontend:

```bash
cd app
```

Instale as dependências Node.js:

```bash
npm install
```

Inicie o servidor de desenvolvimento do Angular:

```bash
npm start
```

Abra o seu navegador e acesse:
👉 **`http://localhost:4200`**

---

## 🔐 Variáveis de Ambiente (Copiar e Colar)

Para configurar o arquivo `api/.env.local`, escolha uma das opções abaixo e cole o conteúdo no arquivo:

### Opção 1: SQLite (Recomendado para Testes e Demonstração Imediata)

Não requer nenhum serviço externo rodando.

```env
# api/.env.local
APP_ENV=dev
APP_SECRET=a8f9c1e7b3424d6298fa7c9012345678
DEFAULT_URI=http://localhost:8000
CORS_ALLOW_ORIGIN='^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$'

# Conexão Mysql local
DATABASE_URL="mysql:///%kernel.project_dir%/var/data.db"

# Configuração de Segurança e Sessão
JWT_SECRET_KEY=%kernel.project_dir%/config/jwt/private.pem
JWT_PUBLIC_KEY=%kernel.project_dir%/config/jwt/public.pem
JWT_PASSPHRASE=supportflow_jwt_secret_passphrase
JWT_ACCESS_TOKEN_TTL=900
JWT_REFRESH_TOKEN_TTL=604800
SESSION_MAX_LIFETIME=604800
COOKIE_SECURE=false
COOKIE_SAMESITE=lax
```

### Opção 2: MySQL Local

```env
# api/.env.local
APP_ENV=dev
APP_SECRET=a8f9c1e7b3424d6298fa7c9012345678
DEFAULT_URI=http://localhost:8000
CORS_ALLOW_ORIGIN='^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$'

# Conexão MySQL (Altere usuário, senha e nome do banco conforme seu ambiente)
DATABASE_URL="mysql://root:root@127.0.0.1:3306/supportflow?charset=utf8mb4"

# Configuração de Segurança e Sessão
JWT_SECRET_KEY=%kernel.project_dir%/config/jwt/private.pem
JWT_PUBLIC_KEY=%kernel.project_dir%/config/jwt/public.pem
JWT_PASSPHRASE=supportflow_jwt_secret_passphrase
JWT_ACCESS_TOKEN_TTL=900
JWT_REFRESH_TOKEN_TTL=604800
SESSION_MAX_LIFETIME=604800
COOKIE_SECURE=false
COOKIE_SAMESITE=lax
```

### Chaves Criptográficas JWT

As chaves públicas e privadas necessárias para assinatura dos tokens já vêm provisionadas em `api/config/jwt/`. Caso queira gerar novos pares de chaves em seu ambiente:

```bash
cd api
php bin/console lexik:jwt:generate-keypair --skip-if-exists
```

---

## 👤 Credenciais de Acesso (Demo / Seed)

O comando `php bin/console app:seed` cria automaticamente a organização modelo **Acme Corporation** com usuários para cada perfil do sistema:

| Perfil / Papel                   | E-mail                          | Senha         | Capacidades & Acessos                                                                                                        |
| :------------------------------- | :------------------------------ | :------------ | :--------------------------------------------------------------------------------------------------------------------------- |
| **Administrador**          | `admin@supportflow.local`     | `secret123` | Acesso completo: Gestão de usuários, catálogo de serviços, políticas de SLA, pipelines, relatórios e métricas gerais. |
| **Atendente (Agente)**     | `atendente@supportflow.local` | `secret123` | Painel operacional: Triagem, assunção de chamados, movimentação de tickets no pipeline, comentários e histórico.       |
| **Solicitante (Usuário)** | `joao@supportflow.local`      | `secret123` | Portal do colaborador: Abertura simplificada de tickets por departamento/categoria e acompanhamento do status.               |

---

## 🧪 Executando os Testes

O projeto conta com **cobertura abrangente de testes automatizados**, garantindo a estabilidade tanto das regras de negócio do backend quanto dos fluxos visuais e reativos do frontend.

### Testes da API (PHPUnit)

Cobre serviços de domínio, validações de integridade, gestão de sessões, segurança e controllers de autenticação:

```bash
cd api
php vendor/bin/phpunit
```

> **Resultado**: `OK (50 tests, 226 assertions)` ✅

### Testes do Frontend (Vitest)

Cobre componentes, interceptors com refresh concorrente, guards de rota, pipes e serviços de estado:

```bash
cd app
npm test -- --watch=false
```

> **Resultado**: `13 passed (13 test files), 224 passed (224 tests)` ✅

---

## 📂 Estrutura do Projeto

```text
helper-desk/
├── api/                             # Backend em Symfony 7.4
│   ├── bin/                         # Binários do Symfony (console)
│   ├── config/                      # Configurações de pacotes, rotas, segurança e JWT
│   │   ├── jwt/                     # Chaves criptográficas RSA (private.pem / public.pem)
│   │   └── packages/                # Configurações do Security, CORS, Doctrine e JWT
│   ├── migrations/                  # Migrações versionadas do banco de dados (Doctrine)
│   ├── src/
│   │   ├── Command/                 # Comandos CLI (ex: SeedDatabaseCommand)
│   │   ├── Controller/              # Controllers REST da API
│   │   ├── DTO/                     # Objetos de transferência de dados (Request / Response)
│   │   ├── Entity/                  # Entidades de domínio mapeadas pelo Doctrine
│   │   ├── EventListener/           # Listeners (ex: CsrfValidationListener, ExceptionListener)
│   │   ├── Repository/              # Repositórios de persistência e consultas isoladas
│   │   └── Service/                 # Regras de negócio (Auth, Session, Token, Tickets, SLA)
│   └── tests/                       # Suíte de testes unitários e de integração (PHPUnit)
│
├── app/                             # Frontend SPA em Angular 21
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/                # Serviços centrais (Auth, Api, Interceptors, Guards, Models)
│   │   │   ├── features/            # Módulos de páginas e fluxos (Auth, Dashboard, Tickets, etc.)
│   │   │   ├── shared/              # Componentes compartilhados (Header, Sidebar, Badges)
│   │   │   └── app.ts               # Componente raiz da aplicação
│   │   ├── environments/            # Configurações de ambiente (URLs de API)
│   │   └── testing/                 # Utilitários, factories e mocks para testes
│   ├── package.json                 # Dependências e scripts npm
│   └── angular.json                 # Configuração do Angular CLI
│
├── docs/                            # Documentação detalhada de arquitetura e decisões (14 guias)
└── README.md                        # Documentação principal do projeto
```

---

## 📚 Documentação Técnica Adicional

Para entender a fundo as decisões de engenharia, contratos de API e modelos de dados, consulte os documentos na pasta [`docs/`](file:///d:/programacao/helper-desk/docs):

- [`01-getting-started.md`](file:///d:/programacao/helper-desk/docs/01-getting-started.md) — Guia de onboarding e setup inicial.
- [`02-backend.md`](file:///d:/programacao/helper-desk/docs/02-backend.md) — Arquitetura de backend, camadas e injeção de dependência.
- [`03-frontend.md`](file:///d:/programacao/helper-desk/docs/03-frontend.md) — Arquitetura frontend Angular, signals e padrões de componentização.
- [`04-system-design.md`](file:///d:/programacao/helper-desk/docs/04-system-design.md) — Desenho do sistema, resiliência e modelo multi-tenant.
- [`05-design-system.md`](file:///d:/programacao/helper-desk/docs/05-design-system.md) — Tokens de design, tipografia, paleta e componentes CSS.
- [`06-database.md`](file:///d:/programacao/helper-desk/docs/06-database.md) & [`07-entities.md`](file:///d:/programacao/helper-desk/docs/07-entities.md) — Modelagem relacional e dicionário de dados.
- [`10-api-contracts.md`](file:///d:/programacao/helper-desk/docs/10-api-contracts.md) — Especificação detalhada dos endpoints REST.
- [`11-security.md`](file:///d:/programacao/helper-desk/docs/11-security.md) & [`12-authentication-and-permissions.md`](file:///d:/programacao/helper-desk/docs/12-authentication-and-permissions.md) — Modelo de segurança, RBAC, cookies e proteção CSRF.
- [`13-architecture-decisions.md`](file:///d:/programacao/helper-desk/docs/13-architecture-decisions.md) — Architecture Decision Records (ADRs).
- [`14-development-standards.md`](file:///d:/programacao/helper-desk/docs/14-development-standards.md) — Padrões de código, linters e boas práticas.

---

<div align="center">
  <sub>Desenvolvido com excelência técnica por Gustavo Fagundes.</sub>
</div>
