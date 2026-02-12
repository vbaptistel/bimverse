# Bimverse Comercial

Plataforma web para gestão do pipeline comercial da Bimverse, com foco em propostas, revisões, fornecedores e anexos.

## Visão geral

A aplicação centraliza o fluxo comercial em uma única interface:

- dashboard com indicadores de propostas e conversão;
- cadastro e gestão de clientes;
- cadastro e gestão de fornecedores;
- criação e acompanhamento de propostas por status;
- ciclo de revisões com histórico;
- upload e download de anexos via Supabase Storage.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Server Components + Server Actions
- Tailwind CSS 4 + componentes baseados em shadcn/base-ui
- Drizzle ORM + PostgreSQL
- Supabase (Auth + Storage)
- Vitest (unitário) + Playwright (E2E)

## Arquitetura

Projeto organizado em módulos com separação por camadas:

- `domain`: regras de negócio e entidades
- `application`: casos de uso e portas
- `infrastructure`: implementações de persistência/integrações
- `interface`: actions, schemas e presenters para UI

Fluxo padrão do backend:

`Server Action -> Use Case -> Port -> Infrastructure`

Princípios adotados:

- sem API REST pública de domínio;
- regras de negócio fora de componentes React;
- dependências sempre apontando para dentro (`interface -> application -> domain`).

## Estrutura do projeto

```text
src/
  app/                # rotas e layouts do Next.js
  components/         # componentes de UI e páginas
  composition/        # composição de dependências por módulo
  modules/
    attachments/
    customers/
    dashboard/
    proposals/
    suppliers/
  shared/             # utilitários e infraestrutura compartilhada
drizzle/              # migrations SQL
tests/e2e/            # testes Playwright
```

## Pré-requisitos

- Node.js 20+
- npm 10+
- PostgreSQL disponível (local ou remoto)
- projeto Supabase com Auth e Storage configurados

## Configuração local

1. Instale dependências:

   ```bash
   npm install
   ```

2. Crie o arquivo de ambiente:

   ```bash
   cp .env.example .env.local
   ```

3. Preencha as variáveis obrigatórias no `.env.local`.

4. Aplique migrations no banco:

   ```bash
   npm run db:migrate
   ```

5. Suba a aplicação:

   ```bash
   npm run dev
   ```

6. Acesse: `http://localhost:3000`

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `DATABASE_URL` | Sim | String de conexão PostgreSQL usada pelo Drizzle. |
| `NEXT_PUBLIC_SUPABASE_URL` | Sim | URL do projeto Supabase. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sim | Chave pública (anon) do Supabase. |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim | Chave service role para operações de backend/storage. |
| `NEXT_PUBLIC_APP_URL` | Não | URL base da aplicação (default: `http://localhost:3000`). |
| `DEV_BYPASS_USER_ID` | Não | ID fixo para contexto de usuário em desenvolvimento. |
| `DEV_BYPASS_ROLE` | Não | Papel do bypass (`admin` ou `comercial`). |

Observação: quando `DEV_BYPASS_USER_ID` e `DEV_BYPASS_ROLE` estão definidos com valores válidos, o bypass também libera as rotas protegidas no `proxy.ts` para desenvolvimento/E2E local.

## Scripts

| Comando | Uso |
| --- | --- |
| `npm run dev` | Ambiente de desenvolvimento com Turbopack. |
| `npm run build` | Build de produção. |
| `npm run start` | Sobe build de produção. |
| `npm run lint` | Verificação de lint. |
| `npm run lint:fix` | Corrige problemas de lint automaticamente. |
| `npm run typecheck` | Checagem de tipos TypeScript. |
| `npm run test` | Atalho para `test:unit`. |
| `npm run test:unit` | Testes unitários com Vitest. |
| `npm run test:watch` | Testes unitários em modo watch. |
| `npm run test:coverage` | Testes unitários com cobertura. |
| `npm run test:e2e` | Testes E2E com Playwright. |
| `npm run db:generate` | Gera migration com Drizzle Kit. |
| `npm run db:migrate` | Executa migrations pendentes. |
| `npm run db:studio` | Abre Drizzle Studio. |

## Rotas principais

- `/dashboard`
- `/clientes`
- `/propostas`
- `/propostas/[id]`
- `/fornecedores`
- `/admin/usuarios`
- `/login`

## Banco de dados

Schema central em `src/shared/infrastructure/db/schema.ts`, incluindo:

- perfis (`profiles`)
- clientes (`customers`)
- propostas e revisões (`proposals`, `proposal_revisions`)
- fornecedores (`suppliers`, `proposal_suppliers`)
- anexos (`attachments`)
- log de atividade (`activity_log`)

As migrations versionadas ficam em `drizzle/`.

## Testes e qualidade

- testes unitários em `src/**/*.test.ts`;
- cobertura mínima configurada no Vitest:
  - 80% statements/lines/functions
  - 60% branches
- testes E2E em `tests/e2e/`, com execução desktop e mobile no Chromium.

### Segurança E2E

- `playwright.config.ts` injeta `DEV_BYPASS_*` no servidor E2E para evitar criação de usuários reais.
- `tests/e2e/global-setup.ts` bloqueia execução quando `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL` ou `NEXT_PUBLIC_APP_URL` apontam para hosts não locais.
- Para liberar execução remota de forma explícita (por sua conta), use `E2E_ALLOW_REMOTE_ENV=1`.
