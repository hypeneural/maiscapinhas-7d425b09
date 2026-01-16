# 📋 Respostas do Frontend - Sistema de Permissões

> **De:** Time Frontend  
> **Para:** Backend  
> **Data:** 16/01/2026

---

## ✅ Respostas às Perguntas

### 1. Dashboard Diferenciada por Role

**Resposta: Opção C (com complemento)**

Preferimos **uma única rota `/dashboard`** que retorne dados diferentes baseado no role, MAS com uma **flag de layout**:

```json
{
  "dashboard_layout": "vendedor",  // ou "conferente", "gerente", "admin"
  "kpis": [ /* KPIs permitidos para este usuário */ ]
}
```

**Justificativa:**
- Mantém uma única rota no frontend
- Backend decide o layout base
- KPIs são filtrados pelo backend (não precisamos de screens por KPI)
- Facilita cache e code-splitting

**Alternativa híbrida:** Se no futuro um gerente quiser ver o dashboard de vendedor, poderíamos ter `GET /dashboard?view=vendedor` com validação no backend.

---

### 2. Telas com Variações por Nível

**Resposta: Opção A (abilities separadas)**

Preferimos abilities distintas:
- `pedidos.view` → Ver apenas os próprios
- `pedidos.view-all` → Ver todos da loja
- `pedidos.view-global` → Ver de todas as lojas (admin)

**Justificativa:**
- Mais explícito e documentável
- Podemos dar `view-all` a um vendedor específico sem mudar role
- No frontend: `if (can('pedidos.view-all')) showAllOrders()`

**Sugestão de convenção:**

| Sufixo | Significado |
|--------|-------------|
| `.view` | Apenas próprios registros |
| `.view-all` | Todos da loja atual |
| `.view-global` | Todas as lojas |
| `.manage` | CRUD completo |

---

### 3. Granularidade de Botões/Ações

**Resposta: Opção A (abilities específicas)**

Preferimos **abilities granulares por ação**:

```
pedidos.create
pedidos.update
pedidos.delete
pedidos.cancel          ← Específica!
pedidos.status.update
pedidos.status.revert   ← Reverter status
pedidos.bulk-update     ← Ações em lote

capas.create
capas.approve           ← Aprovar capa
capas.reject            ← Rejeitar capa
capas.send-production   ← Enviar para produção
```

**Justificativa:**
- Granularidade total para o Super Admin configurar
- Podemos liberar "cancelar" sem liberar "deletar"
- Features ficam para coisas cross-module (ex: `feature.export-excel`)

**Sugestão de organização:**

```
Ability = {módulo}.{recurso?}.{ação}

Exemplos:
- pedidos.create
- pedidos.status.update
- caixa.closing.approve
- admin.users.create
```

---

### 4. Menu Pré-Filtrado

**Resposta: Opção C (manter como está)**

Menu pré-filtrado pelo backend é **perfeito** ✅

**Benefícios:**
- Frontend não precisa conhecer regras de visibilidade
- Menos lógica duplicada
- Menu sempre consistente com permissões reais
- Melhor performance (menos processamento no cliente)

**Uma sugestão:** Incluir o `icon` como string no menu (já fazem isso?) para mapearmos no frontend:

```json
{
  "menu": [
    { "id": "dashboard", "label": "Dashboard", "icon": "LayoutDashboard", "path": "/" }
  ]
}
```

---

### 5. Permissões Temporárias

**Resposta: Todas as opções (A, B e C)**

Gostaríamos de suporte a:

**A) Badge visual para o usuário:**
```json
{
  "permissions": {
    "global": {
      "granted": ["reports.view"],
      "temporary": [
        { 
          "permission": "reports.view",
          "expires_at": "2026-02-01T00:00:00Z",
          "reason": "Projeto especial Q1"
        }
      ]
    }
  }
}
```

**B) Filtro no admin:**
- `GET /admin/user-permissions?temporary=true`

**C) Notificação de expiração:**
- No `/me`, incluir campo `expiring_soon` para permissões que expiram em < 7 dias
- Ou um endpoint separado: `GET /me/expiring-permissions`

**UI que faremos:**
- Badge "Expira em X dias" em acessos temporários
- Alerta no header quando permissão importante está expirando
- Listagem de permissões temporárias no painel admin

