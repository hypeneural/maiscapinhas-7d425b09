# Backend API Documentation - ERP Mais Capinhas

Documentação completa dos endpoints necessários para o backend do sistema ERP Mais Capinhas.

---

## Sumário

1. [Configuração Geral](#configuração-geral)
2. [Autenticação](#autenticação)
3. [Usuários](#usuários)
4. [Lojas](#lojas)
5. [Turnos / Fechamentos](#turnos--fechamentos)
6. [Metas](#metas)
7. [Tabela de Bônus](#tabela-de-bônus)
8. [Regras de Comissão](#regras-de-comissão)
9. [Dashboard](#dashboard)
10. [Relatórios](#relatórios)
11. [Estrutura do Banco de Dados](#estrutura-do-banco-de-dados)

---

## Configuração Geral

### Base URL
```
https://api.maiscapinhas.com.br/v1
```

### Headers Padrão
```
Content-Type: application/json
Authorization: Bearer <token>
```

### Estrutura de Resposta Sucesso
```json
{
  "success": true,
  "data": { ... },
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 150,
    "total_pages": 8
  },
  "meta": {
    "timestamp": "2026-01-08T12:00:00Z",
    "request_id": "uuid"
  }
}
```

### Estrutura de Resposta Erro
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Mensagem legível para o usuário",
    "details": [
      {
        "field": "email",
        "message": "Email inválido"
      }
    ]
  }
}
```

### Códigos de Erro Comuns
| Código | HTTP Status | Descrição |
|--------|-------------|-----------|
| `UNAUTHORIZED` | 401 | Token inválido ou expirado |
| `FORBIDDEN` | 403 | Sem permissão para a ação |
| `NOT_FOUND` | 404 | Recurso não encontrado |
| `VALIDATION_ERROR` | 422 | Dados inválidos |
| `CONFLICT` | 409 | Conflito (ex: email duplicado) |
| `INTERNAL_ERROR` | 500 | Erro interno do servidor |

---

## Autenticação

### POST /auth/login
**Descrição**: Autentica um usuário e retorna tokens de acesso.

**Request Body**:
```json
{
  "email": "string (required)",
  "senha": "string (required)"
}
```

**Response 200**:
```json
{
  "success": true,
  "data": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token",
    "expires_in": 3600,
    "user": {
      "id": "uuid",
      "nome": "João Silva",
      "email": "joao@email.com",
      "role": "vendedor",
      "loja_id": "uuid",
      "loja_nome": "Loja Tijucas",
      "avatar_url": "https://..."
    }
  }
}
```

**Response 401**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email ou senha incorretos"
  }
}
```

---

### POST /auth/logout
**Descrição**: Invalida o token atual do usuário.

**Headers**: `Authorization: Bearer <token>`

**Response 200**:
```json
{
  "success": true,
  "data": {
    "message": "Logout realizado com sucesso"
  }
}
```

---

### POST /auth/refresh
**Descrição**: Renova o access token usando o refresh token.

**Request Body**:
```json
{
  "refresh_token": "string (required)"
}
```

**Response 200**:
```json
{
  "success": true,
  "data": {
    "access_token": "novo_jwt_token",
    "expires_in": 3600
  }
}
```

---

### GET /auth/me
**Descrição**: Retorna dados do usuário logado.

**Headers**: `Authorization: Bearer <token>`

**Response 200**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "nome": "João Silva",
    "email": "joao@email.com",
    "role": "vendedor",
    "loja_id": "uuid",
    "loja": {
      "id": "uuid",
      "nome": "Loja Tijucas",
      "codigo": "TJC"
    },
    "data_nascimento": "1990-05-15",
    "telefone": "(47) 99999-9999",
    "avatar_url": "https://...",
    "ativo": true,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

---

### POST /auth/forgot-password
**Descrição**: Envia email com link para reset de senha.

**Request Body**:
```json
{
  "email": "string (required)"
}
```

**Response 200**:
```json
{
  "success": true,
  "data": {
    "message": "Email de recuperação enviado"
  }
}
```

---

### POST /auth/reset-password
**Descrição**: Reseta a senha usando token recebido por email.

**Request Body**:
```json
{
  "token": "string (required)",
  "nova_senha": "string (required, min: 8)"
}
```

**Response 200**:
```json
{
  "success": true,
  "data": {
    "message": "Senha alterada com sucesso"
  }
}
```

---

## Usuários

### GET /usuarios
**Descrição**: Lista todos os usuários com filtros. Requer role `admin` ou `gerente`.

**Query Parameters**:
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `page` | number | Página (default: 1) |
| `per_page` | number | Itens por página (default: 20, max: 100) |
| `search` | string | Busca por nome ou email |
| `role` | string | Filtrar por role: admin, gerente, conferente, vendedor |
| `loja_id` | uuid | Filtrar por loja |
| `ativo` | boolean | Filtrar por status |
| `order_by` | string | Campo para ordenação (default: nome) |
| `order` | string | asc ou desc (default: asc) |

**Response 200**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "nome": "João Silva",
      "email": "joao@email.com",
      "role": "vendedor",
      "loja_id": "uuid",
      "loja_nome": "Loja Tijucas",
      "data_nascimento": "1990-05-15",
      "telefone": "(47) 99999-9999",
      "avatar_url": "https://...",
      "ativo": true,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-06-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 45,
    "total_pages": 3
  }
}
```

---

### GET /usuarios/:id
**Descrição**: Retorna detalhes de um usuário específico.

**Response 200**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "nome": "João Silva",
    "email": "joao@email.com",
    "role": "vendedor",
    "loja_id": "uuid",
    "loja": {
      "id": "uuid",
      "nome": "Loja Tijucas",
      "codigo": "TJC"
    },
    "data_nascimento": "1990-05-15",
    "telefone": "(47) 99999-9999",
    "avatar_url": "https://...",
    "ativo": true,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-06-01T00:00:00Z",
    "estatisticas": {
      "total_vendido_mes": 45000.00,
      "meta_mes": 50000.00,
      "percentual_meta": 90,
      "bonus_acumulado": 350.00,
      "comissao_projetada": 1350.00
    }
  }
}
```

---

### POST /usuarios
**Descrição**: Cria um novo usuário. Requer role `admin`.

**Request Body**:
```json
{
  "nome": "string (required, min: 3)",
  "email": "string (required, email)",
  "senha": "string (required, min: 8)",
  "role": "string (required, enum: admin|gerente|conferente|vendedor)",
  "loja_id": "uuid (required)",
  "data_nascimento": "string (optional, date: YYYY-MM-DD)",
  "telefone": "string (optional)",
  "avatar_url": "string (optional, url)"
}
```

**Response 201**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "nome": "Novo Usuário",
    "email": "novo@email.com",
    "role": "vendedor",
    "loja_id": "uuid",
    "created_at": "2026-01-08T12:00:00Z"
  }
}
```

---

### PUT /usuarios/:id
**Descrição**: Atualiza dados de um usuário. Admin pode editar todos, usuário pode editar apenas seus dados básicos.

**Request Body** (campos opcionais):
```json
{
  "nome": "string (min: 3)",
  "email": "string (email)",
  "loja_id": "uuid",
  "data_nascimento": "string (date: YYYY-MM-DD)",
  "telefone": "string",
  "avatar_url": "string (url)"
}
```

**Response 200**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "nome": "Nome Atualizado",
    "updated_at": "2026-01-08T12:00:00Z"
  }
}
```

---

### PUT /usuarios/:id/role
**Descrição**: Altera a role de um usuário. Requer role `admin`.

**Request Body**:
```json
{
  "role": "string (required, enum: admin|gerente|conferente|vendedor)"
}
```

**Response 200**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "role": "gerente",
    "updated_at": "2026-01-08T12:00:00Z"
  }
}
```

---

### PUT /usuarios/:id/senha
**Descrição**: Altera a senha de um usuário. Usuário pode alterar própria senha, admin pode alterar de qualquer um.

**Request Body**:
```json
{
  "senha_atual": "string (required se for próprio usuário)",
  "nova_senha": "string (required, min: 8)"
}
```

**Response 200**:
```json
{
  "success": true,
  "data": {
    "message": "Senha alterada com sucesso"
  }
}
```

---

### DELETE /usuarios/:id
**Descrição**: Desativa um usuário (soft delete). Requer role `admin`.

**Response 200**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "ativo": false,
    "updated_at": "2026-01-08T12:00:00Z"
  }
}
```

---

### PUT /usuarios/:id/ativar
**Descrição**: Reativa um usuário desativado. Requer role `admin`.

**Response 200**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "ativo": true,
    "updated_at": "2026-01-08T12:00:00Z"
  }
}
```

---

### GET /usuarios/aniversariantes
**Descrição**: Lista aniversariantes do mês. Requer role `admin` ou `gerente`.

**Query Parameters**:
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `mes` | number | Mês (1-12), default: mês atual |
| `loja_id` | uuid | Filtrar por loja |

**Response 200**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "nome": "João Silva",
      "data_nascimento": "1990-01-15",
      "dia": 15,
      "idade": 36,
      "loja_nome": "Loja Tijucas",
      "avatar_url": "https://..."
    }
  ]
}
```

