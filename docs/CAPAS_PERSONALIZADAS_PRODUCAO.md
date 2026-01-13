# Capas Personalizadas - Producao, Carrinho e Fabrica (Proposta)

## Objetivo
Documentar a logica e o desenho tecnico para criar o fluxo de producao de capas personalizadas, com carrinho de producao, pedido para fabrica, novos status e timeline. O foco e manter compatibilidade com a stack atual e com o modulo de Capas Personalizadas ja existente.

---

## Stack atual (base para esta proposta)

### Frontend
- React + Vite + TypeScript
- TanStack Query (React Query) para dados
- Axios (client)
- Tailwind + shadcn/ui (UI)
- Zod + React Hook Form (formularios)

### Backend (documentacao atual)
- API REST com padrao `/api/v1`
- Auth JWT + RBAC
- Postgres (Supabase) com RLS e audit

---

## Contexto atual (Capas Personalizadas)
Ja existe o recurso de `capas-personalizadas` com:
- CRUD completo
- Status (1..6)
- Pagamento
- Upload de foto
- Envio para producao (bulk)

Faltam:
- Carrinho de producao (estilo e-commerce)
- Pedido de producao agrupado (para fabrica)
- Portal da fabrica com login
- Status de producao da fabrica
- Timeline/log por etapa

---

## Nova logica (visao geral)

```mermaid
flowchart TD
    A[Vendedor cria capa personalizada] --> B[Admin adiciona ao carrinho]
    B --> C[Carrinho aberto]
    C --> D[Admin fecha carrinho]
    D --> E[Pedido enviado para fabrica (Encomenda realizada)]
    E --> F[Fabrica recebe pedido]
    F --> G[Fabrica despacha pedido]
```

---

## Fluxos por perfil

### Vendedor
- Cria capa personalizada com cliente, modelo e foto.
- Acompanha status (ex: Encomendado a Fabrica).
- Visualiza detalhes e foto.

### Administrativo
- Lista capas personalizadas e seleciona itens para carrinho.
- Carrinho permite adicionar/remover pedidos.
- Ao fechar carrinho: cria pedido de producao e altera status das capas.
- Acompanha timeline de cada pedido de producao.

### Fabrica
- Login dedicado com role restrita (ex: `fabrica`).
- Lista pedidos enviados para fabrica.
- Detalha pedidos com foto, modelo, observacao, quantidade.
- Registra valor total do pedido.
- Atualiza status (pedido recebido, pedido despachado).

---

## Modelagem sugerida (backend)

### 1) Ajustes em `capas_personalizadas`
Adicionar campos para linkar ao pedido de producao:
- `production_order_id` (nullable)
- `production_order_item_id` (nullable, opcional)
- `production_status_at` (timestamp)

Observacao: o campo `sended_to_production_at` ja existe e pode virar o mesmo evento de "fechar carrinho".

### 2) Tabela `producao_pedidos`
Campos sugeridos:
- `id`
- `status` (enum): `carrinho_aberto`, `encomenda_realizada`, `pedido_recebido`, `pedido_despachado`, `cancelado`
- `created_by_id` (admin)
- `store_id` (opcional, se separar por loja)
- `total_itens`
- `total_qtd`
- `factory_total` (valor definido pela fabrica)
- `factory_notes` (opcional)
- `created_at`, `closed_at`, `received_at`, `dispatched_at`

### 3) Tabela `producao_pedido_itens`
Item vincula uma capa ao pedido:
- `id`
- `producao_pedido_id`
- `capa_id`
- `qty`
- `selected_product` (snapshot)
- `product_reference` (snapshot)
- `customer_device_name` (snapshot)
- `observacao` (snapshot)
- `photo_url` (snapshot)
- `created_at`

### 4) Tabela `producao_eventos` (timeline)
Log por etapa (admin + fabrica):
- `id`
- `entity_type` (ex: `producao_pedido`, `capa`)
- `entity_id`
- `action` (ex: `cart_created`, `item_added`, `cart_closed`, `pedido_recebido`, `pedido_despachado`)
- `from_status`, `to_status`
- `actor_id`, `actor_role`
- `metadata` (json)
- `created_at`

