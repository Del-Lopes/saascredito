import { z } from "zod"

export const emprestimoSchema = z.object({
  cliente_id: z.string().uuid("Selecione um cliente"),
  // Valor em reais (string do input) — convertido no parse
  valor_principal: z.coerce
    .number()
    .positive("Valor deve ser maior que zero"),
  // Taxa mensal em % (ex.: 5 = 5% ao mês) — guardamos como fração no banco
  taxa_juros_mensal_pct: z.coerce
    .number()
    .min(0, "Taxa não pode ser negativa"),
  dia_vencimento: z.coerce
    .number()
    .int()
    .min(1, "Dia inválido")
    .max(31, "Dia inválido"),
  data_emprestimo: z.string().min(1, "Informe a data"),
  observacoes: z.string().trim().optional().or(z.literal("")),
})

export type EmprestimoInput = z.infer<typeof emprestimoSchema>
