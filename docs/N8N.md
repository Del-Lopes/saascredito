# Automação com N8N — Fase 4

Este guia descreve como conectar o N8N ao sistema para fazer follow-up
automático (lembretes de vencimento e cobrança de atraso).

O app expõe uma **API HTTP** para o N8N (não precisa acessar o Postgres direto),
protegida pelo header `x-jobs-secret` (valor da env `JOBS_SECRET`).

## Endpoints disponíveis

| Método | Rota | Função |
|---|---|---|
| `GET`  | `/api/jobs/filas?tipo=lembrete&dias=3` | Ciclos a vencer em 3 dias, sem lembrete enviado |
| `GET`  | `/api/jobs/filas?tipo=cobranca` | Ciclos atrasados sem cobrança enviada hoje |
| `POST` | `/api/jobs/notificar` | Registra que uma notificação foi enviada (dedup) |
| `POST` | `/api/jobs/marcar-atrasos` | Marca ciclos vencidos como `atrasado` (rodar 1x/dia) |

Todos exigem o header:

```
x-jobs-secret: <valor de JOBS_SECRET>
```

### Formato das filas (GET /api/jobs/filas)

```json
{
  "tipo": "lembrete",
  "dias": 3,
  "itens": [
    {
      "ciclo_id": "uuid",
      "tenant_id": "uuid",
      "emprestimo_id": "uuid",
      "data_vencimento": "2026-07-23",
      "juros_devido": 50.0,
      "valor_quitacao": 1050.0,
      "cliente_id": "uuid",
      "nome": "Fulano",
      "telefone": "+5511999998888"
    }
  ]
}
```

### Registrar envio (POST /api/jobs/notificar)

```json
{
  "ciclo_id": "uuid",
  "tenant_id": "uuid",
  "canal": "whatsapp",
  "tipo": "lembrete",
  "status": "enviado",
  "payload": { "mensagem": "..." }
}
```

> Se já houver um envio `enviado` para o mesmo `(ciclo_id, tipo)`, a resposta
> vem `{ ok: true, duplicado: true }` — o índice único no banco garante a
> idempotência mesmo se o workflow rodar duas vezes.

## Workflows a criar no N8N

### 0. Job diário: marcar atrasos (rodar ANTES dos outros)

```
[Schedule: todo dia 06:00]
  → [HTTP Request: POST {APP_URL}/api/jobs/marcar-atrasos]
       header x-jobs-secret: {{$env.JOBS_SECRET}}
```

### 1. Lembrete de vencimento (D-3)

```
[Schedule: todo dia 09:00]
  → [HTTP Request: GET {APP_URL}/api/jobs/filas?tipo=lembrete&dias=3]
       header x-jobs-secret: {{$env.JOBS_SECRET}}
  → [Split Out: itens]                       (um item por vencimento)
  → [Enviar WhatsApp/E-mail]                 (nó do seu provedor)
       para: {{$json.telefone}}
       texto: "Olá {{$json.nome}}, seu vencimento é dia
               {{$json.data_vencimento}}. Juros do mês:
               R$ {{$json.juros_devido}}. Para quitar:
               R$ {{$json.valor_quitacao}}."
  → [HTTP Request: POST {APP_URL}/api/jobs/notificar]
       body: { ciclo_id, tenant_id, canal:"whatsapp",
               tipo:"lembrete", status:"enviado" }
```

### 2. Cobrança de atraso (diária)

```
[Schedule: todo dia 10:00]
  → [HTTP Request: GET {APP_URL}/api/jobs/filas?tipo=cobranca]
       header x-jobs-secret: {{$env.JOBS_SECRET}}
  → [Split Out: itens]
  → [Enviar WhatsApp/E-mail]
       texto: "Olá {{$json.nome}}, identificamos {{$json.dias_atraso}}
               dia(s) de atraso. Regularize o valor de
               R$ {{$json.juros_devido}} (rolar) ou
               R$ {{$json.valor_quitacao}} (quitar)."
  → [HTTP Request: POST {APP_URL}/api/jobs/notificar]
       body: { ciclo_id, tenant_id, canal:"whatsapp",
               tipo:"cobranca", status:"enviado" }
```

## Regra de dia útil (opcional, recomendado)

Antes de disparar, um nó **IF** pode checar se hoje é fim de semana/feriado e,
se for, adiar. As views já filtram por data exata; ajuste o parâmetro `dias`
do lembrete conforme sua régua (ex.: D-3 e D-1).

## Provedores de mensagem

O nó "Enviar WhatsApp/E-mail" depende do que você contratar:
- **WhatsApp**: API oficial (Cloud API da Meta), ou provedores como Z-API,
  Twilio, 360dialog. Cada um tem seu nó/credencial no N8N.
- **E-mail**: nó SMTP nativo do N8N, ou SendGrid/Resend.

> **Pendência sua:** contratar/configurar o provedor e suas credenciais no N8N.
> O app já entrega as filas prontas e registra os envios — falta só o "braço"
> que dispara a mensagem.

## Opcional: IA para redigir mensagens

Entre a fila e o envio, insira um nó de IA (ex.: node do Claude/OpenAI) que
recebe `{nome, dias_atraso, juros_devido, valor_quitacao}` e devolve uma
mensagem personalizada, em vez do texto fixo.
