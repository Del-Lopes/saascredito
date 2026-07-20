# CRM de Empréstimos — App (Fase 1)

Web app do SaaS de gestão de crédito. Ver o [`../ROADMAP.md`](../ROADMAP.md) para o contexto completo, o modelo de dados e as fases.

**Stack:** Next.js 16 (App Router) · Supabase (Postgres + Auth + RLS) · Tailwind + shadcn/ui (Base UI) · TypeScript · Zod.

## O que a Fase 1 entrega

- Autenticação (login/cadastro por e-mail e senha).
- Cada usuário novo ganha automaticamente um **tenant** próprio (multi-tenant desde o dia 1, via trigger no banco).
- **RLS** ativo em todas as tabelas — isolamento total entre tenants.
- CRUD de **clientes** (com busca e soft delete).
- CRUD de **empréstimos** (modelo rotativo mensal), gerando o 1º ciclo automaticamente.
- Dashboard com KPIs básicos.

## Setup

### 1. Criar o projeto no Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Em **Project Settings → API**, copie: `Project URL`, `anon public key` e `service_role key`.
3. Preencha o `.env.local` (já existe um template):

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ```

### 2. Aplicar as migrations

No **SQL Editor** do Supabase, rode em ordem:

1. `supabase/migrations/0001_init.sql` — tabelas, RLS e o trigger de onboarding.
2. `supabase/migrations/0002_views.sql` — views para dashboard/N8N.

> Ou, se usar a Supabase CLI: `supabase db push`.

### 3. Configurar Auth

Em **Authentication → Providers → Email**, para desenvolvimento local, é
recomendável **desativar "Confirm email"** (senão o cadastro exige confirmação
por e-mail antes do primeiro login).

### 4. Rodar

```bash
npm install
npm run dev
```

Acesse http://localhost:3000 → você será redirecionado para `/login`.
Crie uma conta e comece a cadastrar.

## Estrutura

```
src/
  app/
    login/            # autenticação (fora da área logada)
    (app)/            # área autenticada (layout com sidebar)
      page.tsx        # dashboard (KPIs)
      clientes/       # CRUD de clientes
      emprestimos/    # CRUD de empréstimos
  lib/
    supabase/         # clients browser/server + refresh de sessão
    auth.ts           # requireUser() — guarda de páginas
    finance.ts        # motor financeiro (juros simples, ciclos)
    money.ts          # helpers de dinheiro (centavos, BRL)
    types.ts          # tipos do domínio
  proxy.ts            # antigo "middleware" (Next 16) — protege rotas
supabase/migrations/  # SQL versionado
```

## Convenções (importantes)

- **Dinheiro nunca em `float`** — `numeric` no banco, helpers em `lib/money.ts`.
- **Todo acesso a dados passa por RLS** — as queries usam a sessão do usuário.
- **Soft delete** — clientes/empréstimos são inativados, nunca removidos.
- **Next.js 16**: o arquivo de middleware chama-se `proxy.ts` (runtime nodejs);
  APIs de request (`cookies()`) são assíncronas. Ver `AGENTS.md`.

## Próximo: Fase 2

Motor de ciclos completo (ações **Rolar** / **Quitar**), registro em
`movimentacoes`, marcação de atraso e testes de `lib/finance.ts`.
