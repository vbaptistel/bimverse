# Bimverse Comercial Platform

Aplicação única em Next.js (Vercel) com Clean Architecture estrita para controle de propostas comerciais da Bimverse.

## Stack

- Next.js 16 + TypeScript + App Router
- Server Components + Server Actions
- Tailwind CSS + componentes estilo shadcn
- Drizzle ORM + PostgreSQL
- Supabase (Auth + Storage)
- Vitest + Playwright

## Princípios aplicados

- Sem API REST pública de domínio.
- Fluxo backend: Server Action -> UseCase -> Port -> Infrastructure.
- Upload de arquivos sempre direto do frontend para Supabase via link/token assinado.
- Dependência entre camadas sempre para dentro (`interface -> application -> domain`).

## Estrutura

```text
src/
  app/
  modules/
    proposals/
    attachments/
    suppliers/
    dashboard/
  composition/
  shared/
```

Cada módulo contém:

```text
<module>/
  domain/
  application/
  infrastructure/
  interface/
```

## Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Opcional para bypass local (sem login real):

- `DEV_BYPASS_USER_ID`
- `DEV_BYPASS_ROLE=admin|comercial`

## Comandos

```bash
npm run dev
npm run lint
npm run typecheck
npm run test:unit
npm run test:e2e
npm run build
```

## Banco e migrations

```bash
npm run db:generate
npm run db:migrate
npm run db:studio
```

## Regras importantes

- Não acessar banco diretamente em Server Actions.
- Não implementar regra de negócio em componentes React.
- Não enviar binário de arquivo para Vercel.
