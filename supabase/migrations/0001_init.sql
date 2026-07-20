-- =============================================================================
-- Migration 0001 — Schema inicial: CRM de Empréstimos (modelo rotativo mensal)
-- =============================================================================
-- Modelo de negócio: empréstimo rotativo "juros no mês" (juros simples).
-- Todo mês o cliente ou QUITA (principal + juro) ou ROLA (paga só o juro, gera
-- o ciclo do mês seguinte). A tabela `ciclos` é a unidade central.
--
-- Multi-tenant desde o dia 1: toda tabela tem tenant_id + RLS.
-- Dinheiro em numeric(14,2) (nunca float).
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- TENANTS
-- -----------------------------------------------------------------------------
create table public.tenants (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  created_at  timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- PROFILES (espelha auth.users)
-- -----------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  nome        text,
  role        text not null default 'owner' check (role in ('owner','operador')),
  created_at  timestamptz not null default now()
);
create index profiles_tenant_idx on public.profiles(tenant_id);

-- Helper: tenant_id do usuário autenticado (usado nas policies).
-- SECURITY DEFINER evita recursão de RLS ao consultar profiles.
create or replace function public.current_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id from public.profiles where id = auth.uid();
$$;

-- -----------------------------------------------------------------------------
-- CLIENTES
-- -----------------------------------------------------------------------------
create table public.clientes (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  nome        text not null,
  telefone    text,                       -- E.164 p/ WhatsApp, ex: +5511999998888
  documento   text,                       -- CPF/CNPJ
  observacoes text,
  ativo       boolean not null default true,   -- soft delete
  created_at  timestamptz not null default now()
);
create index clientes_tenant_idx on public.clientes(tenant_id);

-- -----------------------------------------------------------------------------
-- EMPRESTIMOS (rotativo mensal)
-- -----------------------------------------------------------------------------
create table public.emprestimos (
  id                 uuid primary key default gen_random_uuid(),
  tenant_id          uuid not null references public.tenants(id) on delete cascade,
  cliente_id         uuid not null references public.clientes(id) on delete restrict,
  valor_principal    numeric(14,2) not null check (valor_principal > 0),
  taxa_juros_mensal  numeric(6,4) not null check (taxa_juros_mensal >= 0), -- 0.05 = 5%/mês
  dia_vencimento     int not null check (dia_vencimento between 1 and 31),
  data_emprestimo    date not null,
  status             text not null default 'ativo' check (status in ('ativo','quitado','cancelado')),
  observacoes        text,
  ativo              boolean not null default true,
  created_at         timestamptz not null default now()
);
create index emprestimos_tenant_idx on public.emprestimos(tenant_id);
create index emprestimos_cliente_idx on public.emprestimos(cliente_id);

-- -----------------------------------------------------------------------------
-- CICLOS (★ unidade central: um mês de vida do empréstimo)
-- -----------------------------------------------------------------------------
create table public.ciclos (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references public.tenants(id) on delete cascade,
  emprestimo_id    uuid not null references public.emprestimos(id) on delete cascade,
  competencia      int not null,                 -- 1, 2, 3...
  data_vencimento  date not null,
  juros_devido     numeric(14,2) not null,       -- = principal * taxa (constante)
  valor_quitacao   numeric(14,2) not null,       -- = principal + juros_devido
  desfecho         text not null default 'em_aberto'
                     check (desfecho in ('em_aberto','rolou','quitou','atrasado','cancelado')),
  valor_pago       numeric(14,2) not null default 0,
  data_pagamento   date,
  created_at       timestamptz not null default now(),
  unique (emprestimo_id, competencia)
);
create index ciclos_tenant_idx on public.ciclos(tenant_id);
create index ciclos_emprestimo_idx on public.ciclos(emprestimo_id);
create index ciclos_venc_idx on public.ciclos(data_vencimento);

-- -----------------------------------------------------------------------------
-- MOVIMENTACOES (histórico auditável — imutável)
-- -----------------------------------------------------------------------------
create table public.movimentacoes (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  ciclo_id        uuid not null references public.ciclos(id) on delete cascade,
  tipo            text not null check (tipo in ('juros','quitacao','ajuste','estorno')),
  valor           numeric(14,2) not null,
  data            date not null,
  registrado_por  uuid references public.profiles(id),
  observacao      text,
  created_at      timestamptz not null default now()
);
create index movimentacoes_tenant_idx on public.movimentacoes(tenant_id);
create index movimentacoes_ciclo_idx on public.movimentacoes(ciclo_id);

-- -----------------------------------------------------------------------------
-- NOTIFICACOES (registro do que o N8N enviou — Fase 4)
-- -----------------------------------------------------------------------------
create table public.notificacoes (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  ciclo_id    uuid not null references public.ciclos(id) on delete cascade,
  canal       text not null check (canal in ('whatsapp','email')),
  tipo        text not null check (tipo in ('lembrete','cobranca','confirmacao')),
  status      text not null check (status in ('enviado','falhou')),
  enviado_em  timestamptz not null default now(),
  payload     jsonb
);
create index notificacoes_tenant_idx on public.notificacoes(tenant_id);

-- =============================================================================
-- RLS — Row-Level Security (isolamento por tenant)
-- =============================================================================
alter table public.tenants       enable row level security;
alter table public.profiles      enable row level security;
alter table public.clientes      enable row level security;
alter table public.emprestimos   enable row level security;
alter table public.ciclos        enable row level security;
alter table public.movimentacoes enable row level security;
alter table public.notificacoes  enable row level security;

-- profiles: usuário vê/edita apenas o próprio perfil
create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid());
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());

-- tenants: usuário vê apenas o próprio tenant
create policy "tenants_select_own" on public.tenants
  for select using (id = public.current_tenant_id());

-- Tabelas de negócio: acesso total restrito ao tenant do usuário.
-- (Macro repetida para cada tabela: select/insert/update/delete por tenant_id.)
create policy "clientes_tenant_all" on public.clientes
  for all
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy "emprestimos_tenant_all" on public.emprestimos
  for all
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy "ciclos_tenant_all" on public.ciclos
  for all
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy "movimentacoes_tenant_all" on public.movimentacoes
  for all
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy "notificacoes_tenant_all" on public.notificacoes
  for all
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

-- =============================================================================
-- Onboarding automático: ao criar um usuário no Auth, cria tenant + profile.
-- =============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_tenant_id uuid;
begin
  insert into public.tenants (nome)
  values (coalesce(new.raw_user_meta_data->>'nome', 'Minha Operação'))
  returning id into new_tenant_id;

  insert into public.profiles (id, tenant_id, nome, role)
  values (
    new.id,
    new_tenant_id,
    coalesce(new.raw_user_meta_data->>'nome', new.email),
    'owner'
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
