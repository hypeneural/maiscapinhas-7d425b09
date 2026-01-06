import React from 'react';
import { StatCard } from '@/components/StatCard';
import { StatusBadge } from '@/components/StatusBadge';
import { turnos, usuarios, lojas } from '@/data/mockData';
import { 
  FileCheck, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';

export const DashboardConferente: React.FC = () => {
  const pendentes = turnos.filter((t) => t.status === 'pendente');
  const divergentes = turnos.filter((t) => t.status === 'divergente');
  const conferidosHoje = turnos.filter(
    (t) => t.status === 'conferido' && t.dataConferencia === '2026-01-06'
  );

  const getVendedor = (id: string) => usuarios.find((u) => u.id === id);
  const getLoja = (id: string) => lojas.find((l) => l.id === id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold">
          Conferência de Caixa 📝
        </h1>
        <p className="text-muted-foreground">
          Gerencie os envelopes e validações do dia
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="A Conferir"
          value={pendentes.length}
          subtitle="envelopes aguardando"
          icon={Clock}
          variant="primary"
        />
        <StatCard
          title="Com Divergência"
          value={divergentes.length}
          subtitle="precisam de atenção"
          icon={AlertTriangle}
          variant="danger"
        />
        <StatCard
          title="Conferidos Hoje"
          value={conferidosHoje.length}
          subtitle="processados"
          icon={CheckCircle}
          variant="success"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pendentes */}
        <Card className="animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Envelopes Pendentes
            </CardTitle>
            <Link to="/conferencia/lancar">
              <Button variant="ghost" size="sm">
                Ver todos
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {pendentes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-success" />
                <p>Todos os envelopes foram conferidos! 🎉</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendentes.slice(0, 3).map((turno) => {
                  const vendedor = getVendedor(turno.vendedorId);
                  const loja = getLoja(turno.lojaId);
                  return (
                    <div
                      key={turno.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                          {vendedor?.nome.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{vendedor?.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            {loja?.nome} • {turno.turno}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          R$ {turno.valorSistema.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <StatusBadge status="pendente" size="sm" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Divergências */}
        <Card className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Divergências Abertas
            </CardTitle>
            <Link to="/conferencia/divergencias">
              <Button variant="ghost" size="sm">
                Ver todos
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {divergentes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-success" />
                <p>Nenhuma divergência pendente!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {divergentes.slice(0, 3).map((turno) => {
                  const vendedor = getVendedor(turno.vendedorId);
                  const loja = getLoja(turno.lojaId);
                  return (
                    <div
                      key={turno.id}
                      className="flex items-center justify-between p-3 bg-destructive/5 border border-destructive/20 rounded-lg hover:bg-destructive/10 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center text-sm font-medium text-destructive">
                          {vendedor?.nome.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{vendedor?.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            {loja?.nome} • {turno.data}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-destructive">
                          {turno.diferenca !== undefined && turno.diferenca < 0 ? '-' : '+'}
                          R$ {Math.abs(turno.diferenca || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <StatusBadge status="divergente" size="sm" pulse />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action Button */}
      <div className="flex justify-center pt-4">
        <Link to="/conferencia/lancar">
          <Button size="lg" className="gap-2 shadow-glow">
            <FileCheck className="w-5 h-5" />
            Iniciar Nova Conferência
          </Button>
        </Link>
      </div>
    </div>
  );
};
