// Roles do sistema
export type UserRole = 'admin' | 'gerente' | 'conferente' | 'vendedor';

export interface User {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  lojaId: string;
  avatar?: string;
  dataNascimento: string;
  ativo: boolean;
}

export interface Loja {
  id: string;
  nome: string;
  codigo: string;
  endereco: string;
  metaMensal: number;
  ativo: boolean;
}

export interface MetaMensal {
  id: string;
  lojaId: string;
  mes: number;
  ano: number;
  valorMeta: number;
  distribuicao: { vendedorId: string; percentual: number }[];
}

export interface TabelaBonus {
  id: string;
  faixaMinima: number;
  faixaMaxima: number;
  valorBonus: number;
  ativo: boolean;
}

export interface RegraComissao {
  id: string;
  percentualMeta: number; // Ex: 100 = 100% da meta
  percentualComissao: number; // Ex: 2, 3 ou 4%
}

export interface Turno {
  id: string;
  lojaId: string;
  vendedorId: string;
  data: string;
  turno: 'manha' | 'tarde' | 'noite';
  valorSistema: number;
  valorReal?: number;
  diferenca?: number;
  justificativa?: string;
  justificado: boolean;
  bonusElegivel: boolean;
  conferenteId?: string;
  dataConferencia?: string;
  status: 'pendente' | 'conferido' | 'divergente';
}

export interface VendaDiaria {
  id: string;
  vendedorId: string;
  lojaId: string;
  data: string;
  valorVendido: number;
  metaDia: number;
  bonusGanho: number;
}

export interface DashboardVendedor {
  metaDia: number;
  vendidoHoje: number;
  percentualMeta: number;
  horasRestantes: number;
  minutosRestantes: number;
  proximoBonus: {
    faltam: number;
    valorBonus: number;
  };
  acumuladoMes: {
    percentualMeta: number;
    comissaoProjetada: number;
  };
}

export interface DashboardConferente {
  aConferir: number;
  comDivergencia: number;
  conferidosHoje: number;
  envelopesPendentes: Turno[];
}

export interface DashboardAdmin {
  top3Vendedores: {
    vendedor: User;
    valorVendido: number;
    percentualMeta: number;
  }[];
  farolLojas: {
    loja: Loja;
    percentualMeta: number;
    status: 'verde' | 'amarelo' | 'vermelho';
  }[];
  percentualQuebraCaixa: number;
  maioresDivergencias: {
    vendedor: User;
    valorDivergencia: number;
    quantidadeOcorrencias: number;
  }[];
}

// Re-export new types
export * from './customers.types';
export * from './pedidos.types';
export * from './capas.types';

