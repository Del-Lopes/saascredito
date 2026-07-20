"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { criarEmprestimo } from "./actions"
import { jurosMensal, valorQuitacao } from "@/lib/finance"
import { formatBRL } from "@/lib/money"
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

type ClienteOption = { id: string; nome: string }

export function EmprestimoForm({
  clientes,
  trigger,
}: {
  clientes: ClienteOption[]
  trigger: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  // Preview do juro/quitação enquanto digita
  const [valor, setValor] = useState("")
  const [taxaPct, setTaxaPct] = useState("")
  const principalNum = Number(valor) || 0
  const taxaFrac = (Number(taxaPct) || 0) / 100
  const juroPreview = jurosMensal(principalNum, taxaFrac)
  const quitacaoPreview = valorQuitacao(principalNum, taxaFrac)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await criarEmprestimo(formData)
      if (result.ok) {
        toast.success("Empréstimo cadastrado")
        setOpen(false)
        setValor("")
        setTaxaPct("")
      } else {
        toast.error(result.error)
      }
    })
  }

  const hoje = new Date().toISOString().slice(0, 10)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo empréstimo</DialogTitle>
          <DialogDescription>
            Modelo rotativo mensal: juros simples, principal fixo. O 1º ciclo é
            gerado automaticamente.
          </DialogDescription>
        </DialogHeader>

        {clientes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Cadastre um cliente antes de criar um empréstimo.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="cliente_id">Cliente *</Label>
              <select
                id="cliente_id"
                name="cliente_id"
                required
                className="h-9 rounded-md border bg-transparent px-3 text-sm shadow-xs"
                defaultValue=""
              >
                <option value="" disabled>
                  Selecione…
                </option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="valor_principal">Valor (R$) *</Label>
                <Input
                  id="valor_principal"
                  name="valor_principal"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="taxa">Juros (% ao mês) *</Label>
                <Input
                  id="taxa"
                  name="taxa_juros_mensal_pct"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={taxaPct}
                  onChange={(e) => setTaxaPct(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="dia_vencimento">Dia do vencimento *</Label>
                <Input
                  id="dia_vencimento"
                  name="dia_vencimento"
                  type="number"
                  min="1"
                  max="31"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="data_emprestimo">Data do empréstimo *</Label>
                <Input
                  id="data_emprestimo"
                  name="data_emprestimo"
                  type="date"
                  defaultValue={hoje}
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Input id="observacoes" name="observacoes" />
            </div>

            {principalNum > 0 && (
              <div className="rounded-md bg-muted/50 p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Juro por mês:</span>
                  <span className="font-medium tabular-nums">
                    {formatBRL(Math.round(juroPreview * 100))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Para quitar (mês):
                  </span>
                  <span className="font-medium tabular-nums">
                    {formatBRL(Math.round(quitacaoPreview * 100))}
                  </span>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending ? "Salvando…" : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