---

## Lojas

### GET /lojas
**Descrição**: Lista todas as lojas.

**Query Parameters**:
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `ativo` | boolean | Filtrar por status |
| `search` | string | Busca por nome ou código |

**Response 200**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "nome": "Loja Tijucas",
      "codigo": "TJC",
      "endereco": "Rua Principal, 123",
      "troco_padrao": 500.00,
      "meta_mensal": 150000.00,
      "ativo": true,
      "created_at": "2024-01-01T00:00:00Z",
      "total_vendedores": 5
    }
  ]
}
```

---

### GET /lojas/:id
**Descrição**: Retorna detalhes de uma loja com estatísticas.

**Response 200**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "nome": "Loja Tijucas",
    "codigo": "TJC",
    "endereco": "Rua Principal, 123",
    "troco_padrao": 500.00,
    "meta_mensal": 150000.00,
    "ativo": true,
    "created_at": "2024-01-01T00:00:00Z",
    "vendedores": [
      {
        "id": "uuid",
        "nome": "João Silva",
        "role": "vendedor"
      }
    ],
    "estatisticas_mes": {
      "total_vendido": 125000.00,
      "meta": 150000.00,
      "percentual": 83.33,
      "status": "amarelo",
      "total_turnos": 45,
      "turnos_com_divergencia": 3,
      "percentual_divergencia": 6.67
    }
  }
}
```

---

### POST /lojas
**Descrição**: Cria uma nova loja. Requer role `admin`.

**Request Body**:
```json
{
  "nome": "string (required, min: 3)",
  "codigo": "string (required, unique, max: 10)",
  "endereco": "string (optional)",
  "troco_padrao": "number (optional, default: 500)",
  "meta_mensal": "number (optional, default: 0)"
}
```

**Response 201**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "nome": "Nova Loja",
    "codigo": "NVL",
    "created_at": "2026-01-08T12:00:00Z"
  }
}
```

---

### PUT /lojas/:id
**Descrição**: Atualiza dados de uma loja. Requer role `admin`.

**Request Body** (campos opcionais):
```json
{
  "nome": "string (min: 3)",
  "codigo": "string (unique, max: 10)",
  "endereco": "string",
  "troco_padrao": "number",
  "meta_mensal": "number"
}
```

**Response 200**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "updated_at": "2026-01-08T12:00:00Z"
  }
}
```

---

### DELETE /lojas/:id
**Descrição**: Desativa uma loja (soft delete). Requer role `admin`.

**Response 200**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "ativo": false,
    "updated_at": "2026-01-08T12:00:00Z"
  }
}
```

---

### GET /lojas/:id/vendedores
**Descrição**: Lista vendedores de uma loja com estatísticas.

**Response 200**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "nome": "João Silva",
      "avatar_url": "https://...",
      "total_vendido_mes": 45000.00,
      "meta_mes": 50000.00,
      "percentual_meta": 90,
      "ranking_loja": 2
    }
  ]
}
```

---

### GET /lojas/:id/desempenho
**Descrição**: Retorna métricas detalhadas de desempenho da loja.

