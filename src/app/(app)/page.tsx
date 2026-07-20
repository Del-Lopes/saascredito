import { requireUser } from "@/lib/auth"
import { formatBRL } from "@/lib/money"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default async function DashboardPage() {
  const { supabase } = await requireUser()

  // KPIs básicos (o dashboard completo é a Fase 3 — aqui só um resumo)
  const [{ count: totalClientes }, { data: emprestimos }] = await Promise.all([
    supabase
      .from("clientes")
      .select("*", { count: "exact", head: true })
      .eq("ativo", true),
    supabase
      .from("emprestimos")
      .select("valor_principal")
      .eq("status", "ativo")
      .eq("ativo", true),
  ])

  const totalEmprestadoReais =
    emprestimos?.reduce((acc, e) => acc + Number(e.valor_principal), 0) ?? 0
  const totalEmprestadoCents = Math.round(totalEmprestadoReais * 100)

  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Visão geral da sua carteira. O feed e os gráficos completos chegam na
          Fase 3.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Clientes ativos</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {totalClientes ?? 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Empréstimos ativos</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {emprestimos?.length ?? 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total emprestado (principal)</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {formatBRL(totalEmprestadoCents)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Próximos passos</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Fase 1 (cadastro) está no ar. Cadastre{" "}
          <span className="font-medium text-foreground">clientes</span> e{" "}
          <span className="font-medium text-foreground">empréstimos</span> pelo
          menu à esquerda. Fase 2 adicionará os ciclos (rolar/quitar) e o motor
          de juros.
        </CardContent>
      </Card>
    </div>
  )
}
