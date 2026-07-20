import { toCents } from "@/lib/money"
import type { SupabaseClient } from "@supabase/supabase-js"

/** Linha das views de vencimento (ciclo + dados do cliente). */
export interface VencimentoRow {
  id: string
  emprestimo_id: string
  competencia: number
  data_vencimento: string
  juros_devido: number
  valor_quitacao: number
  cliente_id: string
  nome: string
  telefone: string | null
  dias_atraso?: number
}

export interface DashboardData {
  kpis: {
    totalEmprestadoCents: number
    aReceberMesCents: number
    recebidoMesCents: number
    ciclosAtrasados: number
    inadimplenciaPct: number
  }
  feed: VencimentoRow[]
  atrasados: VencimentoRow[]
  fluxo: { semana: string; inicio: string; valorCents: number }[]
}

function inicioSemana(d: Date): Date {
  const dia = d.getDay() // 0 dom
  const diff = (dia + 6) % 7 // segunda como início
  const seg = new Date(d)
  seg.setDate(d.getDate() - diff)
  seg.setHours(0, 0, 0, 0)
  return seg
}

function isoDate(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${mm}-${dd}`
}

function labelSemana(d: Date): string {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
}

/**
 * Monta os dados do dashboard. `hoje` é injetável para testes/determinismo.
 * Todas as queries respeitam RLS (usam o client do usuário).
 */
export async function getDashboardData(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  hoje: Date = new Date()
): Promise<DashboardData> {
  const hojeIso = isoDate(hoje)
  const em30 = new Date(hoje)
  em30.setDate(hoje.getDate() + 30)
  const em30Iso = isoDate(em30)

  const primeiroDiaMes = isoDate(
    new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  )
  const ultimoDiaMes = isoDate(
    new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
  )

  const [
    { data: emprestimosAtivos },
    { data: feed },
    { data: atrasados },
    { data: pagosMes },
    { data: aReceberMes },
  ] = await Promise.all([
    // Total emprestado (principal dos empréstimos ativos)
    supabase
      .from("emprestimos")
      .select("valor_principal")
      .eq("status", "ativo")
      .eq("ativo", true),
    // Feed: próximos vencimentos em aberto (30 dias)
    supabase
      .from("vw_vencimentos_proximos")
      .select("*")
      .gte("data_vencimento", hojeIso)
      .lte("data_vencimento", em30Iso)
      .order("data_vencimento", { ascending: true }),
    // Atrasados
    supabase
      .from("vw_ciclos_atrasados")
      .select("*")
      .order("dias_atraso", { ascending: false }),
    // Recebido no mês (movimentações de juros + quitação)
    supabase
      .from("movimentacoes")
      .select("valor")
      .gte("data", primeiroDiaMes)
      .lte("data", ultimoDiaMes)
      .in("tipo", ["juros", "quitacao"]),
    // A receber no mês (ciclos em aberto vencendo neste mês)
    supabase
      .from("vw_vencimentos_proximos")
      .select("juros_devido")
      .gte("data_vencimento", primeiroDiaMes)
      .lte("data_vencimento", ultimoDiaMes),
  ])

  const totalEmprestadoCents =
    emprestimosAtivos?.reduce(
      (a, e) => a + toCents(Number(e.valor_principal)),
      0
    ) ?? 0

  const recebidoMesCents =
    pagosMes?.reduce((a, m) => a + toCents(Number(m.valor)), 0) ?? 0

  const aReceberMesCents =
    aReceberMes?.reduce((a, c) => a + toCents(Number(c.juros_devido)), 0) ?? 0

  const feedRows = (feed ?? []) as VencimentoRow[]
  const atrasadosRows = (atrasados ?? []) as VencimentoRow[]

  // Inadimplência: ciclos atrasados / (atrasados + em aberto no feed) — proxy simples
  const totalCiclosVivos = atrasadosRows.length + feedRows.length
  const inadimplenciaPct =
    totalCiclosVivos > 0
      ? Math.round((atrasadosRows.length / totalCiclosVivos) * 100)
      : 0

  // Fluxo de caixa: soma dos juros a receber por semana, nas próximas ~6 semanas.
  const semanas: { semana: string; inicio: string; valorCents: number }[] = []
  const base = inicioSemana(hoje)
  for (let i = 0; i < 6; i++) {
    const ini = new Date(base)
    ini.setDate(base.getDate() + i * 7)
    const fim = new Date(ini)
    fim.setDate(ini.getDate() + 7)
    const valorCents = feedRows
      .filter((r) => {
        const d = new Date(`${r.data_vencimento}T00:00:00`)
        return d >= ini && d < fim
      })
      .reduce((a, r) => a + toCents(Number(r.juros_devido)), 0)
    semanas.push({ semana: labelSemana(ini), inicio: isoDate(ini), valorCents })
  }

  return {
    kpis: {
      totalEmprestadoCents,
      aReceberMesCents,
      recebidoMesCents,
      ciclosAtrasados: atrasadosRows.length,
      inadimplenciaPct,
    },
    feed: feedRows,
    atrasados: atrasadosRows,
    fluxo: semanas,
  }
}
