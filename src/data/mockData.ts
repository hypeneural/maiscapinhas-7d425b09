import type { User, Loja, TabelaBonus, RegraComissao, Turno, VendaDiaria } from '@/types';

export const usuarios: User[] = [
  {
    id: '1',
    nome: 'Carlos Admin',
    email: 'admin@maiscapinhas.com',
    role: 'admin',
    lojaId: '1',
    avatar: '',
    dataNascimento: '1985-03-15',
    ativo: true,
  },
  {
    id: '2',
    nome: 'Maria Gerente',
    email: 'gerente@maiscapinhas.com',
    role: 'gerente',
    lojaId: '1',
    avatar: '',
    dataNascimento: '1990-07-22',
    ativo: true,
  },
  {
    id: '3',
    nome: 'João Conferente',
    email: 'conferente@maiscapinhas.com',
    role: 'conferente',
    lojaId: '1',
    avatar: '',
    dataNascimento: '1992-11-08',
    ativo: true,
  },
  {
    id: '4',
    nome: 'Ana Vendedora',
    email: 'ana@maiscapinhas.com',
    role: 'vendedor',
    lojaId: '1',
    avatar: '',
    dataNascimento: '1998-05-30',
    ativo: true,
  },
  {
    id: '5',
    nome: 'Pedro Vendedor',
    email: 'pedro@maiscapinhas.com',
    role: 'vendedor',
    lojaId: '2',
    avatar: '',
    dataNascimento: '1995-09-12',
    ativo: true,
  },
  {
    id: '6',
    nome: 'Lucia Vendedora',
    email: 'lucia@maiscapinhas.com',
    role: 'vendedor',
    lojaId: '1',
    avatar: '',
    dataNascimento: '1997-02-18',
    ativo: true,
  },
];

export const lojas: Loja[] = [
  {
    id: '1',
    nome: 'Mais Capinhas - Shopping Center',
    codigo: 'MC001',
    endereco: 'Shopping Center Norte, Loja 45',
    metaMensal: 50000,
    ativo: true,
  },
  {
    id: '2',
    nome: 'Mais Capinhas - Centro',
    codigo: 'MC002',
    endereco: 'Rua das Flores, 123 - Centro',
    metaMensal: 35000,
    ativo: true,
  },
  {
    id: '3',
    nome: 'Mais Capinhas - Mall Plaza',
    codigo: 'MC003',
    endereco: 'Mall Plaza, Loja 78',
    metaMensal: 45000,
    ativo: true,
  },
];

export const tabelaBonus: TabelaBonus[] = [
  { id: '1', faixaMinima: 500, faixaMaxima: 999.99, valorBonus: 10, ativo: true },
  { id: '2', faixaMinima: 1000, faixaMaxima: 1499.99, valorBonus: 25, ativo: true },
  { id: '3', faixaMinima: 1500, faixaMaxima: 1999.99, valorBonus: 40, ativo: true },
  { id: '4', faixaMinima: 2000, faixaMaxima: 999999, valorBonus: 60, ativo: true },
];

export const regrasComissao: RegraComissao[] = [
  { id: '1', percentualMeta: 80, percentualComissao: 2 },
  { id: '2', percentualMeta: 100, percentualComissao: 3 },
  { id: '3', percentualMeta: 120, percentualComissao: 4 },
];

export const turnos: Turno[] = [
  {
    id: '1',
    lojaId: '1',
    vendedorId: '4',
    data: '2026-01-06',
    turno: 'manha',
    valorSistema: 1250.50,
    valorReal: 1250.50,
    diferenca: 0,
    justificado: true,
    bonusElegivel: true,
    conferenteId: '3',
    dataConferencia: '2026-01-06',
    status: 'conferido',
  },
  {
    id: '2',
    lojaId: '1',
    vendedorId: '4',
    data: '2026-01-05',
    turno: 'tarde',
    valorSistema: 980.00,
    valorReal: 960.00,
    diferenca: -20,
    justificativa: '',
    justificado: false,
    bonusElegivel: false,
    status: 'divergente',
  },
  {
    id: '3',
    lojaId: '2',
    vendedorId: '5',
    data: '2026-01-06',
    turno: 'manha',
    valorSistema: 1500.00,
    status: 'pendente',
    justificado: false,
    bonusElegivel: true,
  },
  {
    id: '4',
    lojaId: '1',
    vendedorId: '6',
    data: '2026-01-05',
    turno: 'manha',
    valorSistema: 2100.00,
    valorReal: 2050.00,
    diferenca: -50,
    justificativa: 'Troco errado entregue ao cliente',
    justificado: true,
    bonusElegivel: false,
    conferenteId: '3',
    status: 'conferido',
  },
  {
    id: '5',
    lojaId: '3',
    vendedorId: '5',
    data: '2026-01-04',
    turno: 'tarde',
    valorSistema: 890.00,
    status: 'pendente',
    justificado: false,
    bonusElegivel: true,
  },
];

export const vendasDiarias: VendaDiaria[] = [
  { id: '1', vendedorId: '4', lojaId: '1', data: '2026-01-06', valorVendido: 1250.50, metaDia: 1666.67, bonusGanho: 25 },
  { id: '2', vendedorId: '4', lojaId: '1', data: '2026-01-05', valorVendido: 980.00, metaDia: 1666.67, bonusGanho: 0 },
  { id: '3', vendedorId: '4', lojaId: '1', data: '2026-01-04', valorVendido: 1890.00, metaDia: 1666.67, bonusGanho: 40 },
  { id: '4', vendedorId: '4', lojaId: '1', data: '2026-01-03', valorVendido: 2150.00, metaDia: 1666.67, bonusGanho: 60 },
  { id: '5', vendedorId: '5', lojaId: '2', data: '2026-01-06', valorVendido: 1500.00, metaDia: 1166.67, bonusGanho: 25 },
  { id: '6', vendedorId: '6', lojaId: '1', data: '2026-01-06', valorVendido: 2100.00, metaDia: 1666.67, bonusGanho: 60 },
];

// Funções auxiliares para cálculos
export const calcularProximoBonus = (valorVendido: number): { faltam: number; valorBonus: number } => {
  for (const faixa of tabelaBonus) {
    if (valorVendido < faixa.faixaMinima) {
      return { faltam: faixa.faixaMinima - valorVendido, valorBonus: faixa.valorBonus };
    }
  }
  return { faltam: 0, valorBonus: 0 };
};

export const calcularComissaoProjetada = (percentualMeta: number): number => {
  const regra = [...regrasComissao].reverse().find(r => percentualMeta >= r.percentualMeta);
  return regra?.percentualComissao || 0;
};
