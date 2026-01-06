import React from 'react';
import { turnos, usuarios, lojas } from '@/data/mockData';
import { StatusBadge } from '@/components/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ChevronRight, Clock } from 'lucide-react';

const Divergencias: React.FC = () => {
  const divergentes = turnos
    .filter((t) => t.status === 'divergente' || (t.diferenca && t.diferenca !== 0 && !t.justificado))
    .sort((a, b) => {
      // Ordenar por data mais antiga e maior valor
      const dateCompare = new Date(a.data).getTime() - new Date(b.data).getTime();
      if (dateCompare !== 0) return dateCompare;
      return Math.abs(b.diferenca || 0) - Math.abs(a.diferenca || 0);
    });

  const getVendedor = (id: string) => usuarios.find((u) => u.id === id);
  const getLoja = (id: string) => lojas.find((l) => l.id === id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-destructive" />
          Divergências Pendentes
        </h1>
        <p className="text-muted-foreground">
          Turnos com diferença entre valor real e sistema, ordenados por urgência
        </p>
      </div>

      {divergentes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-success" />
            </div>
            <p className="text-lg font-medium">Nenhuma divergência pendente!</p>
            <p className="text-muted-foreground">Todos os turnos estão em dia.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {divergentes.map((turno, index) => {
            const vendedor = getVendedor(turno.vendedorId);
            const loja = getLoja(turno.lojaId);
            const diasPendente = Math.floor(
              (new Date().getTime() - new Date(turno.data).getTime()) / (1000 * 60 * 60 * 24)
            );

            return (
              <Card
                key={turno.id}
                className="animate-fade-in hover:shadow-lg transition-shadow cursor-pointer"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center text-lg font-bold text-destructive">
                        {vendedor?.nome.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold">{vendedor?.nome}</p>
                        <p className="text-sm text-muted-foreground">
                          {loja?.codigo} • {turno.data} • {turno.turno}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 sm:gap-6">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Diferença</p>
                        <p className="text-xl font-bold text-destructive">
                          R$ {Math.abs(turno.diferenca || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {diasPendente > 0 && (
                          <div className="flex items-center gap-1 text-warning text-sm">
                            <Clock className="w-4 h-4" />
                            <span>{diasPendente}d</span>
                          </div>
                        )}
                        <StatusBadge status="divergente" pulse />
                      </div>

                      <Button variant="outline" size="sm" className="gap-1">
                        Validar
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Summary */}
      {divergentes.length > 0 && (
        <Card className="bg-destructive/5 border-destructive/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-destructive">Total de divergências pendentes</p>
                <p className="text-2xl font-bold text-destructive">
                  R$ {divergentes
                    .reduce((acc, t) => acc + Math.abs(t.diferenca || 0), 0)
                    .toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">{divergentes.length} turno(s)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Divergencias;
