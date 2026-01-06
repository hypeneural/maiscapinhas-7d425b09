import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { lojas, usuarios, turnos } from '@/data/mockData';
import { MoneyInput } from '@/components/MoneyInput';
import { StatusBadge } from '@/components/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { AlertTriangle, CheckCircle, FileCheck } from 'lucide-react';
import { toast } from 'sonner';

const LancarTurno: React.FC = () => {
  const [lojaId, setLojaId] = useState('');
  const [data, setData] = useState('2026-01-06');
  const [turnoSelecionado, setTurnoSelecionado] = useState<'manha' | 'tarde' | 'noite'>('manha');
  const [vendedorId, setVendedorId] = useState('');
  const [valorReal, setValorReal] = useState(0);
  const [justificativa, setJustificativa] = useState('');
  const [justificado, setJustificado] = useState(false);

  // Busca turno existente
  const turnoExistente = turnos.find(
    (t) =>
      t.lojaId === lojaId &&
      t.data === data &&
      t.turno === turnoSelecionado &&
      t.vendedorId === vendedorId
  );

  const valorSistema = turnoExistente?.valorSistema || 0;
  const diferenca = valorReal - valorSistema;
  const temDivergencia = diferenca !== 0;
  const vendedoresLoja = usuarios.filter(
    (u) => u.role === 'vendedor' && u.lojaId === lojaId
  );

  const handleSubmit = () => {
    if (temDivergencia && !justificado) {
      toast.error('Você precisa justificar e marcar como justificado para fechar o turno!');
      return;
    }
    
    if (temDivergencia && !justificativa.trim()) {
      toast.error('Digite uma justificativa para a divergência!');
      return;
    }

    toast.success('Turno validado e fechado com sucesso!');
    // Reset form
    setValorReal(0);
    setJustificativa('');
    setJustificado(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-display font-bold">Lançamento de Turno</h1>
        <p className="text-muted-foreground">
          Compare os valores do sistema com os valores reais do envelope
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Selecionar Turno</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Loja</Label>
            <Select value={lojaId} onValueChange={setLojaId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a loja" />
              </SelectTrigger>
              <SelectContent>
                {lojas.map((loja) => (
                  <SelectItem key={loja.id} value={loja.id}>
                    {loja.codigo} - {loja.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Data</Label>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label>Turno</Label>
            <Select value={turnoSelecionado} onValueChange={(v) => setTurnoSelecionado(v as 'manha' | 'tarde' | 'noite')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manha">Manhã</SelectItem>
                <SelectItem value="tarde">Tarde</SelectItem>
                <SelectItem value="noite">Noite</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Vendedor</Label>
            <Select value={vendedorId} onValueChange={setVendedorId} disabled={!lojaId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {vendedoresLoja.map((vendedor) => (
                  <SelectItem key={vendedor.id} value={vendedor.id}>
                    {vendedor.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Grid de Comparação */}
      {lojaId && vendedorId && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileCheck className="w-5 h-5" />
              Conferência de Valores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Valor Sistema */}
              <div className="space-y-2">
                <Label className="text-muted-foreground">Valor Sistema (Read-only)</Label>
                <div className="h-12 flex items-center justify-end px-4 rounded-md bg-muted text-lg font-mono">
                  R$ {valorSistema.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>

              {/* Valor Real */}
              <div className="space-y-2">
                <Label>Valor Real (Envelope)</Label>
                <MoneyInput
                  value={valorReal}
                  onChange={setValorReal}
                />
              </div>

              {/* Diferença */}
              <div className="space-y-2">
                <Label className="text-muted-foreground">Diferença</Label>
                <div
                  className={`h-12 flex items-center justify-end px-4 rounded-md text-lg font-mono font-bold ${
                    diferenca === 0
                      ? 'bg-success/10 text-success'
                      : 'bg-destructive/10 text-destructive'
                  }`}
                >
                  {diferenca >= 0 ? '+' : ''}R$ {diferenca.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Alerta de Divergência */}
            {temDivergencia && valorReal > 0 && (
              <div className="mt-6 p-4 bg-destructive/5 border border-destructive/20 rounded-lg animate-fade-in">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
                  <div className="flex-1 space-y-4">
                    <div>
                      <p className="font-medium text-destructive">Divergência detectada!</p>
                      <p className="text-sm text-muted-foreground">
                        É necessário justificar a diferença para fechar este turno.
                        Sem justificativa válida, o bônus será cancelado.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Justificativa *</Label>
                      <Textarea
                        value={justificativa}
                        onChange={(e) => setJustificativa(e.target.value)}
                        placeholder="Descreva o motivo da diferença..."
                        rows={3}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="justificado"
                        checked={justificado}
                        onCheckedChange={(checked) => setJustificado(checked as boolean)}
                      />
                      <Label htmlFor="justificado" className="cursor-pointer">
                        Confirmo que esta divergência está justificada e verificada
                      </Label>
                    </div>

                    {!justificado && (
                      <div className="flex items-center gap-2 text-sm text-destructive">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Bônus será <strong>cancelado</strong> se não justificado</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Sucesso sem divergência */}
            {!temDivergencia && valorReal > 0 && (
              <div className="mt-6 p-4 bg-success/5 border border-success/20 rounded-lg animate-fade-in">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <div>
                    <p className="font-medium text-success">Caixa batendo!</p>
                    <p className="text-sm text-muted-foreground">
                      Os valores conferem. Pronto para validar.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Botão de Ação */}
            <div className="mt-6 flex justify-end">
              <Button
                size="lg"
                onClick={handleSubmit}
                disabled={!valorReal}
                className="gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Validar e Fechar Turno
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LancarTurno;
