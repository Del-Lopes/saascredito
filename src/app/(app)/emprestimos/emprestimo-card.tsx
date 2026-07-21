import Link from "next/link"
import { ChevronRight } from "lucide-react"
import type { EmprestimoComCliente } from "@/lib/types"
import { formatBRL } from "@/lib/money"
import { jurosMensal } from "@/lib/finance"
import { StatusBadge } from "@/components/status-badge"

/** Card de empréstimo — usado na listagem mobile (substitui a linha da tabela). */
export function EmprestimoCard({ e }: { e: EmprestimoComCliente }) {
  const principalCents = Math.round(Number(e.valor_principal) * 100)
  const juroCents = Math.round(
    jurosMensal(Number(e.valor_principal), Number(e.taxa_juros_mensal)) * 100
  )
  const taxaPct = (Number(e.taxa_juros_mensal) * 100).toFixed(1)

  return (
    <Link
      href={`/emprestimos/${e.id}`}
      className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/50 active:bg-muted"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">
            {e.clientes?.nome ?? "—"}
          </span>
          <StatusBadge value={e.status} />
        </div>
        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="tabular-nums">
            Principal {formatBRL(principalCents)}
          </span>
          <span className="tabular-nums">
            Juros {formatBRL(juroCents)} ({taxaPct}%)
          </span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          vence dia {e.dia_vencimento}
        </p>
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground/50" />
    </Link>
  )
}
