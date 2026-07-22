import Link from "next/link"
import { Inbox, CheckCheck } from "lucide-react"
import { requireUser } from "@/lib/auth"
import type { ConfirmacaoView } from "@/lib/types"
import { PageHeader } from "@/components/page-header"
import { EmptyState } from "@/components/empty-state"
import { StatCard } from "@/components/stat-card"
import { ConfirmacaoItem } from "./confirmacao-item"
import { cn } from "@/lib/utils"

type SearchParams = Promise<{ view?: string }>

export default async function ConfirmacoesPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { view } = await searchParams
  const mostrarResolvidas = view === "resolvidas"
  const { supabase } = await requireUser()

  let query = supabase
    .from("vw_confirmacoes")
    .select("*")
    .order("created_at", { ascending: false })

  query = mostrarResolvidas
    ? query.neq("status", "pendente")
    : query.eq("status", "pendente")

  const { data: confirmacoes } = await query.returns<ConfirmacaoView[]>()

  // contagem de pendentes (para o KPI, independente do filtro)
  const { count: pendentes } = await supabase
    .from("confirmacoes")
    .select("*", { count: "exact", head: true })
    .eq("status", "pendente")

  const lista = confirmacoes ?? []

  const filtros = [
    { key: undefined, label: "Pendentes" },
    { key: "resolvidas", label: "Resolvidas" },
  ]

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        eyebrow="Follow-up"
        title="Confirmações"
        description="Respostas dos clientes no WhatsApp para você revisar e dar baixa."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:max-w-md">
        <StatCard
          label="Pendentes"
          value={String(pendentes ?? 0)}
          icon={Inbox}
          tone={(pendentes ?? 0) > 0 ? "warning" : "default"}
        />
      </div>

      {/* Filtro segmentado */}
      <div className="mb-4 inline-flex rounded-lg border bg-muted/40 p-1">
        {filtros.map((f) => {
          const active = view === f.key || (!view && !f.key)
          return (
            <Link
              key={f.label}
              href={f.key ? `/confirmacoes?view=${f.key}` : "/confirmacoes"}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </Link>
          )
        })}
      </div>

      {lista.length === 0 ? (
        <EmptyState
          icon={mostrarResolvidas ? Inbox : CheckCheck}
          title={
            mostrarResolvidas
              ? "Nenhuma confirmação resolvida"
              : "Nenhuma pendência"
          }
          description={
            mostrarResolvidas
              ? "As confirmações que você resolver aparecem aqui."
              : "Quando um cliente responder no WhatsApp, a resposta aparece aqui para você confirmar."
          }
        />
      ) : (
        <div className="space-y-3">
          {lista.map((cf) => (
            <ConfirmacaoItem key={cf.id} cf={cf} />
          ))}
        </div>
      )}
    </div>
  )
}
