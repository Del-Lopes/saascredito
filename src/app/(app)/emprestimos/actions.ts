"use server"

import { revalidatePath } from "next/cache"
import { requireUser } from "@/lib/auth"
import { emprestimoSchema } from "./schema"
import { jurosMensal, valorQuitacao, proximoVencimento } from "@/lib/finance"

export type ActionResult = { ok: true } | { ok: false; error: string }

export async function criarEmprestimo(
  formData: FormData
): Promise<ActionResult> {
  const parsed = emprestimoSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    }
  }

  const { profile, supabase } = await requireUser()
  if (!profile) return { ok: false, error: "Perfil não encontrado" }

  const {
    cliente_id,
    valor_principal,
    taxa_juros_mensal_pct,
    dia_vencimento,
    data_emprestimo,
    observacoes,
  } = parsed.data

  // Taxa vem em % (5) -> fração (0.05)
  const taxa = taxa_juros_mensal_pct / 100

  const { data: emprestimo, error: eErr } = await supabase
    .from("emprestimos")
    .insert({
      tenant_id: profile.tenant_id,
      cliente_id,
      valor_principal,
      taxa_juros_mensal: taxa,
      dia_vencimento,
      data_emprestimo,
      status: "ativo",
      observacoes: observacoes && observacoes.length > 0 ? observacoes : null,
    })
    .select("id")
    .single()

  if (eErr || !emprestimo) {
    return { ok: false, error: "Não foi possível salvar o empréstimo." }
  }

  // Gera o 1º ciclo (competência 1) — vencimento no mês seguinte ao empréstimo.
  const base = new Date(`${data_emprestimo}T00:00:00`)
  const { error: cErr } = await supabase.from("ciclos").insert({
    tenant_id: profile.tenant_id,
    emprestimo_id: emprestimo.id,
    competencia: 1,
    data_vencimento: proximoVencimento(base, dia_vencimento),
    juros_devido: jurosMensal(valor_principal, taxa),
    valor_quitacao: valorQuitacao(valor_principal, taxa),
    desfecho: "em_aberto",
  })

  if (cErr) {
    // Empréstimo criado mas ciclo falhou — sinaliza para revisão manual.
    return {
      ok: false,
      error: "Empréstimo salvo, mas houve erro ao gerar o 1º ciclo.",
    }
  }

  revalidatePath("/emprestimos")
  revalidatePath("/")
  return { ok: true }
}

/** Soft delete (cancela) — nunca remove de fato. */
export async function cancelarEmprestimo(id: string): Promise<ActionResult> {
  const { supabase } = await requireUser()
  const { error } = await supabase
    .from("emprestimos")
    .update({ ativo: false, status: "cancelado" })
    .eq("id", id)

  if (error) return { ok: false, error: "Não foi possível cancelar." }

  revalidatePath("/emprestimos")
  return { ok: true }
}
