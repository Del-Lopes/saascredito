import { createAdminClient } from "@/lib/supabase/admin"

/**
 * POST /api/jobs/notificar
 * Body: { ciclo_id, tenant_id, canal, tipo, status, payload? }
 *
 * Registra que uma notificação foi enviada (chamado pelo N8N após o disparo).
 * O índice único (ciclo_id, tipo) where status='enviado' evita duplicidade —
 * se já existir, retornamos ok com duplicado=true.
 *
 * Protegido por header x-jobs-secret. Service-role.
 */
export async function POST(request: Request) {
  const secret = request.headers.get("x-jobs-secret")
  if (!process.env.JOBS_SECRET || secret !== process.env.JOBS_SECRET) {
    return Response.json({ error: "Não autorizado" }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 })
  }

  const { ciclo_id, tenant_id, canal, tipo, status, payload } = body

  if (!ciclo_id || !tenant_id || !canal || !tipo || !status) {
    return Response.json(
      { error: "Campos obrigatórios: ciclo_id, tenant_id, canal, tipo, status" },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from("notificacoes").insert({
    ciclo_id,
    tenant_id,
    canal,
    tipo,
    status,
    payload: payload ?? null,
  })

  if (error) {
    // 23505 = unique_violation (já enviado) -> tratado como idempotente
    if (error.code === "23505") {
      return Response.json({ ok: true, duplicado: true })
    }
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ ok: true, duplicado: false })
}
