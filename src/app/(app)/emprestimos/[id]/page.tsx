import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Wallet, Percent, BanknoteArrowUp } from "lucide-react"
import { requireUser } from "@/lib/auth"
import type { Ciclo, EmprestimoComCliente } from "@/lib/types"
import { formatBRL, toCents } from "@/lib/money"
import { CicloAcoes } from "./ciclo-acoes"
import { StatCard } from "@/components/stat-card"
import { StatusBadge } from "@/components/status-badge"
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

function dataLonga(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}
function dataCurta(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR")
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
  const totalRecebidoCents =
    ciclos?.reduce((acc, c) => acc + toCents(Number(c.valor_pago)), 0) ?? 0

  return (
    <div className="p-6 lg:p-8">
      <Button
        variant="ghost"
        size="sm"
        nativeButton={false}
        className="mb-4 -ml-2 text-muted-foreground"
        render={
          <Link href="/emprestimos">
            <ArrowLeft className="size-4" />
            Empréstimos
          </Link>
        }
      />

      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {emprestimo.clientes?.nome ?? "Cliente"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Empréstimo rotativo · vencimento todo dia{" "}
            {emprestimo.dia_vencimento} · desde{" "}
            {dataCurta(emprestimo.data_emprestimo)}
          </p>
        </div>
        <StatusBadge value={emprestimo.status} />
      </header>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Principal"
          value={formatBRL(principalCents)}
          icon={Wallet}
        />
        <StatCard
          label={`Juros (${taxaPct}% a.m.)`}
          value={
            cicloAberto
              ? formatBRL(toCents(Number(cicloAberto.juros_devido)))
              : "—"
          }
          icon={Percent}
        />
        <StatCard
          label="Total recebido"
          value={formatBRL(totalRecebidoCents)}
          icon={BanknoteArrowUp}
          tone="success"
        />
      </div>

      {cicloAberto && (
        <Card className="mb-6 border-primary/30 bg-primary/[0.03]">
          <CardHeader>
            <CardTitle className="text-base">
              Ciclo {cicloAberto.competencia} · vence{" "}
              {dataLonga(cicloAberto.data_vencimento)}
            </CardTitle>
            <CardDescription>
              O cliente pode rolar (pagar só o juro) ou quitar (principal +
              juro).
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
      <Card className="overflow-hidden py-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-16">Ciclo</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead className="text-right">Juros</TableHead>
              <TableHead className="text-right">Pago</TableHead>
              <TableHead>Desfecho</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ciclos?.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="tabular-nums font-medium">
                  {c.competencia}
                </TableCell>
                <TableCell className="tabular-nums">
                  {dataCurta(c.data_vencimento)}
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
                  <StatusBadge value={c.desfecho} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