**Query Parameters**:
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `mes` | number | Mês (1-12) |
| `ano` | number | Ano |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "loja_id": "uuid",
    "periodo": {
      "mes": 1,
      "ano": 2026
    },
    "meta": 150000.00,
    "vendido": 125000.00,
    "percentual": 83.33,
    "status": "amarelo",
    "comparativo_mes_anterior": {
      "vendido_anterior": 110000.00,
      "variacao_percentual": 13.64,
      "tendencia": "alta"
    },
    "comparativo_ano_anterior": {
      "vendido_anterior": 95000.00,
      "variacao_percentual": 31.58,
      "tendencia": "alta"
    },
    "vendas_por_dia": [
      {
        "data": "2026-01-01",
        "valor": 5200.00
      }
    ],
    "top_vendedores": [
      {
        "id": "uuid",
        "nome": "João Silva",
        "total": 45000.00,
        "percentual": 36
      }
    ]
  }
}
```

---

## Turnos / Fechamentos

### GET /turnos
**Descrição**: Lista turnos com filtros. Requer role `conferente`, `gerente` ou `admin`.

**Query Parameters**:
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `page` | number | Página |
| `per_page` | number | Itens por página |
| `data_inicio` | string | Data inicial (YYYY-MM-DD) |
| `data_fim` | string | Data final (YYYY-MM-DD) |
| `loja_id` | uuid | Filtrar por loja |
| `vendedor_id` | uuid | Filtrar por vendedor |
| `turno` | string | Filtrar por turno: manha, tarde, noite |
| `status` | string | Filtrar por status: pendente, conferido, divergente |
| `order_by` | string | Campo para ordenação |
| `order` | string | asc ou desc |

**Response 200**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "data": "2026-01-08",
      "turno": "manha",
      "loja": {
        "id": "uuid",
        "nome": "Loja Tijucas"
      },
      "vendedor": {
        "id": "uuid",
        "nome": "João Silva"
      },
      "valores_sistema": {
        "pix": 1500.00,
        "debito": 800.00,
        "credito": 1200.00,
        "especie": 500.00,
        "total": 4000.00
      },
      "valores_reais": {
        "pix": 1500.00,
        "debito": 800.00,
        "credito": 1200.00,
        "especie": 480.00,
        "total": 3980.00
      },
      "diferenca": -20.00,
      "status": "divergente",
      "justificativa": "Troco errado",
      "justificado": true,
      "bonus_elegivel": true,
      "bonus_valor": 25.00,
      "conferente": {
        "id": "uuid",
        "nome": "Maria Conferente"
      },
      "data_conferencia": "2026-01-08T18:00:00Z",
      "created_at": "2026-01-08T12:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

---

### GET /turnos/:id
**Descrição**: Retorna detalhes completos de um turno.

**Response 200**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "data": "2026-01-08",
    "turno": "manha",
    "loja": {
      "id": "uuid",
      "nome": "Loja Tijucas",
      "troco_padrao": 500.00
    },
    "vendedor": {
      "id": "uuid",
      "nome": "João Silva",
      "avatar_url": "https://..."
    },
    "troco_inicial": 500.00,
    "troco_final": 480.00,
    "valores_sistema": {
      "pix": 1500.00,
      "debito": 800.00,
      "credito": 1200.00,
      "especie": 500.00,
      "devolucoes": 50.00,
      "total": 3950.00
    },
    "valores_reais": {
      "pix": 1500.00,
      "debito": 800.00,
      "credito": 1200.00,
      "especie": 480.00,
      "total": 3980.00
    },
    "diferenca": -20.00,
    "status": "divergente",
    "justificativa": "Troco dado a mais para cliente",
    "justificado": true,
    "bonus_elegivel": true,
    "bonus_valor": 25.00,
    "conferente": {
      "id": "uuid",
      "nome": "Maria Conferente"
    },
    "data_conferencia": "2026-01-08T18:00:00Z",
    "historico_alteracoes": [
      {
        "campo": "valores_reais.especie",
        "valor_anterior": 500.00,
        "valor_novo": 480.00,
        "usuario": "Maria Conferente",
        "data": "2026-01-08T17:55:00Z"
      }
    ],
    "created_at": "2026-01-08T12:00:00Z",
    "updated_at": "2026-01-08T18:00:00Z"
  }
}
```

---

### POST /turnos
**Descrição**: Registra um novo turno. Pode ser chamado pelo sistema de PDV ou manualmente.

**Request Body**:
```json
{
  "data": "string (required, date: YYYY-MM-DD)",
  "turno": "string (required, enum: manha|tarde|noite)",
  "loja_id": "uuid (required)",
  "vendedor_id": "uuid (required)",
  "troco_inicial": "number (optional)",
  "valores_sistema": {
    "pix": "number (required)",
    "debito": "number (required)",
    "credito": "number (required)",
    "especie": "number (required)",
    "devolucoes": "number (optional, default: 0)"
  }
}
```

**Response 201**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "data": "2026-01-08",
    "turno": "manha",
    "status": "pendente",
    "created_at": "2026-01-08T12:00:00Z"
  }
}
```

---

### PUT /turnos/:id
**Descrição**: Atualiza dados de um turno (conferência). Requer role `conferente` ou superior.

**Request Body** (campos opcionais):
```json
{
  "troco_final": "number",
  "valores_reais": {
    "pix": "number",
    "debito": "number",
    "credito": "number",
    "especie": "number"
  },
  "justificativa": "string (required se diferenca != 0)",
  "justificado": "boolean (required se diferenca != 0)"
}
```

**Response 200**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "diferenca": -20.00,
    "status": "divergente",
    "updated_at": "2026-01-08T17:55:00Z"
  }
}
```

---

### PUT /turnos/:id/validar
**Descrição**: Valida e fecha o turno. Após validação, não pode mais ser editado (exceto por admin). Requer role `conferente` ou superior.

**Regras de Validação**:
- Se `diferenca != 0` e `justificado == false`: `bonus_elegivel = false`
- Se `diferenca != 0` e `justificativa` vazia: retorna erro
- Calcula `bonus_valor` baseado na tabela de bônus

**Request Body**:
```json
{
  "confirmar": "boolean (required, must be true)"
}
```

