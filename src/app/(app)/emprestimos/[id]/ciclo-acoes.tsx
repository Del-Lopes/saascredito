"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { rolarCiclo, quitarCiclo } from "./actions"
import { formatBRL } from "@/lib/money"
import { Button } from "@/components/ui/button"

export function CicloAcoes({
  cicloId,
  jurosCents,
  quitacaoCents,
}: {
  cicloId: string
  jurosCents: number
  quitacaoCents: number
}) {
  const [pending, startTransition] = useTransition()

  function acao(fn: typeof rolarCiclo, label: string, valor: number) {
    if (!confirm(`Confirmar ${label} de ${formatBRL(valor)}?`)) return
    startTransition(async () => {
      const r = await fn(cicloId)
      if (r.ok) toast.success(`${label} registrada`)
      else toast.error(r.error)
    })
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => acao(rolarCiclo, "Rolagem (juros)", jurosCents)}
      >
        Rolar · {formatBRL(jurosCents)}
      </Button>
      <Button
        size="sm"
        disabled={pending}
        onClick={() => acao(quitarCiclo, "Quitação", quitacaoCents)}
      >
        Quitar · {formatBRL(quitacaoCents)}
      </Button>
    </div>
  )
}
