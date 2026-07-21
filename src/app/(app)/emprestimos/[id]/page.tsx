import Link from "next/link"
import { notFound } from "next/navigation"
import { requireUser } from "@/lib/auth"
import type { Ciclo, EmprestimoComCliente } from "@/lib/types"
import { formatBRL, toCents } from "@/lib/money"
import { CicloAcoes } from "./ciclo-acoes"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const desfechoLabel: Record<string, string> = {
  em_aberto: "Em aberto",
  atrasado: "Atrasado",
  rolou: "Rolou",
  quitou: "Quitou",
  cancelado: "Cancelado",
}

const desfechoVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  em_aberto: "default",
  atrasado: "destructive",
  rolou: "secondary",
  quitou: "secondary",
  cancelado: "outline",
}

export default async function EmprestimoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { supabase } = await requireUser()

  const { data: emprestimo } = await supabase
    .from("emprestimos")
    .select("*, clientes(id, nome)")
    .eq("id", id)
    .single<EmprestimoComCliente>()

  if (!emprestimo) notFound()

  const { data: ciclos } = await supabase
    .from("ciclos")
    .select("*")
    .eq("emprestimo_id", id)
    .order("competencia", { ascending: false })
    .returns<Ciclo[]>()

  const cicloAberto = ciclos?.find(
    (c) => c.desfecho === "em_aberto" || c.desfecho === "atrasado"
  )

  const principalCents = toCents(Number(emprestimo.valor_principal))
  const taxaPct = (Number(emprestimo.taxa_juros_mensal) * 100).toFixed(2)

  // Total já recebido em juros (rolagens) + quitação, a partir dos ciclos.
  const totalRecebidoCents =
    ciclos?.reduce((acc, c) => acc + toCents(Number(c.valor_pago)), 0) ?? 0

  return (
    <div className="p-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href="/emprestimos">← Empréstimos</Link>}
        />
      </div>

      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {emprestimo.clientes?.nome ?? "Cliente"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Empréstimo rotativo · vencimento todo dia {emprestimo.dia_vencimento}
          </p>
        </div>
        <Badge variant={emprestimo.status === "quitado" ? "secondary" : "default"}>
          {emprestimo.status}
        </Badge>
      </header>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Principal</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {formatBRL(principalCents)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Juros ({taxaPct}% a.m.)</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {cicloAberto
                ? formatBRL(toCents(Number(cicloAberto.juros_devido)))
                : "—"}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total recebido</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {formatBRL(totalRecebidoCents)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {cicloAberto && (
        <Card className="mb-6 border-primary/40">
          <CardHeader>
            <CardTitle className="text-base">
              Ciclo {cicloAberto.competencia} · vence{" "}
              {new Date(
                `${cicloAberto.data_vencimento}T00:00:00`
              ).toLocaleDateString("pt-BR")}
            </CardTitle>
            <CardDescription>
              O cliente pode rolar (pagar só o juro) ou quitar (principal + juro).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CicloAcoes
              cicloId={cicloAberto.id}
              jurosCents={toCents(Number(cicloAberto.juros_devido))}
              quitacaoCents={toCents(Number(cicloAberto.valor_quitacao))}
            />
          </CardContent>
        </Card>
      )}

      <h2 className="mb-3 text-sm font-medium text-muted-foreground">
        Histórico de ciclos
      </h2>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ciclo</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead className="text-right">Juros</TableHead>
              <TableHead className="text-right">Pago</TableHead>
              <TableHead>Desfecho</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ciclos?.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="tabular-nums">{c.competencia}</TableCell>
                <TableCell className="tabular-nums">
                  {new Date(
                    `${c.data_vencimento}T00:00:00`
                  ).toLocaleDateString("pt-BR")}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatBRL(toCents(Number(c.juros_devido)))}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {Number(c.valor_pago) > 0
                    ? formatBRL(toCents(Number(c.valor_pago)))
                    : "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={desfechoVariant[c.desfecho] ?? "default"}>
                    {desfechoLabel[c.desfecho] ?? c.desfecho}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
