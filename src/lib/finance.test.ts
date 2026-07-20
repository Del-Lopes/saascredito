import { describe, it, expect } from "vitest"
import {
  round2,
  jurosMensal,
  valorQuitacao,
  adicionarMeses,
  proximoVencimento,
  construirCiclo,
} from "./finance"

describe("round2", () => {
  it("arredonda para 2 casas sem resíduo de float", () => {
    expect(round2(0.1 + 0.2)).toBe(0.3)
    // 1.005 deve arredondar para cima (o truque do EPSILON corrige o float);
    // Math.round(1.005*100) puro daria 100 (errado) por causa do float.
    expect(round2(1.005)).toBe(1.01)
    expect(round2(100.555)).toBe(100.56)
  })
})

describe("jurosMensal / valorQuitacao", () => {
  it("juro simples = principal * taxa", () => {
    expect(jurosMensal(1000, 0.05)).toBe(50)
    expect(jurosMensal(1500, 0.1)).toBe(150)
  })

  it("juro é constante independentemente do ciclo (principal fixo)", () => {
    const j1 = jurosMensal(2000, 0.08)
    const j2 = jurosMensal(2000, 0.08)
    expect(j1).toBe(160)
    expect(j2).toBe(j1)
  })

  it("quitação = principal + juro do mês", () => {
    expect(valorQuitacao(1000, 0.05)).toBe(1050)
    expect(valorQuitacao(3000, 0.03)).toBe(3090)
  })

  it("taxa zero => juro zero, quitação = principal", () => {
    expect(jurosMensal(1000, 0)).toBe(0)
    expect(valorQuitacao(1000, 0)).toBe(1000)
  })
})

describe("adicionarMeses", () => {
  it("mês normal mantém o dia de vencimento", () => {
    // 2026-01-10, +1 mês, dia 10 => 2026-02-10
    expect(adicionarMeses(new Date(2026, 0, 10), 1, 10)).toBe("2026-02-10")
  })

  it("dia 31 em fevereiro cai no último dia do mês", () => {
    // base jan/2026, +1 mês, dia 31 => fev tem 28 (2026 não bissexto) => 2026-02-28
    expect(adicionarMeses(new Date(2026, 0, 15), 1, 31)).toBe("2026-02-28")
  })

  it("respeita ano bissexto (fev 2028 tem 29 dias)", () => {
    expect(adicionarMeses(new Date(2028, 0, 15), 1, 31)).toBe("2028-02-29")
  })

  it("atravessa a virada de ano", () => {
    // dez/2026 +1 mês, dia 5 => jan/2027
    expect(adicionarMeses(new Date(2026, 11, 5), 1, 5)).toBe("2027-01-05")
  })

  it("soma múltiplos meses (rolagem repetida)", () => {
    const base = new Date(2026, 0, 20)
    expect(adicionarMeses(base, 1, 20)).toBe("2026-02-20")
    expect(adicionarMeses(base, 2, 20)).toBe("2026-03-20")
    expect(adicionarMeses(base, 3, 20)).toBe("2026-04-20")
  })
})

describe("proximoVencimento", () => {
  it("ciclo 1 vence um mês após o empréstimo", () => {
    expect(proximoVencimento(new Date(2026, 6, 10), 10)).toBe("2026-08-10")
  })
})

describe("construirCiclo", () => {
  const params = {
    principal: 1000,
    taxaMensal: 0.05,
    dataEmprestimo: new Date(2026, 0, 15),
    diaVencimento: 15,
  }

  it("ciclo 1: vencimento 1 mês depois, juro e quitação corretos", () => {
    const c = construirCiclo({ ...params, competencia: 1 })
    expect(c.competencia).toBe(1)
    expect(c.data_vencimento).toBe("2026-02-15")
    expect(c.juros_devido).toBe(50)
    expect(c.valor_quitacao).toBe(1050)
  })

  it("ciclos seguintes mantêm juro constante e avançam o vencimento", () => {
    const c2 = construirCiclo({ ...params, competencia: 2 })
    const c3 = construirCiclo({ ...params, competencia: 3 })
    expect(c2.juros_devido).toBe(50)
    expect(c3.juros_devido).toBe(50)
    expect(c2.data_vencimento).toBe("2026-03-15")
    expect(c3.data_vencimento).toBe("2026-04-15")
  })

  it("simula 12 rolagens: juro total = 12x o juro mensal, principal intacto", () => {
    const juros = Array.from({ length: 12 }, (_, i) =>
      construirCiclo({ ...params, competencia: i + 1 })
    ).map((c) => c.juros_devido)
    const total = juros.reduce((a, b) => a + b, 0)
    expect(total).toBe(600) // 12 * 50
    // valor de quitação nunca muda (principal fixo)
    const c12 = construirCiclo({ ...params, competencia: 12 })
    expect(c12.valor_quitacao).toBe(1050)
  })
})