**Response 200**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "conferido",
    "bonus_elegivel": true,
    "bonus_valor": 25.00,
    "conferente_id": "uuid",
    "data_conferencia": "2026-01-08T18:00:00Z"
  }
}
```

**Response 422** (validação falhou):
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Não é possível validar turno com divergência não justificada",
    "details": [
      {
        "field": "justificativa",
        "message": "Justificativa é obrigatória quando há divergência"
      }
    ]
  }
}
```

---

### GET /turnos/pendentes
**Descrição**: Lista turnos pendentes de conferência ordenados por prioridade.

**Query Parameters**:
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `loja_id` | uuid | Filtrar por loja |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "total_pendentes": 12,
    "turnos": [
      {
        "id": "uuid",
        "data": "2026-01-06",
        "turno": "tarde",
        "dias_pendente": 2,
        "loja_nome": "Loja Tijucas",
        "vendedor_nome": "João Silva",
        "total_sistema": 4500.00,
        "prioridade": "alta"
      }
    ]
  }
}
```

---

### GET /turnos/divergentes
**Descrição**: Lista turnos com divergência não resolvida.

**Query Parameters**:
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `loja_id` | uuid | Filtrar por loja |
| `order_by` | string | data, diferenca_abs (default: diferenca_abs) |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "total_divergentes": 3,
    "soma_divergencias": -85.00,
    "turnos": [
      {
        "id": "uuid",
        "data": "2026-01-05",
        "turno": "noite",
        "loja_nome": "Loja Bombinhas",
        "vendedor_nome": "Maria Santos",
        "diferenca": -50.00,
        "justificativa": null,
        "justificado": false,
        "dias_pendente": 3
      }
    ]
  }
}
```

---

## Metas

### GET /metas
**Descrição**: Lista metas com filtros.

**Query Parameters**:
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `mes` | number | Mês (1-12) |
| `ano` | number | Ano |
| `loja_id` | uuid | Filtrar por loja |
| `vendedor_id` | uuid | Filtrar por vendedor |

**Response 200**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "loja": {
        "id": "uuid",
        "nome": "Loja Tijucas"
      },
      "mes": 1,
      "ano": 2026,
      "valor_meta": 150000.00,
      "distribuicao": [
        {
          "vendedor_id": "uuid",
          "vendedor_nome": "João Silva",
          "percentual": 50,
          "valor": 75000.00
        },
        {
          "vendedor_id": "uuid",
          "vendedor_nome": "Maria Santos",
          "percentual": 50,
          "valor": 75000.00
        }
      ],
      "realizado": 125000.00,
      "percentual_atingido": 83.33,
      "status": "amarelo"
    }
  ]
}
```

---

### GET /metas/:id
**Descrição**: Retorna detalhes de uma meta.

**Response 200**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "loja": {
      "id": "uuid",
      "nome": "Loja Tijucas"
    },
    "mes": 1,
    "ano": 2026,
    "valor_meta": 150000.00,
    "distribuicao": [
      {
        "vendedor_id": "uuid",
        "vendedor_nome": "João Silva",
        "percentual": 50,
        "valor": 75000.00,
        "realizado": 65000.00,
        "percentual_atingido": 86.67
      }
    ],
    "dias_uteis": 22,
    "dias_restantes": 15,
    "meta_diaria": 6818.18,
    "ritmo_necessario": 8333.33,
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-01-05T00:00:00Z"
  }
}
```

---

### POST /metas
**Descrição**: Cria uma nova meta. Requer role `admin`.

**Request Body**:
```json
{
  "loja_id": "uuid (required)",
  "mes": "number (required, 1-12)",
  "ano": "number (required)",
  "valor_meta": "number (required, min: 0)",
  "distribuicao": [
    {
      "vendedor_id": "uuid (required)",
      "percentual": "number (required, 0-100)"
    }
  ]
}
```

**Validações**:
- Soma dos percentuais deve ser 100%
- Não pode existir meta duplicada para mesmo mês/ano/loja

**Response 201**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "loja_id": "uuid",
    "mes": 1,
    "ano": 2026,
    "valor_meta": 150000.00,
    "created_at": "2026-01-08T12:00:00Z"
  }
}
```

---

### PUT /metas/:id
**Descrição**: Atualiza uma meta. Requer role `admin`.

**Request Body** (campos opcionais):
```json
{
  "valor_meta": "number (min: 0)",
  "distribuicao": [
    {
      "vendedor_id": "uuid",
      "percentual": "number (0-100)"
    }
  ]
}
```

**Response 200**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "updated_at": "2026-01-08T12:00:00Z"
  }
}
```

---

### DELETE /metas/:id
**Descrição**: Remove uma meta. Requer role `admin`.

**Response 200**:
```json
{
  "success": true,
  "data": {
    "message": "Meta removida com sucesso"
  }
}
```

---

### POST /metas/:id/distribuir
**Descrição**: Distribui a meta entre vendedores de forma automática ou manual. Requer role `admin`.

**Request Body**:
```json
{
  "tipo": "string (required, enum: igual|proporcional|manual)",
  "distribuicao": [
    {
      "vendedor_id": "uuid",
      "percentual": "number (0-100)"
    }
  ]
}
```

- `igual`: Distribui igualmente entre todos os vendedores ativos da loja
- `proporcional`: Distribui baseado no histórico de vendas
- `manual`: Usa a distribuição informada

