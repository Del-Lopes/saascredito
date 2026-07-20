import { createAdminClient } from "@/lib/supabase/admin"

/**
 * GET /api/jobs/filas?tipo=lembrete|cobranca[&dias=3]
 *
 * Retorna a fila de disparos para o N8N.
 * - lembrete: ciclos a vencer em `dias` dias (default 3) sem lembrete enviado
 * - cobranca: ciclos atrasados sem cobrança enviada hoje
 *
 * Protegido por header x-jobs-secret. Service-role (todos os tenants).
 */
export async function GET(request: Request) {
  const secret = request.headers.get("x-jobs-secret")
  if (!process.env.JOBS_SECRET || secret !== process.env.JOBS_SECRET) {
    return Response.json({ error: "Não autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const tipo = searchParams.get("tipo")
  const supabase = createAdminClient()

  if (tipo === "lembrete") {
    const dias = Number(searchParams.get("dias") ?? "3")
    const alvo = new Date()
    alvo.setDate(alvo.getDate() + dias)
    const alvoIso = alvo.toISOString().slice(0, 10)

    const { data, error } = await supabase
      .from("vw_fila_lembretes")
      .select("*")
      .eq("data_vencimento", alvoIso)

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ tipo, dias, itens: data ?? [] })
  }

  if (tipo === "cobranca") {
    const { data, error } = await supabase
      .from("vw_fila_cobrancas")
      .select("*")
      .order("dias_atraso", { ascending: false })

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ tipo, itens: data ?? [] })
  }

  return Response.json(
    { error: "Parâmetro 'tipo' deve ser 'lembrete' ou 'cobranca'." },
    { status: 400 }
  )
}
