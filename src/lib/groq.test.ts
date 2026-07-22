import { describe, it, expect } from "vitest"
import { classificarPorPalavra, soDigitos } from "./groq"

describe("classificarPorPalavra (fallback sem IA)", () => {
  it("detecta intenção de rolar", () => {
    expect(classificarPorPalavra("vou rolar esse mês")).toBe("rolar")
    expect(classificarPorPalavra("quero arrolar")).toBe("rolar")
    expect(classificarPorPalavra("pago só os juros")).toBe("rolar")
  })

  it("detecta intenção de quitar", () => {
    expect(classificarPorPalavra("quero quitar tudo")).toBe("quitar")
    expect(classificarPorPalavra("já paguei, segue comprovante")).toBe("quitar")
    expect(classificarPorPalavra("quitei agora")).toBe("quitar")
  })

  it("detecta dúvida", () => {
    expect(classificarPorPalavra("posso pagar semana que vem?")).toBe("duvida")
    expect(classificarPorPalavra("qual o prazo?")).toBe("duvida")
  })

  it("indefinido quando não há sinal claro", () => {
    expect(classificarPorPalavra("bom dia")).toBe("indefinido")
  })

  it("é tolerante a acentos/maiúsculas", () => {
    expect(classificarPorPalavra("VOU ROLAR")).toBe("rolar")
    expect(classificarPorPalavra("Quitação feita")).toBe("quitar")
  })
})

describe("soDigitos", () => {
  it("extrai só os dígitos do telefone", () => {
    expect(soDigitos("+55 (11) 99999-8888")).toBe("5511999998888")
    expect(soDigitos(null)).toBe("")
    expect(soDigitos(undefined)).toBe("")
  })
})
