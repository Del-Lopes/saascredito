# Workflows do N8N — prontos para importar

Três workflows que automatizam o follow-up. O app já expõe a API; aqui está o
"braço" que dispara as mensagens. Detalhes da API em [`../docs/N8N.md`](../docs/N8N.md).

| Arquivo | O que faz | Horário |
|---|---|---|
| `1-marcar-atrasos.json` | Marca ciclos vencidos como `atrasado` | 06:00 |
| `2-lembrete-vencimento.json` | Avisa quem vence em 3 dias | 09:00 |
| `3-cobranca-atraso.json` | Cobra quem está atrasado | 10:00 |

## Passo a passo

### 1. Definir as variáveis de ambiente no N8N

Os workflows usam duas variáveis (não têm segredos hardcoded):

- **`APP_URL`** — a URL pública do app (ex.: `https://seu-app.vercel.app`).
  Em teste local, use um túnel (ngrok) apontando para `http://localhost:3000`.
- **`JOBS_SECRET`** — o mesmo valor do `.env.local` do app.

No N8N: **Settings → Variables** (ou variáveis de ambiente do container, se
self-host). Alternativa: substituir `{{ $env.APP_URL }}` / `{{ $env.JOBS_SECRET }}`
direto nos nós HTTP.

### 2. Importar os workflows

Para cada arquivo: **Workflows → Import from File** → selecione o `.json`.

### 3. Plugar o provedor de mensagem

Cada workflow (2 e 3) tem um nó marcado **"⚠️ SUBSTITUIR: enviar WhatsApp/e-mail"**.
Troque-o pelo nó do seu provedor:

- **WhatsApp**: Meta Cloud API, Z-API, Twilio ou 360dialog.
- **E-mail**: nó SMTP nativo do N8N, SendGrid ou Resend.

Use estas expressões no nó do provedor:
- Destino: `{{ $json.telefone }}`
- Mensagem: `{{ $json.mensagem }}` (já vem montada pelo nó anterior)

### 4. Ativar

Ative os 3 workflows (toggle no topo). Ordem lógica no dia: atrasos (06:00) →
lembretes (09:00) → cobranças (10:00).

## Como funciona a proteção contra duplicidade

O nó final (`POST /api/jobs/notificar`) registra o envio. O banco tem índice
único por `(ciclo_id, tipo)` — se rodar duas vezes, o segundo é ignorado. Então
não há risco de mandar a mesma mensagem duas vezes, mesmo se um workflow reexecutar.

## Opcional: IA para redigir as mensagens

Entre "Monta mensagem" e o envio, insira um nó de IA (Claude/OpenAI) que recebe
`{nome, dias_atraso, juros_devido, valor_quitacao}` e devolve um texto
personalizado, em vez do texto fixo. (Posso construir um endpoint no app que faz
isso — é só pedir.)

## Testar sem o N8N

Você pode validar a API direto, antes de montar tudo:

```bash
# fila de lembretes (D-3)
curl -H "x-jobs-secret: SEU_SECRET" \
  "http://localhost:3000/api/jobs/filas?tipo=lembrete&dias=3"

# marcar atrasos
curl -X POST -H "x-jobs-secret: SEU_SECRET" \
  "http://localhost:3000/api/jobs/marcar-atrasos"
```
