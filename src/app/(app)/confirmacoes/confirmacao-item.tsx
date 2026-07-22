"use client"

import { useTransition } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Check, X, RefreshCw, Wallet } from "lucide-react"
import {
  confirmarRolagem,
  confirmarQuitacao,
  recusarConfirmacao,
} from "./actions"
import type { ConfirmacaoView } from "@/lib/types"
import { formatBRL } from "@/lib/money"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function dataHora(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function ConfirmacaoItem({ cf }: { cf: ConfirmacaoView }) {
  const [pending, startTransition] = useTransition()
  const resolvida = cf.status !== "pendente"
  const semCiclo = !cf.ciclo_id

  const jurosCents = cf.juros_devido
    ? Math.round(Number(cf.juros_devido) * 100)
    : 0
  const quitacaoCents = cf.valor_quitacao
    ? Math.round(Number(cf.valor_quitacao) * 100)
    : 0

  function acao(
    fn: (id: string) => Promise<{ ok: boolean; error?: string }>,
    label: string,
    confirmar = true
  ) {
    if (confirmar && !window.confirm(`Confirmar: ${label}?`)) return
    startTransition(async () => {
      const r = await fn(cf.id)
      if (r.ok) toast.success(`${label} registrada`)
      else toast.error(r.error ?? "Falha na operação")
    })
  }

  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        resolvida ? "bg-muted/30 opacity-70" : "bg-card"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">
              {cf.cliente_nome ?? "Cliente não identificado"}
            </span>
            <StatusBadge value={cf.intencao} />
            {cf.ia_confianca != null && (
              <span className="text-xs text-muted-foreground tabular-nums">
                {Math.round(Number(cf.ia_confianca) * 100)}% conf.
              </span>
            )}
            {resolvida && <StatusBadge value={cf.status} />}
          </div>
          {cf.telefone && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {cf.telefone}
              {cf.data_vencimento && (
                <>
                  {" · vence "}
                  {new Date(
                    `${cf.data_vencimento}T00:00:00`
                  ).toLocaleDateString("pt-BR")}
                </>
              )}
            </p>
          )}
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {dataHora(cf.created_at)}
        </span>
      </div>

      {/* Mensagem original do cliente */}
      <blockquote className="mt-3 rounded-md border-l-2 border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
        “{cf.mensagem}”
      </blockquote>

      {/* Ações (só quando pendente) */}
      {!resolvida && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {semCiclo ? (
            <div className="flex items-center gap-2 text-xs text-warning">
              <Wallet className="size-4" />
              Sem ciclo vinculado —
              {cf.cliente_id ? (
                <Link
                  href={`/emprestimos?q=${encodeURIComponent(cf.cliente_nome ?? "")}`}
                  className="underline"
                >
                  abrir empréstimos do cliente
                </Link>
              ) : (
                <span>cliente não identificado pelo telefone.</span>
              )}
            </div>
          ) : (
            <>
              <Button
                size="sm"
                variant={cf.intencao === "rolar" ? "default" : "outline"}
                disabled={pending}
                onClick={() =>
                  acao(confirmarRolagem, `Rolagem · ${formatBRL(jurosCents)}`)
                }
              >
                <RefreshCw className="size-4" />
                Rolar · {formatBRL(jurosCents)}
              </Button>
              <Button
                size="sm"
                variant={cf.intencao === "quitar" ? "default" : "outline"}
                disabled={pending}
                onClick={() =>
                  acao(
                    confirmarQuitacao,
                    `Quitação · ${formatBRL(quitacaoCents)}`
                  )
                }
              >
                <Check className="size-4" />
                Quitar · {formatBRL(quitacaoCents)}
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground"
            disabled={pending}
            onClick={() => acao(recusarConfirmacao, "Recusar", false)}
          >
            <X className="size-4" />
            Recusar
          </Button>
        </div>
      )}
    </div>
  )
}
