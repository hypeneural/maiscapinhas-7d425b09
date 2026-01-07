import React, { useState } from 'react';
import { Users, Store, Plus, Pencil, Trash2, Save, X, Search, UserCheck, UserX, MapPin, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { usuarios as initialUsuarios, lojas as initialLojas } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { User, Loja, UserRole } from '@/types';

const UsuariosLojas: React.FC = () => {
  const { toast } = useToast();
  const [usuarios, setUsuarios] = useState<User[]>(initialUsuarios);
  const [lojas, setLojas] = useState<Loja[]>(initialLojas);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('usuarios');
  
  // Dialog states
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isLojaDialogOpen, setIsLojaDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingLoja, setEditingLoja] = useState<Loja | null>(null);

  // Form states
  const [userForm, setUserForm] = useState({
    nome: '',
    email: '',
    role: 'vendedor' as UserRole,
    lojaId: '',
    dataNascimento: '',
    ativo: true,
  });

  const [lojaForm, setLojaForm] = useState({
    nome: '',
    codigo: '',
    endereco: '',
    metaMensal: 0,
    ativo: true,
  });

  const roleLabels: Record<UserRole, string> = {
    admin: 'Administrador',
    gerente: 'Gerente',
    conferente: 'Conferente',
    vendedor: 'Vendedor',
  };

  const getRoleColor = (role: UserRole): 'success' | 'warning' | 'error' | 'default' => {
    switch (role) {
      case 'admin': return 'error';
      case 'gerente': return 'warning';
      case 'conferente': return 'success';
      default: return 'default';
    }
  };

  // Usuários
  const filteredUsuarios = usuarios.filter(u =>
    u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveUser = () => {
    if (!userForm.nome || !userForm.email || !userForm.lojaId) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    if (editingUser) {
      setUsuarios(prev => prev.map(u => 
        u.id === editingUser.id 
          ? { ...u, ...userForm }
          : u
      ));
      toast({ title: 'Usuário atualizado com sucesso!' });
    } else {
      const novoUser: User = {
        id: String(Date.now()),
        avatar: '',
        ...userForm,
      };
      setUsuarios(prev => [...prev, novoUser]);
      toast({ title: 'Usuário criado com sucesso!' });
    }

    setIsUserDialogOpen(false);
    setEditingUser(null);
    resetUserForm();
  };

  const resetUserForm = () => {
    setUserForm({
      nome: '',
      email: '',
      role: 'vendedor',
      lojaId: '',
      dataNascimento: '',
      ativo: true,
    });
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm({
      nome: user.nome,
      email: user.email,
      role: user.role,
      lojaId: user.lojaId,
      dataNascimento: user.dataNascimento,
      ativo: user.ativo,
    });
    setIsUserDialogOpen(true);
  };

  const handleDeleteUser = (id: string) => {
    setUsuarios(prev => prev.filter(u => u.id !== id));
    toast({ title: 'Usuário removido com sucesso!' });
  };

  const handleToggleUserAtivo = (id: string) => {
    setUsuarios(prev => prev.map(u => 
      u.id === id ? { ...u, ativo: !u.ativo } : u
    ));
  };

  // Lojas
  const filteredLojas = lojas.filter(l =>
    l.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveLoja = () => {
    if (!lojaForm.nome || !lojaForm.codigo) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    if (editingLoja) {
      setLojas(prev => prev.map(l => 
        l.id === editingLoja.id 
          ? { ...l, ...lojaForm }
          : l
      ));
      toast({ title: 'Loja atualizada com sucesso!' });
    } else {
      const novaLoja: Loja = {
        id: String(Date.now()),
        ...lojaForm,
      };
      setLojas(prev => [...prev, novaLoja]);
      toast({ title: 'Loja criada com sucesso!' });
    }

    setIsLojaDialogOpen(false);
    setEditingLoja(null);
    resetLojaForm();
  };

  const resetLojaForm = () => {
    setLojaForm({
      nome: '',
      codigo: '',
      endereco: '',
      metaMensal: 0,
      ativo: true,
    });
  };

  const handleEditLoja = (loja: Loja) => {
    setEditingLoja(loja);
    setLojaForm({
      nome: loja.nome,
      codigo: loja.codigo,
      endereco: loja.endereco,
      metaMensal: loja.metaMensal,
      ativo: loja.ativo,
    });
    setIsLojaDialogOpen(true);
  };

  const handleDeleteLoja = (id: string) => {
    // Verificar se há usuários vinculados
    const usuariosVinculados = usuarios.filter(u => u.lojaId === id);
    if (usuariosVinculados.length > 0) {
      toast({
        title: 'Erro',
        description: 'Não é possível remover uma loja com usuários vinculados',
        variant: 'destructive',
      });
      return;
    }
    setLojas(prev => prev.filter(l => l.id !== id));
    toast({ title: 'Loja removida com sucesso!' });
  };

  const handleToggleLojaAtivo = (id: string) => {
    setLojas(prev => prev.map(l => 
      l.id === id ? { ...l, ativo: !l.ativo } : l
    ));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Usuários & Lojas"
        description="Gerencie os usuários do sistema e as unidades da rede"
        icon={Users}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <TabsList>
            <TabsTrigger value="usuarios" className="gap-2">
              <Users className="w-4 h-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="lojas" className="gap-2">
              <Store className="w-4 h-4" />
              Lojas
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            {activeTab === 'usuarios' ? (
              <Button onClick={() => { setEditingUser(null); resetUserForm(); setIsUserDialogOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Usuário
              </Button>
            ) : (
              <Button onClick={() => { setEditingLoja(null); resetLojaForm(); setIsLojaDialogOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Loja
              </Button>
            )}
          </div>
        </div>

        <TabsContent value="usuarios" className="mt-0">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left py-3 px-4 font-semibold">Status</th>
                      <th className="text-left py-3 px-4 font-semibold">Nome</th>
                      <th className="text-left py-3 px-4 font-semibold">Email</th>
                      <th className="text-left py-3 px-4 font-semibold">Perfil</th>
                      <th className="text-left py-3 px-4 font-semibold">Loja</th>
                      <th className="text-left py-3 px-4 font-semibold">Aniversário</th>
                      <th className="text-center py-3 px-4 font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsuarios.map((user) => {
                      const loja = lojas.find(l => l.id === user.lojaId);
                      return (
                        <tr 
                          key={user.id} 
                          className={cn(
                            'border-b transition-colors hover:bg-muted/50',
                            !user.ativo && 'opacity-60'
                          )}
                        >
                          <td className="py-3 px-4">
                            <Switch
                              checked={user.ativo}
                              onCheckedChange={() => handleToggleUserAtivo(user.id)}
                            />
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                'w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium',
                                user.ativo ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                              )}>
                                {user.nome.charAt(0)}
                              </div>
                              <span className="font-medium">{user.nome}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">{user.email}</td>
                          <td className="py-3 px-4">
                            <StatusBadge variant={getRoleColor(user.role)}>
                              {roleLabels[user.role]}
                            </StatusBadge>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">{loja?.nome}</td>
                          <td className="py-3 px-4 text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(user.dataNascimento), 'dd/MM', { locale: ptBR })}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex justify-center gap-1">
                              <Button variant="ghost" size="icon" onClick={() => handleEditUser(user)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.id)}>
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filteredUsuarios.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  Nenhum usuário encontrado.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lojas" className="mt-0">
          <div className="grid gap-4">
            {filteredLojas.map(loja => {
              const vendedoresLoja = usuarios.filter(u => u.lojaId === loja.id && u.role === 'vendedor');
              
              return (
                <Card 
                  key={loja.id}
                  className={cn(
                    'hover:shadow-md transition-shadow',
                    !loja.ativo && 'opacity-60'
                  )}
                >
                  <CardContent className="pt-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          'p-3 rounded-lg',
                          loja.ativo ? 'bg-primary/10' : 'bg-muted'
                        )}>
                          <Store className={cn(
                            'w-6 h-6',
                            loja.ativo ? 'text-primary' : 'text-muted-foreground'
                          )} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{loja.nome}</h3>
                            <StatusBadge variant={loja.ativo ? 'success' : 'default'}>
                              {loja.ativo ? 'Ativa' : 'Inativa'}
                            </StatusBadge>
                          </div>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {loja.endereco}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Código: {loja.codigo}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Meta Mensal</p>
                          <p className="font-bold text-lg">
                            R$ {loja.metaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>

                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Vendedores</p>
                          <p className="font-bold text-lg">{vendedoresLoja.length}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Switch
                            checked={loja.ativo}
                            onCheckedChange={() => handleToggleLojaAtivo(loja.id)}
                          />
                        </div>

                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEditLoja(loja)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteLoja(loja.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {filteredLojas.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Store className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium">Nenhuma loja encontrada</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog de Usuário */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Nome Completo</Label>
              <Input
                placeholder="Nome do usuário"
                value={userForm.nome}
                onChange={(e) => setUserForm(prev => ({ ...prev, nome: e.target.value }))}
              />
            </div>

            <div>
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="email@exemplo.com"
                value={userForm.email}
                onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Perfil</Label>
                <Select 
                  value={userForm.role} 
                  onValueChange={(v: UserRole) => setUserForm(prev => ({ ...prev, role: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="gerente">Gerente</SelectItem>
                    <SelectItem value="conferente">Conferente</SelectItem>
                    <SelectItem value="vendedor">Vendedor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Loja</Label>
                <Select 
                  value={userForm.lojaId} 
                  onValueChange={(v) => setUserForm(prev => ({ ...prev, lojaId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {lojas.map(loja => (
                      <SelectItem key={loja.id} value={loja.id}>{loja.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Data de Nascimento</Label>
              <Input
                type="date"
                value={userForm.dataNascimento}
                onChange={(e) => setUserForm(prev => ({ ...prev, dataNascimento: e.target.value }))}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <Label className="text-base">Usuário Ativo</Label>
                <p className="text-sm text-muted-foreground">Pode acessar o sistema</p>
              </div>
              <Switch
                checked={userForm.ativo}
                onCheckedChange={(checked) => setUserForm(prev => ({ ...prev, ativo: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUserDialogOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSaveUser}>
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Loja */}
      <Dialog open={isLojaDialogOpen} onOpenChange={setIsLojaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingLoja ? 'Editar Loja' : 'Nova Loja'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Nome da Loja</Label>
              <Input
                placeholder="Ex: Mais Capinhas - Shopping"
                value={lojaForm.nome}
                onChange={(e) => setLojaForm(prev => ({ ...prev, nome: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Código</Label>
                <Input
                  placeholder="Ex: MC001"
                  value={lojaForm.codigo}
                  onChange={(e) => setLojaForm(prev => ({ ...prev, codigo: e.target.value }))}
                />
              </div>

              <div>
                <Label>Meta Mensal (R$)</Label>
                <Input
                  type="number"
                  placeholder="0,00"
                  value={lojaForm.metaMensal || ''}
                  onChange={(e) => setLojaForm(prev => ({ ...prev, metaMensal: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div>
              <Label>Endereço</Label>
              <Input
                placeholder="Endereço completo da loja"
                value={lojaForm.endereco}
                onChange={(e) => setLojaForm(prev => ({ ...prev, endereco: e.target.value }))}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <Label className="text-base">Loja Ativa</Label>
                <p className="text-sm text-muted-foreground">Aparece nas opções do sistema</p>
              </div>
              <Switch
                checked={lojaForm.ativo}
                onCheckedChange={(checked) => setLojaForm(prev => ({ ...prev, ativo: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLojaDialogOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSaveLoja}>
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsuariosLojas;
