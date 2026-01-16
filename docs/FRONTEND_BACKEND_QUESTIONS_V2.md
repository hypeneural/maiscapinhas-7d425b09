# 📋 Perguntas e Sugestões para o Backend - Fase 2 (Módulos e UserForm)

> **De:** Time Frontend  
> **Para:** Backend  
> **Data:** 16/01/2026  
> **Contexto:** Finalizamos as páginas de Roles e Permissions. Antes de prosseguir com Módulos e tabs no UserForm, temos algumas dúvidas.

---

## ❓ Perguntas sobre Módulos

### 1. Endpoint `/admin/modules` - Formato da Lista

Qual é o formato da resposta para listagem de módulos?

**Esperamos algo assim:**
```json
{
  "data": [
    {
      "id": 1,
      "slug": "pedidos-simples",
      "name": "Pedidos Simples",
      "description": "Gestão de pedidos básicos",
      "icon": "ShoppingCart",
      "status": "active",
      "is_global": true,
      "stores_count": 5,
      "version": "1.0.0"
    }
  ]
}
```

**Perguntas:**
- O campo `icon` retorna o nome do ícone Lucide ou uma URL de imagem?
- Existe um campo `status` para indicar se o módulo está ativo/inativo globalmente?
- `stores_count` indica em quantas lojas está ativado?

---

### 2. Endpoint `/admin/modules/{id}/full` - Status Atual

O endpoint está implementado? Quais campos estão disponíveis?

**Campos que precisamos:**
```json
{
  "id": 1,
  "slug": "pedidos-simples",
  "name": "Pedidos Simples",
  "texts": {
    "page_title": "Pedidos",
    "page_description": "...",
    "empty_state": "Nenhum pedido encontrado"
  },
  "statuses": [...],
  "actions": [...],
  "filters": [...],
  "table_columns": [...]
}
```

---

### 3. Ativação por Loja

Como funciona a ativação de módulos por loja?

**Opção A - Toggle simples:**
```
POST /admin/modules/{id}/stores/{storeId}/activate
DELETE /admin/modules/{id}/stores/{storeId}/deactivate
```

**Opção B - Lista de lojas:**
```
PUT /admin/modules/{id}/stores
{ "store_ids": [1, 2, 3] }
```

**Qual abordagem está implementada?**

---

### 4. Configurações por Loja

Módulos podem ter configurações específicas por loja?

**Exemplo:**
- Loja A: Pedidos com limite de 10 itens
- Loja B: Pedidos com limite de 50 itens

Se sim, qual endpoint para editar?

---

## ❓ Perguntas sobre UserForm

### 5. Estrutura de Tabs no Usuário

Vou adicionar tabs no formulário de usuário. A estrutura ideal seria:

```
[Dados Básicos] [Lojas] [Permissões] [Auditoria]
```

**Perguntas:**
- A tab "Permissões" deve mostrar: permissões efetivas, overrides, e roles?
- Podemos editar overrides diretamente no UserForm ou precisa de modal separado?
- O endpoint `/admin/users/{id}/permissions/effective` já está pronto?

---

### 6. Adicionar Permissão Override no UserForm

Para adicionar um override de permissão ao usuário, qual é o formato esperado?

```json
POST /admin/users/{id}/permissions
{
  "permission": "capas.view-global",
  "type": "grant",
  "store_id": null,
  "expires_at": "2026-02-01T23:59:59Z",
  "reason": "Cobertura de férias"
}
```

**Campos obrigatórios:** permission, type  
**Campos opcionais:** store_id, expires_at, reason

**Isso está correto?**

---

### 7. Roles do Usuário por Loja

Cada usuário pode ter múltiplas roles dependendo da loja?

**Exemplo:**
- João é "vendedor" na Loja A
- João é "gerente" na Loja B

Se sim, a atribuição de roles é por loja ou global?

---

## 💡 Sugestões para UX/UI

### 1. Indicador Visual de Permissões Temporárias

Seria bom ter no `/me` um campo simples:

```json
{
  "has_temporary_permissions": true,
  "temporary_count": 3
}
```

Assim podemos mostrar um badge no header/sidebar sem carregar a lista completa.

---

### 2. Permissões Mais Usadas

Endpoint para listar as permissões mais concedidas:

```
GET /admin/permissions/most-granted?limit=10
```

Facilita a UX no momento de adicionar overrides.

---

### 3. Usuários por Permissão

Ver todos os usuários que têm uma permissão específica:

```
GET /admin/permissions/{name}/users
```

Útil para auditoria: "Quem pode deletar pedidos?"

---

### 4. Validação de Conflitos

Antes de remover uma permissão, verificar se o usuário tem tarefas pendentes:

```
POST /admin/permissions/validate-removal
{
  "user_id": 1,
  "permission": "pedidos.create"
}

Response:
{
  "safe_to_remove": false,
  "reason": "Usuário tem 3 pedidos em rascunho"
}
```

---

### 5. Módulos - Dependências

Módulos podem ter dependências entre si?

**Exemplo:**
- "Capas Personalizadas" depende de "Pedidos Simples"
- Não pode ativar Capas sem ter Pedidos ativo

Se sim, como isso é retornado na API?

---

### 6. Preview de Módulo

Seria útil ter screenshots/previews do módulo para o admin ver antes de ativar:

```json
{
  "previews": [
    { "title": "Lista", "url": "/previews/pedidos-list.png" },
    { "title": "Form", "url": "/previews/pedidos-form.png" }
  ]
}
```

---

## 📦 Endpoints Necessários

### Página: Lista de Módulos
- [ ] `GET /admin/modules` — **Confirmar formato**
- [ ] `GET /admin/modules/{id}` — Detalhes básicos

### Página: Detalhes do Módulo
- [ ] `GET /admin/modules/{id}/full` — **Confirmar que está pronto**
- [ ] `GET /admin/modules/{id}/stores` — Lojas onde está ativo
- [ ] `POST /admin/modules/{id}/activate` — Ativar globalmente
- [ ] `POST /admin/modules/{id}/deactivate` — Desativar globalmente

### UserForm - Tab Permissões
- [ ] `GET /admin/users/{id}/permissions/effective` — **Confirmar formato**
- [ ] `POST /admin/users/{id}/permissions` — Adicionar override
- [ ] `DELETE /admin/users/{id}/permissions/{overrideId}` — Remover override

### UserForm - Tab Roles
- [ ] `GET /admin/users/{id}/roles` — Roles atuais
- [ ] `POST /admin/users/{id}/roles` — Atribuir role
- [ ] `DELETE /admin/users/{id}/roles/{assignmentId}` — Remover role

---

## ⏱️ Prioridade

**Mais urgente para continuar:**

1. ✅ Confirmar formato de `/admin/modules` e `/admin/modules/{id}/full`
2. ✅ Confirmar `/admin/users/{id}/permissions/effective`
3. ✅ Confirmar estrutura de roles por loja vs global

---

*Time Frontend - MaisCapinhas*
