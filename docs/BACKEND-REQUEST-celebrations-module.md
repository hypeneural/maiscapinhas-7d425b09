# Solicitação: Módulo de Comemorações

**De:** Time Frontend  
**Para:** Time Backend  
**Data:** 16/01/2026

---

## Resumo

Solicitamos a criação de um **módulo de comemorações** para exibir aniversariantes (de nascimento e de empresa) do mês, com countdown, lista organizada e detalhes relevantes.

---

## Situação Atual

### Endpoints Existentes

| Endpoint | Retorno | Observação |
|----------|---------|------------|
| `GET /users/birthdays` | `BirthdayEntry[]` | Retorna apenas aniversariantes de nascimento |

```typescript
// Tipo atual (api.ts linha 715)
interface BirthdayEntry {
    id: number;
    name: string;
    avatar_url?: string;
    birth_date: string;
    store_name: string;
}
```

### Frontend Atual

- `CelebrationModal.tsx`: Modal com confetti para aniversário + tempo de empresa
- `useCelebrationCheck()`: Hook que verifica datas do usuário logado
- **Limitação**: Mostra apenas para o próprio usuário, não há lista de aniversariantes do mês

---

## Proposta de Novos Endpoints

### 1. Lista de Comemorações do Mês

```
GET /api/v1/celebrations/month
GET /api/v1/celebrations/month?month=2&year=2026
```

**Query Params:**
| Param | Tipo | Default | Descrição |
|-------|------|---------|-----------|
| `month` | int | mês atual | 1-12 |
| `year` | int | ano atual | |
| `store_id` | int | null | Filtrar por loja |
| `type` | string | null | `birthday`, `work_anniversary`, ou ambos |

**Response:**
```json
{
    "data": {
        "month": 1,
        "year": 2026,
        "celebrations": [
            {
                "id": 1,
                "user_id": 42,
                "user_name": "Maria Silva",
                "avatar_url": "https://...",
                "store_id": 1,
                "store_name": "Loja Centro",
                "type": "birthday",
                "date": "2026-01-20",
                "day_of_month": 20,
                "days_until": 4,
                "is_today": false,
                "is_past": false,
                "years": null
            },
            {
                "id": 2,
                "user_id": 7,
                "user_name": "João Souza",
                "avatar_url": null,
                "store_id": 2,
                "store_name": "Loja Shopping",
                "type": "work_anniversary",
                "date": "2026-01-16",
                "day_of_month": 16,
                "days_until": 0,
                "is_today": true,
                "is_past": false,
                "years": 3
            }
        ],
        "summary": {
            "total": 15,
            "birthdays": 10,
            "work_anniversaries": 5,
            "today": 2,
            "upcoming_this_week": 4
        }
    }
}
```

### 2. Próximas Comemorações (Widget Dashboard)

```
GET /api/v1/celebrations/upcoming
```

**Query Params:**
| Param | Tipo | Default | Descrição |
|-------|------|---------|-----------|
| `limit` | int | 5 | Quantidade |
| `days` | int | 7 | Próximos X dias |
| `store_id` | int | null | Filtrar por loja |

**Response:**
```json
{
    "data": [
        {
            "user_id": 42,
            "user_name": "Maria Silva",
            "avatar_url": "https://...",
            "store_name": "Loja Centro",
            "type": "birthday",
            "date": "2026-01-20",
            "days_until": 4
        }
    ]
}
```

### 3. Comemorações de Hoje (Destaque)

```
GET /api/v1/celebrations/today
```

**Response:**
```json
{
    "data": [
        {
            "user_id": 7,
            "user_name": "João Souza",
            "avatar_url": null,
            "store_name": "Loja Shopping",
            "type": "work_anniversary",
            "years": 3,
            "message": "João completou 3 anos na Mais Capinhas!"
        }
    ]
}
```

---

## Dados Necessários do Usuário

Para este módulo funcionar, precisamos que a tabela `users` contenha:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `birth_date` | date | Data de nascimento |
| `hired_at` | date | Data de contratação |

**Pergunta:** Esses campos já existem? Se `hired_at` não existe, precisa ser adicionado.

---

## Uso no Frontend

### Página Principal (`/comemorações` ou widget no dashboard)

1. **Calendário Visual** - destacando dias com comemorações
2. **Lista de Aniversariantes do Mês** - agrupados por dia ou semana
3. **Countdown** - "Próximo aniversário em X dias"
4. **Destaque "Hoje"** - card especial para quem faz aniversário hoje

### Widget Dashboard

- Card pequeno mostrando próximas comemorações
- Quantidade de aniversariantes do mês

---

## Permissões Sugeridas

| Permission | Descrição |
|------------|-----------|
| `celebrations.view` | Ver comemorações (todos autenticados) |
| `celebrations.manage` | Editar datas (admin) |

---

## Prioridade

**Média** - Não é crítico, mas melhora engajamento/cultura da equipe.

---

## Dúvidas para o Backend

1. O campo `hired_at` já existe na tabela `users`?
2. Preferem criar um controller separado `CelebrationController` ou adicionar ao `UserController`?
3. Os endpoints devem ficar em `/api/v1/` ou podemos criar uma rota específica `/api/v1/celebrations/`?

---

**Contato:** [Time Frontend]
