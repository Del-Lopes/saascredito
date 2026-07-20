-- =============================================================================
-- Migration 0003 — Automação (Fase 4): dedup de notificações + view p/ N8N
-- =============================================================================

-- Evita disparo duplicado: no máximo 1 notificação enviada por (ciclo, tipo).
-- (parcial: só conta as com status 'enviado')
create unique index if not exists notificacoes_dedup_idx
  on public.notificacoes (ciclo_id, tipo)
  where status = 'enviado';

-- -----------------------------------------------------------------------------
-- View: fila de LEMBRETES (ciclos a vencer em N dias, sem lembrete enviado)
-- N8N filtra por data_vencimento = hoje + X e dispara.
-- -----------------------------------------------------------------------------
create or replace view public.vw_fila_lembretes
with (security_invoker = true) as
select
  ci.id as ciclo_id,
  ci.tenant_id,
  ci.emprestimo_id,
  ci.data_vencimento,
  ci.juros_devido,
  ci.valor_quitacao,
  e.cliente_id,
  c.nome,
  c.telefone
from public.ciclos ci
join public.emprestimos e on e.id = ci.emprestimo_id
join public.clientes c on c.id = e.cliente_id
where ci.desfecho = 'em_aberto'
  and c.ativo and e.ativo
  and c.telefone is not null
  and not exists (
    select 1 from public.notificacoes n
    where n.ciclo_id = ci.id
      and n.tipo = 'lembrete'
      and n.status = 'enviado'
  );

-- -----------------------------------------------------------------------------
-- View: fila de COBRANÇAS (ciclos atrasados, sem cobrança enviada hoje)
-- -----------------------------------------------------------------------------
create or replace view public.vw_fila_cobrancas
with (security_invoker = true) as
select
  ci.id as ciclo_id,
  ci.tenant_id,
  ci.emprestimo_id,
  ci.data_vencimento,
  ci.juros_devido,
  ci.valor_quitacao,
  (current_date - ci.data_vencimento) as dias_atraso,
  e.cliente_id,
  c.nome,
  c.telefone
from public.ciclos ci
join public.emprestimos e on e.id = ci.emprestimo_id
join public.clientes c on c.id = e.cliente_id
where ci.desfecho = 'atrasado'
  and c.ativo and e.ativo
  and c.telefone is not null
  and not exists (
    select 1 from public.notificacoes n
    where n.ciclo_id = ci.id
      and n.tipo = 'cobranca'
      and n.status = 'enviado'
      and n.enviado_em::date = current_date
  );
