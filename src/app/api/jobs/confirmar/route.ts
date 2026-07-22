import { createAdminClient } from "@/lib/supabase/admin"
import { classificarIntencao, soDigitos } from "@/lib/groq"

/**
 * POST /api/jobs/confirmar
 * Body: { telefone, mensagem }
 *
 * Recebe (via N8N) a resposta do cliente no WhatsApp, classifica a intenção
 * com a IA (Groq) e cria uma CONFIRMAÇÃO PENDENTE ligada ao ciclo em aberto do
 * cliente (encontrado pelo telefone). NÃO dá baixa — só o operador confirma na
 * tela, com 1 clique. Protegido por x-jobs-secret. Service-role (cross-tenant).
 */
export async function POST(request: Request) {
  const secret = request.headers.get("x-jobs-secret")
  if (!process.env.JOBS_SECRET || secret !== process.env.JOBS_SECRET) {
    return Response.json({ error: "Não autorizado" }, { status: 401 })
  }

  let body: { telefone?: string; mensagem?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 })
  }

  const telefone = (body.telefone ?? "").trim()
  const mensagem = (body.mensagem ?? "").trim()
  if (!telefone || !mensagem) {
    return Response.json(
      { error: "Campos obrigatórios: telefone, mensagem" },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  // 1) Classifica a intenção (IA com fallback por palavra-chave).
  const { intencao, confianca } = await classificarIntencao(mensagem)

  // 2) Acha o cliente por telefone (comparando só dígitos) e o ciclo aberto.
  const digitos = soDigitos(telefone)
  let clienteId: string | null = null
  let tenantId: string | null = null
  let cicloId: string | null = null

  if (digitos) {
    // Busca clientes ativos cujo telefone bate (dígitos contidos).
    const { data: clientes } = await supabase
      .from("clientes")
      .select("id, tenant_id, telefone")
      .eq("ativo", true)

    const cliente = (clientes ?? []).find(
      (c) => soDigitos(c.telefone).endsWith(digitos) || digitos.endsWith(soDigitos(c.telefone))
    )

    if (cliente) {
      clienteId = cliente.id
      tenantId = cliente.tenant_id

      // ciclo em aberto/atrasado mais recente desse cliente
      const { data: ciclos } = await supabase
        .from("ciclos")
        .select("id, data_vencimento, emprestimos!inner(cliente_id)")
        .eq("emprestimos.cliente_id", cliente.id)
        .in("desfecho", ["em_aberto", "atrasado"])
        .order("data_vencimento", { ascending: false })
        .limit(1)

      cicloId = ciclos?.[0]?.id ?? null
    }
  }

  // Sem tenant não dá para gravar (RLS/consistência). Se não achou o cliente,
  // não temos como saber o tenant — respondemos 200 informando não-match, mas
  // sem criar registro órfão.
  if (!tenantId) {
    return Response.json({
      ok: true,
      matched: false,
      intencao,
      confianca,
      aviso: "Cliente não encontrado pelo telefone — nenhuma pendência criada.",
    })
  }

  // 3) Cria a confirmação pendente.
  const { error } = await supabase.from("confirmacoes").insert({
    tenant_id: tenantId,
    cliente_id: clienteId,
    ciclo_id: cicloId,
    telefone,
    mensagem,
    intencao,
    ia_confianca: confianca,
    status: "pendente",
  })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({
    ok: true,
    matched: Boolean(cicloId),
    intencao,
    confianca,
  })
}
