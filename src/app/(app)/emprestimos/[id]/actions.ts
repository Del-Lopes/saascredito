"use server"

import { revalidatePath } from "next/cache"
import { requireUser } from "@/lib/auth"
import { construirCiclo } from "@/lib/finance"
import type { Ciclo, Emprestimo } from "@/lib/types"

export type ActionResult = { ok: true } | { ok: false; error: string }

/** Ciclos que ainda aceitam ação (não foram encerrados). */
const ABERTOS = ["em_aberto", "atrasado"]

/**
 * ROLAR (arrolar): cliente paga apenas o juro do mês.
 * - encerra o ciclo atual (desfecho='rolou', valor_pago=juros)
 * - registra movimentação de juros
 * - abre o próximo ciclo (competência+1) com os mesmos valores
 */
export async function rolarCiclo(cicloId: string): Promise<ActionResult> {
  const { profile, supabase } = await requireUser()
  if (!profile) return { ok: false, error: "Perfil não encontrado" }

  // Carrega o ciclo + o empréstimo (para recomputar o próximo vencimento).
  const { data: ciclo } = await supabase
    .from("ciclos")
    .select("*")
    .eq("id", cicloId)
    .single<Ciclo>()

  if (!ciclo) return { ok: false, error: "Ciclo não encontrado" }
  if (!ABERTOS.includes(ciclo.desfecho)) {
    return { ok: false, error: "Este ciclo já foi encerrado." }
  }

  const { data: emprestimo } = await supabase
    .from("emprestimos")
    .select("*")
    .eq("id", ciclo.emprestimo_id)
    .single<Emprestimo>()

  if (!emprestimo) return { ok: false, error: "Empréstimo não encontrado" }

  const hoje = new Date().toISOString().slice(0, 10)

  // 1) Encerra o ciclo atual como "rolou"
  const { error: upErr } = await supabase
    .from("ciclos")
    .update({
      desfecho: "rolou",
      valor_pago: ciclo.juros_devido,
      data_pagamento: hoje,
    })
    .eq("id", ciclo.id)
    .in("desfecho", ABERTOS) // guarda contra corrida/duplo clique
  if (upErr) return { ok: false, error: "Falha ao registrar a rolagem." }

  // 2) Registra a movimentação de juros
  await supabase.from("movimentacoes").insert({
    tenant_id: profile.tenant_id,
    ciclo_id: ciclo.id,
    tipo: "juros",
    valor: ciclo.juros_devido,
    data: hoje,
    registrado_por: profile.id,
    observacao: `Rolagem do ciclo ${ciclo.competencia}`,
  })

  // 3) Cria o próximo ciclo
  const prox = construirCiclo({
    competencia: ciclo.competencia + 1,
    principal: Number(emprestimo.valor_principal),
    taxaMensal: Number(emprestimo.taxa_juros_mensal),
    dataEmprestimo: new Date(`${emprestimo.data_emprestimo}T00:00:00`),
    diaVencimento: emprestimo.dia_vencimento,
  })

  const { error: novoErr } = await supabase.from("ciclos").insert({
    tenant_id: profile.tenant_id,
    emprestimo_id: emprestimo.id,
    competencia: prox.competencia,
    data_vencimento: prox.data_vencimento,
    juros_devido: prox.juros_devido,
    valor_quitacao: prox.valor_quitacao,
    desfecho: "em_aberto",
  })
  if (novoErr) {
    return { ok: false, error: "Rolagem feita, mas falhou ao abrir o próximo ciclo." }
  }

  revalidatePath(`/emprestimos/${emprestimo.id}`)
  revalidatePath("/emprestimos")
  revalidatePath("/")
  return { ok: true }
}

/**
 * QUITAR: cliente paga principal + juro do mês.
 * - encerra o ciclo atual (desfecho='quitou', valor_pago=valor_quitacao)
 * - registra movimentação de quitação
 * - marca o empréstimo como 'quitado' (não gera novo ciclo)
 */
export async function quitarCiclo(cicloId: string): Promise<ActionResult> {
  const { profile, supabase } = await requireUser()
  if (!profile) return { ok: false, error: "Perfil não encontrado" }

  const { data: ciclo } = await supabase
    .from("ciclos")
    .select("*")
    .eq("id", cicloId)
    .single<Ciclo>()

  if (!ciclo) return { ok: false, error: "Ciclo não encontrado" }
  if (!ABERTOS.includes(ciclo.desfecho)) {
    return { ok: false, error: "Este ciclo já foi encerrado." }
  }

  const hoje = new Date().toISOString().slice(0, 10)

  const { error: upErr } = await supabase
    .from("ciclos")
    .update({
      desfecho: "quitou",
      valor_pago: ciclo.valor_quitacao,
      data_pagamento: hoje,
    })
    .eq("id", ciclo.id)
    .in("desfecho", ABERTOS)
  if (upErr) return { ok: false, error: "Falha ao registrar a quitação." }

  await supabase.from("movimentacoes").insert({
    tenant_id: profile.tenant_id,
    ciclo_id: ciclo.id,
    tipo: "quitacao",
    valor: ciclo.valor_quitacao,
    data: hoje,
    registrado_por: profile.id,
    observacao: `Quitação no ciclo ${ciclo.competencia}`,
  })

  const { error: empErr } = await supabase
    .from("emprestimos")
    .update({ status: "quitado" })
    .eq("id", ciclo.emprestimo_id)
  if (empErr) {
    return { ok: false, error: "Quitação registrada, mas falhou ao atualizar o empréstimo." }
  }

  revalidatePath(`/emprestimos/${ciclo.emprestimo_id}`)
  revalidatePath("/emprestimos")
  revalidatePath("/")
  return { ok: true }
}
