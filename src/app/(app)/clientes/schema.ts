import { z } from "zod"

export const clienteSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome"),
  telefone: z
    .string()
    .trim()
    .optional()
    .or(z.literal("")),
  documento: z.string().trim().optional().or(z.literal("")),
  observacoes: z.string().trim().optional().or(z.literal("")),
})

export type ClienteInput = z.infer<typeof clienteSchema>
