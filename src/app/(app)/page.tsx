import Link from "next/link"
import {
  Wallet,
  TrendingUp,
  BanknoteArrowUp,
  CircleAlert,
} from "lucide-react"
import { requireUser } from "@/lib/auth"
import { getDashboardData } from "@/lib/dashboard"
import { formatBRL } from "@/lib/money"
import { FluxoChart } from "@/components/fluxo-chart"
import { StatCard } from "@/components/stat-card"
import { PageHeader } from "@/components/page-header"
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

function dataCurta(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  })
}

export default async function DashboardPage() {
  const { supabase } = await requireUser()
  const { kpis, feed, atrasados, fluxo } = await getDashboardData(supabase)

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="Dashboard"
        description="Fluxo de caixa e próximos recebimentos."
      />

      {/* KPIs */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total emprestado"
          value={formatBRL(kpis.totalEmprestadoCents)}
          icon={Wallet}
        />
        <StatCard
          label="A receber no mês"
          value={formatBRL(kpis.aReceberMesCents)}
          icon={TrendingUp}
        />
        <StatCard
          label="Recebido no mês"
          value={formatBRL(kpis.recebidoMesCents)}
          icon={BanknoteArrowUp}
          tone="success"
        />
        <StatCard
          label="Inadimplência"
          value={`${kpis.inadimplenciaPct}%`}
          hint={`${kpis.ciclosAtrasados} ciclo(s) em atraso`}
          icon={CircleAlert}
          tone={kpis.ciclosAtrasados > 0 ? "danger" : "default"}
        />
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
            <CardTitle className="flex items-center gap-2 text-base">
              Atrasos
              {atrasados.length > 0 && (
                <Badge variant="destructive">{atrasados.length}</Badge>
              )}
            </CardTitle>
            <CardDescription>Fila de cobrança do dia.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {atrasados.length === 0 ? (
              <div className="flex flex-col items-center gap-1 py-6 text-center">
                <div className="flex size-10 items-center justify-center rounded-full bg-success/10 text-success">
                  <BanknoteArrowUp className="size-5" />
                </div>
                <p className="mt-1 text-sm font-medium">Nenhum atraso</p>
                <p className="text-xs text-muted-foreground">
                  Sua carteira está em dia.
                </p>
              </div>
            ) : (
              atrasados.slice(0, 6).map((a) => (
                <Link
                  key={a.id}
                  href={`/emprestimos/${a.emprestimo_id}`}
                  className="flex items-center justify-between rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2.5 text-sm transition-colors hover:bg-destructive/10"
                >
                  <span className="min-w-0 truncate font-medium">{a.nome}</span>
                  <span className="ml-2 flex shrink-0 items-center gap-2 text-xs">
                    <Badge variant="destructive" className="tabular-nums">
                      {a.dias_atraso}d
                    </Badge>
                    <span className="tabular-nums font-medium">
                      {formatBRL(Math.round(Number(a.juros_devido) * 100))}
                    </span>
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
          <CardDescription>O que entra nos próximos 30 dias.</CardDescription>
        </CardHeader>
        <CardContent>
          {feed.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhum vencimento nos próximos 30 dias.
            </p>
          ) : (
            <ul className="-my-1 divide-y">
              {feed.slice(0, 12).map((f) => (
                <li key={f.id}>
                  <Link
                    href={`/emprestimos/${f.emprestimo_id}`}
                    className="group flex items-center justify-between gap-3 rounded-md px-2 py-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-9 shrink-0 flex-col items-center justify-center rounded-lg bg-muted text-center leading-none">
                        <span className="text-[10px] uppercase text-muted-foreground">
                          {dataCurta(f.data_vencimento).split(" ")[1]}
                        </span>
                        <span className="text-sm font-semibold tabular-nums">
                          {dataCurta(f.data_vencimento).split(" ")[0]}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{f.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {diaLabel(f.data_vencimento)}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums">
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
