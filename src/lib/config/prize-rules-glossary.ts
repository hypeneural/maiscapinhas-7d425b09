/**
 * Prize Rules Glossary
 * 
 * Centralized tooltip texts for Prize Rules UI.
 * Use these for consistent, user-friendly explanations.
 */

export const PRIZE_RULES_GLOSSARY = {
    // Cooldown
    min_gap_spins:
        "Número mínimo de jogadas que devem acontecer antes deste prêmio poder sair novamente. Ex: 10 = depois de sair, precisa de 10 jogadas para poder sair de novo.",
    cooldown_seconds:
        "Tempo mínimo em segundos entre cada vez que este prêmio sai. Ex: 300 = 5 minutos de espera após sair.",
    cooldown_scope:
        "Define se o controle é por TV ou geral. 'Por tela' = cada TV tem seu próprio contador. 'Global' = todas as TVs compartilham o mesmo contador.",

    // Limits
    max_per_hour:
        "Quantidade máxima de vezes que este prêmio pode sair por hora. Deixe vazio para sem limite.",
    max_per_day:
        "Quantidade máxima de vezes que este prêmio pode sair por dia. Deixe vazio para sem limite.",

    // Pacing
    pacing_enabled:
        "Se ativado, o sistema distribui os prêmios ao longo da campanha para não acabar o estoque no primeiro dia.",
    pacing_buffer:
        "Margem acima do ritmo ideal. 1.30 = permite gastar até 30% acima do ritmo ideal antes de frear.",

    // Other
    priority:
        "Prioridade para desempate quando há conflito. Quanto menor o número, maior a prioridade.",

    // State
    is_eligible:
        "Indica se o prêmio pode sair na próxima jogada. Se verde ✅, pode sair. Se vermelho 🚫, está bloqueado.",
    spins_until_eligible:
        "Quantas jogadas faltam para este prêmio poder sair novamente.",
    seconds_until_eligible:
        "Quantos segundos faltam para este prêmio poder sair novamente.",
    awarded_count_hour:
        "Quantas vezes este prêmio saiu na última hora.",
    awarded_count_day:
        "Quantas vezes este prêmio saiu hoje.",
    awarded_count_total:
        "Total de vezes que este prêmio saiu desde o início da campanha.",
} as const;

export type GlossaryKey = keyof typeof PRIZE_RULES_GLOSSARY;

/**
 * Get tooltip text for a field
 */
export function getGlossaryText(key: GlossaryKey): string {
    return PRIZE_RULES_GLOSSARY[key];
}

/**
 * Scope labels for display
 */
export const COOLDOWN_SCOPE_LABELS = {
    screen: 'Por tela',
    campaign: 'Global',
} as const;

/**
 * Eligibility status labels
 */
export const ELIGIBILITY_STATUS = {
    eligible: { icon: '✅', label: 'Elegível', color: 'text-green-600' },
    cooldown: { icon: '⏳', label: 'Cooldown', color: 'text-amber-600' },
    limit_hour: { icon: '🚫', label: 'Limite/hora', color: 'text-red-600' },
    limit_day: { icon: '🚫', label: 'Limite/dia', color: 'text-red-600' },
    no_stock: { icon: '📦', label: 'Sem estoque', color: 'text-gray-600' },
    pacing: { icon: '⏸️', label: 'Pacing', color: 'text-blue-600' },
} as const;
