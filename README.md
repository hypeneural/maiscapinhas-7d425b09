# ERP Mais Capinhas – Verão 2026

Sistema ERP Web completo para gestão de vendas, conferência de caixa e acompanhamento de metas da rede **Mais Capinhas**.

![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss)
![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?logo=vite)
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-Latest-000000?logo=shadcnui)

---

## Índice

- [Visão Geral](#visão-geral)
- [Stack Tecnológica](#stack-tecnológica)
- [Funcionalidades Implementadas](#funcionalidades-implementadas)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Como Executar](#como-executar)
- [Sistema de Permissões (RBAC)](#sistema-de-permissões-rbac)
- [Status do Desenvolvimento](#status-do-desenvolvimento)
- [Sugestões de Endpoints para Backend](#sugestões-de-endpoints-para-backend)
- [Sugestões de Melhorias no Frontend](#sugestões-de-melhorias-no-frontend)

---

## Visão Geral

O **ERP Mais Capinhas** é uma aplicação web responsiva projetada para:

- **Vendedores**: Acompanhar metas diárias/mensais com gamificação e bônus
- **Conferentes**: Validar fechamento de caixa e identificar divergências
- **Gerentes/Admins**: Visualizar rankings, desempenho de lojas e configurar regras

### Filosofia de Design

- **80/20**: Interface ultra-simples para vendedores (foco em dois indicadores principais)
- **Gamificação**: Bônus progressivos e contagem regressiva para criar senso de urgência
- **Validação Forte**: Conferência de caixa não permite fechar com divergências não justificadas
- **Cores Semafóricas**: Verde (meta batida/caixa ok), Amarelo (atenção), Vermelho (divergência/abaixo da meta)

---

## Stack Tecnológica

### Core

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| **React** | 18.3.1 | Biblioteca UI principal |
| **TypeScript** | 5.0+ | Tipagem estática |
| **Vite** | 5.0+ | Build tool e dev server |
| **Tailwind CSS** | 3.4+ | Estilização utility-first |
| **shadcn/ui** | Latest | Componentes UI acessíveis |

### Bibliotecas de Suporte

| Biblioteca | Versão | Propósito |
|------------|--------|-----------|
| **React Router DOM** | 6.30+ | Navegação e rotas |
| **Recharts** | 2.15+ | Gráficos (velocímetros, barras, pizza, área) |
| **TanStack Query** | 5.83+ | Gerenciamento de estado servidor/cache |
| **React Hook Form** | 7.61+ | Gerenciamento de formulários |
| **Zod** | 3.25+ | Validação de schemas |
| **Lucide React** | 0.462+ | Biblioteca de ícones |
| **date-fns** | 3.6+ | Manipulação de datas |
| **class-variance-authority** | 0.7+ | Variantes de componentes |
| **Sonner** | 1.7+ | Notificações toast |

### Identidade Visual

```css
/* Paleta de Cores */
--primary: hsl(310 47% 27%)     /* #6C2460 - Roxo (marca) */
--secondary: hsl(172 85% 33%)   /* #0C9C90 - Teal (ações) */
--accent: hsl(49 100% 47%)      /* #F0CC00 - Amarelo (destaques) */

/* Semânticas */
--success: hsl(152 69% 31%)     /* Verde - Meta batida */
--warning: hsl(45 93% 47%)      /* Amarelo - Atenção */
--destructive: hsl(0 84% 60%)   /* Vermelho - Crítico */

/* Neutras */
--background: hsl(0 0% 98%)     /* #FAFAFA */
--muted: hsl(0 0% 96%)          /* #F5F5F5 */
--border: hsl(0 0% 89%)         /* #E4E4E4 */
```

---

## Funcionalidades Implementadas

### Dashboards por Perfil

| Dashboard | Componentes | Status |
|-----------|-------------|--------|
| **Vendedor** | Gauge velocímetro, Timer regressivo, Barra de bônus, Resumo mensal | ✅ Completo |
| **Conferente** | Cards de status, Lista de pendências, Ações rápidas | ✅ Completo |
| **Admin/Gerente** | Top 3 vendedores, Farol de lojas, Indicador de risco | ✅ Completo |

### Módulo Faturamento (Vendedor)

| Tela | Funcionalidade | Status |
|------|----------------|--------|
| **Extrato de Vendas** | Histórico diário, vendas vs meta, indicadores visuais | ✅ Completo |
| **Meus Bônus** | Lista de bônus por dia, status (pendente/aprovado/rejeitado), totalizadores | ✅ Completo |
| **Minhas Comissões** | Projeção de comissão, faixas escalonadas, simulador | ✅ Completo |

### Módulo Conferência (Conferente)

| Tela | Funcionalidade | Status |
|------|----------------|--------|
| **Lançar Turno** | Filtros, grid comparativo Sistema vs Real, cálculo de diferença, justificativa obrigatória | ✅ Completo |
| **Divergências** | Lista ordenada por antiguidade/valor, ações rápidas | ✅ Completo |
| **Histórico de Envelopes** | Consulta de fechamentos passados, filtros avançados, exportação | ✅ Completo |

### Módulo Gestão (Gerente/Admin)

| Tela | Funcionalidade | Status |
|------|----------------|--------|
| **Ranking de Vendas** | Top vendedores, pódio animado, gráficos comparativos, filtros por período | ✅ Completo |
| **Desempenho por Loja** | Farol de lojas, gráficos de evolução, comparativo mês atual vs anterior | ✅ Completo |
| **Quebra de Caixa** | Relatório de divergências, ranking de maior % erro, indicadores de risco | ✅ Completo |

### Módulo Configurações (Admin)

| Tela | Funcionalidade | Status |
|------|----------------|--------|
| **Metas Mensais** | CRUD de metas por loja, distribuição entre vendedores | ✅ Completo |
| **Tabela de Bônus** | CRUD de faixas de bônus diário | ✅ Completo |
| **Regras de Comissão** | CRUD de faixas de comissão escalonada | ✅ Completo |
| **Usuários & Lojas** | CRUD de usuários e lojas, gestão de permissões | ✅ Completo |

### Componentes Reutilizáveis

| Componente | Descrição |
|------------|-----------|
| `GaugeChart` | Gráfico velocímetro animado com cores semafóricas |
| `StatusBadge` | Badges de status com variantes (success/warning/error/default) |
| `StatCard` | Cards de estatísticas com ícones e tendência |
| `MoneyInput` | Input monetário formatado (R$) |
| `BonusProgress` | Barra de progresso para próximo bônus |
| `CountdownTimer` | Timer regressivo animado |
| `DataTable` | Tabela reutilizável com ordenação e paginação |
| `PageHeader` | Cabeçalho de página com breadcrumbs e ações |
| `EmptyState` | Estado vazio com ilustração e CTA |
| `RoleGuard` | HOC para proteção de componentes por permissão |

---

## Estrutura do Projeto

```
src/
├── components/
│   ├── dashboards/
│   │   ├── DashboardAdmin.tsx
│   │   ├── DashboardConferente.tsx
│   │   └── DashboardVendedor.tsx
│   ├── ui/                        # Componentes shadcn/ui
│   ├── AppSidebar.tsx
│   ├── BonusProgress.tsx
│   ├── CountdownTimer.tsx
│   ├── DataTable.tsx
│   ├── EmptyState.tsx
│   ├── GaugeChart.tsx
│   ├── MoneyInput.tsx
│   ├── PageHeader.tsx
│   ├── RoleGuard.tsx
│   ├── RoleSwitcher.tsx
│   ├── StatCard.tsx
│   └── StatusBadge.tsx
├── contexts/
│   └── AuthContext.tsx
├── data/
│   └── mockData.ts
├── hooks/
│   ├── use-mobile.tsx
│   └── use-toast.ts
├── layouts/
│   └── MainLayout.tsx
├── pages/
│   ├── conferencia/
│   │   ├── Divergencias.tsx
│   │   ├── HistoricoEnvelopes.tsx
│   │   └── LancarTurno.tsx
│   ├── config/
│   │   ├── MetasMensais.tsx
│   │   ├── RegrasComissao.tsx
│   │   ├── TabelaBonus.tsx
│   │   └── UsuariosLojas.tsx
│   ├── faturamento/
│   │   ├── ExtratoVendas.tsx
│   │   ├── MeusBonus.tsx
│   │   └── MinhasComissoes.tsx
│   ├── gestao/
│   │   ├── DesempenhoLojas.tsx
│   │   ├── QuebraCaixa.tsx
│   │   └── RankingVendas.tsx
│   ├── Dashboard.tsx
│   ├── Index.tsx
│   └── NotFound.tsx
├── types/
│   └── index.ts
├── App.tsx
├── index.css
└── main.tsx
```

---

## Como Executar

### Pré-requisitos

- Node.js 18+
- npm, yarn ou bun

### Instalação

```bash
# Clone o repositório
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

### Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Servidor de desenvolvimento (hot reload) |
| `npm run build` | Build otimizado de produção |
| `npm run preview` | Preview do build local |
| `npm run lint` | Análise estática com ESLint |

---

## Sistema de Permissões (RBAC)

| Role | Descrição | Módulos Acessíveis |
|------|-----------|-------------------|
| **Admin** | Gestão total do sistema | Dashboard, Conferência, Gestão, Configurações |
| **Gerente** | Relatórios e supervisão | Dashboard, Gestão |
| **Conferente** | Fechamento de caixa | Dashboard, Conferência |
| **Vendedor** | Faturamento pessoal | Dashboard, Meu Faturamento |

### Role Switcher (Desenvolvimento)

Use o seletor no canto inferior direito para alternar entre perfis e testar as diferentes visões.

---

## Status do Desenvolvimento

### Fase 1 - MVP ✅

- [x] Dashboards personalizados por role
- [x] Módulo Faturamento completo (Vendedor)
- [x] Módulo Conferência completo (Conferente)
- [x] Sistema de autenticação mockado com RBAC

### Fase 2 - Gestão ✅

- [x] Ranking completo de vendedores com pódio
- [x] Desempenho por loja com gráficos Recharts
- [x] Relatório de quebra de caixa detalhado
- [x] Histórico de envelopes

### Fase 3 - Configurações ✅

- [x] CRUD de Metas Mensais
- [x] CRUD de Tabela de Bônus
- [x] CRUD de Regras de Comissão
- [x] Gestão de Usuários e Lojas

### Fase 4 - Backend (Pendente)

- [ ] Integração com Lovable Cloud (Supabase)
- [ ] Autenticação real (email/senha)
- [ ] API REST para persistência
- [ ] Sincronização em tempo real

### Fase 5 - Produção (Pendente)

- [ ] Deploy em produção
- [ ] Domínio customizado
- [ ] PWA / Modo offline
- [ ] Monitoramento e analytics

---

## Sugestões de Endpoints para Backend

### Autenticação

```
POST   /auth/login                    # Login com email/senha
POST   /auth/logout                   # Logout
POST   /auth/refresh                  # Refresh token
GET    /auth/me                       # Dados do usuário logado
POST   /auth/forgot-password          # Solicitar reset de senha
POST   /auth/reset-password           # Resetar senha
```

### Lojas

```
GET    /lojas                         # Listar todas as lojas
GET    /lojas/:id                     # Detalhes de uma loja
POST   /lojas                         # Criar loja
PUT    /lojas/:id                     # Atualizar loja
DELETE /lojas/:id                     # Desativar loja
GET    /lojas/:id/vendedores          # Vendedores da loja
GET    /lojas/:id/desempenho          # Métricas de desempenho
```

### Usuários

```
GET    /usuarios                      # Listar usuários (com filtros)
GET    /usuarios/:id                  # Detalhes do usuário
POST   /usuarios                      # Criar usuário
PUT    /usuarios/:id                  # Atualizar usuário
DELETE /usuarios/:id                  # Desativar usuário
PUT    /usuarios/:id/role             # Alterar role
GET    /usuarios/aniversariantes      # Aniversariantes do mês
```

### Turnos / Fechamentos

```
GET    /turnos                        # Listar turnos (com filtros: data, loja, vendedor, status)
GET    /turnos/:id                    # Detalhes do turno
POST   /turnos                        # Criar/registrar turno
PUT    /turnos/:id                    # Atualizar turno (conferência)
PUT    /turnos/:id/validar            # Validar e fechar turno
GET    /turnos/pendentes              # Turnos pendentes de conferência
GET    /turnos/divergentes            # Turnos com divergência
```

### Metas

```
GET    /metas                         # Listar metas (filtro por mês/ano/loja)
GET    /metas/:id                     # Detalhes da meta
POST   /metas                         # Criar meta
PUT    /metas/:id                     # Atualizar meta
DELETE /metas/:id                     # Remover meta
POST   /metas/:id/distribuir          # Distribuir meta entre vendedores
```

### Bônus

```
GET    /bonus/tabela                  # Listar faixas de bônus
POST   /bonus/tabela                  # Criar faixa
PUT    /bonus/tabela/:id              # Atualizar faixa
DELETE /bonus/tabela/:id              # Remover faixa
GET    /bonus/vendedor/:id            # Bônus do vendedor (por período)
GET    /bonus/calcular                # Calcular bônus (simulação)
```

### Comissões

```
GET    /comissoes/regras              # Listar regras de comissão
POST   /comissoes/regras              # Criar regra
PUT    /comissoes/regras/:id          # Atualizar regra
DELETE /comissoes/regras/:id          # Remover regra
GET    /comissoes/vendedor/:id        # Comissão do vendedor (por período)
GET    /comissoes/projecao/:id        # Projeção de comissão
```

### Dashboard / Relatórios

```
GET    /dashboard/vendedor            # Dados do dashboard vendedor
GET    /dashboard/conferente          # Dados do dashboard conferente
GET    /dashboard/admin               # Dados do dashboard admin
GET    /relatorios/ranking            # Ranking de vendedores
GET    /relatorios/desempenho-lojas   # Desempenho comparativo de lojas
GET    /relatorios/quebra-caixa       # Relatório de quebra de caixa
GET    /relatorios/historico          # Histórico de fechamentos
```

### Estrutura de Resposta Sugerida

```json
{
  "success": true,
  "data": { ... },
  "pagination": {
    "page": 1,
    "perPage": 20,
    "total": 150,
    "totalPages": 8
  },
  "meta": {
    "timestamp": "2026-01-08T12:00:00Z"
  }
}
```

### Estrutura de Erro

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Justificativa é obrigatória para divergências",
    "details": [...]
  }
}
```

---

## Sugestões de Melhorias no Frontend

### Alta Prioridade

| Melhoria | Descrição | Impacto | Complexidade |
|----------|-----------|---------|--------------|
| **Animações com Framer Motion** | Transições de página, micro-interações, animação do pódio | Alto | Média |
| **Modo Escuro** | Tema dark seguindo a paleta da marca | Médio | Baixa |
| **Notificações Push** | Alertas de metas, divergências pendentes | Alto | Média |
| **Exportação PDF/Excel** | Relatórios exportáveis em todos os módulos | Alto | Média |
| **Filtros Persistentes** | Salvar preferências de filtros por usuário | Médio | Baixa |

### Média Prioridade

| Melhoria | Descrição | Impacto | Complexidade |
|----------|-----------|---------|--------------|
| **Tour Guiado (Onboarding)** | Tutorial interativo para novos usuários | Médio | Média |
| **Gráficos Comparativos** | Comparativo mês atual vs anterior em todas as telas | Alto | Média |
| **Shortcuts de Teclado** | Atalhos para ações frequentes | Baixo | Baixa |
| **Drag & Drop** | Reordenação de cards no dashboard | Baixo | Média |
| **Busca Global** | Buscar vendedores, lojas, turnos de qualquer lugar | Médio | Média |

### Baixa Prioridade (Nice to Have)

| Melhoria | Descrição | Impacto | Complexidade |
|----------|-----------|---------|--------------|
| **Dashboard Customizável** | Widgets arrastáveis por usuário | Médio | Alta |
| **Notificações In-App** | Centro de notificações com histórico | Médio | Média |
| **Modo Apresentação** | Tela cheia para TVs/monitores em lojas | Baixo | Baixa |
| **Chat Interno** | Comunicação entre gerentes e vendedores | Médio | Alta |
| **Gamificação Avançada** | Conquistas, níveis, badges | Médio | Alta |

### Performance

| Melhoria | Descrição | Impacto | Complexidade |
|----------|-----------|---------|--------------|
| **Lazy Loading de Rotas** | Code splitting por módulo | Médio | Baixa |
| **Virtualização de Listas** | Para rankings e históricos grandes | Médio | Média |
| **Cache Otimizado (TanStack)** | Stale-while-revalidate em todos os endpoints | Alto | Média |
| **PWA Completo** | Service worker, offline mode, instalável | Alto | Alta |
| **Prefetch de Dados** | Carregar próximas páginas antecipadamente | Médio | Baixa |

### Acessibilidade

| Melhoria | Descrição | Impacto | Complexidade |
|----------|-----------|---------|--------------|
| **Skip Links** | Navegação rápida para conteúdo principal | Baixo | Baixa |
| **Focus Management** | Gerenciamento de foco em modais/navegação | Médio | Média |
| **Screen Reader Support** | ARIA labels e live regions | Médio | Média |
| **Alto Contraste** | Modo de alto contraste para acessibilidade visual | Baixo | Baixa |

### Integrações Futuras

| Integração | Descrição | Impacto | Complexidade |
|------------|-----------|---------|--------------|
| **WhatsApp Business API** | Alertas e relatórios via WhatsApp | Alto | Alta |
| **Integração com PDV** | Sincronização automática de vendas | Crítico | Alta |
| **API para App Mobile** | Endpoints otimizados para React Native | Alto | Alta |
| **Webhooks** | Eventos para automações externas (Zapier, n8n) | Médio | Média |
| **Google Sheets** | Exportação automática para planilhas | Médio | Média |

---

## Contribuição

1. Fork o repositório
2. Crie uma branch: `git checkout -b feature/minha-feature`
3. Commit: `git commit -m 'feat: adiciona minha feature'`
4. Push: `git push origin feature/minha-feature`
5. Abra um Pull Request

---

## Licença

Este projeto é proprietário da rede **Mais Capinhas**.

---

<p align="center">
  Desenvolvido com Lovable
</p>
