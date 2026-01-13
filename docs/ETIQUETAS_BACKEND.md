# Etiquetas - Backend (Pedidos e Capas Personalizadas)

## Objetivo
Documentar uma solucao de backend robusta e configuravel para geracao de etiquetas
de pedidos e capas personalizadas, com QR code, dados do cliente, loja, vendedor
e status de pagamento (pago/em aberto).

---

## Stack e premissas (base atual)
- API REST padrao `/api/v1`
- Backend Laravel (provavel pelo uso de Spatie e padrao atual)
- Auth JWT + RBAC
- Postgres + Storage (S3/Supabase)
- Queue/worker para jobs de geracao e merge
- Frontend React + TanStack Query (consumo simples via endpoints)

---

## Pacotes recomendados (nivel producao)

### PDF (HTML -> PDF)
- **spatie/browsershot** (Chrome/Puppeteer): maior fidelidade de layout
- **barryvdh/laravel-dompdf**: simples, mas CSS limitado
- **barryvdh/laravel-snappy** (wkhtmltopdf): meio-termo, depende de binario no SO

**Sugestao pratica**: Browsershot para PDF + ZPL para termica.

### QR Code
- **simplesoftwareio/simple-qrcode**: facil de embutir (PNG/SVG) no HTML
- **endroid/qr-code**: alternativa mais low-level

### ZPL (termicas Zebra)
- **robgridley/zebra**: builder ZPL + envio TCP/IP (porta 9100)
- **variograma/weez-zpl**: alternativa mais simples
- **Labelary API**: preview/validacao de ZPL (render PNG/PDF)

### Merge de PDF (bulk)
- **iio/libmergepdf** (usa FPDI)
- **fpdi/fpdi** (base)

### Auditoria
- **spatie/laravel-activitylog** (log de geracao/reimpressao/alteracoes)

### Idempotencia
- **square1/laravel-idempotency** (evita double click/retry)

---

## Arquitetura recomendada (render engine plugavel)
Criar um motor de renderizacao desacoplado.

```php
interface LabelRendererInterface
{
    public function render(Template $template, array $payload, array $options): RenderResult;
}
```

Implementacoes:
- `PdfBrowsershotRenderer`
- `PdfDompdfRenderer`
- `PdfSnappyRenderer`
- `ZplRenderer`

`RendererSelector` escolhe o renderer por `template.format`, `template.engine`
e/ou configuracao por loja.

---

## Padronizacao das informacoes (payload unico)
Padrao unico para todas as entidades, com chaves comuns.

```json
{
  "entity_type": "pedido",
  "entity_id": 123,
  "entity": {
    "id": 123,
    "title": "Capa iPhone 14",
    "status": 3,
    "status_label": "Disponivel na Loja",
    "created_at": "2026-01-13T10:20:00Z"
  },
  "customer": {
    "id": 55,
    "name": "Joao Silva",
    "phone": "(47) 99999-0000"
  },
  "store": {
    "id": 2,
    "name": "Loja Tijucas"
  },
  "seller": {
    "id": 9,
    "name": "Maria"
  },
  "payment": {
    "status": "open",
    "paid_at": null,
    "total": 99.9,
    "paid_amount": 0,
    "remaining": 99.9
  },
  "qr": {
    "payload": "https://app.maiscapinhas.com.br/pedidos/123"
  },
  "meta": {
    "generated_at": "2026-01-13T10:25:00Z",
    "source": "single"
  }
}
```

Para capas personalizadas, manter o mesmo envelope e trocar `entity`:

```json
{
  "entity_type": "capa_personalizada",
  "entity_id": 987,
  "entity": {
    "id": 987,
    "title": "Capa Galaxy S23",
    "qty": 1,
    "status": 6,
    "status_label": "Enviado para Producao"
  },
  "customer": {
    "id": 55,
    "name": "Joao Silva",
    "phone": "(47) 99999-0000"
  },
  "store": {
    "id": 2,
    "name": "Loja Tijucas"
  },
  "seller": {
    "id": 9,
    "name": "Maria"
  },
  "payment": {
    "status": "paid",
    "paid_at": "2026-01-12",
    "total": 120,
    "paid_amount": 120,
    "remaining": 0
  },
  "qr": {
    "payload": "https://app.maiscapinhas.com.br/capas/987"
  },
  "meta": {
    "generated_at": "2026-01-13T10:25:00Z",
    "source": "bulk"
  }
}
```