**Response 200**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "distribuicao": [
      {
        "vendedor_id": "uuid",
        "vendedor_nome": "João Silva",
        "percentual": 50,
        "valor": 75000.00
      }
    ]
  }
}
```

---

## Tabela de Bônus

### GET /bonus/tabela
**Descrição**: Lista todas as faixas de bônus.

**Query Parameters**:
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `ativo` | boolean | Filtrar por status |

**Response 200**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "faixa_minima": 500.00,
      "faixa_maxima": 799.99,
      "valor_bonus": 10.00,
      "ativo": true,
      "created_at": "2024-01-01T00:00:00Z"
    },
    {
      "id": "uuid",
      "faixa_minima": 800.00,
      "faixa_maxima": 999.99,
      "valor_bonus": 20.00,
      "ativo": true,
      "created_at": "2024-01-01T00:00:00Z"
    },
    {
      "id": "uuid",
      "faixa_minima": 1000.00,
      "faixa_maxima": null,
      "valor_bonus": 50.00,
      "ativo": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### POST /bonus/tabela
**Descrição**: Cria uma nova faixa de bônus. Requer role `admin`.

**Request Body**:
```json
{
  "faixa_minima": "number (required, min: 0)",
  "faixa_maxima": "number (optional, maior que faixa_minima)",
  "valor_bonus": "number (required, min: 0)"
}
```

**Validações**:
- Não pode haver sobreposição de faixas
- `faixa_maxima` pode ser null (sem limite)

**Response 201**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "faixa_minima": 1500.00,
    "faixa_maxima": 1999.99,
    "valor_bonus": 75.00,
    "created_at": "2026-01-08T12:00:00Z"
  }
}
```

---

### PUT /bonus/tabela/:id
**Descrição**: Atualiza uma faixa de bônus. Requer role `admin`.

**Request Body** (campos opcionais):
```json
{
  "faixa_minima": "number (min: 0)",
  "faixa_maxima": "number (maior que faixa_minima)",
  "valor_bonus": "number (min: 0)",
  "ativo": "boolean"
}
```

**Response 200**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "updated_at": "2026-01-08T12:00:00Z"
  }
}
```

---

### DELETE /bonus/tabela/:id
**Descrição**: Remove uma faixa de bônus. Requer role `admin`.

**Response 200**:
```json
{
  "success": true,
  "data": {
    "message": "Faixa de bônus removida com sucesso"
  }
}
```

---

### GET /bonus/vendedor/:id
**Descrição**: Lista bônus de um vendedor por período.

**Query Parameters**:
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `data_inicio` | string | Data inicial (YYYY-MM-DD) |
| `data_fim` | string | Data final (YYYY-MM-DD) |
| `status` | string | pendente, aprovado, rejeitado |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "vendedor": {
      "id": "uuid",
      "nome": "João Silva"
    },
    "periodo": {
      "inicio": "2026-01-01",
      "fim": "2026-01-31"
    },
    "resumo": {
      "total_aprovado": 350.00,
      "total_pendente": 50.00,
      "total_rejeitado": 25.00,
      "quantidade_turnos": 22
    },
    "bonus": [
      {
        "id": "uuid",
        "data": "2026-01-08",
        "turno": "manha",
        "loja_nome": "Loja Tijucas",
        "total_vendido": 1250.00,
        "valor_bonus": 50.00,
        "status": "aprovado",
        "conferido_em": "2026-01-08T18:00:00Z"
      }
    ]
  }
}
```

---

### GET /bonus/calcular
**Descrição**: Calcula o bônus para um valor de venda (simulação).

**Query Parameters**:
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `valor` | number | Valor da venda |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "valor_venda": 1250.00,
    "faixa_atual": {
      "minima": 1000.00,
      "maxima": 1499.99,
      "bonus": 50.00
    },
    "valor_bonus": 50.00,
    "proxima_faixa": {
      "minima": 1500.00,
      "bonus": 75.00,
      "faltam": 250.00
    }
  }
}
```

---

## Regras de Comissão

### GET /comissoes/regras
**Descrição**: Lista todas as regras de comissão.

**Response 200**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "percentual_meta_minimo": 0,
      "percentual_meta_maximo": 99.99,
      "percentual_comissao": 2.00,
      "descricao": "Abaixo da meta",
      "ativo": true
    },
    {
      "id": "uuid",
      "percentual_meta_minimo": 100,
      "percentual_meta_maximo": 119.99,
      "percentual_comissao": 3.00,
      "descricao": "Meta atingida",
      "ativo": true
    },
    {
      "id": "uuid",
      "percentual_meta_minimo": 120,
      "percentual_meta_maximo": null,
      "percentual_comissao": 4.00,
      "descricao": "Super meta",
      "ativo": true
    }
  ]
}
```

---

### POST /comissoes/regras
**Descrição**: Cria uma nova regra de comissão. Requer role `admin`.

**Request Body**:
```json
{
  "percentual_meta_minimo": "number (required, 0-999)",
  "percentual_meta_maximo": "number (optional)",
  "percentual_comissao": "number (required, 0-100)",
  "descricao": "string (optional)"
}
```

**Response 201**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "created_at": "2026-01-08T12:00:00Z"
  }
}
```

---

### PUT /comissoes/regras/:id
**Descrição**: Atualiza uma regra de comissão. Requer role `admin`.

**Request Body** (campos opcionais):
```json
{
  "percentual_meta_minimo": "number",
  "percentual_meta_maximo": "number",
  "percentual_comissao": "number",
  "descricao": "string",
  "ativo": "boolean"
}
```

**Response 200**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "updated_at": "2026-01-08T12:00:00Z"
  }
}
```

---

### DELETE /comissoes/regras/:id
**Descrição**: Remove uma regra de comissão. Requer role `admin`.

**Response 200**:
```json
{
  "success": true,
  "data": {
    "message": "Regra de comissão removida com sucesso"
  }
}
```

---

### GET /comissoes/vendedor/:id
**Descrição**: Retorna comissão de um vendedor por período.

