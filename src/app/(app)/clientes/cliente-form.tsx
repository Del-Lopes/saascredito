"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { criarCliente, atualizarCliente } from "./actions"
import type { Cliente } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

function FormFields({
  cliente,
  onDone,
}: {
  cliente?: Cliente
  onDone: () => void
}) {
  const [pending, startTransition] = useTransition()
  const editing = Boolean(cliente)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = editing
        ? await atualizarCliente(cliente!.id, formData)
        : await criarCliente(formData)
      if (result.ok) {
        toast.success(editing ? "Cliente atualizado" : "Cliente cadastrado")
        onDone()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="nome">Nome *</Label>
        <Input id="nome" name="nome" defaultValue={cliente?.nome ?? ""} required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="telefone">Telefone (WhatsApp)</Label>
        <Input
          id="telefone"
          name="telefone"
          placeholder="+55 11 99999-8888"
          defaultValue={cliente?.telefone ?? ""}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="documento">Documento (CPF/CNPJ)</Label>
        <Input
          id="documento"
          name="documento"
          defaultValue={cliente?.documento ?? ""}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="observacoes">Observações</Label>
        <Input
          id="observacoes"
          name="observacoes"
          defaultValue={cliente?.observacoes ?? ""}
        />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : editing ? "Salvar" : "Cadastrar"}
        </Button>
      </DialogFooter>
    </form>
  )
}

/** Botão que abre o dialog de criação (auto-controlado). */
export function ClienteForm({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo cliente</DialogTitle>
          <DialogDescription>
            Dados de quem recebe o empréstimo.
          </DialogDescription>
        </DialogHeader>
        <FormFields onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}

/** Dialog controlado (usado para edição a partir do menu de ações). */
export function ClienteFormDialog({
  cliente,
  open,
  onOpenChange,
}: {
  cliente?: Cliente
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {cliente ? "Editar cliente" : "Novo cliente"}
          </DialogTitle>
          <DialogDescription>
            Dados de quem recebe o empréstimo.
          </DialogDescription>
        </DialogHeader>
        <FormFields cliente={cliente} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}