Padrao `payment.status`: `open | paid | partial | cancelled`.
Campos opcionais: `total`, `paid_amount`, `remaining`.

---

## Fields allowlist + aliases (padronizacao e seguranca)
- `allowed_fields`: lista valida para cada `entity_type`
- `field_aliases`: atalhos amigaveis para templates
- `fields` no request: opcional, usado apenas como override/limit

Exemplo de aliases:
- `customer_name` -> `customer.name`
- `customer_phone` -> `customer.phone`
- `store_name` -> `store.name`
- `seller_name` -> `seller.name`
- `payment_status` -> `payment.status`
- `qr_payload` -> `qr.payload`

Evita quebra de template ao renomear chaves internas.
O template define os campos que usa; `fields` nao deve ser obrigatorio.

---

## Templates e layout
Templates versionados e com metadata de layout. Versoes ficam em
`label_template_versions`, e o template ativo aponta `active_version_id`.

Recomendado guardar:
- `width_mm`, `height_mm`, `dpi`, `margin_mm`, `orientation`
- `font_family`, `font_size_base`
- `engine` (browsershot/dompdf/snappy/zpl)
- `format` (pdf | zpl | json)
- `variables_schema` (json) opcional para validacao

### Seguranca de template
Evitar Blade livre se muitos usuarios editam:
- Preferir Mustache/Liquid/Twig com sandbox
- Ou usar JSON declarativo (render interno)
- Se Blade: restringir roles, validar variaveis e bloquear diretivas perigosas

---

## Cadastro e configuracao (defaults)
Configuracoes por escopo (global/loja/entidade):
- template default
- formato/engine default
- campos habilitados (allowlist)
- qr payload default
- copias default
- opcoes de renderizacao (DPI, margens, etc)

---

## Modelagem sugerida (Postgres)

### `label_templates`
- `id`
- `name`
- `entity_type` (pedido | capa_personalizada | producao_pedido)
- `active_version_id`
- `is_active`
- `created_by`, `created_at`, `updated_at`

### `label_template_versions`
- `id`
- `template_id`
- `body` (template string)
- `format` (pdf | zpl | json)
- `engine` (browsershot | dompdf | snappy | zpl)
- `width_mm`, `height_mm`, `dpi`, `margin_mm`, `orientation`
- `font_family`, `font_size_base`
- `variables_schema` (json, opcional)
- `version_label` (ex: v1, v2)
- `template_hash`
- `created_by`, `created_at`

### `label_settings`
- `id`
- `scope` (global | store)
- `store_id` (nullable)
- `entity_type`
- `default_template_id`
- `default_format`
- `default_engine`
- `default_copies`
- `allowed_fields` (json array)
- `field_aliases` (json map)
- `default_qr_payload_template`
- `default_render_options` (json)
- `updated_by`, `updated_at`

### `label_jobs`
- `id`
- `entity_type`
- `requested_by`
- `status` (queued | processing | done | failed)
- `total_items`
- `processed_items`
- `error_count`
- `output_format` (pdf | zpl)
- `merge_mode` (single_pdf | per_item | zip)
- `chunk_size`
- `filters` (json)
- `output_file_url` (nullable)
- `expires_at` (nullable)
- `created_at`, `finished_at`

### `label_job_items`
- `id`
- `job_id`
- `entity_id`
- `status` (queued | done | failed)
- `attempts`
- `file_url` (nullable)
- `payload_hash`
- `error_message` (nullable)

### `label_files`
- `id`
- `entity_type`
- `entity_id`
- `template_id`
- `template_version_id`
- `format`
- `file_url`
- `data_snapshot` (json)
- `payload_hash`
- `template_hash`
- `render_options` (json)
- `copies`
- `source` (single | bulk | reprint)
- `idempotency_key` (nullable)
- `store_id` (nullable)
- `created_by`, `created_at`

### (Opcional) `label_printers`
- `id`
- `store_id`
- `name`
- `driver` (zpl)
- `host`, `port`
- `dpi`
- `active`

