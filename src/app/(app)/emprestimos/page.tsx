import Link from "next/link"
import { HandCoins, Plus, ChevronRight, Search } from "lucide-react"
import { requireUser } from "@/lib/auth"
import type { Cliente, EmprestimoComCliente } from "@/lib/types"
import { formatBRL } from "@/lib/money"
import { jurosMensal } from "@/lib/finance"
import { EmprestimoForm } from "./emprestimo-form"
import { EmprestimoCard } from "./emprestimo-card"
import { PageHeader } from "@/components/page-header"
import { EmptyState } from "@/components/empty-state"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

type SearchParams = Promise<{ status?: string; q?: string }>

export default async function EmprestimosPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { status, q } = await searchParams
  const { supabase } = await requireUser()

  // Se há busca, filtramos pelo nome do cliente (join interno).
  const clientesSel = q ? "clientes!inner(id, nome)" : "clientes(id, nome)"

  let query = supabase
    .from("emprestimos")
    .select(`*, ${clientesSel}`)
    .eq("ativo", true)
    .order("created_at", { ascending: false })

  if (status && ["ativo", "quitado", "cancelado"].includes(status)) {
    query = query.eq("status", status)
  }

  if (q) {
    query = query.ilike("clientes.nome", `%${q}%`)
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
        eyebrow="Carteira"
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

      {/* Busca + filtro segmentado */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <form method="get" className="relative w-full max-w-xs">
          {status && <input type="hidden" name="status" value={status} />}
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            placeholder="Buscar por cliente…"
            defaultValue={q ?? ""}
            className="pl-9"
          />
        </form>

        <div className="inline-flex rounded-lg border bg-muted/40 p-1">
          {filtros.map((f) => {
            const active = status === f.key || (!status && !f.key)
            const params = new URLSearchParams()
            if (f.key) params.set("status", f.key)
            if (q) params.set("q", q)
            const qs = params.toString()
            return (
              <Link
                key={f.label}
                href={qs ? `/emprestimos?${qs}` : "/emprestimos"}
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
      </div>

      <Card className="overflow-hidden py-0">
        {vazio && q ? (
          <EmptyState
            icon={Search}
            title="Nada encontrado"
            description={`Nenhum empréstimo para "${q}".`}
          />
        ) : vazio ? (
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
          <>
            {/* Mobile: lista de cards */}
            <div className="divide-y md:hidden">
              {emprestimos.map((e) => (
                <EmprestimoCard key={e.id} e={e} />
              ))}
            </div>

            {/* Desktop: tabela */}
            <Table className="hidden md:table">
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
          </>
        )}
      </Card>
    </div>
  )
}
