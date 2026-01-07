# 🛒 ERP Mais Capinhas

Sistema ERP Web completo para gestão de vendas, conferência de caixa e acompanhamento de metas da rede **Mais Capinhas**.

![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss)
![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?logo=vite)

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Stack Tecnológica](#-stack-tecnológica)
- [Funcionalidades](#-funcionalidades)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Como Executar](#-como-executar)
- [Sistema de Permissões (RBAC)](#-sistema-de-permissões-rbac)
- [Status do Desenvolvimento](#-status-do-desenvolvimento)
- [Roadmap](#-roadmap)
- [Sugestões de Melhorias](#-sugestões-de-melhorias)

---

## 🎯 Visão Geral

O **ERP Mais Capinhas** é uma aplicação web responsiva projetada para:

- 📊 **Vendedores**: Acompanhar metas diárias/mensais com gamificação e bônus
- 📝 **Conferentes**: Validar fechamento de caixa e identificar divergências
- 📈 **Gerentes/Admins**: Visualizar rankings, desempenho de lojas e configurar regras

### Filosofia de Design
- **80/20**: Interface ultra-simples para vendedores (foco em dois indicadores principais)
- **Gamificação**: Bônus progressivos e contagem regressiva para criar senso de urgência
- **Validação Forte**: Conferência de caixa não permite fechar com divergências não justificadas

---

## 🛠 Stack Tecnológica

### Frontend
| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| **React** | 18.3.1 | Biblioteca UI principal |
| **TypeScript** | 5.0+ | Tipagem estática |
| **Vite** | 5.0+ | Build tool e dev server |
| **Tailwind CSS** | 3.4+ | Estilização utility-first |
| **shadcn/ui** | Latest | Componentes UI acessíveis |

### Bibliotecas Principais
| Biblioteca | Propósito |
|------------|-----------|
| **React Router DOM** | Navegação e rotas |
| **Recharts** | Gráficos (velocímetros, barras, rankings) |
| **TanStack Query** | Gerenciamento de estado servidor/cache |
| **React Hook Form** | Gerenciamento de formulários |
| **Zod** | Validação de schemas |
| **Lucide React** | Ícones |
| **date-fns** | Manipulação de datas |
| **Framer Motion** | Animações (planejado) |

### Identidade Visual
```css
/* Cores da marca */
--primary: #6C2460    /* Roxo - cor principal */
--secondary: #0C9C90  /* Teal - ações secundárias */
--accent: #F0CC00     /* Amarelo - destaques */
--muted: #F0F0F0      /* Cinza claro - backgrounds */
--border: #E4E4E4     /* Cinza - bordas */
```

---

## ✅ Funcionalidades

### Implementadas

#### 🏠 Dashboard (Personalizado por Role)

**Dashboard Vendedor:**
- ✅ Gráfico velocímetro (Gauge) - Meta do dia vs Vendido
- ✅ Indicador visual de status (verde/amarelo/vermelho)
- ✅ Contagem regressiva do turno
- ✅ Barra de progresso para próximo bônus
- ✅ Resumo mensal (% da meta e comissão projetada)

**Dashboard Conferente:**
- ✅ Cards de status (A Conferir, Com Divergência, Conferidos)
- ✅ Lista de turnos pendentes ordenada por prioridade
- ✅ Acesso rápido ao lançamento de turno

**Dashboard Admin/Gerente:**
- ✅ Top 3 vendedores do mês com avatares
- ✅ Farol de lojas (verde/amarelo/vermelho)
- ✅ Indicador de risco (% quebra de caixa)
- ✅ Estatísticas gerais da rede

#### 💰 Meu Faturamento (Vendedor)

- ✅ **Extrato de Vendas**: Histórico com vendas vs meta por dia
- ✅ **Meus Bônus**: Visualização de bônus diários (pendente/aprovado/rejeitado)
- ✅ **Minhas Comissões**: Previsão de comissão mensal por faixa

#### 📝 Conferência de Caixa (Conferente)

- ✅ **Lançamento de Turno**: 
  - Filtros por loja, data, turno, vendedor
  - Grid comparativo (Sistema vs Real)
  - Cálculo de diferença em tempo real
  - Justificativa obrigatória para divergências
  - Validação forte antes de fechar turno

- ✅ **Divergências**:
  - Lista ordenada por antiguidade e valor
  - Indicadores visuais de pendência
  - Ação rápida para resolver

#### 🔐 Sistema de Autenticação

- ✅ Context de autenticação com RBAC
- ✅ Role Switcher para desenvolvimento
- ✅ RoleGuard para proteção de componentes
- ✅ Menu dinâmico baseado em permissões

#### 🎨 Componentes Reutilizáveis

- ✅ `GaugeChart` - Gráfico velocímetro animado
- ✅ `StatusBadge` - Badges de status coloridos
- ✅ `StatCard` - Cards de estatísticas
- ✅ `MoneyInput` - Input monetário formatado
- ✅ `BonusProgress` - Barra de progresso de bônus
- ✅ `CountdownTimer` - Timer regressivo
- ✅ `RoleGuard` - Proteção por permissão
- ✅ `AppSidebar` - Menu lateral retrátil

---

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── dashboards/
│   │   ├── DashboardAdmin.tsx      # Dashboard para Admin/Gerente
│   │   ├── DashboardConferente.tsx # Dashboard para Conferente
│   │   └── DashboardVendedor.tsx   # Dashboard para Vendedor
│   ├── ui/                         # Componentes shadcn/ui
│   ├── AppSidebar.tsx              # Menu lateral
│   ├── BonusProgress.tsx           # Barra de bônus
│   ├── CountdownTimer.tsx          # Timer regressivo
│   ├── GaugeChart.tsx              # Gráfico velocímetro
│   ├── MoneyInput.tsx              # Input monetário
│   ├── NavLink.tsx                 # Link de navegação
│   ├── RoleGuard.tsx               # Proteção por role
│   ├── RoleSwitcher.tsx            # Alternador de perfil (dev)
│   ├── StatCard.tsx                # Card de estatística
│   └── StatusBadge.tsx             # Badge de status
├── contexts/
│   └── AuthContext.tsx             # Context de autenticação
├── data/
│   └── mockData.ts                 # Dados mock para desenvolvimento
├── hooks/
│   ├── use-mobile.tsx              # Hook para detecção mobile
│   └── use-toast.ts                # Hook para notificações
├── layouts/
│   └── MainLayout.tsx              # Layout principal com sidebar
├── pages/
│   ├── conferencia/
│   │   ├── Divergencias.tsx        # Tela de divergências
│   │   └── LancarTurno.tsx         # Lançamento de turno
│   ├── faturamento/
│   │   ├── ExtratoVendas.tsx       # Extrato de vendas
│   │   ├── MeusBonus.tsx           # Meus bônus
│   │   └── MinhasComissoes.tsx     # Minhas comissões
│   ├── Dashboard.tsx               # Dashboard principal
│   ├── Index.tsx                   # Página inicial
│   └── NotFound.tsx                # Página 404
├── types/
│   └── index.ts                    # Tipos TypeScript
├── App.tsx                         # Rotas da aplicação
├── index.css                       # Estilos globais e tokens
└── main.tsx                        # Entry point
```

---

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+
- npm ou bun

### Instalação

```bash
# Clone o repositório
git clone <YOUR_GIT_URL>

# Entre no diretório
cd <YOUR_PROJECT_NAME>

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

### Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run preview` | Preview do build |
| `npm run lint` | Executa ESLint |

---

## 🔐 Sistema de Permissões (RBAC)

O sistema possui 4 níveis de acesso:

| Role | Descrição | Acesso |
|------|-----------|--------|
| **Admin** | Gestão total do sistema | Todas as telas + Configurações |
| **Gerente** | Relatórios e desempenho | Dashboard Macro + Gestão |
| **Conferente** | Fechamento de caixa | Conferência + Divergências |
| **Vendedor** | Faturamento e metas pessoais | Dashboard + Meu Faturamento |

### Usando o Role Switcher (Desenvolvimento)

Em ambiente de desenvolvimento, use o seletor no canto inferior direito para alternar entre perfis e testar as diferentes visões do sistema.

---

## 📊 Status do Desenvolvimento

### ✅ Concluído
- [x] Estrutura base do projeto
- [x] Sistema de design (cores, tokens, componentes)
- [x] Autenticação mockada com RBAC
- [x] Menu lateral dinâmico
- [x] Dashboard personalizado por role
- [x] Telas de Faturamento (Vendedor)
- [x] Telas de Conferência (Conferente)
- [x] Componentes reutilizáveis

### 🚧 Em Desenvolvimento
- [ ] Telas de Gestão & Relatórios
- [ ] Telas de Configurações (Admin)
- [ ] Integração com backend real

### ❌ Pendente
- [ ] Autenticação real (Lovable Cloud)
- [ ] Persistência de dados
- [ ] Testes automatizados
- [ ] PWA / Modo offline

---

## 🗺 Roadmap

### Fase 1 - MVP (Atual)
- ✅ Dashboards por perfil
- ✅ Conferência de caixa
- ✅ Visualização de faturamento

### Fase 2 - Gestão
- [ ] Ranking completo de vendedores
- [ ] Desempenho por loja (gráficos comparativos)
- [ ] Relatório de quebra de caixa detalhado
- [ ] Histórico de envelopes

### Fase 3 - Configurações
- [ ] CRUD de Metas Mensais
- [ ] CRUD de Tabela de Bônus
- [ ] CRUD de Regras de Comissão
- [ ] Gestão de Usuários e Lojas

### Fase 4 - Backend
- [ ] Integração Lovable Cloud (Supabase)
- [ ] Autenticação real (email/senha)
- [ ] API REST para dados
- [ ] Sincronização em tempo real

### Fase 5 - Produção
- [ ] Deploy em produção
- [ ] Domínio customizado
- [ ] Monitoramento e analytics
- [ ] Backup automático

---

## 💡 Sugestões de Melhorias

### UX/UI
| Melhoria | Impacto | Complexidade |
|----------|---------|--------------|
| Modo escuro | Médio | Baixa |
| Animações com Framer Motion | Alto | Média |
| Notificações push | Alto | Média |
| Tour guiado para novos usuários | Médio | Média |
| Atalhos de teclado | Baixo | Baixa |

### Funcionalidades
| Melhoria | Impacto | Complexidade |
|----------|---------|--------------|
| Dashboard de aniversariantes | Médio | Baixa |
| Exportação para Excel/PDF | Alto | Média |
| Filtros avançados com salvamento | Médio | Média |
| Comparativo mês atual vs anterior | Alto | Média |
| Metas individuais por vendedor | Alto | Alta |

### Performance
| Melhoria | Impacto | Complexidade |
|----------|---------|--------------|
| Lazy loading de rotas | Médio | Baixa |
| Cache de dados com TanStack Query | Alto | Média |
| Virtualização de listas grandes | Médio | Média |
| Service Worker para offline | Alto | Alta |

### Segurança
| Melhoria | Impacto | Complexidade |
|----------|---------|--------------|
| Autenticação 2FA | Alto | Alta |
| Log de auditoria | Alto | Média |
| Rate limiting | Médio | Média |
| Criptografia de dados sensíveis | Alto | Alta |

### Integrações
| Melhoria | Impacto | Complexidade |
|----------|---------|--------------|
| WhatsApp para alertas | Alto | Média |
| Integração com PDV | Crítico | Alta |
| API para apps mobile | Alto | Alta |
| Webhooks para automações | Médio | Média |

---

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto é proprietário da rede **Mais Capinhas**.

---

## 📞 Suporte

Para dúvidas ou sugestões, entre em contato com a equipe de desenvolvimento.

---

<p align="center">
  Desenvolvido com ❤️ usando <a href="https://lovable.dev">Lovable</a>
</p>
