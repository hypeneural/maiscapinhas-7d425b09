/**
 * Dashboard Constants
 * 
 * Centralized tooltips and labels for the admin/manager dashboard.
 * All text in Portuguese (pt-BR) for consistency.
 */

export const DASHBOARD_TOOLTIPS = {
    // KPI Cards
    networkSales: 'Valor total de vendas realizadas por todas as lojas até o momento',
    networkGoal: 'Percentual de atingimento da meta consolidada de todas as lojas',
    activeSellers: 'Número de vendedores com pelo menos uma venda registrada no mês',
    aboveGoal: 'Vendedores que atingiram ou superaram a meta individual',
    pendingCash: 'Turnos com conferência de caixa pendente de aprovação',
    approvedCash: 'Turnos com conferência de caixa já aprovada no mês',

    // Projections
    projection: 'Estimativa de faturamento: (vendas ÷ dias corridos) × dias do mês',
    linearProjection: 'Projeção baseada na média diária de vendas atual',
    trendProjection: 'Projeção ajustada considerando tendência de crescimento',

    // Comparisons
    yoyGrowth: 'Variação percentual comparado ao mesmo período do ano passado',
    momGrowth: 'Variação percentual comparado ao mesmo período do mês anterior',
    samePeriodLastYear: 'Vendas do dia 1 até hoje do mesmo mês do ano passado',
    samePeriodLastMonth: 'Vendas do dia 1 até hoje do mês anterior',

    // Ranking
    rankingPosition: 'Posição atual no ranking de vendas do mês',
    totalSold: 'Valor total de vendas realizadas no período',
    achievementRate: 'Percentual da meta atingido (vendas/meta × 100)',
    bonusAccumulated: 'Total de bônus diário acumulado no mês',

    // Store Status
    storeStatus: {
        green: 'Meta atingida ou superada (≥100%)',
        yellow: 'Atenção necessária (80-99%)',
        red: 'Abaixo do esperado (<80%)',
    },

    // Forecast Status
    forecastStatus: {
        ON_TRACK: 'No caminho para atingir a meta',
        AT_RISK: 'Risco de não atingir a meta (90-99% projetado)',
        BEHIND: 'Projeção abaixo da meta esperada (<90%)',
    },

    // Charts
    storePerformanceChart: 'Comparação do faturamento atual vs meta por loja',
    goalDistributionChart: 'Distribuição de vendedores por atingimento de meta',
    salesProjectionChart: 'Evolução de vendas com projeção para o mês',
};

export const DASHBOARD_LABELS = {
    // Headers
    panelTitle: 'Painel de Gestão',
    topSellers: 'Top Vendedores do Mês',
    storeBeacon: 'Farol de Lojas',
    closingProjection: 'Projeção de Fechamento',

    // KPI Cards
    networkSales: 'Vendas da Rede',
    networkGoal: 'Meta da Rede',
    activeSellers: 'Vendedores Ativos',
    pendingCash: 'Caixas Pendentes',

    // Projection
    currentSales: 'Vendas Atuais',
    goalAmount: 'Meta da Rede',
    linearProjection: 'Projeção Linear',

    // Status
    onTrack: 'No caminho',
    atRisk: 'Atenção',
    behind: 'Abaixo',

    // Actions
    viewAll: 'Ver todos',
    viewDetails: 'Ver detalhes',
};

export const STATUS_COLORS = {
    green: {
        bg: 'bg-green-500',
        text: 'text-green-600',
        border: 'border-green-500',
        bgLight: 'bg-green-50 dark:bg-green-950/30',
    },
    yellow: {
        bg: 'bg-yellow-500',
        text: 'text-yellow-600',
        border: 'border-yellow-500',
        bgLight: 'bg-yellow-50 dark:bg-yellow-950/30',
    },
    red: {
        bg: 'bg-red-500',
        text: 'text-red-600',
        border: 'border-red-500',
        bgLight: 'bg-red-50 dark:bg-red-950/30',
    },
} as const;

export type StatusColor = keyof typeof STATUS_COLORS;