### (Opcional) `label_spool_jobs`
- `id`
- `printer_id`
- `status` (queued | sending | done | failed)
- `zpl_payload`
- `attempts`
- `error_message`
- `label_file_id` (nullable)
- `printer_snapshot` (json)
- `sent_at`
- `ack` (nullable)
- `created_at`, `finished_at`

---

## Indices e constraints (evita dor em producao)
- `label_job_items`: UNIQUE (`job_id`, `entity_id`)
- `label_files`: INDEX (`entity_type`, `entity_id`), INDEX (`store_id`), INDEX (`created_at`)
- `label_templates`: INDEX (`entity_type`, `is_active`)
- `label_settings`: UNIQUE (`scope`, `store_id`, `entity_type`)
- idempotency: UNIQUE (`requested_by`, `idempotency_key`, `endpoint`)
- Enums com CHECK constraints (status, format, engine)

---

## Endpoints sugeridos (com responsabilidades)
Base path: `/api/v1`

### Templates (cadastro e manutencao)
| Metodo | Endpoint | O que faz |
|--------|----------|-----------|
| GET | `/labels/templates` | Lista templates (filtros por `entity_type`, `active`) |
| POST | `/labels/templates` | Cria template e primeira versao |
| GET | `/labels/templates/{id}` | Detalha template + versoes |
| PATCH | `/labels/templates/{id}` | Atualiza metadados e cria nova versao do body |
| POST | `/labels/templates/{id}/activate` | Ativa a versao desejada |
| POST | `/labels/templates/{id}/preview` | Renderiza preview (PNG/PDF) |
| POST | `/labels/templates/{id}/validate` | Valida variaveis, layout e placeholders |
| POST | `/labels/templates/{id}/clone` | Duplica template para nova base |
| GET | `/labels/fields` | Lista allowlist + aliases por entidade |

### Configuracao (defaults)
| Metodo | Endpoint | O que faz |
|--------|----------|-----------|
| GET | `/labels/settings` | Busca defaults (por `store_id` + `entity_type`) |
| PUT | `/labels/settings` | Atualiza defaults por escopo |

### Geracao de etiqueta (somente 1)
| Metodo | Endpoint | O que faz |
|--------|----------|-----------|
| POST | `/labels/render` | Gera etiqueta (sync ou async) |

### Geracao em massa (bulk)
| Metodo | Endpoint | O que faz |
|--------|----------|-----------|
| POST | `/labels/bulk` | Cria job de geracao em massa |
| GET | `/labels/jobs/{id}` | Status do job (progresso e erros) |
| GET | `/labels/jobs/{id}/items` | Itens com status/erro (paginado) |
| POST | `/labels/jobs/{id}/retry` | Reprocessa itens falhados |
| POST | `/labels/jobs/{id}/cancel` | Cancela job (queued/processing) |
| GET | `/labels/jobs/{id}/file` | Download do arquivo consolidado |

### Historico e reimpressao
| Metodo | Endpoint | O que faz |
|--------|----------|-----------|
| GET | `/labels/files` | Lista etiquetas geradas (paginado) |
| GET | `/labels/files/{id}` | Detalha etiqueta gerada (snapshot) |
| POST | `/labels/files/{id}/reprint` | Reimprime usando snapshot + hashes |

### Impressao termica (spool - opcional)
| Metodo | Endpoint | O que faz |
|--------|----------|-----------|
| GET | `/labels/printers` | Lista impressoras cadastradas |
| POST | `/labels/printers` | Cadastra impressora |
| POST | `/labels/spool` | Envia ZPL direto para impressora |

### Atalhos por entidade (opcional)
| Metodo | Endpoint | O que faz |
|--------|----------|-----------|
| POST | `/pedidos/{id}/label` | Gera etiqueta do pedido |
| POST | `/pedidos/labels/bulk` | Etiquetas de pedidos em massa |
| POST | `/capas-personalizadas/{id}/label` | Etiqueta de capa |
| POST | `/capas-personalizadas/labels/bulk` | Etiquetas de capas em massa |

---

## Requests e responses (exemplos)

### POST /labels/render (somente 1)
```json
{
  "mode": "sync",
  "entity_type": "pedido",
  "entity_id": 123,
  "template_id": 5,
  "format": "pdf",
  "engine": "browsershot",
  "copies": 1,
  "fields": ["customer_name", "customer_phone", "store_name", "seller_name", "payment_status"],
  "qr_payload_override": null,
  "render_options": {
    "dpi": 203,
    "margin_mm": 2
  }
}
```

