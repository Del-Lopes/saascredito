"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { inativarCliente } from "./actions"
import { ClienteFormDialog } from "./cliente-form"
import type { Cliente } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ClienteRowActions({ cliente }: { cliente: Cliente }) {
  const [pending, startTransition] = useTransition()
  const [editOpen, setEditOpen] = useState(false)

  function handleInativar() {
    if (!confirm(`Inativar o cliente "${cliente.nome}"?`)) return
    startTransition(async () => {
      const result = await inativarCliente(cliente.id)
      if (result.ok) toast.success("Cliente inativado")
      else toast.error(result.error)
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="sm" disabled={pending}>
              ⋯
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleInativar}
            className="text-destructive"
          >
            Inativar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog de edição controlado, fora do menu */}
      <ClienteFormDialog
        cliente={cliente}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  )
}
