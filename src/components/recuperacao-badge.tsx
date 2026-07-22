import { cn } from "@/lib/utils"
import type { NivelRecuperacao } from "@/lib/recuperacao"

const estilos: Record<NivelRecuperacao, string> = {
  nenhum: "bg-destructive/10 text-destructive",
  parcial: "bg-warning/15 text-warning",
  lucrando: "bg-success/10 text-success",
}

/** Tag semáfora de recuperação: 🔴 nada → 🟡 parcial → 🟢 lucrando. */
export function RecuperacaoBadge({
  nivel,
  label,
  pct,
}: {
  nivel: NivelRecuperacao
  label: string
  pct: number
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        estilos[nivel]
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {label}
      {nivel !== "nenhum" && (
        <span className="tabular-nums opacity-80">· {pct}%</span>
      )}
    </span>
  )
}
