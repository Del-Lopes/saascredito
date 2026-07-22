/**
 * Recuperação de um empréstimo — quanto do principal já voltou.
 *
 * No modelo rotativo, o "recuperado" é o total recebido (juros de rolagens +
 * quitações) em relação ao principal emprestado. Quando o recebido atinge o
 * principal, você recuperou 100% do que emprestou — daí em diante é lucro.
 */

export type NivelRecuperacao = "nenhum" | "parcial" | "lucrando"

export interface Recuperacao {
  /** % recuperado do principal (pode passar de 100). */
  pct: number
  /** % limitado a 100 para a barra de progresso. */
  pctBarra: number
  nivel: NivelRecuperacao
  /** Rótulo em pt-BR para a tag. */
  label: string
}

/**
 * @param principalCents  valor emprestado (centavos)
 * @param recebidoCents    soma de valor_pago dos ciclos (centavos)
 */
export function calcularRecuperacao(
  principalCents: number,
  recebidoCents: number
): Recuperacao {
  const pct =
    principalCents > 0
      ? Math.round((recebidoCents / principalCents) * 100)
      : 0

  let nivel: NivelRecuperacao
  let label: string
  if (recebidoCents <= 0) {
    nivel = "nenhum"
    label = "A recuperar"
  } else if (pct >= 100) {
    nivel = "lucrando"
    label = "Lucrando"
  } else {
    nivel = "parcial"
    label = "Recuperando"
  }

  return { pct, pctBarra: Math.min(pct, 100), nivel, label }
}