**Query Parameters**:
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `mes` | number | Mês (1-12) |
| `ano` | number | Ano |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "vendedor": {
      "id": "uuid",
      "nome": "João Silva"
    },
    "periodo": {
      "mes": 1,
      "ano": 2026
    },
    "meta": 75000.00,
    "realizado": 82500.00,
    "percentual_atingido": 110,
    "regra_aplicada": {
      "percentual_meta_minimo": 100,
      "percentual_meta_maximo": 119.99,
      "percentual_comissao": 3.00,
      "descricao": "Meta atingida"
    },
    "valor_comissao": 2475.00,
    "status": "pendente",
    "data_fechamento": null
  }
}
```

---

### GET /comissoes/projecao/:id
**Descrição**: Retorna projeção de comissão baseada no ritmo atual.

**Query Parameters**:
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `mes` | number | Mês (1-12) |
| `ano` | number | Ano |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "vendedor": {
      "id": "uuid",
      "nome": "João Silva"
    },
    "periodo": {
      "mes": 1,
      "ano": 2026,
      "dias_uteis": 22,
      "dias_trabalhados": 8,
      "dias_restantes": 14
    },
    "atual": {
      "meta": 75000.00,
      "realizado": 28000.00,
      "percentual": 37.33,
      "media_diaria": 3500.00
    },
    "projecao": {
      "valor_projetado": 77000.00,
      "percentual_projetado": 102.67,
      "regra_provavel": {
        "percentual_comissao": 3.00,
        "descricao": "Meta atingida"
      },
      "comissao_projetada": 2310.00
    },
    "cenarios": [
      {
        "cenario": "pessimista",
        "percentual_meta": 85,
        "comissao": 1275.00
      },
      {
        "cenario": "realista",
        "percentual_meta": 103,
        "comissao": 2310.00
      },
      {
        "cenario": "otimista",
        "percentual_meta": 125,
        "comissao": 3750.00
      }
    ]
  }
}
```

---

## Dashboard

### GET /dashboard/vendedor
**Descrição**: Dados do dashboard do vendedor logado.

**Response 200**:
```json
{
  "success": true,
  "data": {
    "vendedor": {
      "id": "uuid",
      "nome": "João Silva",
      "loja_nome": "Loja Tijucas"
    },
    "turno_atual": {
      "turno": "manha",
      "inicio": "08:00",
      "fim": "14:00",
      "horas_restantes": 3,
      "minutos_restantes": 45
    },
    "dia": {
      "meta": 3500.00,
      "vendido": 2800.00,
      "percentual": 80,
      "faltam": 700.00,
      "status": "amarelo"
    },
    "bonus": {
      "valor_atual": 20.00,
      "faixa_atual": "R$ 800 - R$ 999",
      "proximo_bonus": {
        "faltam": 200.00,
        "valor": 50.00,
        "faixa": "R$ 1000+"
      }
    },
    "mes": {
      "meta": 75000.00,
      "realizado": 45000.00,
      "percentual": 60,
      "dias_restantes": 15,
      "media_diaria": 3000.00,
      "ritmo_necessario": 2000.00
    },
    "comissao": {
      "percentual_atual": 2,
      "valor_projetado": 1500.00,
      "proxima_faixa": {
        "percentual_meta": 100,
        "percentual_comissao": 3,
        "faltam": 30000.00
      }
    }
  }
}
```

---

### GET /dashboard/conferente
**Descrição**: Dados do dashboard do conferente logado.

**Response 200**:
```json
{
  "success": true,
  "data": {
    "resumo": {
      "a_conferir": 12,
      "com_divergencia": 3,
      "conferidos_hoje": 8
    },
    "turnos_pendentes": [
      {
        "id": "uuid",
        "data": "2026-01-06",
        "turno": "tarde",
        "loja_nome": "Loja Tijucas",
        "vendedor_nome": "João Silva",
        "valor_sistema": 4500.00,
        "dias_pendente": 2,
        "prioridade": "alta"
      }
    ],
    "divergencias_recentes": [
      {
        "id": "uuid",
        "data": "2026-01-07",
        "loja_nome": "Loja Bombinhas",
        "vendedor_nome": "Maria Santos",
        "diferenca": -50.00,
        "justificado": false
      }
    ],
    "estatisticas_semana": {
      "total_conferido": 45,
      "total_divergencias": 5,
      "percentual_divergencia": 11.11,
      "valor_total_conferido": 180000.00
    }
  }
}
```

---

### GET /dashboard/admin
**Descrição**: Dados do dashboard do admin/gerente.

**Response 200**:
```json
{
  "success": true,
  "data": {
    "top3_vendedores": [
      {
        "posicao": 1,
        "vendedor": {
          "id": "uuid",
          "nome": "João Silva",
          "avatar_url": "https://...",
          "loja_nome": "Loja Tijucas"
        },
        "total_vendido": 85000.00,
        "percentual_meta": 113.33
      }
    ],
    "farol_lojas": [
      {
        "loja": {
          "id": "uuid",
          "nome": "Loja Tijucas"
        },
        "meta": 150000.00,
        "realizado": 125000.00,
        "percentual": 83.33,
        "status": "amarelo",
        "tendencia": "alta"
      }
    ],
    "indicadores_risco": {
      "percentual_quebra_rede": 4.5,
      "total_divergencias_mes": 15,
      "valor_total_divergencias": -850.00,
      "maiores_divergencias": [
        {
          "vendedor": {
            "id": "uuid",
            "nome": "Pedro Alves"
          },
          "quantidade": 5,
          "valor_total": -320.00,
          "percentual_erro": 12.5
        }
      ]
    },
    "resumo_geral": {
      "total_vendido_mes": 450000.00,
      "meta_rede": 600000.00,
      "percentual_rede": 75,
      "total_lojas": 5,
      "total_vendedores": 25,
      "turnos_pendentes": 12
    }
  }
}
```

---

## Relatórios

### GET /relatorios/ranking
**Descrição**: Ranking completo de vendedores.

