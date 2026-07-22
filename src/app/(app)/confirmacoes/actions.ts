"use server"

import { revalidatePath } from "next/cache"
import { requireUser } from "@/lib/auth"
import { rolarCicloCore, quitarCicloCore } from "@/lib/ciclos"
import type { Confirmacao } from "@/lib/types"

export type ActionResult = { ok: true } | { ok: false; error: string }

/** Carrega a confirmação (RLS garante o tenant do usuário). */
async function carregar(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  id: string
): Promise<Confirmacao | null> {
  const { data } = await supabase
    .from("confirmacoes")
    .select("*")
    .eq("id", id)
    .single()
  return (data as Confirmacao | null) ?? null
}

function revalidar() {
  revalidatePath("/confirmacoes")
  revalidatePath("/emprestimos")
  revalidatePath("/")
}

async function darBaixa(
  id: string,
  tipo: "rolar" | "quitar"
): Promise<ActionResult> {
  const { profile, supabase } = await requireUser()
  if (!profile) return { ok: false, error: "Perfil não encontrado" }

  const cf = await carregar(supabase, id)
  if (!cf) return { ok: false, error: "Confirmação não encontrada" }
  if (cf.status !== "pendente") {
    return { ok: false, error: "Esta confirmação já foi resolvida." }
  }
  if (!cf.ciclo_id) {
    return {
      ok: false,
      error: "Sem ciclo vinculado. Vincule um ciclo antes de confirmar.",
    }
  }

  const r =
    tipo === "rolar"
      ? await rolarCicloCore(supabase, profile, cf.ciclo_id)
      : await quitarCicloCore(supabase, profile, cf.ciclo_id)
  if (!r.ok) return r

  const { error } = await supabase
    .from("confirmacoes")
    .update({
      status: "confirmado",
      resolvido_por: profile.id,
      resolvido_em: new Date().toISOString(),
    })
    .eq("id", id)
  if (error) {
    return {
      ok: false,
      error: "Baixa feita, mas falhou ao atualizar a confirmação.",
    }
  }

  revalidar()
  return { ok: true }
}

export async function confirmarRolagem(id: string): Promise<ActionResult> {
  return darBaixa(id, "rolar")
}

export async function confirmarQuitacao(id: string): Promise<ActionResult> {
  return darBaixa(id, "quitar")
}

/** Recusa/arquiva a pendência — não mexe no ciclo. */
export async function recusarConfirmacao(id: string): Promise<ActionResult> {
  const { profile, supabase } = await requireUser()
  if (!profile) return { ok: false, error: "Perfil não encontrado" }

  const { error } = await supabase
    .from("confirmacoes")
    .update({
      status: "recusado",
      resolvido_por: profile.id,
      resolvido_em: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "pendente")
  if (error) return { ok: false, error: "Falha ao recusar." }

  revalidar()
  return { ok: true }
}

/** Vincula manualmente um ciclo a uma confirmação sem match automático. */
export async function vincularCiclo(
  id: string,
  cicloId: string
): Promise<ActionResult> {
  const { supabase } = await requireUser()

  const { error } = await supabase
    .from("confirmacoes")
    .update({ ciclo_id: cicloId })
    .eq("id", id)
  if (error) return { ok: false, error: "Falha ao vincular o ciclo." }

  revalidar()
  return { ok: true }
}
