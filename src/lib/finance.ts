/**
 * Motor financeiro — modelo rotativo mensal (juros simples).
 *
 * Regra: todo mês o cliente QUITA (principal + juro) ou ROLA (paga só o juro,
 * gera o ciclo do mês seguinte). Como o juro é simples e o principal não muda,
 * o juro mensal é CONSTANTE.
 *
 * A Fase 2 expande este módulo (rolar/quitar, testes). Aqui já entregamos o
 * cálculo base e a geração do 1º ciclo, usados no cadastro (Fase 1).
 *
 * Valores monetários trafegam aqui como number em REAIS. Arredondamos para
 * centavos em toda operação para evitar resíduo de ponto flutuante.
 */

/** Arredonda para 2 casas (centavos) de forma estável. */
export function round2(v: number): number {
  return Math.round((v + Number.EPSILON) * 100) / 100
}

/** Juro mensal (constante) = principal × taxa. */
export function jurosMensal(principal: number, taxaMensal: number): number {
  return round2(principal * taxaMensal)
}

/** Valor para quitar no mês = principal + juro do mês. */
export function valorQuitacao(principal: number, taxaMensal: number): number {
  return round2(principal + jurosMensal(principal, taxaMensal))
}

/**
 * Próxima data de vencimento a partir de uma data base, no dia informado.
 * Trata meses curtos: se o dia não existe no mês (ex.: 31 em fev), usa o
 * último dia do mês. Retorna string ISO (YYYY-MM-DD).
 */
export function proximoVencimento(dataBase: Date, diaVencimento: number): string {
  const ano = dataBase.getFullYear()
  const mes = dataBase.getMonth() + 1 // mês seguinte (0-indexed +1)
  const ultimoDia = new Date(ano, mes + 1, 0).getDate()
  const dia = Math.min(diaVencimento, ultimoDia)
  const d = new Date(ano, mes, dia)
  return d.toISOString().slice(0, 10)
}
