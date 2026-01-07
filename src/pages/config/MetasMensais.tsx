import React, { useState } from 'react';
import { Target, Plus, Pencil, Trash2, Save, X, Store, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { lojas, usuarios } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface MetaConfig {
  id: string;
  lojaId: string;
  mes: number;
  ano: number;
  valorMeta: number;
  distribuicao: { vendedorId: string; percentual: number; nome: string }[];
}

const MetasMensais: React.FC = () => {
  const { toast } = useToast();
  const [metas, setMetas] = useState<MetaConfig[]>([
    {
      id: '1',
      lojaId: '1',
      mes: 1,
      ano: 2026,
      valorMeta: 50000,
      distribuicao: [
        { vendedorId: '4', percentual: 50, nome: 'Ana Vendedora' },
        { vendedorId: '6', percentual: 50, nome: 'Lucia Vendedora' },
      ],
    },
    {
      id: '2',
      lojaId: '2',
      mes: 1,
      ano: 2026,
      valorMeta: 35000,
      distribuicao: [
        { vendedorId: '5', percentual: 100, nome: 'Pedro Vendedor' },
      ],
    },
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMeta, setEditingMeta] = useState<MetaConfig | null>(null);
  const [formData, setFormData] = useState({
    lojaId: '',
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear(),
    valorMeta: 0,
    distribuicao: [] as { vendedorId: string; percentual: number; nome: string }[],
  });

  const meses = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' },
  ];

  const handleLojaChange = (lojaId: string) => {
    const vendedoresLoja = usuarios.filter(u => u.lojaId === lojaId && u.role === 'vendedor' && u.ativo);
    const percentualBase = Math.floor(100 / vendedoresLoja.length);
    const resto = 100 - (percentualBase * vendedoresLoja.length);

    const distribuicao = vendedoresLoja.map((v, index) => ({
      vendedorId: v.id,
      percentual: percentualBase + (index === 0 ? resto : 0),
      nome: v.nome,
    }));

    setFormData(prev => ({
      ...prev,
      lojaId,
      distribuicao,
    }));
  };

  const handleDistribuicaoChange = (vendedorId: string, novoPercentual: number) => {
    const novaDistribuicao = formData.distribuicao.map(d => {
      if (d.vendedorId === vendedorId) {
        return { ...d, percentual: novoPercentual };
      }
      return d;
    });

    // Normalizar para garantir que soma = 100
    const total = novaDistribuicao.reduce((acc, d) => acc + d.percentual, 0);
    if (total !== 100 && novaDistribuicao.length > 1) {
      const outros = novaDistribuicao.filter(d => d.vendedorId !== vendedorId);
      const restante = 100 - novoPercentual;
      const perPessoa = restante / outros.length;
      
      novaDistribuicao.forEach(d => {
        if (d.vendedorId !== vendedorId) {
          d.percentual = Math.round(perPessoa);
        }
      });
    }

    setFormData(prev => ({ ...prev, distribuicao: novaDistribuicao }));
  };

  const handleSave = () => {
    if (!formData.lojaId || formData.valorMeta <= 0) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    const totalDistribuicao = formData.distribuicao.reduce((acc, d) => acc + d.percentual, 0);
    if (totalDistribuicao !== 100) {
      toast({
        title: 'Erro',
        description: 'A distribuição deve somar 100%',
        variant: 'destructive',
      });
      return;
    }

    if (editingMeta) {
      setMetas(prev => prev.map(m => 
        m.id === editingMeta.id 
          ? { ...m, ...formData }
          : m
      ));
      toast({ title: 'Meta atualizada com sucesso!' });
    } else {
      const novaMeta: MetaConfig = {
        id: String(Date.now()),
        ...formData,
      };
      setMetas(prev => [...prev, novaMeta]);
      toast({ title: 'Meta criada com sucesso!' });
    }

    setIsDialogOpen(false);
    setEditingMeta(null);
    setFormData({
      lojaId: '',
      mes: new Date().getMonth() + 1,
      ano: new Date().getFullYear(),
      valorMeta: 0,
      distribuicao: [],
    });
  };

  const handleEdit = (meta: MetaConfig) => {
    setEditingMeta(meta);
    setFormData({
      lojaId: meta.lojaId,
      mes: meta.mes,
      ano: meta.ano,
      valorMeta: meta.valorMeta,
      distribuicao: meta.distribuicao,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setMetas(prev => prev.filter(m => m.id !== id));
    toast({ title: 'Meta removida com sucesso!' });
  };

  const openNewDialog = () => {
    setEditingMeta(null);
    setFormData({
      lojaId: '',
      mes: new Date().getMonth() + 1,
      ano: new Date().getFullYear(),
      valorMeta: 0,
      distribuicao: [],
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Metas Mensais"
        description="Configure as metas de vendas por loja e distribua entre os vendedores"
        icon={Target}
        actions={
          <Button onClick={openNewDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Meta
          </Button>
        }
      />

      {/* Lista de Metas */}
      <div className="grid gap-4">
        {metas.map(meta => {
          const loja = lojas.find(l => l.id === meta.lojaId);
          const mesLabel = meses.find(m => m.value === meta.mes)?.label;

          return (
            <Card key={meta.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <Store className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{loja?.nome}</h3>
                      <p className="text-muted-foreground">
                        {mesLabel} {meta.ano}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <StatusBadge variant="default">
                          R$ {meta.valorMeta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </StatusBadge>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 max-w-md">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Distribuição</span>
                    </div>
                    <div className="space-y-2">
                      {meta.distribuicao.map(d => (
                        <div key={d.vendedorId} className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                            {d.nome.charAt(0)}
                          </div>
                          <span className="text-sm flex-1 truncate">{d.nome}</span>
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${d.percentual}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-12 text-right">{d.percentual}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(meta)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(meta.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {metas.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">Nenhuma meta configurada</p>
              <p className="text-muted-foreground mb-4">Crie sua primeira meta mensal</p>
              <Button onClick={openNewDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Meta
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog de Criação/Edição */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingMeta ? 'Editar Meta' : 'Nova Meta Mensal'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Loja</Label>
                <Select value={formData.lojaId} onValueChange={handleLojaChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a loja" />
                  </SelectTrigger>
                  <SelectContent>
                    {lojas.map(loja => (
                      <SelectItem key={loja.id} value={loja.id}>{loja.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Mês</Label>
                <Select 
                  value={String(formData.mes)} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, mes: Number(v) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {meses.map(mes => (
                      <SelectItem key={mes.value} value={String(mes.value)}>{mes.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Ano</Label>
                <Select 
                  value={String(formData.ano)} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, ano: Number(v) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                    <SelectItem value="2027">2027</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2">
                <Label>Valor da Meta (R$)</Label>
                <Input
                  type="number"
                  placeholder="0,00"
                  value={formData.valorMeta || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, valorMeta: Number(e.target.value) }))}
                />
              </div>
            </div>

            {formData.distribuicao.length > 0 && (
              <div className="border-t pt-4">
                <Label className="mb-4 block">Distribuição entre Vendedores</Label>
                <div className="space-y-4">
                  {formData.distribuicao.map(d => (
                    <div key={d.vendedorId} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{d.nome}</span>
                        <span className="text-sm font-bold">{d.percentual}%</span>
                      </div>
                      <Slider
                        value={[d.percentual]}
                        onValueChange={(value) => handleDistribuicaoChange(d.vendedorId, value[0])}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                      <div className="text-xs text-muted-foreground text-right">
                        R$ {((formData.valorMeta * d.percentual) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>Total distribuído:</span>
                    <span className={cn(
                      'font-bold',
                      formData.distribuicao.reduce((acc, d) => acc + d.percentual, 0) === 100 
                        ? 'text-green-600' 
                        : 'text-destructive'
                    )}>
                      {formData.distribuicao.reduce((acc, d) => acc + d.percentual, 0)}%
                    </span>
                  </div>
                </div>
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

export default MetasMensais;
