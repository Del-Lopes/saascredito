-- =============================================================================
-- Migration 0002 — Views de leitura (dashboard + N8N)
-- =============================================================================
-- Views herdam a RLS das tabelas base (security_invoker), então cada tenant
-- só enxerga os próprios registros.
-- =============================================================================

-- Próximos vencimentos ainda em aberto (feed + lembretes do N8N)
create or replace view public.vw_vencimentos_proximos
with (security_invoker = true) as
select
  ci.id,
  ci.tenant_id,
  ci.emprestimo_id,
  ci.competencia,
  ci.data_vencimento,
  ci.juros_devido,
  ci.valor_quitacao,
  e.cliente_id,
  e.valor_principal,
  c.nome,
  c.telefone
from public.ciclos ci
join public.emprestimos e on e.id = ci.emprestimo_id
join public.clientes c on c.id = e.cliente_id
where ci.desfecho = 'em_aberto'
  and c.ativo and e.ativo;

-- Ciclos em atraso (radar de cobrança + cobrança automática do N8N)
create or replace view public.vw_ciclos_atrasados
with (security_invoker = true) as
select
  ci.id,
  ci.tenant_id,
  ci.emprestimo_id,
  ci.competencia,
  ci.data_vencimento,
  ci.juros_devido,
  ci.valor_quitacao,
  e.cliente_id,
  c.nome,
  c.telefone,
  (current_date - ci.data_vencimento) as dias_atraso
from public.ciclos ci
join public.emprestimos e on e.id = ci.emprestimo_id
join public.clientes c on c.id = e.cliente_id
where ci.desfecho = 'atrasado'
  and c.ativo and e.ativo;
