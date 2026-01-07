import React, { useState } from 'react';
import { Gift, Plus, Pencil, Trash2, Save, X, DollarSign, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { tabelaBonus as initialBonus } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { TabelaBonus } from '@/types';

const TabelaBonusPage: React.FC = () => {
  const { toast } = useToast();
  const [bonus, setBonus] = useState<TabelaBonus[]>(initialBonus);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBonus, setEditingBonus] = useState<TabelaBonus | null>(null);
  const [formData, setFormData] = useState({
    faixaMinima: 0,
    faixaMaxima: 0,
    valorBonus: 0,
    ativo: true,
  });

  const handleSave = () => {
    if (formData.faixaMinima <= 0 || formData.faixaMaxima <= 0 || formData.valorBonus <= 0) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos corretamente',
        variant: 'destructive',
      });
      return;
    }

    if (formData.faixaMinima >= formData.faixaMaxima) {
      toast({
        title: 'Erro',
        description: 'A faixa mínima deve ser menor que a faixa máxima',
        variant: 'destructive',
      });
      return;
    }

    if (editingBonus) {
      setBonus(prev => prev.map(b => 
        b.id === editingBonus.id 
          ? { ...b, ...formData }
          : b
      ));
      toast({ title: 'Faixa atualizada com sucesso!' });
    } else {
      const novaFaixa: TabelaBonus = {
        id: String(Date.now()),
        ...formData,
      };
      setBonus(prev => [...prev, novaFaixa].sort((a, b) => a.faixaMinima - b.faixaMinima));
      toast({ title: 'Faixa criada com sucesso!' });
    }

    setIsDialogOpen(false);
    setEditingBonus(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      faixaMinima: 0,
      faixaMaxima: 0,
      valorBonus: 0,
      ativo: true,
    });
  };

  const handleEdit = (faixa: TabelaBonus) => {
    setEditingBonus(faixa);
    setFormData({
      faixaMinima: faixa.faixaMinima,
      faixaMaxima: faixa.faixaMaxima,
      valorBonus: faixa.valorBonus,
      ativo: faixa.ativo,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setBonus(prev => prev.filter(b => b.id !== id));
    toast({ title: 'Faixa removida com sucesso!' });
  };

  const handleToggleAtivo = (id: string) => {
    setBonus(prev => prev.map(b => 
      b.id === id ? { ...b, ativo: !b.ativo } : b
    ));
  };

  const openNewDialog = () => {
    setEditingBonus(null);
    const ultimaFaixa = bonus[bonus.length - 1];
    if (ultimaFaixa) {
      setFormData({
        faixaMinima: ultimaFaixa.faixaMaxima + 0.01,
        faixaMaxima: ultimaFaixa.faixaMaxima + 500,
        valorBonus: ultimaFaixa.valorBonus + 10,
        ativo: true,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  // Calcular exemplo de bônus
  const calcularExemploBonus = (valor: number): number => {
    const faixa = bonus.find(b => b.ativo && valor >= b.faixaMinima && valor <= b.faixaMaxima);
    return faixa?.valorBonus || 0;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Tabela de Bônus Diário"
        description="Configure as faixas de bônus por valor vendido no dia"
        icon={Gift}
        actions={
          <Button onClick={openNewDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Faixa
          </Button>
        }
      />

      {/* Visualização das Faixas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Faixas de Premiação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Linha de progressão visual */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-muted via-primary to-accent" />
            
            <div className="space-y-4">
              {bonus.sort((a, b) => a.faixaMinima - b.faixaMinima).map((faixa, index) => (
                <div 
                  key={faixa.id}
                  className={cn(
                    'relative flex items-center gap-4 p-4 rounded-lg border transition-all',
                    faixa.ativo 
                      ? 'bg-card hover:shadow-md' 
                      : 'bg-muted/50 opacity-60'
                  )}
                >
                  {/* Indicador */}
                  <div className={cn(
                    'relative z-10 w-4 h-4 rounded-full border-2',
                    faixa.ativo ? 'bg-primary border-primary' : 'bg-muted border-muted-foreground'
                  )} />

                  {/* Conteúdo */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <div>
                      <span className="text-xs text-muted-foreground block">Faixa de Venda</span>
                      <span className="font-medium">
                        R$ {faixa.faixaMinima.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} 
                        {' — '}
                        {faixa.faixaMaxima >= 999999 
                          ? 'acima' 
                          : `R$ ${faixa.faixaMaxima.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                        }
                      </span>
                    </div>

                    <div>
                      <span className="text-xs text-muted-foreground block">Bônus</span>
                      <span className="font-bold text-xl text-accent">
                        R$ {faixa.valorBonus.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={faixa.ativo}
                        onCheckedChange={() => handleToggleAtivo(faixa.id)}
                      />
                      <StatusBadge variant={faixa.ativo ? 'success' : 'default'}>
                        {faixa.ativo ? 'Ativo' : 'Inativo'}
                      </StatusBadge>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(faixa)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(faixa.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {bonus.length === 0 && (
            <div className="text-center py-12">
              <Gift className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">Nenhuma faixa configurada</p>
              <p className="text-muted-foreground mb-4">Crie sua primeira faixa de bônus</p>
              <Button onClick={openNewDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Faixa
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Simulador */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-secondary" />
            Simulador de Bônus
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[500, 1200, 2000].map(valor => (
              <div 
                key={valor}
                className="p-4 rounded-lg border bg-gradient-to-br from-card to-muted/30 text-center"
              >
                <p className="text-sm text-muted-foreground mb-1">Vendendo</p>
                <p className="text-2xl font-bold mb-2">
                  R$ {valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <div className="py-2 px-4 rounded-full bg-accent/20 inline-flex items-center gap-2">
                  <Gift className="w-4 h-4 text-accent" />
                  <span className="font-bold text-accent">
                    R$ {calcularExemploBonus(valor).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Criação/Edição */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingBonus ? 'Editar Faixa de Bônus' : 'Nova Faixa de Bônus'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Faixa Mínima (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={formData.faixaMinima || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, faixaMinima: Number(e.target.value) }))}
                />
              </div>
              <div>
                <Label>Faixa Máxima (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={formData.faixaMaxima || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, faixaMaxima: Number(e.target.value) }))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use 999999 para "sem limite"
                </p>
              </div>
            </div>

            <div>
              <Label>Valor do Bônus (R$)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={formData.valorBonus || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, valorBonus: Number(e.target.value) }))}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <Label className="text-base">Faixa Ativa</Label>
                <p className="text-sm text-muted-foreground">Ativar ou desativar esta faixa</p>
              </div>
              <Switch
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ativo: checked }))}
              />
            </div>

            {formData.faixaMinima > 0 && formData.faixaMaxima > 0 && formData.valorBonus > 0 && (
              <div className="p-4 rounded-lg bg-accent/10 border border-accent/30">
                <p className="text-sm text-center">
                  Vendendo entre{' '}
                  <strong>R$ {formData.faixaMinima.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                  {' e '}
                  <strong>R$ {formData.faixaMaxima.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                  {', o vendedor ganha '}
                  <strong className="text-accent">R$ {formData.valorBonus.toFixed(2)}</strong>
                  {' de bônus'}
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

export default TabelaBonusPage;
