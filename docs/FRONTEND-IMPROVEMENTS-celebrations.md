# Melhorias Visuais - Módulo Comemorações

**Para:** Time Frontend  
**Data:** 16/01/2026

---

## 📊 Dados Adicionais do Backend (Solicitar)

Para implementar as melhorias visuais sugeridas, solicitar ao backend:

| Campo | Endpoint | Descrição |
|-------|----------|-----------|
| `age` | `/celebrations` | Idade que a pessoa está fazendo (para birthday) |
| `photo_celebration` | `/celebrations/today` | Flag para saber se existe foto do colaborador |
| `department` | Todos | Setor/cargo do colaborador (para agrupar) |

---

## 🎨 Melhorias Visuais Sugeridas

### 1. Cards de Destaque para "Hoje"

```
┌─────────────────────────────────────────────────┐
│ 🎂 ANIVERSARIANTES DE HOJE                      │
│                                                 │
│  [Avatar]  Maria Silva         26 anos         │
│            Loja Centro         🎉 Celebrar     │
│                                                 │
│  [Avatar]  João Santos         3 anos empresa  │
│            Loja Shopping       🎉 Celebrar     │
└─────────────────────────────────────────────────┘
```

**Sugestão:** Card com gradiente animado, confetti sutil de fundo

---

### 2. Countdown Interativo

Adicionar widget de countdown para o próximo aniversário:

```tsx
// Novo componente: CelebrationCountdown.tsx
<div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 p-6">
    <div className="flex items-center gap-4">
        <Avatar size="xl" />
        <div>
            <p className="text-white/70">Próximo aniversário</p>
            <h3 className="text-2xl font-bold text-white">Maria Silva</h3>
            <p className="text-3xl font-mono text-white">
                <span>2</span>d <span>14</span>h <span>32</span>m
            </p>
        </div>
    </div>
</div>
```

---

### 3. Visualização Calendário

Adicionar view de calendário mensal com dias marcados:

```
      Janeiro 2026
 D   S   T   Q   Q   S   S
           1   2   3   4
 5   6   7   8   9  10  11
12  13  14  15 [16] 17  18   ← Hoje destacado
19 (20) 21  22  23 (24) 25   ← Dias com celebração em círculo
26  27  28  29  30  31
```

**Biblioteca sugerida:** `react-calendar` ou componente custom com Tailwind

---

### 4. Animações e Micro-interações

| Elemento | Animação |
|----------|----------|
| Card "Hoje" | Pulse suave no badge, gradiente animado |
| Hover na tabela | Scale sutil + sombra elevada |
| Badges de status | Fade-in com delay escalonado |
| Stats Cards | Counter animado (0 → valor final) |

**Implementação:**
```tsx
// Usar framer-motion ou react-spring
import { motion } from 'framer-motion';

<motion.div
    initial={{ scale: 0.9, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ duration: 0.3 }}
>
```

---

### 5. Confetti para Celebrações

Reutilizar o `CelebrationModal.tsx` existente para:
- Ao clicar "Celebrar" em um aniversariante de hoje
- Auto-trigger quando acessar a página e houver aniversário do próprio usuário

---

### 6. Widget Dashboard

Criar widget compacto para o Dashboard principal:

```tsx
// Novo componente: CelebrationWidget.tsx
<Card className="relative overflow-hidden">
    <div className="absolute right-0 top-0 opacity-10">
        <PartyPopper size={120} />
    </div>
    <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Cake className="h-5 w-5 text-pink-500" />
            Comemorações
        </CardTitle>
    </CardHeader>
    <CardContent>
        <div className="space-y-3">
            {upcomingCelebrations.slice(0, 3).map(c => (
                <div key={c.id} className="flex items-center gap-3">
                    <Avatar size="sm" />
                    <div className="flex-1">
                        <p className="font-medium text-sm">{c.user_name}</p>
                        <p className="text-xs text-muted-foreground">
                            {c.type === 'birthday' ? '🎂' : '🎉'} {c.status_label}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    </CardContent>
</Card>
```

---

### 7. Grouping por Semana

Na tabela, agrupar por período:

```
📍 HOJE (2)
   [tabela com 2 itens]

📅 ESTA SEMANA (5)
   [tabela com 5 itens]

📆 RESTO DO MÊS (8)
   [tabela com 8 itens]
```

---

### 8. Dark Mode Polish

Garantir que gradientes e cores funcionem bem em dark mode:

```css
/* Gradiente que funciona em ambos os modos */
.celebration-gradient {
    background: linear-gradient(
        135deg,
        hsl(var(--primary) / 0.1) 0%,
        hsl(var(--accent) / 0.1) 100%
    );
}
```

---

## ⚙️ Componentes Novos Sugeridos

| Componente | Descrição |
|------------|-----------|
| `CelebrationCountdown.tsx` | Widget countdown animado |
| `CelebrationWidget.tsx` | Widget compacto para Dashboard |
| `CelebrationCalendar.tsx` | View calendário mensal |
| `CelebrationCard.tsx` | Card destacado para "hoje" |
| `AnimatedCounter.tsx` | Numbers com animação de contagem |

---

## 📦 Dependências Sugeridas

```bash
# Animações
npm install framer-motion

# Calendário (opcional)
npm install react-day-picker

# Já existe no projeto
# canvas-confetti ✓
```

---

## 🎯 Prioridade de Implementação

1. **Alta:** Widget Dashboard + Card "Hoje"
2. **Média:** Countdown + Animações
3. **Baixa:** Calendário + Grouping