**Query Parameters**:
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `mes` | number | Mês (1-12) |
| `ano` | number | Ano |
| `loja_id` | uuid | Filtrar por loja |
| `limit` | number | Limite de resultados (default: 50) |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "periodo": {
      "mes": 1,
      "ano": 2026
    },
    "podio": [
      {
        "posicao": 1,
        "vendedor": {
          "id": "uuid",
          "nome": "João Silva",
          "avatar_url": "https://...",
          "loja_nome": "Loja Tijucas"
        },
        "total_vendido": 85000.00,
        "meta": 75000.00,
        "percentual_meta": 113.33,
        "bonus_acumulado": 450.00
      }
    ],
    "ranking": [
      {
        "posicao": 4,
        "vendedor": {
          "id": "uuid",
          "nome": "Carlos Souza",
          "avatar_url": "https://...",
          "loja_nome": "Loja Bombinhas"
        },
        "total_vendido": 62000.00,
        "meta": 70000.00,
        "percentual_meta": 88.57,
        "variacao_posicao": 2
      }
    ],
    "estatisticas": {
      "total_vendedores": 25,
      "media_percentual": 92.5,
      "acima_meta": 12,
      "abaixo_meta": 13
    }
  }
}
```

---

### GET /relatorios/desempenho-lojas
**Descrição**: Relatório de desempenho comparativo entre lojas.

**Query Parameters**:
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `mes` | number | Mês (1-12) |
| `ano` | number | Ano |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "periodo": {
      "mes": 1,
      "ano": 2026
    },
    "lojas": [
      {
        "loja": {
          "id": "uuid",
          "nome": "Loja Tijucas",
          "codigo": "TJC"
        },
        "meta": 150000.00,
        "realizado": 135000.00,
        "percentual": 90,
        "status": "amarelo",
        "comparativo_mes_anterior": {
          "valor": 120000.00,
          "variacao": 12.5
        },
        "comparativo_ano_anterior": {
          "valor": 95000.00,
          "variacao": 42.1
        },
        "vendedores": 5,
        "media_por_vendedor": 27000.00,
        "melhor_vendedor": {
          "nome": "João Silva",
          "total": 45000.00
        }
      }
    ],
    "totais": {
      "meta_rede": 600000.00,
      "realizado_rede": 520000.00,
      "percentual_rede": 86.67,
      "melhor_loja": "Loja Tijucas",
      "pior_loja": "Loja Centro"
    },
    "evolucao_diaria": [
      {
        "data": "2026-01-01",
        "valor": 22000.00
      }
    ]
  }
}
```

---

### GET /relatorios/quebra-caixa
**Descrição**: Relatório de quebra de caixa e divergências.

**Query Parameters**:
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `data_inicio` | string | Data inicial (YYYY-MM-DD) |
| `data_fim` | string | Data final (YYYY-MM-DD) |
| `loja_id` | uuid | Filtrar por loja |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "periodo": {
      "inicio": "2026-01-01",
      "fim": "2026-01-31"
    },
    "resumo": {
      "total_turnos": 450,
      "turnos_com_divergencia": 35,
      "percentual_divergencia": 7.78,
      "valor_total_divergencia": -1250.00,
      "divergencias_justificadas": 28,
      "divergencias_nao_justificadas": 7
    },
    "por_tipo": {
      "falta_caixa": {
        "quantidade": 25,
        "valor": -980.00
      },
      "sobra_caixa": {
        "quantidade": 10,
        "valor": 230.00
      }
    },
    "ranking_vendedores": [
      {
        "posicao": 1,
        "vendedor": {
          "id": "uuid",
          "nome": "Pedro Alves",
          "loja_nome": "Loja Centro"
        },
        "total_turnos": 22,
        "turnos_com_divergencia": 5,
        "percentual_erro": 22.73,
        "valor_total": -320.00,
        "nivel_risco": "alto"
      }
    ],
    "por_loja": [
      {
        "loja": {
          "id": "uuid",
          "nome": "Loja Tijucas"
        },
        "total_turnos": 90,
        "divergencias": 5,
        "percentual": 5.56,
        "valor": -180.00
      }
    ],
    "evolucao": [
      {
        "semana": "2026-W01",
        "total_turnos": 110,
        "divergencias": 8,
        "percentual": 7.27
      }
    ]
  }
}
```

---

### GET /relatorios/historico
**Descrição**: Histórico de fechamentos para consulta.

**Query Parameters**:
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `page` | number | Página |
| `per_page` | number | Itens por página |
| `data_inicio` | string | Data inicial |
| `data_fim` | string | Data final |
| `loja_id` | uuid | Filtrar por loja |
| `vendedor_id` | uuid | Filtrar por vendedor |
| `status` | string | conferido, divergente |
| `apenas_divergencias` | boolean | Mostrar apenas divergências |

**Response 200**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "data": "2026-01-08",
      "turno": "manha",
      "loja_nome": "Loja Tijucas",
      "vendedor_nome": "João Silva",
      "valor_sistema": 4500.00,
      "valor_real": 4480.00,
      "diferenca": -20.00,
      "status": "conferido",
      "justificativa": "Troco a mais",
      "justificado": true,
      "bonus_valor": 25.00,
      "conferente_nome": "Maria Conferente",
      "data_conferencia": "2026-01-08T18:00:00Z"
    }
  ],
  "pagination": { ... },
  "totais": {
    "registros": 450,
    "valor_sistema": 1800000.00,
    "valor_real": 1798750.00,
    "diferenca": -1250.00
  }
}
```

---

## Estrutura do Banco de Dados

### Diagrama ER

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   lojas     │       │  usuarios   │       │ user_roles  │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │◄──┐   │ id (PK)     │◄──────│ id (PK)     │
│ nome        │   │   │ nome        │       │ user_id(FK) │
│ codigo      │   │   │ email       │       │ role        │
│ endereco    │   └───│ loja_id(FK) │       └─────────────┘
│ troco_padrao│       │ data_nasc   │
│ meta_mensal │       │ telefone    │
│ ativo       │       │ avatar_url  │
│ created_at  │       │ ativo       │
└─────────────┘       │ created_at  │
                      └─────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌─────────────┐       ┌─────────────┐     ┌─────────────┐
│   turnos    │       │   metas     │     │meta_distrib │
├─────────────┤       ├─────────────┤     ├─────────────┤
│ id (PK)     │       │ id (PK)     │     │ id (PK)     │
│ data        │       │ loja_id(FK) │     │ meta_id(FK) │
│ turno       │       │ mes         │     │vendedor_id  │
│ loja_id(FK) │       │ ano         │     │ percentual  │
│vendedor_id  │       │ valor_meta  │     └─────────────┘
│conferente_id│       │ created_at  │
│ troco_ini   │       └─────────────┘
│ troco_fin   │
│ val_sistema │       ┌─────────────┐     ┌─────────────┐
│ val_real    │       │tabela_bonus │     │regra_comiss │
│ diferenca   │       ├─────────────┤     ├─────────────┤
│ status      │       │ id (PK)     │     │ id (PK)     │
│justificativa│       │ faixa_min   │     │ perc_meta_mn│
│ justificado │       │ faixa_max   │     │ perc_meta_mx│
│bonus_elegiv │       │ valor_bonus │     │ perc_comiss │
│ bonus_valor │       │ ativo       │     │ descricao   │
│ data_conf   │       └─────────────┘     │ ativo       │
│ created_at  │                           └─────────────┘
└─────────────┘
```

### Tabelas SQL (Supabase/PostgreSQL)

```sql
-- Enum para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'gerente', 'conferente', 'vendedor');

