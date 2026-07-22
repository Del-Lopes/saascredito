-- =============================================================================
-- Migration 0004 — Confirmações de pagamento via WhatsApp
-- =============================================================================
-- Caixa de entrada semi-automática: o N8N recebe a resposta do cliente no
-- WhatsApp, a IA classifica a intenção (rolar/quitar/dúvida) e o app cria uma
-- CONFIRMAÇÃO PENDENTE ligada ao ciclo (pelo telefone). O operador revê na tela
-- "Confirmações" e dá a baixa real com 1 clique. A IA nunca movimenta dinheiro.
-- =============================================================================

create table public.confirmacoes (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  cliente_id    uuid references public.clientes(id) on delete set null,
  ciclo_id      uuid references public.ciclos(id) on delete set null,
  telefone      text,                     -- remetente (E.164) — auditoria/rematch
  mensagem      text not null,            -- texto original do cliente
  intencao      text not null default 'indefinido'
                  check (intencao in ('rolar','quitar','duvida','indefinido')),
  ia_confianca  numeric(4,3),             -- 0..1 (confiança do classificador)
  status        text not null default 'pendente'
                  check (status in ('pendente','confirmado','recusado')),
  resolvido_por uuid references public.profiles(id),
  resolvido_em  timestamptz,
  created_at    timestamptz not null default now()
);
create index confirmacoes_tenant_idx on public.confirmacoes(tenant_id);
create index confirmacoes_status_idx on public.confirmacoes(tenant_id, status);
create index confirmacoes_ciclo_idx on public.confirmacoes(ciclo_id);

-- RLS por tenant (mesma macro das demais tabelas de negócio)
alter table public.confirmacoes enable row level security;
create policy "confirmacoes_tenant_all" on public.confirmacoes
  for all
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

-- -----------------------------------------------------------------------------
-- View: confirmações com dados do cliente e do ciclo (para a tela).
-- security_invoker herda a RLS das tabelas base.
-- -----------------------------------------------------------------------------
create or replace view public.vw_confirmacoes
with (security_invoker = true) as
select
  cf.id,
  cf.tenant_id,
  cf.cliente_id,
  cf.ciclo_id,
  cf.telefone,
  cf.mensagem,
  cf.intencao,
  cf.ia_confianca,
  cf.status,
  cf.resolvido_em,
  cf.created_at,
  c.nome            as cliente_nome,
  ci.emprestimo_id,
  ci.competencia,
  ci.data_vencimento,
  ci.juros_devido,
  ci.valor_quitacao,
  ci.desfecho       as ciclo_desfecho
from public.confirmacoes cf
left join public.clientes c on c.id = cf.cliente_id
left join public.ciclos ci on ci.id = cf.ciclo_id;
