-- =============================================================================
-- SEED AMPLIADO — ~30 clientes, ~40 empréstimos ([DEMO2])
-- =============================================================================
-- Popula bastante o app, com GRUPOS de vencimento concentrados nos dias 5, 15 e
-- 26 (picos de caixa visíveis no feed e no gráfico). Maria Silva e Roberto Souza
-- vencem no dia 26, conforme pedido.
--
-- Prefixo [DEMO2] — NÃO mexe nos [DEMO] originais nem nos seus dados reais.
-- Idempotente: apaga os [DEMO2] anteriores antes de recriar (pode rodar de novo).
--
-- Roda no SQL Editor do Supabase.
-- =============================================================================

do $$
declare
  v_tenant uuid;
  v_cli    uuid;
  v_emp    uuid;
  v_ciclo  uuid;
  v_nome   text;
  v_principal numeric;
  v_taxa   numeric;
  v_dia    int;
  v_juros  numeric;
  v_quit   numeric;
  v_estado text;
  v_venc   date;
  i int;

  -- 30 nomes (Maria Silva e Roberto Souza incluídos)
  nomes text[] := array[
    'Maria Silva','Roberto Souza','Ana Costa','Carlos Pereira','Beatriz Lima',
    'Fernando Alves','Juliana Rocha','Marcos Dias','Patrícia Gomes','Rafael Melo',
    'Camila Barbosa','Bruno Cardoso','Larissa Nunes','Tiago Ferreira','Vanessa Ribeiro',
    'Eduardo Martins','Gabriela Pinto','Rodrigo Teixeira','Aline Castro','Felipe Moreira',
    'Renata Azevedo','Gustavo Ramos','Priscila Freitas','Diego Cunha','Natália Correia',
    'Leandro Vieira','Simone Duarte','André Cavalcanti','Bianca Monteiro','Otávio Nogueira'
  ];

  -- dias de vencimento: peso forte nos dias 5, 15 e 26 (grupos concentrados)
  dias_pool int[] := array[26,26,26,26,15,15,15,15,5,5,5,5,10,20,8,12,18,22,28,3];
