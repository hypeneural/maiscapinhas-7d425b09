# Perguntas para o Backend - Melhoria de Filtros nas Listagens

## Resumo

O frontend precisa implementar filtros avançados nas listagens de **Clientes**, **Pedidos** e **Capas**. Este documento contém perguntas e sugestões para o backend sobre a implementação necessária.

---

## 1. Filtros Atuais (Frontend Types)

### PedidoFilters (existente)
```typescript
interface PedidoFilters {
    store_id?: number;
    user_id?: number;
    status?: PedidoStatus;         // ✅ já existe
    customer_id?: number;
    initial_date?: string;         // ✅ já existe (período)
    final_date?: string;           // ✅ já existe
    brand_id?: number;
    model_id?: number;
    keyword?: string;              // 🔶 precisa suportar ID, nome, telefone
    page?: number;
    per_page?: number;
    sort?: string;
    direction?: 'asc' | 'desc';
}
```

### CapaFilters (existente)
```typescript
interface CapaFilters {
    store_id?: number;
    user_id?: number;
    status?: CapaStatus;           // ✅ já existe
    customer_id?: number;
    initial_date?: string;         // ✅ já existe
    final_date?: string;           // ✅ já existe
    brand_id?: number;
    model_id?: number;
    keyword?: string;              // 🔶 precisa suportar ID, nome, telefone
    payed?: 0 | 1;                 // ✅ já existe
    payday?: string;
    received_by_id?: number;
    page?: number;
    per_page?: number;
    sort?: string;
    direction?: 'asc' | 'desc';
}
```

### CustomerFilters (existente)
```typescript
interface CustomerFilters {
    name?: string;
    email?: string;
    phone?: string;
    city?: string;
    state?: string;
    has_device?: 0 | 1;
    brand_id?: number;
    model_id?: number;
    page?: number;
    per_page?: number;
    sort?: string;
    direction?: 'asc' | 'desc';
    // 🔶 FALTA: keyword para busca unificada?
}
```

---

## 2. Perguntas para o Backend

### 2.1 Busca por Keyword (Pedidos/Capas)

> [!IMPORTANT]
> **Pergunta Principal:** O parâmetro `keyword` já busca em múltiplos campos ou apenas em um?

1. **Quais campos o `keyword` pesquisa atualmente?**
   - [ ] ID do pedido/capa
   - [ ] Nome do produto (`selected_product`)
   - [ ] Referência do produto (`product_reference`) [capas]
   - [ ] Nome do cliente (`customer.name`)
   - [ ] Telefone do cliente (`customer.phone`)
   - [ ] Email do cliente (`customer.email`)
   - [ ] Observações (`obs`)

2. **O `keyword` aceita busca por ID numérico?**
   - Ex: Usuário digita `123` → deve retornar pedido/capa com ID 123?
   - Sugestão: Se `keyword` for numérico, buscar por ID. Se texto, buscar por nome/produto.

3. **Existe busca por telefone?**
   - Frontend precisa buscar por telefone do cliente.
   - Pode ser via `keyword` ou parâmetro separado `phone`?

---

### 2.2 Filtros por Período

> [!NOTE]
> Os tipos já têm `initial_date` e `final_date`, mas precisamos confirmar:

4. **Qual o formato esperado das datas?**
   - `YYYY-MM-DD` (ISO)
   - `DD/MM/YYYY` (BR)
   - Timestamp?

5. **As datas filtram por qual campo?**
   - [ ] `created_at`
   - [ ] `updated_at`
   - [ ] `sended_to_production_at` [capas]
   - [ ] `payday` [capas]

6. **É inclusivo? (Ex: `final_date='2024-01-31'` inclui 31/01?)**

---

### 2.3 Filtros por Status

7. **O filtro `status` aceita múltiplos valores?**
   - Atual: `status=1`
   - Desejado: `status=1,2,3` ou `status[]=1&status[]=2`?
   - Isso permitiria filtrar "Aguardando + Em Produção" de uma vez.

---

### 2.4 Clientes - Busca Unificada

8. **Existe parâmetro `keyword` para clientes?**
   - Hoje temos `name`, `email`, `phone` separados
   - Usuário quer digitar em um campo só e buscar em todos
   - Sugestão: adicionar `keyword` que busca em `name`, `email`, `phone`

9. **Filtro por período de cadastro?**
   - `initial_date`, `final_date` para `created_at`?

---

### 2.5 Ordenação

10. **Quais campos permitem ordenação?**
    - Pedidos: `id`, `created_at`, `status`, `selected_product`?
    - Capas: `id`, `created_at`, `status`, `price`, `qty`?
    - Clientes: `id`, `name`, `created_at`?

---

## 3. Sugestões de Melhoria (Frontend → Backend)

### 3.1 Novo Parâmetro `id` Separado

Ao invés de depender do `keyword`, ter parâmetro específico:

```
GET /api/v1/pedidos?id=123
GET /api/v1/capas-personalizadas?id=456
```

**Benefício:** Busca exata por ID, sem ambiguidade.

---

### 3.2 Filtro Multi-Status

```
GET /api/v1/pedidos?status[]=1&status[]=2
GET /api/v1/capas-personalizadas?status[]=1&status[]=3
```

**Benefício:** Filtrar vários status de uma vez.

---

### 3.3 Busca Unificada para Clientes

```
GET /api/v1/customers?keyword=João
# Busca em: name, email, phone
```

---

### 3.4 Presets de Período

```
GET /api/v1/pedidos?period=today
GET /api/v1/pedidos?period=this_week
GET /api/v1/pedidos?period=this_month
GET /api/v1/pedidos?period=last_30_days
```

**Alternativa:** Frontend calcula as datas, mas preset simplifica.

---

## 4. Exemplo de Requisição Completa

```
GET /api/v1/pedidos?
    keyword=João&
    status=1&
    initial_date=2024-01-01&
    final_date=2024-01-31&
    store_id=5&
    page=1&
    per_page=25&
    sort=created_at&
    direction=desc
```

---

## 5. Próximos Passos

1. **Backend confirma** comportamento atual do `keyword`
2. **Backend adiciona** campos faltantes se necessário
3. **Frontend implementa** UI de filtros avançados
4. **Testes end-to-end** dos novos filtros

---

> [!TIP]
> Por favor, responda às perguntas numeradas (1-10) para que possamos prosseguir com a implementação no frontend.
