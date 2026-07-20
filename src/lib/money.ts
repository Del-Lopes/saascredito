/**
 * Utilitários de dinheiro.
 *
 * Regra do projeto: NUNCA usar float para dinheiro.
 * Internamente trabalhamos em CENTAVOS (inteiros). No banco, os valores
 * numeric(14,2) representam reais; convertemos na borda (leitura/escrita).
 */

/** Converte reais (ex.: 1500.5) para centavos inteiros (150050). */
export function toCents(reais: number): number {
  return Math.round(reais * 100)
}

/** Converte centavos inteiros (150050) para reais (1500.5). */
export function toReais(cents: number): number {
  return cents / 100
}

/** Formata centavos como moeda brasileira: 150050 -> "R$ 1.500,50". */
export function formatBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100)
}

/**
 * Faz o parse de um input de moeda digitado pelo usuário para centavos.
 * Aceita "1.500,50", "1500.50", "1500", "R$ 1.500,50".
 */
export function parseBRLToCents(input: string): number {
  const cleaned = input
    .replace(/[^\d,.-]/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "") // remove separador de milhar
    .replace(",", ".")
  const value = Number.parseFloat(cleaned)
  return Number.isFinite(value) ? Math.round(value * 100) : 0
}