---

## Status (alinhado com backend)

### Capas Personalizadas
1. Encomenda solicitada
2. Produto indisponivel
3. Disponivel na loja
4. Venda realizada
5. Cancelada
6. Enviado para Producao (UI pode exibir "Encomendado a Fabrica")

### Carrinho/Pedido de Producao
- `carrinho_aberto` (interno)
- `encomenda_realizada` (carrinho fechado)
- `pedido_recebido` (endpoint `/producao/pedidos/{id}/receber`)
- `pedido_despachado` (a alinhar com backend)
- `cancelado` (status 6 quando `DELETE /producao/carrinho`)

---

## Permissoes
Para acessar os endpoints de producao, o usuario deve atender:
- `isGlobalAdmin() = true`
- `isGlobalAdmin()` retorna true se `users.is_super_admin = true` OU se existir `store_users.role = 'admin'`.

---

## Regras de negocio (alinhadas com backend)

1. **Validacao previa antes de adicionar ao carrinho**
   - Use `POST /producao/carrinho/validar` com os IDs selecionados.
   - O `GET /producao/carrinho` nao retorna `eligible_capa_ids` (performance).

2. **Bloqueios retornam motivo**
   - `NOT_FOUND`, `CANCELLED`, `NO_PHOTO`, `ALREADY_IN_CART`, `ALREADY_SENT`, `INVALID_STATUS`.

3. **Adicionar ao carrinho**
   - Apenas capas elegiveis devem ser enviadas para `/producao/carrinho/itens`.

4. **Cancelar carrinho**
   - `DELETE /producao/carrinho` muda o status para `CANCELADO` (6) e reverte capas para `ENCOMENDA_SOLICITADA` (1).
   - Carrinho nao e deletado (auditoria).

5. **Remover itens em lote**
   - `DELETE /producao/carrinho/itens/bulk` remove multiplos itens de uma vez.

---

## Endpoints confirmados (backend)
**Base path**: `/api/v1`

### Carrinho de Producao
| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| `GET` | `/producao/carrinho` | Retorna carrinho aberto |
| `POST` | `/producao/carrinho/validar` | Valida capas antes de adicionar |
| `POST` | `/producao/carrinho/itens` | Adiciona itens no carrinho |
| `DELETE` | `/producao/carrinho/itens/{id}` | Remove item do carrinho |
| `DELETE` | `/producao/carrinho/itens/bulk` | Remove varios itens |
| `POST` | `/producao/carrinho/fechar` | Fecha carrinho e cria pedido |
| `DELETE` | `/producao/carrinho` | Cancela carrinho (status 6) |

**POST /producao/carrinho/validar**
```json
{
  "capa_ids": [27, 28, 29]
}
```

**Response**
```json
{
  "data": {
    "eligible": [27, 29],
    "blocked": [
      { "id": 28, "reason": "NO_PHOTO", "message": "Capa nao possui foto" }
    ],
    "eligible_count": 2,
    "blocked_count": 1
  }
}
```

**DELETE /producao/carrinho/itens/bulk**
```json
{
  "item_ids": [1, 2, 3]
}
```

**Response**
```json
{
  "message": "2 item(ns) removido(s)",
  "data": {
    "removed": [1, 2],
    "errors": [{ "id": 3, "message": "Item nao encontrado no carrinho." }],
    "removed_count": 2,
    "error_count": 1
  }
}
```

### Pedidos de Producao
| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| `GET` | `/producao/pedidos` | Lista pedidos |
| `GET` | `/producao/pedidos/{id}` | Detalha pedido |
| `PATCH` | `/producao/pedidos/{id}/receber` | Fabrica confirma recebimento |
| `DELETE` | `/producao/pedidos/{id}` | Cancela pedido |

---

## Endpoints pendentes/alinhamento necessario
- Timeline de pedido e capa (`/producao/pedidos/{id}/timeline` e `/capas-personalizadas/{id}/timeline`).
- Endpoint para `pedido_despachado`.
- Endpoint para fabrica informar `factory_total`.

