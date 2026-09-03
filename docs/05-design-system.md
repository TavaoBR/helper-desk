# 05 — Design System

> **Status:** baseline técnica criada antes da análise de um repositório executável.
> Itens marcados como **Planejado** são propostas de arquitetura e não devem ser tratados como já implementados.
> Quando o código existir, `composer.json`, `package.json`, migrations, código-fonte, infraestrutura e testes passam a ser a fonte primária de verificação.


## Estado

**Não implementado atualmente.**

Esta é uma baseline para evitar fragmentação visual.

## Princípios

- interface corporativa clara;
- alta legibilidade;
- consistência;
- cores semânticas;
- sem estilos isolados por tela;
- reutilização antes de variação.

## Tokens

### Cores

Centralizar:

```text
--color-bg
--color-surface
--color-surface-muted
--color-text
--color-text-muted
--color-border
--color-primary
--color-success
--color-warning
--color-danger
--color-info
```

Valores finais: **a definir após aprovação visual**.

### Tipografia

Uma única família principal, ainda **a definir**.

Escala:

| Token | Uso |
|---|---|
| 12px | metadados |
| 14px | corpo compacto |
| 16px | corpo |
| 18px | subtítulo |
| 20–24px | seção |
| 28–32px | título principal |

Pesos preferenciais: 400, 500, 600, 700.

## Espaçamento

Escala de 4px:

```text
4, 8, 12, 16, 20, 24, 32, 40, 48
```

## Grid/responsividade

- desktop: sidebar + header + conteúdo;
- tablet: sidebar recolhível;
- mobile: navegação compacta e uma coluna.

## Bordas

- border 1px;
- radius base 8px;
- cards 8–12px;
- modal 12px.

## Sombras

Discretas. Preferir borda e contraste de superfície.

## Ícones

Uma única biblioteca. Tamanhos: 16, 20 e 24px.

## Botões

Variantes:
- primary;
- secondary;
- ghost;
- danger.

Estados:
- default;
- hover;
- focus;
- disabled;
- loading.

## Inputs/selects

Obrigatório:
- label;
- ajuda opcional;
- erro;
- foco visível;
- disabled claro.

## Modais

Somente ações focadas. Fluxos longos devem usar página/drawer.

## Dropdowns

- ESC;
- clique fora;
- teclado;
- foco gerenciado.

## Tabelas

- loading;
- empty;
- ações por linha;
- filtros;
- paginação;
- alternativa mobile.

## Cards

Não substituir tabela sem necessidade em desktop.

## Alerts

- info;
- success;
- warning;
- error.

Sempre com texto/ícone, não só cor.

## Badges

Usar para prioridade, status, SLA e disponibilidade.

## Loading

- skeleton para conteúdo;
- spinner em ação;
- progress quando mensurável.

## Empty state

Explicar:
1. o que está vazio;
2. por quê;
3. ação recomendada.

## Regras anti-fragmentação

1. Não criar botão novo se variante existente resolve.
2. Não usar hex diretamente na feature.
3. Espaçamento vem de token.
4. Prioridade usa badge consistente.
5. Loading/error/empty reutilizam componentes.
6. Mudança de token exige revisão transversal.

## Pontos encontrados durante a análise

Paleta, fonte e ícones finais ainda não foram definidos/confirmados.
