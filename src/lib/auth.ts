import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { Profile } from "@/lib/types"

/**
 * Retorna o usuário autenticado + seu profile (com tenant_id).
 * Redireciona para /login se não houver sessão.
 * Use no topo de Server Components de páginas protegidas.
 */
export async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>()

  return { user, profile, supabase }
}
