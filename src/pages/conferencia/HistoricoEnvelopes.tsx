import React, { useState } from 'react';
import { History, Search, Filter, Calendar, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { turnos, usuarios, lojas } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const HistoricoEnvelopes: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLoja, setSelectedLoja] = useState<string>('todas');
  const [selectedStatus, setSelectedStatus] = useState<string>('todos');
  const [selectedTurno, setSelectedTurno] = useState<typeof turnos[0] | null>(null);

  // Filtrar turnos
  const turnosFiltrados = turnos.filter(turno => {
    const vendedor = usuarios.find(u => u.id === turno.vendedorId);
    const loja = lojas.find(l => l.id === turno.lojaId);
    
    const matchSearch = searchTerm === '' || 
      vendedor?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loja?.nome.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchLoja = selectedLoja === 'todas' || turno.lojaId === selectedLoja;
    const matchStatus = selectedStatus === 'todos' || turno.status === selectedStatus;

    return matchSearch && matchLoja && matchStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'conferido': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'divergente': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pendente': return <Clock className="w-4 h-4 text-yellow-600" />;
      default: return null;
    }
  };

  const getStatusVariant = (status: string): 'success' | 'error' | 'warning' => {
    switch (status) {
      case 'conferido': return 'success';
      case 'divergente': return 'error';
      default: return 'warning';
    }
  };

  const getTurnoLabel = (turno: string) => {
    switch (turno) {
      case 'manha': return 'Manhã';
      case 'tarde': return 'Tarde';
      case 'noite': return 'Noite';
      default: return turno;
    }
  };

  // Estatísticas
  const stats = {
    total: turnos.length,
    conferidos: turnos.filter(t => t.status === 'conferido').length,
    pendentes: turnos.filter(t => t.status === 'pendente').length,
    divergentes: turnos.filter(t => t.status === 'divergente').length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Histórico de Envelopes"
        description="Consulta de fechamentos passados"
        icon={History}
      />

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total de Turnos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.conferidos}</p>
              <p className="text-sm text-muted-foreground">Conferidos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.pendentes}</p>
              <p className="text-sm text-muted-foreground">Pendentes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{stats.divergentes}</p>
              <p className="text-sm text-muted-foreground">Com Divergência</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por vendedor ou loja..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedLoja} onValueChange={setSelectedLoja}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtrar loja" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as Lojas</SelectItem>
                {lojas.map(loja => (
                  <SelectItem key={loja.id} value={loja.id}>{loja.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full md:w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="conferido">Conferido</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="divergente">Divergente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Histórico */}
      <Card>
        <CardHeader>
          <CardTitle>Envelopes ({turnosFiltrados.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 font-semibold">Data</th>
                  <th className="text-left py-3 px-4 font-semibold">Turno</th>
                  <th className="text-left py-3 px-4 font-semibold">Vendedor</th>
                  <th className="text-left py-3 px-4 font-semibold">Loja</th>
                  <th className="text-right py-3 px-4 font-semibold">Valor Sistema</th>
                  <th className="text-right py-3 px-4 font-semibold">Valor Real</th>
                  <th className="text-right py-3 px-4 font-semibold">Diferença</th>
                  <th className="text-center py-3 px-4 font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {turnosFiltrados.map((turno) => {
                  const vendedor = usuarios.find(u => u.id === turno.vendedorId);
                  const loja = lojas.find(l => l.id === turno.lojaId);
                  const conferente = usuarios.find(u => u.id === turno.conferenteId);

                  return (
                    <tr 
                      key={turno.id} 
                      className={cn(
                        'border-b transition-colors hover:bg-muted/50',
                        turno.status === 'divergente' && 'bg-destructive/5'
                      )}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(turno.status)}
                          <StatusBadge variant={getStatusVariant(turno.status)}>
                            {turno.status === 'conferido' ? 'Conferido' : 
                             turno.status === 'divergente' ? 'Divergente' : 'Pendente'}
                          </StatusBadge>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {format(new Date(turno.data), 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge variant="default">
                          {getTurnoLabel(turno.turno)}
                        </StatusBadge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                            {vendedor?.nome.charAt(0)}
                          </div>
                          <span>{vendedor?.nome}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{loja?.nome}</td>
                      <td className="py-3 px-4 text-right font-medium">
                        R$ {turno.valorSistema.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        {turno.valorReal !== undefined 
                          ? `R$ ${turno.valorReal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          : '-'
                        }
                      </td>
                      <td className="py-3 px-4 text-right">
                        {turno.diferenca !== undefined ? (
                          <span className={cn(
                            'font-bold',
                            turno.diferenca === 0 ? 'text-green-600' : 'text-destructive'
                          )}>
                            R$ {turno.diferenca.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setSelectedTurno(turno)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader>
                              <DialogTitle>Detalhes do Envelope</DialogTitle>
                            </DialogHeader>
                            {selectedTurno && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm text-muted-foreground">Data</p>
                                    <p className="font-medium">
                                      {format(new Date(selectedTurno.data), 'dd/MM/yyyy', { locale: ptBR })}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Turno</p>
                                    <p className="font-medium">{getTurnoLabel(selectedTurno.turno)}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Vendedor</p>
                                    <p className="font-medium">{vendedor?.nome}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Loja</p>
                                    <p className="font-medium">{loja?.nome}</p>
                                  </div>
                                </div>
                                <div className="border-t pt-4">
                                  <div className="grid grid-cols-3 gap-4 text-center">
                                    <div className="p-3 bg-muted rounded-lg">
                                      <p className="text-sm text-muted-foreground">Sistema</p>
                                      <p className="text-lg font-bold">
                                        R$ {selectedTurno.valorSistema.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                      </p>
                                    </div>
                                    <div className="p-3 bg-muted rounded-lg">
                                      <p className="text-sm text-muted-foreground">Real</p>
                                      <p className="text-lg font-bold">
                                        {selectedTurno.valorReal !== undefined 
                                          ? `R$ ${selectedTurno.valorReal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                                          : '-'
                                        }
                                      </p>
                                    </div>
                                    <div className={cn(
                                      'p-3 rounded-lg',
                                      selectedTurno.diferenca === 0 ? 'bg-green-500/10' : 'bg-red-500/10'
                                    )}>
                                      <p className="text-sm text-muted-foreground">Diferença</p>
                                      <p className={cn(
                                        'text-lg font-bold',
                                        selectedTurno.diferenca === 0 ? 'text-green-600' : 'text-red-600'
                                      )}>
                                        {selectedTurno.diferenca !== undefined 
                                          ? `R$ ${selectedTurno.diferenca.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                                          : '-'
                                        }
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                {selectedTurno.justificativa && (
                                  <div className="border-t pt-4">
                                    <p className="text-sm text-muted-foreground mb-1">Justificativa</p>
                                    <p className="text-sm bg-muted p-3 rounded-lg">{selectedTurno.justificativa}</p>
                                  </div>
                                )}
                                {conferente && (
                                  <div className="border-t pt-4">
                                    <p className="text-sm text-muted-foreground mb-1">Conferido por</p>
                                    <p className="font-medium">{conferente.nome}</p>
                                    {selectedTurno.dataConferencia && (
                                      <p className="text-sm text-muted-foreground">
                                        em {format(new Date(selectedTurno.dataConferencia), 'dd/MM/yyyy', { locale: ptBR })}
                                      </p>
                                    )}
                                  </div>
                                )}
                                <div className="flex items-center justify-between pt-4 border-t">
                                  <span className="text-sm text-muted-foreground">Bônus Elegível</span>
                                  <StatusBadge variant={selectedTurno.bonusElegivel ? 'success' : 'error'}>
                                    {selectedTurno.bonusElegivel ? 'Sim' : 'Não'}
                                  </StatusBadge>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {turnosFiltrados.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum envelope encontrado com os filtros selecionados.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HistoricoEnvelopes;
