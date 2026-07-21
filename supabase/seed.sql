-- =============================================================================
-- SEED — dados de demonstração para o CRM de Empréstimos
-- =============================================================================
-- Roda no SQL Editor do Supabase. Popula clientes, empréstimos, ciclos e
-- movimentações em vários estados, para o dashboard/feed/radar ficarem cheios.
--
-- Usa automaticamente o PRIMEIRO tenant existente (o seu, criado no signup).
-- Datas são relativas a current_date, então sempre geram dados "atuais".
--
-- É IDEMPOTENTE: apaga os dados de demo anteriores (clientes com nome iniciando
-- em "[DEMO]") antes de recriar. Não toca em dados reais.
-- =============================================================================

do $$
declare
  v_tenant  uuid;
  v_c1 uuid; v_c2 uuid; v_c3 uuid; v_c4 uuid; v_c5 uuid;
  v_e uuid;
  v_ciclo uuid;
begin
  -- 1) tenant alvo
  select id into v_tenant from public.tenants order by created_at limit 1;
  if v_tenant is null then
    raise exception 'Nenhum tenant encontrado. Faça login/cadastro no app primeiro.';
  end if;

  -- 2) limpa demo anterior (cascata remove ciclos/movimentações/empréstimos)
  delete from public.clientes
   where tenant_id = v_tenant and nome like '[DEMO]%';

  -- 3) clientes
  insert into public.clientes (tenant_id, nome, telefone, documento)
  values
    (v_tenant, '[DEMO] Maria Silva',    '+5511991110001', '111.111.111-11'),
    (v_tenant, '[DEMO] João Pereira',   '+5511991110002', '222.222.222-22'),
    (v_tenant, '[DEMO] Ana Costa',      '+5511991110003', '333.333.333-33'),
    (v_tenant, '[DEMO] Carlos Souza',   '+5511991110004', '444.444.444-44'),
    (v_tenant, '[DEMO] Beatriz Lima',   '+5511991110005', '555.555.555-55');

  select id into v_c1 from public.clientes where tenant_id=v_tenant and nome='[DEMO] Maria Silva';
  select id into v_c2 from public.clientes where tenant_id=v_tenant and nome='[DEMO] João Pereira';
  select id into v_c3 from public.clientes where tenant_id=v_tenant and nome='[DEMO] Ana Costa';
  select id into v_c4 from public.clientes where tenant_id=v_tenant and nome='[DEMO] Carlos Souza';
  select id into v_c5 from public.clientes where tenant_id=v_tenant and nome='[DEMO] Beatriz Lima';

  -- ---------------------------------------------------------------------------
  -- Empréstimo 1: Maria — R$ 1.000 @ 10%/mês, vence em ~5 dias (FEED)
  -- ---------------------------------------------------------------------------
  insert into public.emprestimos
    (tenant_id, cliente_id, valor_principal, taxa_juros_mensal, dia_vencimento,
     data_emprestimo, status)
  values
    (v_tenant, v_c1, 1000.00, 0.10, extract(day from current_date + 5)::int,
     current_date - 25, 'ativo')
  returning id into v_e;
  insert into public.ciclos
    (tenant_id, emprestimo_id, competencia, data_vencimento, juros_devido,
     valor_quitacao, desfecho)
  values
    (v_tenant, v_e, 1, current_date + 5, 100.00, 1100.00, 'em_aberto');

  -- ---------------------------------------------------------------------------
  -- Empréstimo 2: João — R$ 5.000 @ 8%/mês, já ROLOU 1x, ciclo 2 em aberto
  -- vence em ~12 dias (FEED). Movimentação de juros registrada.
  -- ---------------------------------------------------------------------------
  insert into public.emprestimos
    (tenant_id, cliente_id, valor_principal, taxa_juros_mensal, dia_vencimento,
     data_emprestimo, status)
  values
    (v_tenant, v_c2, 5000.00, 0.08, extract(day from current_date + 12)::int,
     current_date - 40, 'ativo')
  returning id into v_e;
  -- ciclo 1 já rolado
  insert into public.ciclos
    (tenant_id, emprestimo_id, competencia, data_vencimento, juros_devido,
     valor_quitacao, desfecho, valor_pago, data_pagamento)
  values
    (v_tenant, v_e, 1, current_date - 18, 400.00, 5400.00, 'rolou', 400.00,
     current_date - 18)
  returning id into v_ciclo;
  insert into public.movimentacoes
    (tenant_id, ciclo_id, tipo, valor, data, observacao)
  values
    (v_tenant, v_ciclo, 'juros', 400.00, current_date - 18, 'Rolagem do ciclo 1');
  -- ciclo 2 em aberto
  insert into public.ciclos
    (tenant_id, emprestimo_id, competencia, data_vencimento, juros_devido,
     valor_quitacao, desfecho)
  values
    (v_tenant, v_e, 2, current_date + 12, 400.00, 5400.00, 'em_aberto');

  -- ---------------------------------------------------------------------------
  -- Empréstimo 3: Ana — R$ 2.000 @ 12%/mês, ciclo ATRASADO (RADAR)
  -- venceu há 6 dias e continua em aberto -> marcado como atrasado.
  -- ---------------------------------------------------------------------------
  insert into public.emprestimos
    (tenant_id, cliente_id, valor_principal, taxa_juros_mensal, dia_vencimento,
     data_emprestimo, status)
  values
    (v_tenant, v_c3, 2000.00, 0.12, extract(day from current_date - 6)::int,
     current_date - 36, 'ativo')
  returning id into v_e;
  insert into public.ciclos
    (tenant_id, emprestimo_id, competencia, data_vencimento, juros_devido,
     valor_quitacao, desfecho)
  values
    (v_tenant, v_e, 1, current_date - 6, 240.00, 2240.00, 'atrasado');

  -- ---------------------------------------------------------------------------
  -- Empréstimo 4: Carlos — R$ 3.000 @ 9%/mês, QUITADO (KPI recebido)
  -- ---------------------------------------------------------------------------
  insert into public.emprestimos
    (tenant_id, cliente_id, valor_principal, taxa_juros_mensal, dia_vencimento,
     data_emprestimo, status)
  values
    (v_tenant, v_c4, 3000.00, 0.09, extract(day from current_date - 3)::int,
     current_date - 33, 'quitado')
  returning id into v_e;
  insert into public.ciclos
    (tenant_id, emprestimo_id, competencia, data_vencimento, juros_devido,
     valor_quitacao, desfecho, valor_pago, data_pagamento)
  values
    (v_tenant, v_e, 1, current_date - 3, 270.00, 3270.00, 'quitou', 3270.00,
     current_date - 3)
  returning id into v_ciclo;
  insert into public.movimentacoes
    (tenant_id, ciclo_id, tipo, valor, data, observacao)
  values
    (v_tenant, v_ciclo, 'quitacao', 3270.00, current_date - 3, 'Quitação no ciclo 1');

  -- ---------------------------------------------------------------------------
  -- Empréstimo 5: Beatriz — R$ 800 @ 15%/mês, vence em ~20 dias (FLUXO futuro)
  -- ---------------------------------------------------------------------------
  insert into public.emprestimos
    (tenant_id, cliente_id, valor_principal, taxa_juros_mensal, dia_vencimento,
     data_emprestimo, status)
  values
    (v_tenant, v_c5, 800.00, 0.15, extract(day from current_date + 20)::int,
     current_date - 10, 'ativo')
  returning id into v_e;
  insert into public.ciclos
    (tenant_id, emprestimo_id, competencia, data_vencimento, juros_devido,
     valor_quitacao, desfecho)
  values
    (v_tenant, v_e, 1, current_date + 20, 120.00, 920.00, 'em_aberto');

  raise notice 'Seed concluído para o tenant %', v_tenant;
end $$;
