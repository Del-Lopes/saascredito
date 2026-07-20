import { requireUser } from "@/lib/auth"
import type { Cliente } from "@/lib/types"
import { ClienteForm } from "./cliente-form"
import { ClienteRowActions } from "./cliente-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

  return (
    <div className="p-8">
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground">
            {clientes?.length ?? 0} cliente(s) ativo(s)
          </p>
        </div>
        <ClienteForm trigger={<Button>Novo cliente</Button>} />
      </header>

      <form className="mb-4">
        <Input
          name="q"
          placeholder="Buscar por nome…"
          defaultValue={q ?? ""}
          className="max-w-xs"
        />
      </form>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientes && clientes.length > 0 ? (
              clientes.map((cliente) => (
                <TableRow key={cliente.id}>
                  <TableCell className="font-medium">{cliente.nome}</TableCell>
                  <TableCell>{cliente.telefone ?? "—"}</TableCell>
                  <TableCell>{cliente.documento ?? "—"}</TableCell>
                  <TableCell>
                    <ClienteRowActions cliente={cliente} />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-10 text-center text-muted-foreground"
                >
                  Nenhum cliente ainda. Cadastre o primeiro.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
