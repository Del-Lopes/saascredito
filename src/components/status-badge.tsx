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
  // intenção da confirmação
  rolar: { label: "Quer rolar", cls: "bg-warning/15 text-warning" },
  quitar: { label: "Quer quitar", cls: "bg-success/10 text-success" },
  duvida: { label: "Dúvida", cls: "bg-info/10 text-info" },
  indefinido: { label: "Indefinido", cls: "bg-muted text-muted-foreground" },
  // status da confirmação
  pendente: { label: "Pendente", cls: "bg-primary/10 text-primary" },
  confirmado: { label: "Confirmado", cls: "bg-success/10 text-success" },
  recusado: { label: "Recusado", cls: "bg-muted text-muted-foreground" },
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
