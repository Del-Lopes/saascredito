import Link from "next/link"
import { requireUser } from "@/lib/auth"
import type { Cliente, EmprestimoComCliente } from "@/lib/types"
import { formatBRL } from "@/lib/money"
import { jurosMensal } from "@/lib/finance"
import { EmprestimoForm } from "./emprestimo-form"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type SearchParams = Promise<{ status?: string }>

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  ativo: "default",
  quitado: "secondary",
  cancelado: "destructive",
}

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

  const filtros = [
    { key: undefined, label: "Todos" },
    { key: "ativo", label: "Ativos" },
    { key: "quitado", label: "Quitados" },
  ]

  return (
    <div className="p-8">
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Empréstimos</h1>
          <p className="text-sm text-muted-foreground">
            {emprestimos?.length ?? 0} empréstimo(s)
          </p>
        </div>
        <EmprestimoForm
          clientes={clientes ?? []}
          trigger={<Button>Novo empréstimo</Button>}
        />
      </header>

      <div className="mb-4 flex gap-2">
        {filtros.map((f) => {
          const active = status === f.key || (!status && !f.key)
          return (
            <Button
              key={f.label}
              variant={active ? "default" : "outline"}
              size="sm"
              render={
                <Link
                  href={f.key ? `/emprestimos?status=${f.key}` : "/emprestimos"}
                >
                  {f.label}
                </Link>
              }
            />
          )
        })}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead className="text-right">Principal</TableHead>
              <TableHead className="text-right">Juros/mês</TableHead>
              <TableHead className="text-center">Venc.</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {emprestimos && emprestimos.length > 0 ? (
              emprestimos.map((e) => {
                const principalCents = Math.round(Number(e.valor_principal) * 100)
                const juroCents = Math.round(
                  jurosMensal(
                    Number(e.valor_principal),
                    Number(e.taxa_juros_mensal)
                  ) * 100
                )
                return (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">
                      {e.clientes?.nome ?? "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatBRL(principalCents)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatBRL(juroCents)}
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({(Number(e.taxa_juros_mensal) * 100).toFixed(1)}%)
                      </span>
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      dia {e.dia_vencimento}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[e.status] ?? "default"}>
                        {e.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-10 text-center text-muted-foreground"
                >
                  Nenhum empréstimo ainda.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
