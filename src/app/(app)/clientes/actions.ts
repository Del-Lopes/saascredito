"use server"

import { revalidatePath } from "next/cache"
import { requireUser } from "@/lib/auth"
import { clienteSchema } from "./schema"

export type ActionResult = { ok: true } | { ok: false; error: string }

function emptyToNull(v: string | undefined): string | null {
  return v && v.length > 0 ? v : null
}

export async function criarCliente(formData: FormData): Promise<ActionResult> {
  const parsed = clienteSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" }
  }

  const { profile, supabase } = await requireUser()
  if (!profile) return { ok: false, error: "Perfil não encontrado" }

  const { error } = await supabase.from("clientes").insert({
    tenant_id: profile.tenant_id,
    nome: parsed.data.nome,
    telefone: emptyToNull(parsed.data.telefone),
    documento: emptyToNull(parsed.data.documento),
    observacoes: emptyToNull(parsed.data.observacoes),
  })

  if (error) return { ok: false, error: "Não foi possível salvar o cliente." }

  revalidatePath("/clientes")
  return { ok: true }
}

export async function atualizarCliente(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const parsed = clienteSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" }
  }

  const { supabase } = await requireUser()

  const { error } = await supabase
    .from("clientes")
    .update({
      nome: parsed.data.nome,
      telefone: emptyToNull(parsed.data.telefone),
      documento: emptyToNull(parsed.data.documento),
      observacoes: emptyToNull(parsed.data.observacoes),
    })
    .eq("id", id)

  if (error) return { ok: false, error: "Não foi possível atualizar o cliente." }

  revalidatePath("/clientes")
  return { ok: true }
}

/** Soft delete — nunca remove de fato. */
export async function inativarCliente(id: string): Promise<ActionResult> {
  const { supabase } = await requireUser()
  const { error } = await supabase
    .from("clientes")
    .update({ ativo: false })
    .eq("id", id)

  if (error) return { ok: false, error: "Não foi possível inativar o cliente." }

  revalidatePath("/clientes")
  return { ok: true }
}
