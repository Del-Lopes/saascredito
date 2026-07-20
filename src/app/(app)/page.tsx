import Link from "next/link"
import { requireUser } from "@/lib/auth"
import { getDashboardData } from "@/lib/dashboard"
import { formatBRL } from "@/lib/money"
import { FluxoChart } from "@/components/fluxo-chart"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

function diaLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const diff = Math.round((d.getTime() - hoje.getTime()) / 86400000)
  if (diff === 0) return "hoje"
  if (diff === 1) return "amanhã"
  if (diff > 1) return `em ${diff} dias`
  return `há ${Math.abs(diff)} dias`
}

export default async function DashboardPage() {
  const { supabase } = await requireUser()
  const { kpis, feed, atrasados, fluxo } = await getDashboardData(supabase)

  const kpiCards = [
    { label: "Total emprestado", valor: formatBRL(kpis.totalEmprestadoCents) },
    { label: "A receber (mês)", valor: formatBRL(kpis.aReceberMesCents) },
    { label: "Recebido (mês)", valor: formatBRL(kpis.recebidoMesCents) },
    {
      label: "Inadimplência",
      valor: `${kpis.inadimplenciaPct}%`,
      alerta: kpis.ciclosAtrasados > 0,
    },
  ]

  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Fluxo de caixa e próximos recebimentos.
        </p>
      </header>

      {/* KPIs */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((k) => (
          <Card key={k.label}>
            <CardHeader className="pb-2">
              <CardDescription>{k.label}</CardDescription>
              <CardTitle
                className={`text-2xl tabular-nums ${
                  k.alerta ? "text-destructive" : ""
                }`}
              >
                {k.valor}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Fluxo de caixa */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Fluxo de caixa (juros)</CardTitle>
            <CardDescription>
              Juros a receber por semana — próximas 6 semanas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FluxoChart dados={fluxo} />
          </CardContent>
        </Card>

        {/* Radar de atrasos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Atrasos
              {atrasados.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {atrasados.length}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Fila de cobrança do dia.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {atrasados.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum atraso. 🎉
              </p>
            ) : (
              atrasados.slice(0, 6).map((a) => (
                <Link
                  key={a.id}
                  href={`/emprestimos/${a.emprestimo_id}`}
                  className="flex items-center justify-between rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm hover:bg-destructive/10"
                >
                  <span className="truncate">{a.nome}</span>
                  <span className="ml-2 shrink-0 text-xs text-destructive">
                    {a.dias_atraso}d · {formatBRL(Math.round(Number(a.juros_devido) * 100))}
                  </span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Feed de próximos vencimentos */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Próximos vencimentos</CardTitle>
          <CardDescription>
            O que entra nos próximos 30 dias.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {feed.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum vencimento nos próximos 30 dias.
            </p>
          ) : (
            <ul className="divide-y">
              {feed.slice(0, 12).map((f) => (
                <li key={f.id}>
                  <Link
                    href={`/emprestimos/${f.emprestimo_id}`}
                    className="flex items-center justify-between py-2.5 text-sm hover:bg-muted/40"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{f.nome}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(
                          `${f.data_vencimento}T00:00:00`
                        ).toLocaleDateString("pt-BR")}{" "}
                        · {diaLabel(f.data_vencimento)}
                      </span>
                    </div>
                    <span className="tabular-nums font-medium">
                      {formatBRL(Math.round(Number(f.juros_devido) * 100))}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