begin
  -- tenant alvo
  select id into v_tenant from public.tenants order by created_at limit 1;
  if v_tenant is null then
    raise exception 'Nenhum tenant encontrado. Faça login/cadastro no app primeiro.';
  end if;

  -- limpa [DEMO2] anteriores (cascata remove empréstimos/ciclos/movimentações)
  delete from public.clientes
   where tenant_id = v_tenant and nome like '[DEMO2]%';

  -- ---------------------------------------------------------------------------
  -- Cria clientes + 1 a 2 empréstimos cada (total ~40 empréstimos)
  -- ---------------------------------------------------------------------------
  for i in 1 .. array_length(nomes, 1) loop
    insert into public.clientes (tenant_id, nome, telefone, documento)
    values (
      v_tenant,
      '[DEMO2] ' || nomes[i],
      '+5511' || lpad((900000000 + i)::text, 9, '0'),
      lpad((10000000000 + i * 111)::text, 11, '0')
    )
    returning id into v_cli;

    -- Maria Silva (i=1) e Roberto Souza (i=2) => forçar dia 26
    -- demais => escolhe do pool concentrado, variando pelo índice
    if i <= 2 then
      v_dia := 26;
    else
      v_dia := dias_pool[1 + (i * 7) % array_length(dias_pool, 1)];
    end if;

    -- valor e taxa variados (determinístico pelo índice)
    v_principal := (500 + (i % 10) * 350)::numeric;        -- 500 .. 3650
    v_taxa      := (0.05 + (i % 6) * 0.01)::numeric;        -- 5% .. 10%
    v_juros     := round(v_principal * v_taxa, 2);
    v_quit      := round(v_principal + v_juros, 2);

    -- estado do empréstimo/ciclo, rotacionando entre padrões
    v_estado := (array['aberto_futuro','aberto_proximo','atrasado','rolou_aberto','quitado'])
                [1 + (i % 5)];

    -- ===== Empréstimo principal =====
    insert into public.emprestimos
      (tenant_id, cliente_id, valor_principal, taxa_juros_mensal, dia_vencimento,
       data_emprestimo, status)
    values
      (v_tenant, v_cli, v_principal, v_taxa, v_dia,
       current_date - (20 + i), case when v_estado='quitado' then 'quitado' else 'ativo' end)
    returning id into v_emp;

    if v_estado = 'aberto_futuro' then
      -- vence nos próximos ~15-25 dias (fluxo futuro)
      v_venc := current_date + (12 + (i % 14));
      insert into public.ciclos (tenant_id, emprestimo_id, competencia, data_vencimento,
        juros_devido, valor_quitacao, desfecho)
      values (v_tenant, v_emp, 1, v_venc, v_juros, v_quit, 'em_aberto');

    elsif v_estado = 'aberto_proximo' then
      -- vence nos próximos ~2-9 dias (FEED destaque)
      v_venc := current_date + (2 + (i % 8));
      insert into public.ciclos (tenant_id, emprestimo_id, competencia, data_vencimento,
        juros_devido, valor_quitacao, desfecho)
      values (v_tenant, v_emp, 1, v_venc, v_juros, v_quit, 'em_aberto');

    elsif v_estado = 'atrasado' then
      -- venceu há 2-14 dias, em aberto => RADAR
      v_venc := current_date - (2 + (i % 13));
      insert into public.ciclos (tenant_id, emprestimo_id, competencia, data_vencimento,
        juros_devido, valor_quitacao, desfecho)
      values (v_tenant, v_emp, 1, v_venc, v_juros, v_quit, 'atrasado');

    elsif v_estado = 'rolou_aberto' then
      -- ciclo 1 rolado + ciclo 2 em aberto (histórico + feed)
      insert into public.ciclos (tenant_id, emprestimo_id, competencia, data_vencimento,
        juros_devido, valor_quitacao, desfecho, valor_pago, data_pagamento)
      values (v_tenant, v_emp, 1, current_date - (15 + i % 10), v_juros, v_quit,
        'rolou', v_juros, current_date - (15 + i % 10))
      returning id into v_ciclo;
      insert into public.movimentacoes (tenant_id, ciclo_id, tipo, valor, data, observacao)
      values (v_tenant, v_ciclo, 'juros', v_juros, current_date - (15 + i % 10), 'Rolagem do ciclo 1');

      insert into public.ciclos (tenant_id, emprestimo_id, competencia, data_vencimento,
        juros_devido, valor_quitacao, desfecho)
      values (v_tenant, v_emp, 2, current_date + (5 + i % 15), v_juros, v_quit, 'em_aberto');

    else -- quitado
      insert into public.ciclos (tenant_id, emprestimo_id, competencia, data_vencimento,
        juros_devido, valor_quitacao, desfecho, valor_pago, data_pagamento)
      values (v_tenant, v_emp, 1, current_date - (3 + i % 8), v_juros, v_quit,
        'quitou', v_quit, current_date - (3 + i % 8))
      returning id into v_ciclo;
      insert into public.movimentacoes (tenant_id, ciclo_id, tipo, valor, data, observacao)
      values (v_tenant, v_ciclo, 'quitacao', v_quit, current_date - (3 + i % 8), 'Quitação no ciclo 1');
    end if;

    -- ===== Segundo empréstimo (só para ~1/3 dos clientes) => ~40 no total =====
    if i % 3 = 0 then
      v_principal := (800 + (i % 8) * 500)::numeric;
      v_taxa      := (0.06 + (i % 5) * 0.01)::numeric;
      v_juros     := round(v_principal * v_taxa, 2);
      v_quit      := round(v_principal + v_juros, 2);
      -- vencimento também concentrado (dia 5, 15 ou 26)
      v_dia := (array[5,15,26])[1 + (i % 3)];

      insert into public.emprestimos
        (tenant_id, cliente_id, valor_principal, taxa_juros_mensal, dia_vencimento,
         data_emprestimo, status)
      values
        (v_tenant, v_cli, v_principal, v_taxa, v_dia, current_date - (30 + i), 'ativo')
      returning id into v_emp;

      insert into public.ciclos (tenant_id, emprestimo_id, competencia, data_vencimento,
        juros_devido, valor_quitacao, desfecho)
      values (v_tenant, v_emp, 1, current_date + (3 + i % 20), v_juros, v_quit, 'em_aberto');
    end if;
  end loop;

  raise notice 'Seed ampliado concluído para o tenant %', v_tenant;
end $$;
