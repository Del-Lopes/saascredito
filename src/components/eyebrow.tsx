import { cn } from "@/lib/utils"

/**
 * Eyebrow editorial (mono, uppercase, com traço à esquerda) — o detalhe de
 * assinatura do design do roadmap. Usado acima de títulos de seção/página.
 */
export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <p
      className={cn(
        "flex items-center gap-2.5 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-primary",
        className
      )}
    >
      <span aria-hidden className="h-px w-6 bg-primary" />
      {children}
    </p>
  )
}
