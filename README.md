# 🛍️ ERP Mais Capinhas – Verão 2026

<div align="center">

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![Status](https://img.shields.io/badge/status-development-yellow.svg)
![License](https://img.shields.io/badge/license-proprietary-red.svg)
![React](https://img.shields.io/badge/React-18.3.1-61dafb.svg?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6.svg?logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-3.x-38bdf8.svg?logo=tailwindcss)

**Sistema ERP Web moderno para gestão de vendas, conferência de caixa e controle de metas da rede Mais Capinhas**

[📖 Documentação](#-documentação-adicional) •
[🚀 Como Rodar](#-como-rodar) •
[🏗️ Arquitetura](#️-arquitetura) •
[👥 Roles & Permissões](#-roles--permissões-rbac) •
[💰 Regras de Negócio](#-regras-de-negócio)

</div>

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Stack Tecnológica](#-stack-tecnológica)
- [Arquitetura do Sistema](#️-arquitetura)
- [Roles & Permissões (RBAC)](#-roles--permissões-rbac)
- [Regras de Negócio](#-regras-de-negócio)
  - [Bônus Diário](#-bônus-diário)
  - [Comissão Mensal](#-comissão-mensal)
- [Funcionalidades Implementadas](#-funcionalidades-implementadas)
- [PWA & Mobile](#-pwa--mobile)
- [Boas Práticas Utilizadas](#-boas-práticas-utilizadas)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Como Rodar](#-como-rodar)
- [Status do Desenvolvimento](#-status-do-desenvolvimento)
- [Documentação Adicional](#-documentação-adicional)

---

## 🎯 Visão Geral

O **ERP Mais Capinhas** é um sistema web completo desenvolvido para gerenciar a operação de vendas da rede de lojas Mais Capinhas. O sistema foi projetado seguindo a regra 80/20, focando nas funcionalidades que geram maior valor para o negócio.

### Principais Objetivos

- **📊 Vendedores**: Interface gamificada com odômetro de metas, bônus em tempo real e projeção de comissões
- **✅ Conferentes**: Fluxo simplificado de conferência de caixa com validação de divergências
- **📈 Gerentes/Admin**: Dashboards consolidados, ranking de vendedores e relatórios de performance

### Filosofia de Design

| Princípio | Descrição |
|-----------|-----------|
| **80/20** | Foco nas funcionalidades que geram 80% do valor |
| **Gamificação** | Elementos de jogo para motivar vendedores |
| **Validação Forte** | Divergências exigem justificativa obrigatória |
| **Cores Semafóricas** | Verde/Amarelo/Vermelho para indicar status |
| **Mobile First** | Interface responsiva otimizada para dispositivos móveis |

---

## 🛠️ Stack Tecnológica

### Core Framework

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| **React** | 18.3.1 | Framework UI com hooks modernos |
| **TypeScript** | 5.x | Tipagem estática para segurança |
| **Vite** | 5.x | Build tool ultra-rápido |
| **React Router** | 6.30 | Roteamento SPA declarativo |

### Estilização & UI

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| **Tailwind CSS** | 3.x | Utility-first CSS framework |
| **shadcn/ui** | latest | Componentes acessíveis e customizáveis |
| **Lucide React** | 0.462 | Biblioteca de ícones |
| **Recharts** | 2.15 | Gráficos e visualizações |

### State Management & Data Fetching

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| **TanStack Query** | 5.83 | Cache, fetching e sincronização |
| **Axios** | 1.13 | Cliente HTTP |
| **Zod** | 3.25 | Validação de schemas |
| **React Hook Form** | 7.61 | Gerenciamento de formulários |

### Animações & UX

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| **canvas-confetti** | 1.9 | Celebrações visuais |
| **Embla Carousel** | 8.6 | Carrosséis touch-friendly |
| **Sonner** | 1.7 | Notificações toast |

### PWA & Offline

| Tecnologia | Propósito |
|------------|-----------|
| **Vite PWA** | Service Worker e manifest |
| **Workbox** | Estratégias de cache offline |

---

## 🏗️ Arquitetura

### Padrão de Camadas

```
┌─────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                       │
│  Pages • Components • Layouts • UI Components (shadcn)          │
├─────────────────────────────────────────────────────────────────┤
│                          HOOKS LAYER                             │
│  useAuth • usePermissions • useXxxQuery • useXxxMutation        │
├─────────────────────────────────────────────────────────────────┤
│                         SERVICES LAYER                           │
│  auth.service • dashboard.service • cash.service • etc          │
├─────────────────────────────────────────────────────────────────┤
│                           API LAYER                              │
│  client.ts • token.ts • error-handler.ts                        │
├─────────────────────────────────────────────────────────────────┤
│                          TYPES LAYER                             │
│  api.ts • conference.types • dashboard.types • admin.types      │
└─────────────────────────────────────────────────────────────────┘
```

### Fluxo de Dados

```
┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
│   Page   │─────>│   Hook   │─────>│  Service │─────>│   API    │
│Component │      │ (Query)  │      │  Layer   │      │ Client   │
└──────────┘      └──────────┘      └──────────┘      └──────────┘
     ▲                 │                                    │
     │                 │                                    │
     │                 ▼                                    ▼
     │           ┌──────────┐                        ┌──────────┐
     └───────────│  Cache   │                        │  Backend │
                 │(TanStack)│                        │   API    │
                 └──────────┘                        └──────────┘
```

---

## 👥 Roles & Permissões (RBAC)

O sistema implementa um **RBAC (Role-Based Access Control)** granular com 4 níveis hierárquicos + Super Admin.

### Hierarquia de Roles

```
┌─────────────────────────────────────────────────────────────────┐
│                        SUPER ADMIN                               │
│         (Acesso total a todas lojas e funcionalidades)          │
├─────────────────────────────────────────────────────────────────┤
│                          ADMIN (4)                               │
│   Gestão completa • Usuários • Lojas • Regras • Auditoria       │
├─────────────────────────────────────────────────────────────────┤
│                        GERENTE (3)                               │
│   Relatórios • Ranking • Aprovações • Metas locais             │
├─────────────────────────────────────────────────────────────────┤
│                       CONFERENTE (2)                             │
│   Lançamento de turnos • Conferência • Aprovações               │
├─────────────────────────────────────────────────────────────────┤
│                        VENDEDOR (1)                              │
│   Dashboard pessoal • Vendas • Bônus • Comissões                │
└─────────────────────────────────────────────────────────────────┘
```

### Permissões Granulares

O sistema possui **28+ permissões granulares**:

```typescript
type Permission =
  // Dashboard
  | 'dashboard:view'
  // Sales
  | 'sales:create' | 'sales:view' | 'sales:edit' | 'sales:delete'
  // Bonus/Commission
  | 'bonus:view_own' | 'bonus:view_all'
  | 'commission:view_own' | 'commission:view_all'
  // Shifts & Closings
  | 'shift:create' | 'shift:view'
  | 'closing:submit' | 'closing:approve' | 'closing:reject'
  | 'divergence:view'
  // Goals & Rules
  | 'goals:view' | 'goals:manage'
  | 'rules:view' | 'rules:manage'
  // Reports
  | 'ranking:view' | 'reports:store_performance'
  | 'reports:cash_integrity' | 'reports:consolidated'
  // Admin
  | 'users:view' | 'users:manage'
  | 'stores:view' | 'stores:manage' | 'audit:view';
```

### Mapeamento Role → Permissões

| Permissão | Admin | Gerente | Conferente | Vendedor |
|-----------|:-----:|:-------:|:----------:|:--------:|
| dashboard:view | ✅ | ✅ | ✅ | ✅ |
| sales:view | ✅ | ✅ | ❌ | ✅ |
| sales:create | ❌ | ❌ | ❌ | ✅ |
| bonus:view_own | ✅ | ✅ | ❌ | ✅ |
| bonus:view_all | ✅ | ✅ | ❌ | ❌ |
| shift:create | ❌ | ❌ | ✅ | ✅ |
| closing:approve | ✅ | ✅ | ✅ | ❌ |
| goals:manage | ✅ | ✅ | ❌ | ❌ |
| users:manage | ✅ | ❌ | ❌ | ❌ |
| audit:view | ✅ | ❌ | ❌ | ❌ |

### Uso no Código

```typescript
// Hook de permissões
const { hasPermission, hasMinRole, isAdmin, currentRole } = usePermissions();

// Verificar permissão específica
if (hasPermission('closing:approve')) {
  // Pode aprovar fechamentos
}

// Verificar nível mínimo
if (hasMinRole('gerente')) {
  // Gerente ou superior
}

// Componente de guard
<RoleGuard roles={['admin', 'gerente']}>
  <AdminContent />
</RoleGuard>

// Componentes de conveniência
<AdminOnly><SecretContent /></AdminOnly>
<CanApprove><ApprovalButton /></CanApprove>
```

---

## 💰 Regras de Negócio

### 🎁 Bônus Diário

O sistema de bônus diário é baseado em **faixas de venda** e requer **conferência de caixa sem divergências**.

#### Tabela de Bônus (Configurável)

| Faixa de Venda | Bônus |
|----------------|-------|
| R$ 500 - R$ 999,99 | R$ 10,00 |
| R$ 1.000 - R$ 1.499,99 | R$ 25,00 |
| R$ 1.500 - R$ 1.999,99 | R$ 40,00 |
| R$ 2.000+ | R$ 60,00 |

#### Regras de Elegibilidade

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO DE ELEGIBILIDADE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   1. Vendedor atinge faixa de venda                             │
│              ↓                                                   │
│   2. Conferente registra fechamento de caixa                    │
│              ↓                                                   │
│   3. Sistema verifica: Valor Sistema = Valor Real?              │
│              ↓                                                   │
│        ┌─────┴─────┐                                            │
│        │           │                                            │
│       SIM         NÃO                                           │
│        ↓           ↓                                            │
│    ✅ ELEGÍVEL   Divergência detectada                          │
│                   ↓                                              │
│              Justificativa obrigatória                          │
│                   ↓                                              │
│              ❌ NÃO ELEGÍVEL                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Interface Gamificada

O dashboard do vendedor apresenta:

- **Barra de progresso**: Quanto falta para a próxima faixa
- **Valor do próximo bônus**: Motivação visual
- **Mensagem motivacional**: Feedback contextual

```typescript
interface BonusGamification {
  current_amount: number;       // Vendido até agora
  next_bonus_goal: number;      // Próxima faixa
  gap_to_bonus: number;         // Quanto falta
  next_bonus_value: number;     // Valor do próximo bônus
  current_bonus_earned: number; // Já ganho hoje
  message: string;              // "Faltam R$ 150 para +R$ 25!"
}
```

### 📊 Comissão Mensal

Sistema escalonado baseado no **percentual de atingimento da meta mensal**.

#### Tabela de Comissões (Configurável)

| % da Meta | % Comissão |
|-----------|------------|
| 80% - 99% | 2% |
| 100% - 119% | 3% |
| 120%+ | 4% |

#### Cálculo Projetado

O sistema calcula em tempo real:

```typescript
interface MonthlyCommission {
  month: string;                    // "2026-01"
  sales_mtd: number;                // Vendas do mês até agora
  goal_amount: number;              // Meta mensal
  achievement_rate: number;         // % atingido
  days_elapsed: number;             // Dias passados
  days_total: number;               // Dias totais
  current_tier: number;             // Tier atual (2, 3 ou 4%)
  current_commission_value: number; // Comissão já garantida
  next_tier: number | null;         // Próximo tier
  gap_to_next_tier: number;         // Quanto falta
  projected_sales: number;          // Projeção linear
  projected_achievement: number;    // % projetado
  projected_tier: number;           // Tier projetado
  potential_commission: number;     // Comissão potencial
}
```

#### Exemplo Prático

```
Vendedor: Ana
Meta Mensal: R$ 50.000
Dia atual: 15 de Janeiro (50% do mês)
Vendas MTD: R$ 28.000 (56% da meta)

Projeção Linear: R$ 28.000 × 2 = R$ 56.000 (112% da meta)
Tier Projetado: 3% (entre 100-119%)
Comissão Potencial: R$ 56.000 × 3% = R$ 1.680

Gap para Tier 4%:
- Meta 120%: R$ 60.000
- Faltam: R$ 32.000 até fim do mês
```

---

## ✨ Funcionalidades Implementadas

### Dashboards por Role

| Role | Dashboard | Principais Features |
|------|-----------|---------------------|
| **Vendedor** | `DashboardVendedor` | Odômetro de metas, BonusProgress, projeção de comissão, ritmo diário |
| **Conferente** | `DashboardConferente` | Pendentes, divergências, top vendedores, vendas da loja |
| **Admin/Gerente** | `DashboardAdmin` | Consolidado multi-loja, closings summary, top performers |

### Módulo Faturamento (Vendedor)

- **Extrato de Vendas**: Histórico detalhado com filtros
- **Meus Bônus**: Histórico de bônus por período
- **Minhas Comissões**: Comissões mensais detalhadas

### Módulo Conferência (Conferente)

- **Lançar Turno**: Formulário de fechamento de caixa
- **Divergências**: Fila de pendências com priorização
- **Histórico de Envelopes**: Consulta de fechamentos anteriores

### Módulo Gestão (Gerente/Admin)

- **Ranking de Vendas**: Podium + lista com posição anterior
- **Desempenho de Lojas**: Farol semafórico de performance
- **Quebra de Caixa**: Análise de integridade de caixa

### Módulo Configurações (Admin)

- **Metas Mensais**: CRUD de metas por loja/vendedor
- **Tabela de Bônus**: CRUD de faixas de bônus
- **Regras de Comissão**: CRUD de tiers de comissão
- **Usuários & Lojas**: Gestão completa
- **Auditoria**: Log de ações do sistema

### Componentes Reutilizáveis

| Componente | Descrição |
|------------|-----------|
| `GaugeChart` | Odômetro animado com gradiente |
| `CountdownTimer` | Timer regressivo estilizado |
| `BonusProgress` | Barra de progresso gamificada |
| `StatCard` | Card de estatística com variantes |
| `StatusBadge` | Badge semafórico (verde/amarelo/vermelho) |
| `DataTable` | Tabela com paginação e filtros |
| `MoneyInput` | Input monetário formatado |
| `MonthPicker` | Seletor de mês/ano |
| `RoleGuard` | HOC para proteção de rotas/componentes |
| `EmptyState` | Estado vazio com ilustração |

---

## 📱 PWA & Mobile

### Progressive Web App

O sistema está configurado como PWA com:

- **Manifest**: Ícones, cores, orientação portrait
- **Service Worker**: Cache offline com Workbox
- **Installable**: Prompt de instalação nativo
- **Offline Page**: Fallback quando offline
- **Apple Touch Icons**: Suporte iOS

### Recursos Configurados

| Recurso | Status | Descrição |
|---------|--------|-----------|
| Web Manifest | ✅ | name, icons, theme_color |
| Service Worker | ✅ | Workbox auto-update |
| Offline Support | ✅ | Página offline fallback |
| Install Prompt | ✅ | Componente PWAInstallPrompt |
| Apple Touch Icon | ✅ | Suporte iOS/Safari |

### Responsividade

- **Mobile First**: Layouts otimizados para telas pequenas
- **Breakpoints**: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px)
- **Touch Friendly**: Botões e interações adequados para touch
- **Drawer Sidebar**: Navegação lateral colapsável em mobile

---

## ✅ Boas Práticas Utilizadas

### TypeScript & Tipagem

- **Tipagem estrita** em todo o projeto
- **Zod** para validação runtime de schemas
- **Inferência automática** de tipos a partir de schemas
- **Generic types** para componentes reutilizáveis

### React Query (TanStack Query)

- **Query keys organizadas** por domínio
- **Cache strategies** por role (vendedor: 1min, admin: 5min)
- **Optimistic updates** para melhor UX
- **Prefetching** de dados críticos

### Segurança

- **Sanitização de inputs** com lib/security
- **Rate limiting** no client
- **Token management** seguro (memória + sessionStorage)
- **XSS prevention** em inputs
- **RLS policies** preparadas para backend

### Performance

- **Code Splitting**: Lazy loading de páginas
- **React Query Cache**: Evita refetch desnecessário
- **Memoization**: `useMemo`, `useCallback` estratégicos
- **Debounce/Throttle**: Em buscas e filtros

### Acessibilidade (a11y)

- Componentes shadcn/ui com ARIA
- Navegação por teclado funcional
- Contraste adequado em dark/light mode
- Labels em todos os formulários
- Focus management em modais

---

## 📁 Estrutura do Projeto

```
src/
├── components/              # Componentes reutilizáveis
│   ├── auth/               # GuestRoute, exports
│   ├── crud/               # ConfirmDialog, DataTable, FormDialog
│   ├── dashboards/         # DashboardVendedor, Conferente, Admin
│   ├── layout/             # MobileSidebar
│   └── ui/                 # shadcn/ui (50+ componentes)
├── contexts/               # AuthContext
├── hooks/
│   ├── api/                # React Query hooks por domínio
│   │   ├── use-auth.ts
│   │   ├── use-dashboard.ts
│   │   ├── use-cash.ts
│   │   ├── use-cash-shifts.ts
│   │   ├── use-cash-closings.ts
│   │   ├── use-sales.ts
│   │   ├── use-finance.ts
│   │   ├── use-reports.ts
│   │   ├── use-goals.ts
│   │   ├── use-rules.ts
│   │   ├── use-stores.ts
│   │   ├── use-admin-stores.ts
│   │   ├── use-admin-users.ts
│   │   └── use-audit.ts
│   ├── usePermissions.ts
│   ├── useFilteredMenu.ts
│   └── useSessionTimeout.ts
├── layouts/                # MainLayout
├── lib/
│   ├── api/                # client, token, error-handler
│   ├── config/             # menuConfig
│   ├── permissions/        # RBAC schemas, constants
│   ├── security/           # Sanitização
│   └── utils/              # rateLimiter, helpers
├── pages/
│   ├── conferencia/        # LancarTurno, Divergencias, Historico
│   ├── config/             # Metas, Bonus, Regras, Usuarios, Auditoria
│   ├── faturamento/        # Extrato, MeusBonus, MinhasComissoes
│   ├── gestao/             # Ranking, Lojas, QuebraCaixa
│   ├── Dashboard.tsx
│   ├── Login.tsx
│   ├── ForgotPassword.tsx
│   └── Unauthorized.tsx
├── providers/              # QueryProvider
├── schemas/                # Zod schemas (auth, cash)
├── services/
│   ├── admin/              # goals, rules, stores, users, audit
│   ├── conference/         # cash-shifts, cash-closings
│   ├── auth.service.ts
│   ├── dashboard.service.ts
│   ├── sales.service.ts
│   ├── finance.service.ts
│   ├── reports.service.ts
│   └── stores.service.ts
├── types/
│   ├── api.ts              # Types gerais da API
│   ├── conference.types.ts # Tipos de conferência
│   ├── dashboard.types.ts  # Tipos de dashboard
│   ├── admin.types.ts      # Tipos administrativos
│   └── index.ts            # Re-exports
└── data/
    └── mockData.ts         # Dados mockados para desenvolvimento
```

---

## 🚀 Como Rodar

### Pré-requisitos

- Node.js 18+ ou Bun
- npm, yarn ou bun

### Instalação

```bash
# Clone o repositório
git clone https://github.com/maiscapinhas/erp-verao-2026.git
cd erp-verao-2026

# Instale as dependências
npm install
# ou
bun install
```

### Desenvolvimento

```bash
# Inicie o servidor de desenvolvimento
npm run dev
# ou
bun dev

# Acesse http://localhost:8080
```

### Build de Produção

```bash
# Build otimizado
npm run build

# Preview do build
npm run preview
```

### Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run preview` | Preview do build |
| `npm run lint` | ESLint |

---

## 📊 Status do Desenvolvimento

### Fases Concluídas

| Fase | Descrição | Status |
|------|-----------|--------|
| **1. MVP Dashboard** | Dashboards por role, componentes base | ✅ 100% |
| **2. Meu Faturamento** | Extrato, Bônus, Comissões | ✅ 100% |
| **3. Conferência de Caixa** | Lançamento, Divergências, Histórico | ✅ 100% |
| **4. Gestão & Relatórios** | Ranking, Lojas, Quebra | ✅ 100% |
| **5. Configurações Admin** | Metas, Bônus, Regras, Usuários, Auditoria | ✅ 100% |

### Próximas Etapas

| Fase | Descrição | Status |
|------|-----------|--------|
| **6. Backend Real** | Integração com API/Lovable Cloud | 🔄 Pendente |
| **7. Animações** | Framer Motion, micro-interactions | 🔄 Pendente |
| **8. PWA Avançado** | Push notifications, sync offline | 🔄 Pendente |
| **9. Testes** | Vitest, Testing Library | 🔄 Pendente |

---

## 📚 Documentação Adicional

| Arquivo | Descrição |
|---------|-----------|
| [backend.md](./backend.md) | Especificação completa de 40+ endpoints |
| [FRONTEND_IMPROVEMENTS.md](./FRONTEND_IMPROVEMENTS.md) | Roadmap de melhorias técnicas |
| [docs/CONFERENCIA_CAIXA_BACKEND.md](./docs/CONFERENCIA_CAIXA_BACKEND.md) | Fluxo detalhado de conferência |

---

## 🎨 Design System

### Paleta de Cores

```css
:root {
  /* Backgrounds */
  --background: 222 47% 11%;        /* #151521 */
  --foreground: 0 0% 95%;           /* #F2F2F2 */
  
  /* Primary (Roxo Vibrante) */
  --primary: 250 89% 65%;           /* #8B5CF6 */
  --primary-foreground: 0 0% 100%;
  
  /* Secondary (Ciano/Turquesa) */
  --secondary: 168 76% 42%;         /* #1ABC9C */
  
  /* Semáforo */
  --success: 142 76% 36%;           /* Verde */
  --warning: 38 92% 50%;            /* Amarelo */
  --destructive: 0 84% 60%;         /* Vermelho */
}
```

---

## 🤝 Contribuição

1. Fork o repositório
2. Crie uma branch: `git checkout -b feature/minha-feature`
3. Commit suas mudanças: `git commit -m 'feat: adiciona nova feature'`
4. Push para a branch: `git push origin feature/minha-feature`
5. Abra um Pull Request

### Padrão de Commits

- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Formatação
- `refactor:` Refatoração
- `test:` Testes
- `chore:` Manutenção

---

## 📝 Licença

Este projeto é **proprietário** da rede Mais Capinhas. Todos os direitos reservados.

---

<div align="center">

Desenvolvido com 💜 para **Mais Capinhas**

**Verão 2026**

</div>
