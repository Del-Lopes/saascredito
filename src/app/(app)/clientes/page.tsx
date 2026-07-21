import { Users, Plus, Search } from "lucide-react"
import { requireUser } from "@/lib/auth"
import type { Cliente } from "@/lib/types"
import { ClienteForm } from "./cliente-form"
import { ClienteRowActions } from "./cliente-actions"
import { PageHeader } from "@/components/page-header"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type SearchParams = Promise<{ q?: string }>

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { q } = await searchParams
  const { supabase } = await requireUser()

  let query = supabase
    .from("clientes")
    .select("*")
    .eq("ativo", true)
    .order("nome")

  if (q) query = query.ilike("nome", `%${q}%`)

  const { data: clientes } = await query.returns<Cliente[]>()
  const vazio = !clientes || clientes.length === 0

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="Clientes"
        description={`${clientes?.length ?? 0} cliente(s) ativo(s)`}
      >
        <ClienteForm
          trigger={
            <Button>
              <Plus className="size-4" />
              Novo cliente
            </Button>
          }
        />
      </PageHeader>

      <form className="mb-4">
        <div className="relative max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            placeholder="Buscar por nome…"
            defaultValue={q ?? ""}
            className="pl-9"
          />
        </div>
      </form>

      <Card className="overflow-hidden py-0">
        {vazio && !q ? (
          <EmptyState
            icon={Users}
            title="Nenhum cliente ainda"
            description="Cadastre o primeiro cliente para começar a registrar empréstimos."
            action={
              <ClienteForm
                trigger={
                  <Button>
                    <Plus className="size-4" />
                    Novo cliente
                  </Button>
                }
              />
            }
          />
        ) : vazio ? (
          <EmptyState
            icon={Search}
            title="Nada encontrado"
            description={`Nenhum cliente com "${q}".`}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientes.map((cliente) => (
                <TableRow key={cliente.id}>
                  <TableCell className="font-medium">{cliente.nome}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {cliente.telefone ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {cliente.documento ?? "—"}
                  </TableCell>
                  <TableCell>
                    <ClienteRowActions cliente={cliente} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
