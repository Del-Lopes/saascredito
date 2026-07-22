"use server"

import { revalidatePath } from "next/cache"
import { requireUser } from "@/lib/auth"
import { rolarCicloCore, quitarCicloCore } from "@/lib/ciclos"

export type ActionResult = { ok: true } | { ok: false; error: string }

/**
 * ROLAR (arrolar): cliente paga apenas o juro do mês.
 * Wrapper fino sobre rolarCicloCore (lógica compartilhada com Confirmações).
 */
export async function rolarCiclo(cicloId: string): Promise<ActionResult> {
  const { profile, supabase } = await requireUser()
  if (!profile) return { ok: false, error: "Perfil não encontrado" }

  const r = await rolarCicloCore(supabase, profile, cicloId)
  if (!r.ok) return r

  revalidatePath(`/emprestimos/${r.emprestimoId}`)
  revalidatePath("/emprestimos")
  revalidatePath("/")
  return { ok: true }
}

/**
 * QUITAR: cliente paga principal + juro do mês.
 * Wrapper fino sobre quitarCicloCore.
 */
export async function quitarCiclo(cicloId: string): Promise<ActionResult> {
  const { profile, supabase } = await requireUser()
  if (!profile) return { ok: false, error: "Perfil não encontrado" }

  const r = await quitarCicloCore(supabase, profile, cicloId)
  if (!r.ok) return r

  revalidatePath(`/emprestimos/${r.emprestimoId}`)
  revalidatePath("/emprestimos")
  revalidatePath("/")
  return { ok: true }
}
