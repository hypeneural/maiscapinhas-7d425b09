# Perguntas e Sugestões para API de Produção / Capas Personalizadas

> **Data**: 2026-01-13
> **Equipe**: Frontend → Backend
> **Status**: 🔴 Aguardando Resposta

---

## 🔴 Bugs Críticos

### Bug 1: Capa em Carrinho Cancelado Bloqueia Nova Adição

**Cenário:**
1. Admin adiciona capas ao carrinho
2. Admin cancela o carrinho
3. Admin tenta adicionar a MESMA capa a um novo carrinho
4. ❌ Erro 500 - Duplicate entry

**Endpoint:**
```http
POST /api/v1/producao/carrinho/itens
{ "capa_ids": [26] }
```

**Erro:**
```json
{
  "message": "SQLSTATE[23000]: Integrity constraint violation: 1062 Duplicate entry '26' for key 'producao_pedido_itens_capa_personalizada_id_unique'"
}
```

**Análise:**
- A constraint `capa_personalizada_id_unique` impede duplicatas
- Quando o carrinho é cancelado, o item permanece na tabela `producao_pedido_itens`
- Ao tentar adicionar novamente, a constraint falha

**Soluções Sugeridas:**

| Opção | Descrição |
|-------|-----------|
| **A - Soft Delete** | Ao cancelar carrinho, deletar os itens fisicamente OU marcar como soft-deleted |
| **B - Constraint Composta** | Alterar constraint para `UNIQUE(capa_personalizada_id, producao_pedido_id)` permitindo a mesma capa em pedidos diferentes |
| **C - Verificação de Status** | A constraint deve considerar apenas itens em pedidos com status ativo (não cancelado) |

**Pergunta:**
Qual abordagem faz mais sentido para o modelo de dados atual?

---

### Bug 2: Admin/Super Admin Não Consegue Ver Pedidos da Fábrica

**Cenário:**
1. Super admin ou admin tenta acessar endpoint de fábrica
2. ❌ Recebe "Acesso negado. Apenas fábrica."

**Endpoint:**
```http
GET /api/v1/fabrica/pedidos?page=1&per_page=10
```

**Erro:**
```json
{ "message": "Acesso negado. Apenas fábrica." }
```

**Solução Sugerida:**
O endpoint deveria aceitar:
- `fabrica` role (atual)
- `admin` de qualquer loja
- `super_admin`

**Código sugerido:**
```php
// FabricaRequest.php (ou Policy)
public function authorize()
{
    return $this->user() && (
        $this->user()->hasFabricaAccess() ||  // fábrica
        $this->user()->isGlobalAdmin()         // admin/super_admin
    );
}
```

---

## 🟡 Melhorias Sugeridas

### 1. Validação de Capa Antes de Adicionar ao Carrinho

**Problema atual:** O endpoint `/carrinho/itens` retorna erro 500 se a capa já está em outro carrinho (mesmo cancelado).

**Sugestão:** Aprimorar a validação no backend para:
- Verificar se a capa já está em um carrinho **ATIVO** (status != CANCELADO)
- Se estiver em carrinho cancelado, permitir adicionar a novo carrinho
- Retornar mensagem amigável em vez de erro 500

**Block reason adicional sugerido:**
```json
{
  "reason": "IN_CANCELLED_CART",
  "message": "Capa está em pedido cancelado. Liberando para novo uso..."
}
```

---

### 2. Endpoint para Limpar Itens de Carrinhos Cancelados

**Cenário:** Caso existam itens "órfãos" em carrinhos cancelados.

**Sugestão de endpoint:**
```http
POST /api/v1/producao/admin/limpar-itens-cancelados
```

Isso liberaria as capas que estão presas em pedidos cancelados.

---

### 3. Status Detalhado no GET Carrinho

**Atual:** Apenas itens no carrinho

**Sugestão:** Incluir campo `can_add_more` no response:
```json
{
  "id": 3,
  "status": 1,
  "items": [...],
  "can_add_more": true,
  "blockers": []  // motivos que impedem adicionar mais itens
}
```

---

### 4. Histórico de Capas em Carrinhos Cancelados

**Cenário:** Admin quer ver em qual carrinho cancelado uma capa esteve.

**Sugestão:** Adicionar ao response de capa personalizada:
```json
{
  "id": 26,
  "status": 1,
  "producao_history": [
    { "pedido_id": 2, "status": "CANCELADO", "added_at": "2026-01-12" },
    { "pedido_id": 3, "status": "CARRINHO_ABERTO", "added_at": "2026-01-13" }
  ]
}
```

---

## 📋 Checklist de Endpoints a Verificar

| Endpoint | Issue |
|----------|-------|
| `POST /carrinho/itens` | ❌ Erro 500 ao adicionar capa de carrinho cancelado |
| `GET /fabrica/pedidos` | ❌ Admin/Super admin bloqueado |
| `DELETE /carrinho` | ⚠️ Verificar se libera capas corretamente |
| `GET /producao/pedidos` | ✅ Funciona |
| `POST /carrinho/validar` | ✅ Funciona |

---

## 🔐 Resumo de Permissões Esperadas

| Endpoint | fabrica | admin | super_admin |
|----------|---------|-------|-------------|
| `/producao/*` | ❌ | ✅ | ✅ |
| `/fabrica/*` | ✅ | ✅ (sugerido) | ✅ (sugerido) |

---

## Perguntas Gerais

1. **Quando um carrinho é cancelado, os itens são removidos fisicamente ou apenas via soft delete?**

2. **A constraint `capa_personalizada_id_unique` é global ou deveria ser por pedido?**

3. **Existe algum job/cron para limpar carrinhos abandonados?**

4. **O admin pode visualizar o "Portal Fábrica" para acompanhar os pedidos que enviou?**

5. **Existe log de auditoria para saber quem cancelou um carrinho/pedido?**

---

Aguardamos retorno! 🙏
