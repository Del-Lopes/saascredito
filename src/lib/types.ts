/**
 * Tipos do domínio (espelham as tabelas do banco — migration 0001).
 * Valores monetários chegam do banco como number (numeric -> number via driver).
 */

export type EmprestimoStatus = "ativo" | "quitado" | "cancelado"
export type CicloDesfecho =
  | "em_aberto"
  | "rolou"
  | "quitou"
  | "atrasado"
  | "cancelado"

export interface Cliente {
  id: string
  tenant_id: string
  nome: string
  telefone: string | null
  documento: string | null
  observacoes: string | null
  ativo: boolean
  created_at: string
}

export interface Emprestimo {
  id: string
  tenant_id: string
  cliente_id: string
  valor_principal: number
  taxa_juros_mensal: number
  dia_vencimento: number
  data_emprestimo: string
  status: EmprestimoStatus
  observacoes: string | null
  ativo: boolean
  created_at: string
}

/** Empréstimo com dados do cliente embutidos (join). */
export interface EmprestimoComCliente extends Emprestimo {
  clientes: Pick<Cliente, "id" | "nome"> | null
}

export interface Ciclo {
  id: string
  tenant_id: string
  emprestimo_id: string
  competencia: number
  data_vencimento: string
  juros_devido: number
  valor_quitacao: number
  desfecho: CicloDesfecho
  valor_pago: number
  data_pagamento: string | null
  created_at: string
}

export interface Profile {
  id: string
  tenant_id: string
  nome: string | null
  role: "owner" | "operador"
  created_at: string
}

export type ConfirmacaoIntencao = "rolar" | "quitar" | "duvida" | "indefinido"
export type ConfirmacaoStatus = "pendente" | "confirmado" | "recusado"

export interface Confirmacao {
  id: string
  tenant_id: string
  cliente_id: string | null
  ciclo_id: string | null
  telefone: string | null
  mensagem: string
  intencao: ConfirmacaoIntencao
  ia_confianca: number | null
  status: ConfirmacaoStatus
  resolvido_por: string | null
  resolvido_em: string | null
  created_at: string
}

/** Linha da view vw_confirmacoes (confirmação + cliente + ciclo). */
export interface ConfirmacaoView {
  id: string
  tenant_id: string
  cliente_id: string | null
  ciclo_id: string | null
  telefone: string | null
  mensagem: string
  intencao: ConfirmacaoIntencao
  ia_confianca: number | null
  status: ConfirmacaoStatus
  resolvido_em: string | null
  created_at: string
  cliente_nome: string | null
  emprestimo_id: string | null
  competencia: number | null
  data_vencimento: string | null
  juros_devido: number | null
  valor_quitacao: number | null
  ciclo_desfecho: CicloDesfecho | null
}