---

### 6. Contexto de Loja

**Resposta: Opção A + C (híbrido)**

**Como funciona hoje:**
1. Usuário seleciona loja ativa (armazenamos em `sessionStorage`)
2. Enviamos `X-Store-Id` no header de requests
3. No frontend, verificamos `permissions.by_store[currentStoreId]`

**Sugestão de melhoria:**

No `/me`, incluir um campo `effective_permissions` que já merge global + loja atual:

```json
{
  "current_store_id": 1,
  "effective_permissions": ["pedidos.view", "capas.create", ...],
  "effective_screens": ["screen.dashboard", "screen.capas.production", ...]
}
```

**Ou** podemos continuar fazendo o merge no frontend (já funciona bem).

---

### 7. Permissões Faltantes

#### Screens Novas Sugeridas

```
# Pedidos
screen.pedidos.detail        # Detalhe do pedido
screen.pedidos.edit          # Edição

# Capas
screen.capas.detail          # Detalhe da capa
screen.capas.edit            # Edição

# Clientes
screen.clientes              # Lista
screen.clientes.create       # Novo cliente
screen.clientes.detail       # Detalhe
screen.clientes.edit         # Edição

# Fábrica (portal externo)
screen.fabrica.dashboard     # Dashboard da fábrica
screen.fabrica.dispatch      # Despacho

# Produção (interno)
screen.producao              # Menu produção
screen.producao.cart         # Carrinho de produção
screen.producao.orders       # Pedidos de produção

# Configurações
screen.config.payment-methods    # Formas de pagamento ← NOVO
screen.config.brands             # Marcas de aparelhos
screen.config.models             # Modelos de aparelhos

# Super Admin
screen.super-admin                    # Menu super admin
screen.super-admin.whatsapp-instances # Instâncias WhatsApp
screen.super-admin.permissions        # Gestão de permissões (meta!)
```

#### Abilities Novas Sugeridas

```
# Payment Methods
payment-methods.view
payment-methods.create
payment-methods.update
payment-methods.delete
payment-methods.toggle-status   # Ativar/desativar

# Clientes
clientes.view
clientes.view-all
clientes.create
clientes.update
clientes.delete
clientes.merge                  # Mesclar clientes duplicados

# Pedidos - ações específicas
pedidos.print                   # Imprimir comprovante
pedidos.send-whatsapp           # Enviar notificação WhatsApp
pedidos.duplicate               # Duplicar pedido

# Capas - ações específicas
capas.print                     # Imprimir
capas.download-image            # Baixar imagem
capas.send-whatsapp             # Notificação WhatsApp

# Caixa
caixa.reopen                    # Reabrir fechamento rejeitado
caixa.export                    # Exportar relatório

# Produção
producao.cart.add
producao.cart.remove
producao.cart.close
producao.orders.receive
producao.orders.cancel

# Admin
admin.users.impersonate         # Logar como outro usuário (debug)
admin.audit.export              # Exportar logs
admin.system.maintenance        # Modo manutenção
```

#### Features Novas Sugeridas

```
feature.dark-mode               # Tema escuro (se for toggleável)
feature.beta-features           # Acesso a features beta
feature.advanced-search         # Busca avançada
feature.keyboard-shortcuts      # Atalhos de teclado
feature.offline-mode            # Modo offline (PWA)
feature.notifications-push      # Push notifications
```

---

## 🎨 Sugestões para o Painel de Gestão de Permissões

### Organização Visual para Super Admin

Sugerimos uma **interface de gestão em 3 níveis**:

```
┌─────────────────────────────────────────────────────────────────┐
│                    GESTÃO DE PERMISSÕES                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   ROLES     │  │   LOJAS     │  │  USUÁRIOS   │              │
│  │  (Cargos)   │  │  (Stores)   │  │   (Users)   │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                     │
│         ▼                ▼                ▼                     │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              MATRIZ DE PERMISSÕES                       │    │
│  │                                                         │    │
│  │  Módulo: Pedidos          [v] Herdado  [+] Override     │    │
│  │  ┌──────────────────┬─────────┬─────────┬─────────┐     │    │
│  │  │ Permissão        │ Role    │ Loja    │ User    │     │    │
│  │  ├──────────────────┼─────────┼─────────┼─────────┤     │    │
│  │  │ pedidos.view     │ ✅ (R)  │ ─       │ ─       │     │    │
│  │  │ pedidos.create   │ ✅ (R)  │ ─       │ ─       │     │    │
│  │  │ pedidos.delete   │ ❌ (R)  │ ✅ (+)  │ ─       │     │    │
│  │  │ pedidos.cancel   │ ❌ (R)  │ ─       │ ✅ (+)  │     │    │
│  │  └──────────────────┴─────────┴─────────┴─────────┘     │    │
│  │                                                         │    │
│  │  (R) = Vem do Role    (+) = Override    (-) = Negado    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Endpoints Sugeridos para a UI Admin

```
# Visão consolidada de um usuário
GET /admin/users/{id}/permissions/effective
→ Retorna todas as permissões resolvidas com origem (role/store/user)

# Copiar permissões de um usuário para outro
POST /admin/users/{id}/permissions/copy-from/{sourceUserId}

# Copiar configuração de um role para outro
POST /admin/roles/{id}/copy-from/{sourceRoleId}

# Preview: "Se eu mudar isso, o que acontece?"
POST /admin/permissions/preview
Body: { user_id, changes: [...] }
→ Retorna permissões antes e depois

# Bulk: Dar permissão a múltiplos usuários
POST /admin/permissions/bulk-grant
Body: { user_ids: [], permissions: [] }
```

### Estrutura de Dados para UI de Permissões

```json
{
  "permission": {
    "id": 15,
    "name": "pedidos.delete",
    "display_name": "Excluir Pedidos",
    "type": "ability",
    "module": "pedidos",
    "description": "Permite excluir pedidos permanentemente",
    "is_dangerous": true,
    "requires": ["pedidos.view"]  // Dependências
  },
  
  "resolution": {
    "granted": true,
    "source": "store_override",  // ou "role", "user_override"
    "source_name": "Loja Centro",
    "inherited_from_role": false,
    "can_be_overridden": true,
    "temporary": null  // ou { expires_at, reason }
  }
}
```

### Agrupamento por Módulo para UI

```json
{
  "modules": [
    {
      "id": "pedidos",
      "name": "Pedidos",
      "icon": "FileCheck",
      "permissions": {
        "abilities": [
          { "name": "pedidos.view", "display": "Ver pedidos", "granted": true },
          { "name": "pedidos.create", "display": "Criar pedidos", "granted": true },
          { "name": "pedidos.delete", "display": "Excluir pedidos", "granted": false }
        ],
        "screens": [
          { "name": "screen.pedidos", "display": "Menu Pedidos", "granted": true },
          { "name": "screen.pedidos.bulk", "display": "Operações em Lote", "granted": false }
        ]
      }
    }
  ]
}
```

---

## 📋 Checklist de Implementação Sugerido

### Backend (vocês)

- [ ] Incluir `dashboard_layout` na resposta do `/me`
- [ ] Adicionar abilities com sufixos `-all` e `-global`
- [ ] Incluir `icon` no menu do `/me`
- [ ] Campo `temporary` nas permissões com expiração
- [ ] Campo `expiring_soon` para permissões que expiram em < 7 dias
- [ ] Endpoint `GET /admin/users/{id}/permissions/effective`
- [ ] Endpoint para preview de mudanças
- [ ] Adicionar permissions faltantes listadas acima

### Frontend (nós)

- [ ] Componente `PermissionGate` com suporte a arrays
- [ ] Badge de "Acesso Temporário" 
- [ ] Alerta de permissões expirando
- [ ] UI de gestão de permissões para Super Admin
- [ ] Matriz visual de permissões (role × loja × user)

---

## 🤝 Alinhamento Final

| Decisão | Resposta |
|---------|----------|
| Dashboard | Rota única com `dashboard_layout` |
| Variações por nível | Abilities separadas (`view` vs `view-all`) |
| Botões/Ações | Abilities granulares por ação |
| Menu | Manter pré-filtrado pelo backend ✅ |
| Permissões temporárias | Badge + filtro admin + notificação |
| Contexto de loja | Header `X-Store-Id` + merge no front |

**Estamos alinhados! Podem prosseguir com essas definições.** 🚀

---

*Qualquer dúvida, estamos à disposição!*
