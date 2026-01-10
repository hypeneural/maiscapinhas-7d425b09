# Conferência de Caixa - Documentação Frontend para Backend

## Objetivo

Este documento descreve a stack atual do frontend para o módulo de **Conferência de Caixa**, apresenta o fluxo implementado, e faz perguntas para alinhar a lógica com o backend.

---

## Stack Atual (Frontend)

| Camada | Tecnologia | Arquivos Relevantes |
|--------|------------|---------------------|
| **Framework** | React + Vite + TypeScript | - |
| **State/Fetch** | TanStack Query (React Query) | `use-cash-*.ts` |
| **UI** | shadcn/ui + Tailwind CSS | `LancarTurno.tsx` |
| **Services** | Fetch API com wrappers | `cash-*.service.ts` |
| **Types** | TypeScript interfaces | `conference.types.ts` |

---

## Endpoints Consumidos

### Cash Shifts (Turnos)
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/v1/cash/shifts` | Lista turnos (filtros: `store_id`, `date`, `status`) |
| `GET` | `/api/v1/cash/shifts/{id}` | Detalhes de um turno |
| `POST` | `/api/v1/cash/shifts` | Cria um novo turno |
| `GET` | `/api/v1/cash/shifts/pending` | Turnos pendentes de conferência |
| `GET` | `/api/v1/cash/shifts/divergent` | Turnos com divergência |

### Cash Closings (Fechamentos)
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/v1/cash/closings/{shiftId}` | Detalhes do fechamento de um turno |
| `POST` | `/api/v1/cash/closings/{shiftId}` | Cria fechamento (com linhas) |
| `PUT` | `/api/v1/cash/closings/{shiftId}` | Atualiza fechamento |
| `POST` | `/api/v1/cash/closings/{shiftId}/submit` | Envia para aprovação |
| `POST` | `/api/v1/cash/closings/{shiftId}/approve` | Aprova fechamento |
| `POST` | `/api/v1/cash/closings/{shiftId}/reject` | Rejeita fechamento |

### Auxiliares
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/v1/stores/{storeId}/users` | Lista vendedores da loja |
| `GET` | `/api/v1/stores/all` | Lista todas as lojas ativas |

---

## Estrutura de Dados Atual (Frontend)

### CashShift (Turno)
```typescript
interface CashShift {
  id: number;
  store_id: number;
  date: string;              // "YYYY-MM-DD"
  shift_code: 'M' | 'T' | 'N'; // Manhã, Tarde, Noite
  seller_id: number;
  status: 'open' | 'closed' | 'pending';
  cash_closing?: CashClosing | null;
}
```

### CashClosing (Fechamento)
```typescript
interface CashClosing {
  id: number;
  cash_shift_id: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  closed_by: number | null;
  closed_at: string | null;
  version: number;
  lines: CashClosingLine[];  // ⚠️ PONTO DE DISCUSSÃO
}
```

### CashClosingLine (Linha de Pagamento)
```typescript
interface CashClosingLine {
  id: number;
  cash_closing_id: number;
  label: string;              // "Dinheiro", "Cartão Crédito", etc.
  system_value: number;       // Valor registrado no sistema
  real_value: number;         // Valor físico contado
  diff_value: number;         // real_value - system_value
  justification_text: string | null;  // ⚠️ PONTO DE DISCUSSÃO
}
```

---

## Fluxo Atual Implementado

```mermaid
flowchart TD
    A[Conferente seleciona Loja + Data + Turno + Vendedor] --> B{Turno existe?}
    B -->|Não| C[POST /cash/shifts - Cria turno]
    B -->|Sim| D[Carrega dados existentes]
    C --> D
    D --> E[Preenche valores por meio de pagamento]
    E --> F{Há divergência?}
    F -->|Sim| G[Exibe campo de justificativa POR LINHA]
    F -->|Não| H[Valores conferem]
    G --> I[POST/PUT /cash/closings]
    H --> I
    I --> J[POST /cash/closings/{id}/submit]
    J --> K[Aguarda aprovação]
