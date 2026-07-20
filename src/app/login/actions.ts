"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export type AuthState = { error: string } | null

export async function login(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "")
  const password = String(formData.get("password") ?? "")

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: "E-mail ou senha inválidos." }
  }

  revalidatePath("/", "layout")
  redirect("/")
}

export async function signup(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const nome = String(formData.get("nome") ?? "")
  const email = String(formData.get("email") ?? "")
  const password = String(formData.get("password") ?? "")

  if (password.length < 6) {
    return { error: "A senha deve ter ao menos 6 caracteres." }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nome } },
  })

  if (error) {
    return { error: "Não foi possível criar a conta. Verifique os dados." }
  }

  revalidatePath("/", "layout")
  redirect("/")
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath("/", "layout")
  redirect("/login")
}
