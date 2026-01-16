# 📦 Resposta Frontend: Sistema Modular v2

> **Data:** 16/01/2026  
> **De:** Time Frontend  
> **Para:** Time de Backend

---

## ✅ Feedback Geral

**Adoramos a nova arquitetura!** 🎉

A abordagem modular resolve vários problemas que tínhamos:
- Textos duplicados no frontend ✅
- Regras de status hardcoded ✅
- Dificuldade de adicionar módulos ✅

---

## 📋 Respostas às Perguntas

### Performance

**1. Cache do módulo**
> React Query com `staleTime: Infinity` + invalidação por webhook

```tsx
// Módulo raramente muda, então cache agressivo
useQuery({
  queryKey: ['module', moduleId, 'full'],
  queryFn: () => fetchModuleFull(moduleId),
  staleTime: Infinity,  // Nunca refetch automático
  gcTime: 1000 * 60 * 60 * 24,  // 24h no cache
})
```

Quando vocês enviarem webhook de mudança, invalidamos:
```tsx
queryClient.invalidateQueries(['module', moduleId])
```

**2. Carregamento**
> Lazy load por página, mas prefetch no hover do menu

```tsx
// No Sidebar, quando hover no item
onMouseEnter={() => {
  queryClient.prefetchQuery(['module', 'pedidos-simples', 'full'])
}}
```

---

### UX

**3. Status badges**
> Usar `badge_variant` do backend ✅

Confiamos no backend para manter consistência visual. Só precisamos do mapeamento:

```tsx
// Esperamos esses valores em badge_variant:
type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 
                    'success' | 'warning' | 'info';
```

**Sugestão:** Incluir também `text_color` para quando o badge tiver background custom:
```json
{
  "color": "#3B82F6",
  "text_color": "white",
  "badge_variant": "custom"
}
```

**4. Confirmação**
> Usar `confirm_message` do backend, mas com nosso modal

Queremos controlar o visual, mas texto vem da API:
```tsx
<ConfirmDialog
  title={action.confirm_title}
  description={action.confirm_message}
  confirmText={action.confirm_button ?? "Confirmar"}
  cancelText={action.cancel_button ?? "Cancelar"}
  variant={action.confirm_variant ?? "default"}  // ou "destructive"
/>
```

**Sugestão de campos extras:**
```json
{
  "confirm": true,
  "confirm_title": "Cancelar Pedido",
  "confirm_message": "Tem certeza que deseja cancelar?",
  "confirm_button": "Sim, Cancelar",
  "cancel_button": "Não, Voltar",
  "confirm_variant": "destructive"
}
```

**5. Shortcuts**
> Enviar só a tecla, nós montamos o combo

```json
{
  "shortcut": "A",           // Letra simples
  "shortcut_modifier": null  // ou "ctrl", "alt", "shift"
}
```

Nós mostramos como `⌘A` no Mac ou `Ctrl+A` no Windows.

---

### Super Admin

**6. Edição de transições**
> **Matriz tipo spreadsheet** é melhor!

Mockup sugerido:

```
┌─────────────────────────────────────────────────────────────────┐
│ Módulo: Pedidos Simples - Matriz de Transições                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ De ↓ / Para →    │ Disponível │ Aguardando │ Concluído │ Canc. │
│ ─────────────────┼────────────┼────────────┼───────────┼───────│
│ Solicitado       │ [AG]       │ [ ]        │ [ ]       │ [VAG] │
│ Disponível       │ ─          │ [VAG]      │ [AG]      │ [AG]  │
│ Aguardando       │ [ ]        │ ─          │ [VAG]     │ [AG]  │
│ Concluído        │ [ ]        │ [ ]        │ ─         │ [ ]   │
│                                                                 │
│ Legenda: V=Vendedor  A=Admin  G=Gerente  S=Super                │
│                                                                 │
│ [Salvar Alterações]                                             │
└─────────────────────────────────────────────────────────────────┘
```

Cada célula clicável abre um popover:
```
┌───────────────────────────────┐
│ Quem pode: Solicitado → Disp. │
├───────────────────────────────┤
│ [x] Super Admin               │
│ [x] Admin                     │
│ [x] Gerente                   │
│ [ ] Conferente                │
│ [ ] Vendedor                  │
├───────────────────────────────┤
│ [Aplicar]                     │
└───────────────────────────────┘
```

**7. Visualização de workflow**
> **Diagrama interativo** (mas Mermaid renderizado, não edição)

Sugerimos um fluxograma visual:

```
┌─────────────────────────────────────────────────────────────────┐
│ Workflow: Pedidos Simples                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌───────────┐       ┌───────────────┐       ┌───────────┐     │
│   │Solicitado │──────▶│ Disponível    │──────▶│ Concluído │     │
│   │  (azul)   │       │   (verde)     │       │  (cinza)  │     │
│   └─────┬─────┘       └───────┬───────┘       └───────────┘     │
│         │                     │                                 │
│         │    ┌────────────────┘                                 │
│         │    │                                                  │
│         ▼    ▼                                                  │
│   ┌───────────────┐                                             │
│   │   Cancelado   │                                             │
│   │  (vermelho)   │                                             │
│   └───────────────┘                                             │
│                                                                 │
│ Clique em uma transição para ver/editar permissões              │
└─────────────────────────────────────────────────────────────────┘
```

**Sugestão:** Enviar dados para renderizar diagrama:
```json
{
  "workflow_diagram": {
    "nodes": [
      { "id": "1", "label": "Solicitado", "color": "#3B82F6", "position": { "x": 0, "y": 0 } }
    ],
    "edges": [
      { "from": "1", "to": "3", "label": "Disponibilizar", "roles": ["admin", "gerente"] }
    ]
  }
}
```

---

### Dados

**8. Campos condicionais**
> Enviar estrutura completa do form!

Queremos renderizar dinamicamente:
```json
{
  "conditional_fields": {
    "cancelado": {
      "cancelation_reason": {
        "type": "select",
        "label": "Motivo do Cancelamento",
        "placeholder": "Selecione o motivo",
        "required": true,
        "options": [
          { "value": "customer_request", "label": "Solicitação do cliente" },
          { "value": "out_of_stock", "label": "Produto indisponível" },
          { "value": "other", "label": "Outro motivo" }
        ],
        "show_when": {
          "field": "cancelation_reason",
          "equals": "other"
        },
        "dependent_fields": ["cancelation_notes"]
      },
      "cancelation_notes": {
        "type": "textarea",
        "label": "Observações",
        "placeholder": "Descreva o motivo...",
        "required": true,
        "max_length": 500,
        "visible_when": {
          "cancelation_reason": "other"
        }
      }
    }
  }
}
```

**9. Validações**
> SIM! Enviar regras de validação

```json
{
  "fields": {
    "customer_phone": {
      "type": "phone",
      "label": "Telefone",
      "validations": {
        "required": true,
        "pattern": "^\\+55\\d{10,11}$",
        "pattern_message": "Formato inválido. Use +5548999999999",
        "min_length": 13,
        "max_length": 14
      }
    },
    "quantity": {
      "type": "number",
      "label": "Quantidade",
      "validations": {
        "required": true,
        "min": 1,
        "max": 100,
        "integer": true
      }
    }
  }
}
```

Usamos Zod, então podemos converter:
```tsx
function apiValidationsToZod(validations) {
  let schema = z.string();
  if (validations.required) schema = schema.min(1, "Campo obrigatório");
  if (validations.pattern) schema = schema.regex(new RegExp(validations.pattern), validations.pattern_message);
  // ...
  return schema;
}
```

---

## 🎨 Sugestões de Melhorias na API

### 1. Incluir Estados de Loading

```json
{
  "texts": {
    "loading_title": "Carregando pedidos...",
    "loading_description": "Aguarde enquanto buscamos os dados.",
    "error_title": "Erro ao carregar",
    "error_description": "Não foi possível carregar os pedidos.",
    "retry_button": "Tentar novamente"
  }
}
```

### 2. Incluir Filtros Disponíveis

```json
{
  "filters": {
    "status": {
      "type": "multi-select",
      "label": "Status",
      "options": "from_statuses"  // Usa array de statuses
    },
    "date_range": {
      "type": "date-range",
      "label": "Período",
      "presets": ["today", "week", "month", "custom"]
    },
    "store": {
      "type": "select",
      "label": "Loja",
      "options": "from_user_stores"  // Preenche com lojas do usuário
    }
  }
}
```

### 3. Incluir Colunas da Tabela

```json
{
  "table_columns": {
    "default": [
      { "key": "id", "label": "#", "sortable": true, "width": 80 },
      { "key": "customer_name", "label": "Cliente", "sortable": true },
      { "key": "status", "label": "Status", "type": "badge" },
      { "key": "created_at", "label": "Data", "type": "date", "format": "dd/MM/yyyy" },
      { "key": "total", "label": "Valor", "type": "currency", "align": "right" }
    ],
    "compact": [
      { "key": "id", "label": "#" },
      { "key": "customer_name", "label": "Cliente" },
      { "key": "status", "label": "Status" }
    ]
  }
}
```

### 4. Incluir Ações em Lote

