import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"

type Tone = "default" | "success" | "warning" | "danger"

const toneStyles: Record<Tone, { icon: string; value: string }> = {
  default: { icon: "bg-primary/10 text-primary", value: "" },
  success: { icon: "bg-success/10 text-success", value: "" },
  warning: { icon: "bg-warning/15 text-warning", value: "" },
  danger: { icon: "bg-destructive/10 text-destructive", value: "text-destructive" },
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string
  value: string
  hint?: string
  icon?: LucideIcon
  tone?: Tone
}) {
  const t = toneStyles[tone]
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p
            className={cn(
              "mt-1.5 text-2xl font-semibold tabular-nums tracking-tight",
              t.value
            )}
          >
            {value}
          </p>
          {hint && (
            <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg",
              t.icon
            )}
          >
            <Icon className="size-[1.15rem]" />
          </div>
        )}
      </div>
    </Card>
  )
}