-- Enum para status de turno
CREATE TYPE public.turno_status AS ENUM ('pendente', 'conferido', 'divergente');

-- Enum para período do turno
CREATE TYPE public.turno_periodo AS ENUM ('manha', 'tarde', 'noite');

-- Tabela de lojas
CREATE TABLE public.lojas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL,
    codigo VARCHAR(10) NOT NULL UNIQUE,
    endereco TEXT,
    troco_padrao DECIMAL(10,2) DEFAULT 500.00,
    meta_mensal DECIMAL(12,2) DEFAULT 0,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de usuários (extende auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    loja_id UUID REFERENCES public.lojas(id),
    data_nascimento DATE,
    telefone VARCHAR(20),
    avatar_url TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de roles (NUNCA armazenar role no profile!)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, role)
);

-- Tabela de metas
CREATE TABLE public.metas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loja_id UUID REFERENCES public.lojas(id) NOT NULL,
    mes SMALLINT NOT NULL CHECK (mes BETWEEN 1 AND 12),
    ano SMALLINT NOT NULL,
    valor_meta DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (loja_id, mes, ano)
);

-- Tabela de distribuição de metas
CREATE TABLE public.metas_distribuicao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meta_id UUID REFERENCES public.metas(id) ON DELETE CASCADE NOT NULL,
    vendedor_id UUID REFERENCES public.profiles(id) NOT NULL,
    percentual DECIMAL(5,2) NOT NULL CHECK (percentual BETWEEN 0 AND 100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (meta_id, vendedor_id)
);

-- Tabela de bônus
CREATE TABLE public.tabela_bonus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faixa_minima DECIMAL(10,2) NOT NULL,
    faixa_maxima DECIMAL(10,2),
    valor_bonus DECIMAL(10,2) NOT NULL,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de regras de comissão
CREATE TABLE public.regras_comissao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    percentual_meta_minimo DECIMAL(5,2) NOT NULL,
    percentual_meta_maximo DECIMAL(5,2),
    percentual_comissao DECIMAL(5,2) NOT NULL,
    descricao VARCHAR(100),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de turnos/fechamentos
CREATE TABLE public.turnos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data DATE NOT NULL,
    turno turno_periodo NOT NULL,
    loja_id UUID REFERENCES public.lojas(id) NOT NULL,
    vendedor_id UUID REFERENCES public.profiles(id) NOT NULL,
    conferente_id UUID REFERENCES public.profiles(id),
    troco_inicial DECIMAL(10,2),
    troco_final DECIMAL(10,2),
    -- Valores do sistema
    valor_pix_sistema DECIMAL(10,2) DEFAULT 0,
    valor_debito_sistema DECIMAL(10,2) DEFAULT 0,
    valor_credito_sistema DECIMAL(10,2) DEFAULT 0,
    valor_especie_sistema DECIMAL(10,2) DEFAULT 0,
    valor_devolucoes DECIMAL(10,2) DEFAULT 0,
    -- Valores reais
    valor_pix_real DECIMAL(10,2),
    valor_debito_real DECIMAL(10,2),
    valor_credito_real DECIMAL(10,2),
    valor_especie_real DECIMAL(10,2),
    -- Calculados
    diferenca DECIMAL(10,2) GENERATED ALWAYS AS (
        COALESCE(valor_pix_real, 0) + COALESCE(valor_debito_real, 0) + 
        COALESCE(valor_credito_real, 0) + COALESCE(valor_especie_real, 0) -
        (valor_pix_sistema + valor_debito_sistema + valor_credito_sistema + valor_especie_sistema - valor_devolucoes)
    ) STORED,
    -- Status e justificativa
    status turno_status DEFAULT 'pendente',
    justificativa TEXT,
    justificado BOOLEAN DEFAULT false,
    bonus_elegivel BOOLEAN DEFAULT true,
    bonus_valor DECIMAL(10,2) DEFAULT 0,
    data_conferencia TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (data, turno, vendedor_id)
);

-- Tabela de histórico de alterações (auditoria)
CREATE TABLE public.turnos_historico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    turno_id UUID REFERENCES public.turnos(id) ON DELETE CASCADE NOT NULL,
    usuario_id UUID REFERENCES public.profiles(id) NOT NULL,
    campo VARCHAR(50) NOT NULL,
    valor_anterior TEXT,
    valor_novo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Função para verificar role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS Policies
ALTER TABLE public.lojas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metas ENABLE ROW LEVEL SECURITY;

-- Exemplo de policy para turnos
CREATE POLICY "Vendedores podem ver próprios turnos"
ON public.turnos
FOR SELECT
TO authenticated
USING (
    vendedor_id = auth.uid() OR
    public.has_role(auth.uid(), 'conferente') OR
    public.has_role(auth.uid(), 'gerente') OR
    public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Conferentes podem editar turnos"
ON public.turnos
FOR UPDATE
TO authenticated
USING (
    public.has_role(auth.uid(), 'conferente') OR
    public.has_role(auth.uid(), 'admin')
);
```

---

## Considerações de Segurança

1. **Autenticação**: Usar JWT com refresh tokens
2. **Roles**: NUNCA armazenar no localStorage/sessionStorage
3. **RLS**: Todas as tabelas devem ter RLS habilitado
4. **Auditoria**: Log de todas as alterações em turnos
5. **Rate Limiting**: Implementar em todos os endpoints
6. **Validação**: Server-side em todos os inputs
7. **HTTPS**: Obrigatório em produção

---

## Versionamento da API

- Usar prefixo `/v1/` em todas as rotas
- Manter compatibilidade por pelo menos 6 meses ao depreciar
- Documentar breaking changes no changelog

---

## Contato

Para dúvidas sobre a API, entre em contato com a equipe de desenvolvimento.