```json
{
  "bulk_actions": {
    "change_status": {
      "label": "Alterar Status",
      "icon": "RefreshCw",
      "permission": "pedidos.bulk-update",
      "requires_selection": true,
      "min_selection": 1,
      "max_selection": 50
    },
    "export": {
      "label": "Exportar Selecionados",
      "icon": "Download",
      "permission": "pedidos.export",
      "requires_selection": true,
      "formats": ["xlsx", "pdf", "csv"]
    },
    "delete": {
      "label": "Excluir Selecionados",
      "icon": "Trash",
      "permission": "pedidos.delete",
      "requires_selection": true,
      "confirm": true,
      "confirm_message": "Excluir {count} pedidos?"
    }
  }
}
```

### 5. Incluir Quick Actions (Linha da Tabela)

```json
{
  "row_actions": {
    "primary": {
      "action": "view",
      "label": "Ver Detalhes",
      "icon": "Eye"
    },
    "secondary": [
      { "action": "edit", "label": "Editar", "icon": "Edit", "permission": "pedidos.update" },
      { "action": "duplicate", "label": "Duplicar", "icon": "Copy", "permission": "pedidos.create" },
      { "action": "delete", "label": "Excluir", "icon": "Trash", "permission": "pedidos.delete", "variant": "destructive" }
    ]
  }
}
```

### 6. Incluir Notificações/Toasts

```json
{
  "notifications": {
    "created": {
      "title": "Pedido criado!",
      "description": "Pedido #{id} foi criado com sucesso.",
      "variant": "success"
    },
    "status_changed": {
      "title": "Status alterado",
      "description": "Pedido #{id} agora está {status}.",
      "variant": "info"
    },
    "deleted": {
      "title": "Pedido excluído",
      "description": "O pedido foi removido permanentemente.",
      "variant": "warning"
    },
    "error": {
      "title": "Erro",
      "description": "Não foi possível completar a ação.",
      "variant": "destructive"
    }
  }
}
```

### 7. Incluir Estatísticas/Cards

```json
{
  "stats_cards": {
    "enabled": true,
    "permission": "pedidos.view-stats",
    "cards": [
      { "id": "total", "label": "Total", "icon": "Package", "color": "blue" },
      { "id": "pending", "label": "Pendentes", "icon": "Clock", "color": "yellow" },
      { "id": "completed", "label": "Concluídos", "icon": "CheckCircle", "color": "green" },
      { "id": "revenue", "label": "Faturamento", "icon": "DollarSign", "color": "emerald", "type": "currency" }
    ]
  }
}
```

---

## 🔐 Sugestões para UI do Super Admin

### 1. Tela de Módulos

```
┌─────────────────────────────────────────────────────────────────┐
│ Módulos do Sistema                                    [+ Novo]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ 📦 Pedidos Simples                                        │   │
│ │ 6 status • 11 permissões • 5 ações                        │   │
│ │ [Editar] [Transições] [Permissões] [Documentação]         │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                 │
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ 🎨 Capas Personalizadas                                   │   │
│ │ 10 status • 16 permissões • 8 ações                       │   │
│ │ [Editar] [Transições] [Permissões] [Documentação]         │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Editor de Textos (Internacionalização Futura)

```
┌─────────────────────────────────────────────────────────────────┐
│ Textos: Pedidos Simples                           [Salvar]      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Menu & Navegação                                                │
│ ┌─────────────────────────────────────────────────────────┐     │
│ │ Label do Menu:     [Pedidos                          ]  │     │
│ │ Tooltip:           [Gerenciar pedidos de encomenda   ]  │     │
│ └─────────────────────────────────────────────────────────┘     │
│                                                                 │
│ Página Principal                                                │
│ ┌─────────────────────────────────────────────────────────┐     │
│ │ Título:            [Pedidos de Encomenda             ]  │     │
│ │ Descrição:         [Acompanhe todos os pedidos...    ]  │     │
│ │ Botão Criar:       [Novo Pedido                      ]  │     │
│ │ Estado Vazio:      [Nenhum pedido encontrado.        ]  │     │
│ └─────────────────────────────────────────────────────────┘     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3. Editor de Ações