**Response**
```json
{
  "data": {
    "label_id": 3001,
    "file_url": "https://storage.../labels/3001.pdf",
    "format": "pdf"
  }
}
```

Notas:
- `fields` e opcional; se omitido, usa o que o template define.
- Se `mode=async`, a resposta retorna `job_id` em vez de `file_url`.

### POST /labels/bulk (geracao em massa)
```json
{
  "entity_type": "capa_personalizada",
  "selection_mode": "ids",
  "ids": [987, 988, 989],
  "template_id": 7,
  "format": "pdf",
  "engine": "browsershot",
  "merge_mode": "single_pdf",
  "chunk_size": 100
}
```

**Response**
```json
{
  "data": {
    "job_id": 44,
    "status": "queued",
    "total_items": 3
  }
}
```

### POST /labels/bulk (por filtro)
```json
{
  "entity_type": "pedido",
  "selection_mode": "filters",
  "filters": {
    "store_id": 2,
    "status": [1, 3],
    "initial_date": "2026-01-01",
    "final_date": "2026-01-31"
  },
  "template_id": 5,
  "format": "pdf",
  "merge_mode": "zip"
}
```

---

## Regras de negocio
- RBAC: vendedor gera apenas itens da propria loja; admin/gerente pode gerar em massa.
- Auditoria obrigatoria: registrar usuario, entidade, template e hashes.
- Snapshot de dados na geracao (evita divergencia se pedido mudar depois).
- Idempotencia via header `Idempotency-Key`.
- Allowlist valida `fields` e `field_aliases`.
- `fields` no request e opcional e deve ser tratado como override/limit.
- Masking por role deve ser feito no resolver de payload, nao no request.

---

## Preview e validacao (muda o jogo)
Adicionar:
- `POST /labels/templates/{id}/preview` (PNG/PDF)
- `POST /labels/templates/{id}/validate` (campos faltantes, tamanho, placeholders)

Para ZPL, usar Labelary para preview e validacao visual.

### Privacidade no preview ZPL (Labelary)
- Preview deve usar payload fake por padrao.
- Quando usar payload real, aplicar mascara (nome parcial, telefone truncado).

---

## Bulk escalavel
- Processar em chunks (ex: 100 por vez)
- `label_job_items` com retry e erro por item
- Merge apenas no final (se `merge_mode=single_pdf`)
- Definir retention policy (ex: expirar arquivos em X dias)

---

## Impressao termica (spool)
Se precisar enviar direto para impressora de rede:
- Gerar ZPL e enviar via TCP 9100
- Guardar spool job para reenvio/auditoria

---

## Seguranca do renderer (principalmente Browsershot)
- Rodar o renderer em container/worker isolado (fila)
- Bloquear rede ou aplicar whitelist para evitar SSRF
- Assets (logo/fontes) preferir locais ou URLs assinadas
- Sanitizacao/sandbox de template obrigatoria

---

## QR code (configuracao)
Campo `default_qr_payload_template` em `label_settings`.
Exemplos:
- `https://app.maiscapinhas.com.br/pedidos/{{entity.id}}`
- `https://app.maiscapinhas.com.br/capas/{{entity.id}}`

### QR payload seguro (evitar enumeracao)
- Preferir UUID/slug nao incremental
- Ou HMAC assinado (pedidoId + expires + signature)
- Ou rota que exige auth e o app valida o acesso

---

## Observacoes sobre pagamento
Padronizar tudo em `payment.*` (status, paid_at, total, paid_amount, remaining).
Evitar duplicar regra em `entity.payed`/`entity.payday`.
Para pedido, sugerido:
- criar tabela `pedido_pagamentos`, ou
- relacionar com `sales` (venda registrada) para marcar `paid`.

---

## Proximos passos sugeridos
1. Definir renderer default (Browsershot) e fallback (Dompdf).
2. Implementar endpoints de preview/validate e allowlist de campos.
3. Definir templates iniciais (HTML e ZPL) e layout padrao.
4. Implementar worker para jobs em massa + merge.
5. Integrar spool ZPL se houver impressoras de rede.
