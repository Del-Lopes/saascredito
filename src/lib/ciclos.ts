import { construirCiclo } from "@/lib/finance"
import type { Ciclo, Emprestimo, Profile } from "@/lib/types"
import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Núcleo da baixa de ciclos (rolar/quitar), compartilhado entre o detalhe do
 * empréstimo e a tela de Confirmações. Recebe o `supabase` autenticado e o
 * `profile` já resolvidos (o contexto de auth/RLS é responsabilidade de quem
 * chama). Retorna um resultado simples — o wrapper (server action) cuida do
 * revalidatePath e do formato de UI.
 */

export type ResultadoCiclo =
  | { ok: true; emprestimoId: string }
  | { ok: false; error: string }

/** Ciclos que ainda aceitam ação (não foram encerrados). */
export const CICLOS_ABERTOS = ["em_aberto", "atrasado"]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DB = SupabaseClient<any, any, any>

/**
 * ROLAR: cliente paga só o juro. Encerra o ciclo (desfecho='rolou'),
 * grava movimentação de juros e abre o próximo ciclo (competência+1).
 */
export async function rolarCicloCore(
  supabase: DB,
  profile: Profile,
  cicloId: string
): Promise<ResultadoCiclo> {
  const { data: ciclo } = await supabase
    .from("ciclos")
    .select("*")
    .eq("id", cicloId)
    .single<Ciclo>()

  if (!ciclo) return { ok: false, error: "Ciclo não encontrado" }
  if (!CICLOS_ABERTOS.includes(ciclo.desfecho)) {
    return { ok: false, error: "Este ciclo já foi encerrado." }
  }

  const { data: emprestimo } = await supabase
    .from("emprestimos")
    .select("*")
    .eq("id", ciclo.emprestimo_id)
    .single<Emprestimo>()

  if (!emprestimo) return { ok: false, error: "Empréstimo não encontrado" }

  const hoje = new Date().toISOString().slice(0, 10)

  const { error: upErr } = await supabase
    .from("ciclos")
    .update({
      desfecho: "rolou",
      valor_pago: ciclo.juros_devido,
      data_pagamento: hoje,
    })
    .eq("id", ciclo.id)
    .in("desfecho", CICLOS_ABERTOS) // guarda contra corrida/duplo clique
  if (upErr) return { ok: false, error: "Falha ao registrar a rolagem." }

  await supabase.from("movimentacoes").insert({
    tenant_id: profile.tenant_id,
    ciclo_id: ciclo.id,
    tipo: "juros",
    valor: ciclo.juros_devido,
    data: hoje,
    registrado_por: profile.id,
    observacao: `Rolagem do ciclo ${ciclo.competencia}`,
  })

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

  return { ok: true, emprestimoId: emprestimo.id }
}

/**
 * QUITAR: cliente paga principal + juro. Encerra o ciclo (desfecho='quitou'),
 * grava movimentação de quitação e marca o empréstimo como 'quitado'.
 */
export async function quitarCicloCore(
  supabase: DB,
  profile: Profile,
  cicloId: string
): Promise<ResultadoCiclo> {
  const { data: ciclo } = await supabase
    .from("ciclos")
    .select("*")
    .eq("id", cicloId)
    .single<Ciclo>()

  if (!ciclo) return { ok: false, error: "Ciclo não encontrado" }
  if (!CICLOS_ABERTOS.includes(ciclo.desfecho)) {
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
    .in("desfecho", CICLOS_ABERTOS)
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

  return { ok: true, emprestimoId: ciclo.emprestimo_id }
}