---

## Frontend sugerido (baseado na stack atual)

### Novos modulos/pages
- `pages/producao/ProducaoCarrinho.tsx`
- `pages/producao/ProducaoPedidos.tsx`
- `pages/producao/ProducaoPedidoDetail.tsx`
- `pages/fabrica/FabricaPedidos.tsx`
- `pages/fabrica/FabricaPedidoDetail.tsx`

### Novos services/hooks
- `services/producao.service.ts`
- `hooks/api/use-producao.ts`
- `types/producao.types.ts`

### Integracao recomendada (alinhada com backend)
- Validar IDs com `POST /producao/carrinho/validar`.
- Exibir bloqueios retornados pelo backend.
- Adicionar apenas `eligible` em `POST /producao/carrinho/itens`.
- Remover itens em lote com `DELETE /producao/carrinho/itens/bulk`.
- Cancelar carrinho com `DELETE /producao/carrinho` (reverte capas).

```typescript
const validation = await api.post('/producao/carrinho/validar', {
  capa_ids: selectedIds,
});

if (validation.data.blocked_count > 0) {
  validation.data.blocked.forEach((item: { id: number; message: string }) => {
    toast.warning(`Capa #${item.id}: ${item.message}`);
  });
}

if (validation.data.eligible_count > 0) {
  await api.post('/producao/carrinho/itens', {
    capa_ids: validation.data.eligible,
  });
}
```

```typescript
await api.delete('/producao/carrinho/itens/bulk', {
  data: { item_ids: [1, 2, 3] },
});
```

### UI sugerida (admin)
- Lista de capas com botao "Adicionar ao carrinho"
- Pagina do carrinho com:
  - Lista de itens
  - Totais
  - Botao "Fechar carrinho"
  - Botao "Cancelar carrinho"
  - Remover item
- Pedidos de producao:
  - Filtros por status/data/loja
  - Detalhe com lista de itens e timeline

### UI sugerida (fabrica)
- Lista de pedidos:
  - Filtros por status e data
  - Status badge
- Detalhe do pedido:
  - Data do pedido
  - Total de itens
  - Modelo/dados do celular
  - Quantidade
  - Observacao
  - Link para download da foto
  - Campo para `valor total` (factory_total)
  - Botoes "Pedido recebido" e "Pedido despachado"

---

## Timeline (admin)
Nota: backend ainda nao expos endpoint de timeline. Necessario alinhar antes da implementacao.

Sugestao de eventos exibidos:
- Capa criada
- Foto enviada
- Pagamento registrado
- Adicionado ao carrinho
- Removido do carrinho
- Carrinho fechado (pedido criado)
- Carrinho cancelado
- Pedido recebido pela fabrica
- Pedido despachado pela fabrica

Exibir com:
- Data/hora
- Usuario/role que realizou
- Status anterior e novo
- Observacao (se houver)

---

## Validacoes e erros esperados

- `403 FORBIDDEN` quando o usuario nao e global admin.
- `409 CONFLICT` quando:
  - Capa ja esta em carrinho aberto
  - Capa ja pertence a pedido fechado

- `422 UNPROCESSABLE` quando:
  - Capa sem foto
  - Carrinho fechado sem itens

- Bloqueios retornados pelo backend:
  - `NOT_FOUND`, `CANCELLED`, `NO_PHOTO`, `ALREADY_IN_CART`, `ALREADY_SENT`, `INVALID_STATUS`

---

## Observacoes finais
- A forma mais simples e tratar o carrinho como um `producao_pedidos` com status `carrinho_aberto`.
- Se necessario separar por loja, criar 1 carrinho aberto por loja.
- Para fabrica, recomenda-se um role novo (ex: `fabrica`) e RLS restrito a `producao_pedidos`.

---

## Proximos passos sugeridos
1. Validar com backend a estrutura das tabelas e status.
2. Implementar endpoints pendentes em `/api/v1/producao/*`.
3. Atualizar frontend com novo fluxo de carrinho e portal da fabrica.
4. Adicionar timeline e logs para auditoria.
