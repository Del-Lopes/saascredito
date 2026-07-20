/**
 * Motor financeiro — modelo rotativo mensal (juros simples).
 *
 * Regra: todo mês o cliente QUITA (principal + juro) ou ROLA (paga só o juro,
 * gera o ciclo do mês seguinte). Como o juro é simples e o principal não muda,
 * o juro mensal é CONSTANTE ao longo dos ciclos.
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
 * Adiciona `meses` a uma data mantendo o dia de vencimento desejado.
 * Trata meses curtos: se o dia não existe no mês alvo (ex.: 31 em fevereiro),
 * usa o último dia do mês. Retorna string ISO (YYYY-MM-DD).
 *
 * @param dataBase data de referência
 * @param meses    quantos meses somar (>= 1)
 * @param diaVencimento dia desejado do mês (1-31)
 */
export function adicionarMeses(
  dataBase: Date,
  meses: number,
  diaVencimento: number
): string {
  const ano = dataBase.getFullYear()
  const mesAlvo = dataBase.getMonth() + meses // 0-indexed
  // Último dia do mês alvo: dia 0 do mês seguinte.
  const ultimoDia = new Date(ano, mesAlvo + 1, 0).getDate()
  const dia = Math.min(diaVencimento, ultimoDia)
  const d = new Date(ano, mesAlvo, dia)
  // Normaliza para ISO sem fuso (usa componentes locais).
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${mm}-${dd}`
}

/**
 * Próximo vencimento a partir da data do empréstimo: o mês SEGUINTE, no dia
 * de vencimento. (Ciclo 1 vence 1 mês após o empréstimo.)
 */
export function proximoVencimento(dataBase: Date, diaVencimento: number): string {
  return adicionarMeses(dataBase, 1, diaVencimento)
}

/** Dados calculados de um ciclo, prontos para inserir no banco. */
export interface CicloCalculado {
  competencia: number
  data_vencimento: string
  juros_devido: number
  valor_quitacao: number
}

/**
 * Constrói o ciclo de competência N.
 * O vencimento é `competencia` meses após a data do empréstimo.
 * Como o juro é constante, todos os ciclos têm o mesmo juros_devido.
 */
export function construirCiclo(params: {
  competencia: number
  principal: number
  taxaMensal: number
  dataEmprestimo: Date
  diaVencimento: number
}): CicloCalculado {
  const { competencia, principal, taxaMensal, dataEmprestimo, diaVencimento } =
    params
  return {
    competencia,
    data_vencimento: adicionarMeses(
      dataEmprestimo,
      competencia,
      diaVencimento
    ),
    juros_devido: jurosMensal(principal, taxaMensal),
    valor_quitacao: valorQuitacao(principal, taxaMensal),
  }
}
