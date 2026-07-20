import { createBrowserClient } from "@supabase/ssr"

/**
 * Cliente Supabase para uso em Client Components (browser).
 * Usa a anon key pública + a sessão do usuário logado (respeitando RLS).
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
