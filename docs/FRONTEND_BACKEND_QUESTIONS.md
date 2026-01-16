# 📋 Perguntas e Sugestões para o Backend - Sistema de Permissões

> **De:** Time Frontend  
> **Para:** Backend  
> **Data:** 16/01/2026  
> **Contexto:** Implementamos a infraestrutura base (types, hooks, services, componentes). Antes de criar as páginas de admin, precisamos de alguns alinhamentos.

---

## ❓ Perguntas de Clarificação

### 1. Endpoint `/me` - Formato Atual

Qual é o formato **atual** da resposta do `/me`? Queremos garantir que os types estão alinhados.

**Formato que estamos esperando:**
```json
{
  "user": { "id": 1, "name": "..." },
  "stores": [...],
  "roles": ["vendedor"],
  "permissions": ["pedidos.view", "screen.pedidos", ...],
  "temporary_permissions": [...],
  "expiring_soon": [...]
}
```

**Pergunta:** O `/me` já retorna esse formato ou é uma versão futura?

---

### 2. Listagem de Permissões - Estrutura

Para a página de gestão de permissões, o endpoint `GET /admin/permissions` retorna:

**a)** Apenas um array de permissões?
```json
{ "data": [{ "id": 1, "name": "pedidos.view", ... }] }
```

**b)** Já agrupadas por módulo/grupo?
```json
{
  "data": [...],
  "groups": { "visualizacao": { "label": "Visualização", "icon": "Eye" } }
}
```

**Preferimos a opção (b)** para evitar lógica de agrupamento no frontend.

---

### 3. Roles - System vs Custom

No endpoint `GET /admin/roles`, as roles têm `is_system: true/false`.

**Perguntas:**
- Roles `is_system: true` (admin, gerente, vendedor) podem ser editadas?
- Podemos apenas adicionar/remover permissões, ou também editar nome/descrição?
- Existe um endpoint separado para editar permissões de uma role system?

---

### 4. Permissões do Usuário - Override por Loja

Na resposta de `GET /admin/users/{id}/permissions`, os overrides são:
- Por usuário globalmente?
- Por usuário + loja específica?

**Exemplo que esperamos:**
```json
{
  "permissions": ["pedidos.view"],
  "overrides": [
    {
      "permission": "capas.view-global",
      "type": "grant",
      "store_id": null,           // ← global ou por loja?
      "expires_at": "2026-01-20"
    }
  ]
}
```

---

### 5. Módulos - Endpoint Full

O endpoint `/admin/modules/{id}/full` já está implementado?

Precisamos saber se os seguintes campos estão disponíveis:
- `texts` (labels, tooltips, empty state)
- `actions` (com confirm, permission, shortcut)
- `filters` (para renderização dinâmica)
- `table_columns`
- `conditional_fields` (para formulários dinâmicos)

---

### 6. Transições - Como Gravar

Para editar a matriz de transições, qual é o formato esperado no `PUT /admin/modules/{id}/transitions`?

**Opção A - Role matrix:**
```json
{
  "transitions": {
    "1": {          // from status 1
      "3": ["admin", "gerente"],  // to status 3
      "6": ["vendedor", "admin"]  // to status 6
    }
  }
}
```

**Opção B - Array de permissões:**
```json
{
  "transitions": [
    { "from": 1, "to": 3, "roles": ["admin", "gerente"] }
  ]
}
```

---

## 💡 Sugestões de Melhorias

### 1. Preview de Mudanças

Seria útil ter um endpoint de **preview** antes de aplicar mudanças:

```
POST /admin/permissions/preview
{
  "user_id": 1,
  "add_permissions": ["reports.view"],
  "remove_permissions": ["pedidos.delete"]
}

Response:
{
  "current": ["pedidos.view", "pedidos.delete"],
  "after": ["pedidos.view", "reports.view"],
  "added": ["reports.view"],
  "removed": ["pedidos.delete"]
}
```

---

### 2. Copiar Permissões

Endpoint para copiar permissões de um usuário para outro:

```
POST /admin/users/{id}/permissions/copy-from/{sourceUserId}
```

Facilita configuração de novos funcionários.

---

### 3. Bulk Operations

Dar mesma permissão a múltiplos usuários de uma vez:

```
POST /admin/permissions/bulk-grant
{
  "user_ids": [1, 2, 3],
  "permissions": ["reports.view"]
}
```

---

### 4. Audit Log Específico

Ver histórico de mudanças de permissões de um usuário:

```
GET /admin/users/{id}/permissions/audit
```

---

### 5. Templates de Role

Criar uma role baseada em outra (clone):

```
POST /admin/roles/{id}/clone
{
  "name": "conferente-senior",
  "display_name": "Conferente Sênior"
}
```

---

## 📦 Endpoints Necessários para as Páginas

### Página: Lista de Módulos
- [x] `GET /admin/modules` - Lista módulos

### Página: Detalhes do Módulo
- [ ] `GET /admin/modules/{id}/full` - **Confirmar que está pronto**
- [ ] `GET /admin/modules/{id}/transitions` - Matriz de transições
- [ ] `PUT /admin/modules/{id}/transitions` - Editar transições

### Página: Lista de Roles
- [ ] `GET /admin/roles` - **Confirmar formato**
- [ ] `GET /admin/roles/{id}` - Detalhes com permissões

### Página: Form de Role
- [ ] `POST /admin/roles` - Criar role
- [ ] `PUT /admin/roles/{id}` - Editar role
- [ ] `DELETE /admin/roles/{id}` - Excluir role

### Página: Lista de Permissões
- [ ] `GET /admin/permissions` - **Confirmar se retorna grupos**
- [ ] `GET /admin/permissions/grouped` - Alternativa agrupada

### Página: Permissões do Usuário (UserForm)
- [ ] `GET /admin/users/{id}/permissions` - Permissões + overrides
- [ ] `GET /admin/users/{id}/permissions/effective` - Com fonte
- [ ] `POST /admin/users/{id}/permissions` - Add override
- [ ] `DELETE /admin/users/{id}/permissions/{id}` - Remove override

### Página: Roles do Usuário (UserForm)
- [ ] `GET /admin/users/{id}/roles` - Roles do usuário
- [ ] `POST /admin/users/{id}/roles` - Atribuir role
- [ ] `DELETE /admin/users/{id}/roles/{id}` - Remover role

---

## ⏱️ Prioridade

**O que precisamos mais urgente:**

1. ✅ Confirmar formato do `/me` com permissões
2. ✅ Confirmar `GET /admin/roles` e `GET /admin/permissions`
3. ✅ Endpoint `/admin/users/{id}/permissions/effective`

Com essas confirmações, podemos começar as páginas de admin.

---

## 📞 Próximo Passo

Aguardamos as respostas para os itens acima.

Após confirmação, implementaremos:
1. Página de Módulos (lista + detalhes)
2. Página de Roles (CRUD)
3. Página de Permissões (lista agrupada)
4. Atualização do UserForm com tabs de Permissões e Roles

**Prazo estimado:** 2-3 dias após confirmação

---

*Time Frontend - MaisCapinhas*
