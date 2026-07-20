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
