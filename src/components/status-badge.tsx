import { cn } from "@/lib/utils"

/** Mapeia status/desfecho do domínio para cor semântica + rótulo pt-BR. */
const MAP: Record<string, { label: string; cls: string }> = {
  // empréstimo
  ativo: { label: "Ativo", cls: "bg-primary/10 text-primary" },
  quitado: { label: "Quitado", cls: "bg-success/10 text-success" },
  cancelado: {
    label: "Cancelado",
    cls: "bg-muted text-muted-foreground",
  },
  // ciclo
  em_aberto: { label: "Em aberto", cls: "bg-primary/10 text-primary" },
  atrasado: {
    label: "Atrasado",
    cls: "bg-destructive/10 text-destructive",
  },
  rolou: { label: "Rolou", cls: "bg-warning/15 text-warning" },
  quitou: { label: "Quitou", cls: "bg-success/10 text-success" },
}

export function StatusBadge({ value }: { value: string }) {
  const item = MAP[value] ?? {
    label: value,
    cls: "bg-muted text-muted-foreground",
  }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        item.cls
      )}
    >
      {item.label}
    </span>
  )
}
