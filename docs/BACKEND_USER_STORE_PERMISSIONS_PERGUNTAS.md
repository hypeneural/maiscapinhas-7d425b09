# Perguntas para Backend - Gestão de Usuários, Lojas e Permissões

> **Data**: 2026-01-13
> **Equipe**: Frontend → Backend
> **Status**: 🔴 Aguardando Resposta

---

## Estrutura Atual (Entendimento)

### Tabela `users`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `is_super_admin` | boolean | Flag de Super Admin (acesso total) |

### Tabela `store_users` (pivot)
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `user_id` | FK | Usuário |
| `store_id` | FK | Loja |
| `role` | enum | admin, gerente, conferente, vendedor |

### Roles Spatie (global)
| Role | Descrição |
|------|-----------|
| `fabrica` | Acesso ao portal da fábrica (não vinculado a loja) |

---

## ❓ PERGUNTAS

### 1. Cadastro de Usuário com Role `fabrica`

**Pergunta:** Existe endpoint ou campo para atribuir a role `fabrica` ao criar/atualizar usuário?

**Situação atual no frontend:**
```typescript
// CreateUserRequest (admin.types.ts)
{
  name: string;
  email: string;
  password: string;
  is_super_admin?: boolean;
  stores?: Array<{ store_id: number; role: UserRole }>;
  // ❌ Não existe campo para role 'fabrica'
}
```

**Sugestão:**
```json
// POST /admin/users
{
  "name": "Fábrica Central",
  "email": "fabrica@empresa.com",
  "password": "...",
  "roles": ["fabrica"]  // 👈 Novo campo: roles globais (Spatie)
}
```

**Perguntas específicas:**
1. O campo `roles` pode ser enviado no POST/PATCH de usuário?
2. Quais roles globais estão disponíveis além de `fabrica`?
3. Esse campo é acessível apenas para Super Admin?

---

### 2. Vínculo de Usuário com Múltiplas Lojas

**Pergunta:** Existe endpoint para vincular um usuário a várias lojas de uma vez?

**Situação atual:**
```http
POST /admin/stores/{id}/users
{ "user_id": 1, "role": "vendedor" }
```
Precisa chamar este endpoint N vezes para vincular a N lojas.

**Sugestão de endpoint bulk:**
```http
POST /admin/users/{id}/stores/bulk
{
  "stores": [
    { "store_id": 1, "role": "vendedor" },
    { "store_id": 2, "role": "vendedor" },
    { "store_id": 3, "role": "gerente" }
  ]
}
```

**Perguntas específicas:**
1. Este endpoint existe ou pode ser criado?
2. Qual seria a lógica de conflito? (ex: usuário já vinculado à loja)
3. O response deveria retornar sucesso/erro por loja?

---

### 3. Atualização em Massa de Roles

**Pergunta:** Existe endpoint para alterar a role de um usuário em várias lojas de uma vez?

**Exemplo de uso:** Promover vendedor para gerente em todas as lojas onde ele trabalha.

**Sugestão:**
```http
PATCH /admin/users/{id}/stores/bulk
{
  "role": "gerente",
  "store_ids": [1, 2, 3]  // ou []"all" para todas?
}
```

---

### 4. Listagem de Usuários sem Loja

**Pergunta:** O endpoint `GET /admin/users` retorna usuários que:
- Não estão vinculados a nenhuma loja?
- Têm apenas role global (ex: `fabrica`)?

**Filtros sugeridos:**
```http
GET /admin/users?has_stores=false
GET /admin/users?role=fabrica
GET /admin/users?is_global_admin=true
```

---

### 5. Desvínculo em Massa

**Pergunta:** Existe endpoint para remover um usuário de várias lojas de uma vez?

**Sugestão:**
```http
DELETE /admin/users/{id}/stores/bulk
{
  "store_ids": [1, 2, 3]
}
```

---

### 6. Sincronização de Lojas

**Pergunta:** Seria útil ter um endpoint de "sync" que substitui todos os vínculos?

**Exemplo:**
```http
PUT /admin/users/{id}/stores
{
  "stores": [
    { "store_id": 1, "role": "vendedor" },
    { "store_id": 2, "role": "gerente" }
  ]
}
```

Isso removeria vínculos não listados e criaria/atualizaria os listados.

---

### 7. Response do GET /admin/users/{id}

**Pergunta:** O response inclui os campos novos do `/me`?

**Campos esperados:**
```json
{
  "id": 1,
  "name": "Usuário",
  "is_super_admin": false,
  "is_global_admin": true,          // 👈 Incluído?
  "has_fabrica_access": false,      // 👈 Incluído?
  "roles": [],                       // 👈 Incluído?
  "stores": [...]
}
```

---

## 📋 Resumo dos Endpoints Desejados

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/admin/users` | Criar usuário com `roles[]` |
| PATCH | `/admin/users/{id}` | Atualizar usuário com `roles[]` |
| POST | `/admin/users/{id}/stores/bulk` | Vincular a múltiplas lojas |
| PATCH | `/admin/users/{id}/stores/bulk` | Alterar role em múltiplas lojas |
| DELETE | `/admin/users/{id}/stores/bulk` | Desvincular de múltiplas lojas |
| PUT | `/admin/users/{id}/stores` | Sincronizar vínculos (replace all) |
| GET | `/admin/users?has_stores=false` | Filtrar usuários sem loja |

---

## 🎯 Casos de Uso do Frontend

### 1. Criar usuário da fábrica
```json
POST /admin/users
{
  "name": "Fábrica",
  "email": "fabrica@empresa.com",
  "password": "...",
  "roles": ["fabrica"]
}
```

### 2. Adicionar vendedor em 5 lojas
```json
POST /admin/users/42/stores/bulk
{
  "stores": [
    { "store_id": 1, "role": "vendedor" },
    { "store_id": 2, "role": "vendedor" },
    { "store_id": 3, "role": "vendedor" },
    { "store_id": 4, "role": "vendedor" },
    { "store_id": 5, "role": "vendedor" }
  ]
}
```

### 3. Promover para gerente em todas as lojas
```json
PATCH /admin/users/42/stores/bulk
{
  "role": "gerente",
  "store_ids": [1, 2, 3, 4, 5]
}
```

---

Aguardamos retorno! 🙏
