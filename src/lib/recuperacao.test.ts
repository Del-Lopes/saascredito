import { describe, it, expect } from "vitest"
import { calcularRecuperacao } from "./recuperacao"

describe("calcularRecuperacao", () => {
  it("nada recebido -> vermelho (nenhum), 0%", () => {
    const r = calcularRecuperacao(100000, 0)
    expect(r.nivel).toBe("nenhum")
    expect(r.pct).toBe(0)
    expect(r.label).toBe("A recuperar")
  })

  it("recebeu parte -> amarelo (parcial)", () => {
    const r = calcularRecuperacao(100000, 40000)
    expect(r.nivel).toBe("parcial")
    expect(r.pct).toBe(40)
    expect(r.label).toBe("Recuperando")
    expect(r.pctBarra).toBe(40)
  })

  it("recebeu exatamente o principal -> verde (lucrando), 100%", () => {
    const r = calcularRecuperacao(100000, 100000)
    expect(r.nivel).toBe("lucrando")
    expect(r.pct).toBe(100)
    expect(r.label).toBe("Lucrando")
  })

  it("recebeu além do principal -> lucrando, pct > 100 mas barra em 100", () => {
    const r = calcularRecuperacao(100000, 150000)
    expect(r.nivel).toBe("lucrando")
    expect(r.pct).toBe(150)
    expect(r.pctBarra).toBe(100)
  })

  it("principal zero não quebra (evita divisão por zero)", () => {
    const r = calcularRecuperacao(0, 0)
    expect(r.pct).toBe(0)
    expect(r.nivel).toBe("nenhum")
  })
})
