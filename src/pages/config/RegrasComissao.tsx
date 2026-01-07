import React, { useState } from 'react';
import { Percent, Plus, Pencil, Trash2, Save, X, TrendingUp, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { regrasComissao as initialRegras } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { RegraComissao } from '@/types';

const RegrasComissaoPage: React.FC = () => {
  const { toast } = useToast();
  const [regras, setRegras] = useState<RegraComissao[]>(initialRegras);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRegra, setEditingRegra] = useState<RegraComissao | null>(null);
  const [formData, setFormData] = useState({
    percentualMeta: 0,
    percentualComissao: 0,
  });

  const handleSave = () => {
    if (formData.percentualMeta <= 0 || formData.percentualComissao <= 0) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos corretamente',
        variant: 'destructive',
      });
      return;
    }

    // Verificar duplicidade
    const duplicada = regras.some(r => 
      r.percentualMeta === formData.percentualMeta && 
      (!editingRegra || r.id !== editingRegra.id)
    );
    if (duplicada) {
      toast({
        title: 'Erro',
        description: 'Já existe uma regra para este percentual de meta',
        variant: 'destructive',
      });
      return;
    }

    if (editingRegra) {
      setRegras(prev => prev.map(r => 
        r.id === editingRegra.id 
          ? { ...r, ...formData }
          : r
      ).sort((a, b) => a.percentualMeta - b.percentualMeta));
      toast({ title: 'Regra atualizada com sucesso!' });
    } else {
      const novaRegra: RegraComissao = {
        id: String(Date.now()),
        ...formData,
      };
      setRegras(prev => [...prev, novaRegra].sort((a, b) => a.percentualMeta - b.percentualMeta));
      toast({ title: 'Regra criada com sucesso!' });
    }

    setIsDialogOpen(false);
    setEditingRegra(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      percentualMeta: 0,
      percentualComissao: 0,
    });
  };

  const handleEdit = (regra: RegraComissao) => {
    setEditingRegra(regra);
    setFormData({
      percentualMeta: regra.percentualMeta,
      percentualComissao: regra.percentualComissao,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setRegras(prev => prev.filter(r => r.id !== id));
    toast({ title: 'Regra removida com sucesso!' });
  };

  const openNewDialog = () => {
    setEditingRegra(null);
    resetForm();
    setIsDialogOpen(true);
  };

  // Calcular exemplo de comissão
  const calcularExemploComissao = (percentualMeta: number): number => {
    const regraAplicavel = [...regras]
      .sort((a, b) => b.percentualMeta - a.percentualMeta)
      .find(r => percentualMeta >= r.percentualMeta);
    return regraAplicavel?.percentualComissao || 0;
  };

  const getStatusColor = (percentual: number): 'success' | 'warning' | 'error' => {
    if (percentual >= 120) return 'success';
    if (percentual >= 100) return 'warning';
    return 'error';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Regras de Comissão"
        description="Configure os percentuais de comissão por atingimento de meta mensal"
        icon={Percent}
        actions={
          <Button onClick={openNewDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Regra
          </Button>
        }
      />

      {/* Info Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-primary">Como funciona?</p>
              <p className="text-sm text-muted-foreground mt-1">
                A comissão é calculada sobre o <strong>total de vendas do mês</strong> e aplicada 
                conforme o percentual da meta atingida. O percentual de comissão é aplicado sobre 
                o valor total vendido, não apenas sobre a meta.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visualização das Regras */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Faixas de Comissão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {regras.sort((a, b) => a.percentualMeta - b.percentualMeta).map((regra, index) => (
              <div 
                key={regra.id}
                className={cn(
                  'relative p-6 rounded-xl border-2 transition-all hover:shadow-lg',
                  index === regras.length - 1 
                    ? 'border-accent bg-gradient-to-br from-accent/10 to-transparent' 
                    : 'border-border bg-card'
                )}
              >
                {index === regras.length - 1 && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-accent text-accent-foreground text-xs font-bold rounded-full">
                    Melhor Faixa
                  </div>
                )}

                <div className="text-center space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Atingir</p>
                    <p className="text-3xl font-bold">{regra.percentualMeta}%</p>
                    <p className="text-sm text-muted-foreground">da meta</p>
                  </div>

                  <div className="h-px bg-border" />

                  <div>
                    <p className="text-sm text-muted-foreground">Comissão</p>
                    <p className={cn(
                      'text-4xl font-bold',
                      index === regras.length - 1 ? 'text-accent' : 'text-primary'
                    )}>
                      {regra.percentualComissao}%
                    </p>
                  </div>

                  <div className="flex justify-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(regra)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(regra.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {regras.length === 0 && (
              <div className="col-span-3 text-center py-12">
                <Percent className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium">Nenhuma regra configurada</p>
                <p className="text-muted-foreground mb-4">Crie sua primeira regra de comissão</p>
                <Button onClick={openNewDialog}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Regra
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Simulador */}
      <Card>
        <CardHeader>
          <CardTitle>Simulador de Comissão</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[70, 95, 105, 125].map(percentual => {
              const comissao = calcularExemploComissao(percentual);
              const metaExemplo = 50000;
              const vendido = (metaExemplo * percentual) / 100;
              const valorComissao = (vendido * comissao) / 100;

              return (
                <div 
                  key={percentual}
                  className={cn(
                    'p-4 rounded-lg border text-center',
                    percentual >= 120 && 'bg-accent/10 border-accent',
                    percentual >= 100 && percentual < 120 && 'bg-secondary/10 border-secondary',
                    percentual < 100 && 'bg-muted'
                  )}
                >
                  <StatusBadge variant={getStatusColor(percentual)} className="mb-2">
                    {percentual}% da meta
                  </StatusBadge>
                  <p className="text-sm text-muted-foreground mt-2">
                    Vendendo R$ {vendido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-muted-foreground mb-2">
                    (meta de R$ {metaExemplo.toLocaleString('pt-BR')})
                  </p>
                  <div className="py-2 px-3 rounded-lg bg-background">
                    <span className="text-sm text-muted-foreground">Comissão: </span>
                    <span className="font-bold text-lg">{comissao}%</span>
                  </div>
                  <p className="text-lg font-bold mt-2 text-primary">
                    R$ {valorComissao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Criação/Edição */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRegra ? 'Editar Regra de Comissão' : 'Nova Regra de Comissão'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Atingimento da Meta (%)</Label>
              <Input
                type="number"
                placeholder="Ex: 100"
                value={formData.percentualMeta || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, percentualMeta: Number(e.target.value) }))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Percentual mínimo da meta que precisa ser atingido
              </p>
            </div>

            <div>
              <Label>Percentual de Comissão (%)</Label>
              <Input
                type="number"
                step="0.5"
                placeholder="Ex: 3"
                value={formData.percentualComissao || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, percentualComissao: Number(e.target.value) }))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Percentual aplicado sobre o valor total vendido
              </p>
            </div>

            {formData.percentualMeta > 0 && formData.percentualComissao > 0 && (
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                <p className="text-sm text-center">
                  Atingindo <strong>{formData.percentualMeta}%</strong> ou mais da meta, 
                  o vendedor recebe <strong className="text-primary">{formData.percentualComissao}%</strong> de comissão 
                  sobre o total vendido
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RegrasComissaoPage;
