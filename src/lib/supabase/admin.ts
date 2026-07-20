import { createClient } from "@supabase/supabase-js"

/**
 * Cliente Supabase com service-role — BYPASSA RLS.
 * USAR APENAS no servidor, em jobs/rotas administrativas que precisam operar
 * sobre todos os tenants (ex.: marcar atrasos, disparos do N8N).
 * NUNCA expor a service role key ao browser.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}
