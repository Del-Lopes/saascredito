import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Job idempotente: marca como 'atrasado' todo ciclo 'em_aberto' cujo
 * vencimento já passou. Deve rodar diariamente (Supabase cron ou N8N).
 *
 * Protegido por um secret no header `x-jobs-secret` (env JOBS_SECRET).
 * Usa service-role (bypassa RLS) para varrer todos os tenants.
 */
export async function POST(request: Request) {
  const secret = request.headers.get("x-jobs-secret")
  if (!process.env.JOBS_SECRET || secret !== process.env.JOBS_SECRET) {
    return Response.json({ error: "Não autorizado" }, { status: 401 })
  }

  const supabase = createAdminClient()
  const hoje = new Date().toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from("ciclos")
    .update({ desfecho: "atrasado" })
    .eq("desfecho", "em_aberto")
    .lt("data_vencimento", hoje)
    .select("id")

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ ok: true, marcados: data?.length ?? 0 })
}
