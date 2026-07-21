"use client"

import { useState } from "react"
import { formatBRL } from "@/lib/money"
import { cn } from "@/lib/utils"

type Ponto = { semana: string; valorCents: number }

/**
 * Gráfico de fluxo de caixa (juros a receber por semana).
 * Série única -> uma cor (accent do app). SVG inline, com hover por barra,
 * baseline sólida e topos arredondados. Sem legenda (título nomeia a série).
 */
export function FluxoChart({ dados }: { dados: Ponto[] }) {
  const [hover, setHover] = useState<number | null>(null)

  const w = 640
  const h = 220
  const padL = 8
  const padR = 8
  const padTop = 24
  const padBottom = 28
  const plotW = w - padL - padR
  const plotH = h - padTop - padBottom

  const max = Math.max(1, ...dados.map((d) => d.valorCents))
  const n = dados.length
  const slot = plotW / n
  const barW = Math.min(48, slot * 0.6)

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full"
        role="img"
        aria-label="Fluxo de caixa: juros a receber por semana"
      >
        {/* baseline */}
        <line
          x1={padL}
          y1={padTop + plotH}
          x2={w - padR}
          y2={padTop + plotH}
          className="stroke-border"
          strokeWidth={1}
        />
        {dados.map((d, i) => {
          const barH = (d.valorCents / max) * plotH
          const x = padL + i * slot + (slot - barW) / 2
          const y = padTop + plotH - barH
          const active = hover === i
          return (
            <g
              key={d.semana}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              {/* área de hit maior */}
              <rect
                x={padL + i * slot}
                y={padTop}
                width={slot}
                height={plotH}
                fill="transparent"
              />
              <rect
                x={x}
                y={y}
                width={barW}
                height={Math.max(barH, 2)}
                rx={4}
                className={cn(
                  "transition-all duration-150",
                  active ? "fill-primary" : "fill-primary/55"
                )}
              />
              {/* valor no topo quando > 0 */}
              {d.valorCents > 0 && (
                <text
                  x={x + barW / 2}
                  y={y - 6}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[10px] tabular-nums"
                >
                  {formatBRL(d.valorCents).replace("R$", "").trim()}
                </text>
              )}
              {/* rótulo da semana */}
              <text
                x={padL + i * slot + slot / 2}
                y={h - 10}
                textAnchor="middle"
                className="fill-muted-foreground text-[11px] tabular-nums"
              >
                {d.semana}
              </text>
            </g>
          )
        })}
      </svg>
      {hover !== null && (
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 rounded-md border bg-popover px-3 py-1.5 text-xs shadow-md">
          <span className="text-muted-foreground">Semana {dados[hover].semana}: </span>
          <span className="font-medium tabular-nums">
            {formatBRL(dados[hover].valorCents)}
          </span>
        </div>
      )}
    </div>
  )
}
