import Link from "next/link"
import { HandCoins, Plus, ChevronRight } from "lucide-react"
import { requireUser } from "@/lib/auth"
import type { Cliente, EmprestimoComCliente } from "@/lib/types"
import { formatBRL } from "@/lib/money"
import { jurosMensal } from "@/lib/finance"
import { EmprestimoForm } from "./emprestimo-form"
import { PageHeader } from "@/components/page-header"
import { EmptyState } from "@/components/empty-state"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type SearchParams = Promise<{ status?: string }>

export default async function EmprestimosPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { status } = await searchParams
  const { supabase } = await requireUser()

  let query = supabase
    .from("emprestimos")
    .select("*, clientes(id, nome)")
    .eq("ativo", true)
    .order("created_at", { ascending: false })

  if (status && ["ativo", "quitado", "cancelado"].includes(status)) {
    query = query.eq("status", status)
  }

  const [{ data: emprestimos }, { data: clientes }] = await Promise.all([
    query.returns<EmprestimoComCliente[]>(),
    supabase
      .from("clientes")
      .select("id, nome")
      .eq("ativo", true)
      .order("nome")
      .returns<Pick<Cliente, "id" | "nome">[]>(),
  ])

  const vazio = !emprestimos || emprestimos.length === 0

  const filtros = [
    { key: undefined, label: "Todos" },
    { key: "ativo", label: "Ativos" },
    { key: "quitado", label: "Quitados" },
  ]

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="Empréstimos"
        description={`${emprestimos?.length ?? 0} empréstimo(s)`}
      >
        <EmprestimoForm
          clientes={clientes ?? []}
          trigger={
            <Button>
              <Plus className="size-4" />
              Novo empréstimo
            </Button>
          }
        />
      </PageHeader>

      {/* Filtro segmentado */}
      <div className="mb-4 inline-flex rounded-lg border bg-muted/40 p-1">
        {filtros.map((f) => {
          const active = status === f.key || (!status && !f.key)
          return (
            <Link
              key={f.label}
              href={f.key ? `/emprestimos?status=${f.key}` : "/emprestimos"}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </Link>
          )
        })}
      </div>

      <Card className="overflow-hidden py-0">
        {vazio ? (
          <EmptyState
            icon={HandCoins}
            title="Nenhum empréstimo"
            description="Cadastre um empréstimo para começar a acompanhar os ciclos e o caixa."
            action={
              <EmprestimoForm
                clientes={clientes ?? []}
                trigger={
                  <Button>
                    <Plus className="size-4" />
                    Novo empréstimo
                  </Button>
                }
              />
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Principal</TableHead>
                <TableHead className="text-right">Juros/mês</TableHead>
                <TableHead className="text-center">Venc.</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {emprestimos.map((e) => {
                const principalCents = Math.round(
                  Number(e.valor_principal) * 100
                )
                const juroCents = Math.round(
                  jurosMensal(
                    Number(e.valor_principal),
                    Number(e.taxa_juros_mensal)
                  ) * 100
                )
                return (
                  <TableRow
                    key={e.id}
                    className="group relative cursor-pointer"
                  >
                    <TableCell className="font-medium">
                      <Link
                        href={`/emprestimos/${e.id}`}
                        className="after:absolute after:inset-0"
                      >
                        {e.clientes?.nome ?? "—"}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatBRL(principalCents)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatBRL(juroCents)}
                      <span className="ml-1 text-xs text-muted-foreground">
                        {(Number(e.taxa_juros_mensal) * 100).toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-center tabular-nums text-muted-foreground">
                      dia {e.dia_vencimento}
                    </TableCell>
                    <TableCell>
                      <StatusBadge value={e.status} />
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="size-4 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
