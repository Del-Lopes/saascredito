import type { ConfirmacaoIntencao } from "@/lib/types"

/**
 * Classificação da resposta do cliente (WhatsApp) em uma intenção.
 * Usa a API da Groq (OpenAI-compatible) quando GROQ_API_KEY existe; caso
 * contrário — ou em qualquer erro — cai no fallback por palavra-chave, para
 * o fluxo nunca quebrar.
 */

export interface Classificacao {
  intencao: ConfirmacaoIntencao
  /** 0..1, ou null quando veio do fallback. */
  confianca: number | null
}

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
const MODELO = "llama-3.3-70b-versatile"

const SYSTEM_PROMPT = `Você classifica respostas de clientes de um sistema de empréstimos rotativos.
No modelo, todo mês o cliente escolhe: ROLAR (pagar só os juros) ou QUITAR (pagar tudo).
Dada a mensagem do cliente, responda SOMENTE um JSON no formato:
{"intencao": "rolar" | "quitar" | "duvida" | "indefinido", "confianca": number}
Regras:
- "rolar": quer pagar só os juros / renovar / arrolar / deixar rolando.
- "quitar": quer pagar tudo / já pagou o total / quitou / mandou comprovante de quitação.
- "duvida": está perguntando algo, negociando, pedindo prazo, sem decisão clara.
- "indefinido": não dá para inferir.
"confianca" é sua certeza de 0 a 1. Responda apenas o JSON, sem texto extra.`

/** Fallback simples por palavra-chave (sem IA). */
export function classificarPorPalavra(mensagem: string): ConfirmacaoIntencao {
  const t = mensagem
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos
  if (/\b(rolar|arrolar|rolo|renovar|so os juros|so juros|deixa rolando)\b/.test(t)) {
    return "rolar"
  }
  if (/\b(quitar|quitei|quito|paguei|pagar tudo|quitacao|comprovante)\b/.test(t)) {
    return "quitar"
  }
  if (/\?|duvida|quando|prazo|posso|consigo|negociar/.test(t)) {
    return "duvida"
  }
  return "indefinido"
}

export async function classificarIntencao(
  mensagem: string
): Promise<Classificacao> {
  const key = process.env.GROQ_API_KEY
  if (!key) {
    return { intencao: classificarPorPalavra(mensagem), confianca: null }
  }

  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: MODELO,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: mensagem },
        ],
      }),
    })

    if (!res.ok) throw new Error(`Groq ${res.status}`)

    const data = await res.json()
    const raw = data?.choices?.[0]?.message?.content
    const parsed = JSON.parse(raw) as {
      intencao?: string
      confianca?: number
    }

    const valida: ConfirmacaoIntencao[] = [
      "rolar",
      "quitar",
      "duvida",
      "indefinido",
    ]
    const intencao = valida.includes(parsed.intencao as ConfirmacaoIntencao)
      ? (parsed.intencao as ConfirmacaoIntencao)
      : classificarPorPalavra(mensagem)
    const confianca =
      typeof parsed.confianca === "number"
        ? Math.max(0, Math.min(1, parsed.confianca))
        : null

    return { intencao, confianca }
  } catch {
    // qualquer falha (rede, parse, rate limit) -> fallback, nunca quebra
    return { intencao: classificarPorPalavra(mensagem), confianca: null }
  }
}

/** Normaliza telefone para só dígitos (comparação tolerante a formato). */
export function soDigitos(telefone: string | null | undefined): string {
  return (telefone ?? "").replace(/\D/g, "")
}