```
┌─────────────────────────────────────────────────────────────────┐
│ Ação: Avisar Cliente                               [Salvar]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Configurações Básicas                                           │
│ ┌─────────────────────────────────────────────────────────┐     │
│ │ Label:             [Avisar Cliente                   ]  │     │
│ │ Ícone:             [Bell                ▼]              │     │
│ │ Tooltip:           [Enviar notificação WhatsApp...   ]  │     │
│ │ Atalho:            [A ]                                 │     │
│ └─────────────────────────────────────────────────────────┘     │
│                                                                 │
│ Visibilidade                                                    │
│ ┌─────────────────────────────────────────────────────────┐     │
│ │ Disponível nos Status:                                  │     │
│ │ [ ] Solicitado  [x] Disponível  [ ] Aguardando         │     │
│ │ [ ] Concluído   [ ] Cancelado                          │     │
│ └─────────────────────────────────────────────────────────┘     │
│                                                                 │
│ Confirmação                                                     │
│ ┌─────────────────────────────────────────────────────────┐     │
│ │ [x] Requer confirmação                                  │     │
│ │ Tipo: [⚠️ Aviso ▼]  [🔴 Destrutivo]  [ℹ️ Informativo]   │     │
│ │ Título:  [Avisar Cliente?                            ]  │     │
│ │ Mensagem: [O cliente receberá uma notificação...    ]   │     │
│ └─────────────────────────────────────────────────────────┘     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4. Preview em Tempo Real

Sugestão: Ao editar textos/ações, mostrar preview:

```
┌────────────────────────────────┬────────────────────────────────┐
│ EDITOR                         │ PREVIEW                        │
├────────────────────────────────┼────────────────────────────────┤
│                                │                                │
│ Título: [Pedidos de Enc...]    │  ┌──────────────────────────┐  │
│                                │  │ Pedidos de Encomenda     │  │
│ Descrição: [Acompanhe...]      │  │ Acompanhe todos os...    │  │
│                                │  │                          │  │
│ Botão: [Novo Pedido]           │  │ [+ Novo Pedido]          │  │
│                                │  └──────────────────────────┘  │
│                                │                                │
└────────────────────────────────┴────────────────────────────────┘
```

---

## 🔄 Endpoint Adicional Sugerido

### PUT `/admin/modules/{id}/texts`
Permitir editar apenas os textos sem mexer na estrutura:

```json
{
  "texts": {
    "menu_label": "Pedidos",
    "page_title": "Meus Pedidos"
  }
}
```

### PUT `/admin/modules/{id}/actions/{actionId}`
Editar uma ação específica:

```json
{
  "label": "Avisar Cliente",
  "tooltip": "Novo tooltip...",
  "available_in_status": [3, 4]
}
```

### POST `/admin/modules/{id}/actions`
Criar nova ação customizada:

```json
{
  "id": "custom_action",
  "label": "Ação Customizada",
  "icon": "Star",
  "permission": "pedidos.custom-action"
}
```

### GET `/admin/modules/{id}/audit-log`
Ver histórico de mudanças no módulo:

```json
{
  "changes": [
    {
      "date": "2026-01-16T10:30:00Z",
      "user": "Admin João",
      "action": "updated_texts",
      "details": { "field": "page_title", "old": "Pedidos", "new": "Meus Pedidos" }
    }
  ]
}
```

---

## 📋 Checklist de Implementação

### Backend
- [ ] Adicionar `text_color` aos status
- [ ] Adicionar `confirm_button`, `cancel_button`, `confirm_variant` às ações
- [ ] Separar `shortcut` e `shortcut_modifier`
- [ ] Adicionar `workflow_diagram` para renderização visual
- [ ] Incluir estrutura completa de `conditional_fields`
- [ ] Incluir `validations` nos campos
- [ ] Adicionar `filters`, `table_columns`, `bulk_actions`
- [ ] Adicionar `notifications` templates
- [ ] Adicionar `stats_cards` config
- [ ] Endpoints de edição granular (texts, actions)
- [ ] Endpoint de audit log

### Frontend
- [ ] Componente `ModuleRenderer` genérico
- [ ] Hook `useModule(moduleId)` com cache
- [ ] Componente `DynamicForm` baseado em fields da API
- [ ] Conversor `apiValidationsToZod`
- [ ] UI de gestão de módulos para Super Admin
- [ ] Editor visual de transições (matriz)
- [ ] Visualizador de workflow (diagrama)

---

## ✅ Resumo

| Pergunta | Resposta |
|----------|----------|
| Cache | React Query + webhook invalidation |
| Carregamento | Lazy load + prefetch on hover |
| Badges | Usar `badge_variant` do backend |
| Confirmação | Texto do backend, modal nosso |
| Shortcuts | Só a tecla, nós montamos combo |
| Transições | Matriz tipo spreadsheet |
| Workflow | Diagrama interativo |
| Forms | Estrutura completa com validações |

**Estamos prontos para começar!** 🚀

Sugerimos uma call para alinhar os próximos passos.

---

*Time Frontend - MaisCapinhas*