```

---

## ⚠️ PONTOS CRÍTICOS PARA ALINHAMENTO

### 1. Justificativa: Por Linha vs. Por Turno

**Implementação Atual (Frontend):**
- Cada `CashClosingLine` tem seu próprio campo `justification_text`
- Quando há divergência em uma linha, exibe input de justificativa naquela linha específica
- UI força justificativa obrigatória para cada linha com diferença

**Lógica Correta (Informada pelo Usuário):**
- A justificativa deve ser **GERAL para o turno todo**, não por linha individual
- A justificativa **NÃO é obrigatória**

> [!IMPORTANT]
> **Pergunta para o Backend:**
> 1. O campo `justification_text` deve ficar em `CashClosing` (turno) ou em `CashClosingLine` (linha)?
> 2. Qual é o schema correto do banco de dados para isso?
> 3. Se for no turno, a API de criação/atualização deve receber assim?
> ```json
> {
>   "lines": [...],
>   "justification_text": "Texto opcional geral"
> }
> ```

---

## ❓ PERGUNTAS PARA O BACKEND

### Fluxo de Criação de Turno

1. **Quem pode criar um turno?**
   - Apenas o conferente? Ou o vendedor também pode iniciar?
   
2. **Um turno pode ter múltiplos fechamentos?**
   - Ou é sempre 1 turno = 1 fechamento?

3. **O `seller_id` no turno se refere a quem trabalhou no caixa ou quem está lançando?**

### Valores do Sistema

4. **Os valores do sistema (`system_value`) devem vir automáticos da API?**
   - Atualmente o frontend espera que sejam preenchidos manualmente
   - Existe um endpoint que retorna os valores vendidos por turno/vendedor?

5. **Quais meios de pagamento são fixos?**
   - Atualmente temos: Dinheiro, Cartão Crédito, Cartão Débito, PIX
   - Esses valores podem ser dinâmicos vindos do backend?

### Workflow de Aprovação

6. **Quem pode aprovar/rejeitar?**
   - Conferente? Gerente? Ambos?
   
7. **Quando o fechamento é rejeitado, quem pode editar?**
   - O vendedor original? O conferente?

8. **Existe notificação para o vendedor quando rejeitado?**

### Relatórios

9. **O endpoint `/reports/cash-integrity` existe e está funcional?**
   - Parâmetros: `store_id`, `month`

10. **Existe endpoint de histórico de fechamentos por vendedor/loja?**

---

## Proposta de Alteração no Schema (Sugestão Frontend)

Se a justificativa for realmente **geral por turno**, proponho:

### Opção A: Campo no CashClosing
```typescript
interface CashClosing {
  id: number;
  cash_shift_id: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  justification_text: string | null;  // ← Nova posição
  lines: CashClosingLine[];           // ← Sem justificativa individual
}

interface CashClosingLine {
  label: string;
  system_value: number;
  real_value: number;
  // ❌ Remover justification_text daqui
}
```

### Opção B: Manter ambos (flexibilidade)
```typescript
interface CashClosing {
  justification_text: string | null;  // Justificativa geral
  lines: CashClosingLine[];
}

interface CashClosingLine {
  justification_text: string | null;  // Justificativa específica (opcional)
}
```

> [!NOTE]
> Aguardando confirmação do backend para ajustar o frontend.

---

## Próximos Passos

Após respostas do backend:

1. [ ] Ajustar types em `conference.types.ts`
2. [ ] Modificar UI para justificativa geral (se confirmado)
3. [ ] Remover validação de justificativa obrigatória
4. [ ] Adicionar campo opcional de justificativa no formulário
5. [ ] Testar fluxo completo com API real

---

## Contato

**Responsável Frontend:** [Seu nome]  
**Data:** 2026-01-09
