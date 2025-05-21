
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUserSwitcher } from '@/context/UserSwitcherContext';
import { RefreshCw, UserPlus, X, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ImageUpload from '@/components/ImageUpload';

// Mock de dados de usuários
const mockUsers = [
  { id: 1, name: 'João Silva', email: 'joao@email.com', role: 'waiter', status: 'active', photo_url: '' },
  { id: 2, name: 'Maria Souza', email: 'maria@email.com', role: 'chef', status: 'active', photo_url: '' },
  { id: 3, name: 'Carlos Pereira', email: 'carlos@email.com', role: 'customer', status: 'active', photo_url: '' },
  { id: 4, name: 'Ana Oliveira', email: 'ana@email.com', role: 'waiter', status: 'inactive', photo_url: '' },
];

// Mock de usuários extras que podem ser "descobertos" ao atualizar
const extraUsers = [
  { id: 5, name: 'Roberto Alves', email: 'roberto@email.com', role: 'customer', status: 'active', photo_url: '' },
  { id: 6, name: 'Fernanda Lima', email: 'fernanda@email.com', role: 'chef', status: 'active', photo_url: '' },
];

const UserManagement = () => {
  const { currentUser } = useUserSwitcher();
  const [users, setUsers] = useState(mockUsers);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [extraUsersAdded, setExtraUsersAdded] = useState(false);
  const navigate = useNavigate();
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [currentUser2Edit, setCurrentUser2Edit] = useState<any>(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'customer',
    status: 'active',
    photo_url: ''
  });
  
  const isAdminOrOwner = currentUser?.role === 'admin' || currentUser?.role === 'restaurant_owner';

  useEffect(() => {
    // Carregar usuários do localStorage se existirem
    const storedUsers = localStorage.getItem('appUsers');
    if (storedUsers) {
      try {
        setUsers(JSON.parse(storedUsers));
      } catch (error) {
        console.error('Erro ao carregar usuários:', error);
      }
    }
    
    // Se temos Supabase conectado, buscar usuários de lá também
    fetchUsersFromSupabase();
  }, []);
  
  const fetchUsersFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*');
        
      if (error) {
        console.error('Erro ao buscar usuários do Supabase:', error);
        return;
      }
      
      if (data && data.length > 0) {
        // Transformar dados do Supabase para o formato esperado pela UI
        const supabaseUsers = data.map(user => ({
          id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          email: user.email,
          role: user.role,
          status: 'active',  // Assumindo que todos estão ativos por padrão
          photo_url: user.photo_url || ''
        }));
        
        setUsers(supabaseUsers);
        localStorage.setItem('appUsers', JSON.stringify(supabaseUsers));
      }
    } catch (error) {
      console.error('Erro ao processar dados do Supabase:', error);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    
    // Simular uma requisição para atualizar os usuários
    setTimeout(() => {
      if (!extraUsersAdded) {
        // Adicionar usuários extras apenas na primeira atualização
        const updatedUsers = [...users, ...extraUsers];
        setUsers(updatedUsers);
        setExtraUsersAdded(true);
        
        // Salvar no localStorage para persistência
        localStorage.setItem('appUsers', JSON.stringify(updatedUsers));
        
        toast({
          title: "Lista de usuários atualizada",
          description: "Foram encontrados 2 novos usuários no sistema."
        });
      } else {
        toast({
          title: "Lista de usuários atualizada",
          description: "Nenhum novo usuário encontrado."
        });
      }
      
      setIsRefreshing(false);
    }, 800);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (isEditUserOpen) {
      setCurrentUser2Edit(prev => ({ ...prev, [name]: value }));
    } else {
      setNewUser(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleRoleChange = (value) => {
    if (isEditUserOpen) {
      setCurrentUser2Edit(prev => ({ ...prev, role: value }));
    } else {
      setNewUser(prev => ({ ...prev, role: value }));
    }
  };
  
  const handleStatusChange = (value) => {
    if (isEditUserOpen) {
      setCurrentUser2Edit(prev => ({ ...prev, status: value }));
    } else {
      setNewUser(prev => ({ ...prev, status: value }));
    }
  };
  
  const handleImageUpload = (url: string) => {
    if (isEditUserOpen) {
      setCurrentUser2Edit(prev => ({ ...prev, photo_url: url }));
    } else {
      setNewUser(prev => ({ ...prev, photo_url: url }));
    }
  };
  
  const handleEditUser = (user) => {
    setCurrentUser2Edit(user);
    setIsEditUserOpen(true);
  };
  
  const handleSaveEditUser = async () => {
    if (!currentUser2Edit) return;
    
    try {
      // Tentar atualizar no Supabase
      const nameParts = currentUser2Edit.name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      const { error } = await supabase
        .from('users')
        .update({
          first_name: firstName,
          last_name: lastName,
          email: currentUser2Edit.email,
          role: currentUser2Edit.role,
          photo_url: currentUser2Edit.photo_url
          // Removemos 'status' aqui, já que não faz parte do tipo
        })
        .eq('id', currentUser2Edit.id);
        
      if (error) {
        console.error('Erro ao atualizar usuário no Supabase:', error);
        // Continuar com fallback para localStorage
      } else {
        toast({
          title: "Usuário atualizado com sucesso",
          description: `${currentUser2Edit.name} foi atualizado.`
        });
        
        fetchUsersFromSupabase();
        setIsEditUserOpen(false);
        setCurrentUser2Edit(null);
        return;
      }
    } catch (error) {
      console.error('Erro ao processar atualização de usuário:', error);
    }
    
    // Fallback para localStorage
    const updatedUsers = users.map(user => 
      user.id === currentUser2Edit.id ? currentUser2Edit : user
    );
    
    setUsers(updatedUsers);
    localStorage.setItem('appUsers', JSON.stringify(updatedUsers));
    
    toast({
      title: "Usuário atualizado com sucesso",
      description: `${currentUser2Edit.name} foi atualizado.`
    });
    
    setIsEditUserOpen(false);
    setCurrentUser2Edit(null);
  };
  
  const handleAddUser = async () => {
    // Validação básica
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }
    
    // Tente adicionar ao Supabase primeiro
    try {
      // Dividir nome e sobrenome
      const nameParts = newUser.name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            first_name: firstName,
            last_name: lastName,
            email: newUser.email,
            password: newUser.password, // Nota: em um sistema real, a senha seria hasheada
            role: newUser.role,
            username: newUser.email, // Usando email como username por padrão
            photo_url: newUser.photo_url
            // Removemos 'status' aqui, já que não faz parte do tipo
          }
        ])
        .select();
        
      if (error) {
        console.error('Erro ao adicionar usuário ao Supabase:', error);
        // Continua com o fallback para localStorage
      } else if (data) {
        toast({
          title: "Usuário adicionado com sucesso",
          description: `${newUser.name} foi adicionado ao sistema.`
        });
        
        // Atualizar a lista de usuários
        fetchUsersFromSupabase();
        setIsAddUserOpen(false);
        setNewUser({
          name: '',
          email: '',
          password: '',
          role: 'customer',
          status: 'active',
          photo_url: ''
        });
        return;
      }
    } catch (error) {
      console.error('Erro ao processar adição de usuário:', error);
    }
    
    // Fallback para localStorage se o Supabase falhar
    const newId = Math.max(...users.map(u => u.id), 0) + 1;
    const userToAdd = {
      id: newId,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      status: newUser.status,
      photo_url: newUser.photo_url
    };
    
    const updatedUsers = [...users, userToAdd];
    setUsers(updatedUsers);
    localStorage.setItem('appUsers', JSON.stringify(updatedUsers));
    
    toast({
      title: "Usuário adicionado com sucesso",
      description: `${newUser.name} foi adicionado ao sistema.`
    });
    
    // Limpar o formulário e fechar o modal
    setIsAddUserOpen(false);
    setNewUser({
      name: '',
      email: '',
      password: '',
      role: 'customer',
      status: 'active',
      photo_url: ''
    });
  };
  
  const toggleUserStatus = (userId) => {
    const updatedUsers = users.map(user => {
      if (user.id === userId) {
        const newStatus = user.status === 'active' ? 'inactive' : 'active';
        return { ...user, status: newStatus };
      }
      return user;
    });
    
    setUsers(updatedUsers);
    localStorage.setItem('appUsers', JSON.stringify(updatedUsers));
    
    const user = users.find(u => u.id === userId);
    const newStatus = user?.status === 'active' ? 'inactive' : 'active';
    
    toast({
      title: "Status atualizado",
      description: `${user?.name} agora está ${newStatus === 'active' ? 'ativo' : 'inativo'}.`
    });
    
    // Tentar atualizar no Supabase também
    try {
      // Como não podemos atualizar o campo 'status' diretamente, atualizamos apenas o que é permitido
      // e usamos outra forma para rastrear o status do usuário internamente
      supabase
        .from('users')
        .update({ 
          // Não temos campo status na tabela, então não atualizamos nada
          // Podemos criar uma tabela separada para rastrear status ou usar outra abordagem
        })
        .eq('id', userId)
        .then(({ error }) => {
          if (error) {
            console.error('Erro ao atualizar status no Supabase:', error);
          }
        });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  if (!isAdminOrOwner) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="container mx-auto px-4 py-8">
          <Card className="w-full max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Acesso restrito</CardTitle>
              <CardDescription>
                Você não tem permissão para acessar esta página
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">
                Esta página é destinada apenas para administradores ou proprietários do restaurante.
              </p>
              <Button className="mt-4" onClick={() => navigate('/')}>
                Voltar para o início
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Gerenciamento de Usuários</h1>
            <Button 
              size="icon"
              variant="outline"
              onClick={handleRefresh}
              className="rounded-full h-8 w-8"
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setIsAddUserOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" /> Adicionar Usuário
            </Button>
            <Button variant="outline" onClick={() => navigate('/')}>
              Voltar para o menu
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <Card key={user.id}>
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user.photo_url} alt={user.name} />
                  <AvatarFallback className="bg-menu-primary text-white">
                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-base">{user.name}</CardTitle>
                  <CardDescription className="text-xs">{user.email}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Função:</span>
                    <span className="font-medium">{
                      user.role === 'admin' ? 'Administrador' :
                      user.role === 'restaurant_owner' ? 'Proprietário' :
                      user.role === 'waiter' ? 'Garçom' :
                      user.role === 'chef' ? 'Chef' : 'Cliente'
                    }</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status:</span>
                    <span className={`font-medium ${user.status === 'active' ? 'text-green-500' : 'text-red-500'}`}>
                      {user.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 space-y-2">
                  <Button 
                    className="w-full" 
                    variant={user.status === 'active' ? 'default' : 'outline'}
                    onClick={() => toggleUserStatus(user.id)}
                  >
                    {user.status === 'active' ? 'Desativar' : 'Ativar'}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handleEditUser(user)}
                  >
                    Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      {/* Modal de Adicionar Usuário */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Usuário</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="photo_url">Foto de Perfil</Label>
              <ImageUpload
                onImageUpload={handleImageUpload}
                value={newUser.photo_url}
                label="Selecionar foto de perfil"
                maxSizeInMB={2}
                acceptedFileTypes="image/*"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                name="name"
                value={newUser.name}
                onChange={handleInputChange}
                placeholder="Digite o nome completo"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={newUser.email}
                onChange={handleInputChange}
                placeholder="email@exemplo.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={newUser.password}
                onChange={handleInputChange}
                placeholder="Digite a senha"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Função</Label>
              <Select value={newUser.role} onValueChange={handleRoleChange}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Selecione a função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="restaurant_owner">Proprietário</SelectItem>
                  <SelectItem value="chef">Chef</SelectItem>
                  <SelectItem value="waiter">Garçom</SelectItem>
                  <SelectItem value="customer">Cliente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select value={newUser.status} onValueChange={handleStatusChange}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddUserOpen(false)} type="button">Cancelar</Button>
            <Button onClick={handleAddUser} type="button">Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal de Editar Usuário */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          {currentUser2Edit && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit_photo_url">Foto de Perfil</Label>
                <ImageUpload
                  onImageUpload={handleImageUpload}
                  value={currentUser2Edit.photo_url}
                  label="Selecionar foto de perfil"
                  maxSizeInMB={2}
                  acceptedFileTypes="image/*"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_name">Nome Completo</Label>
                <Input
                  id="edit_name"
                  name="name"
                  value={currentUser2Edit.name}
                  onChange={handleInputChange}
                  placeholder="Digite o nome completo"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_email">Email</Label>
                <Input
                  id="edit_email"
                  name="email"
                  type="email"
                  value={currentUser2Edit.email}
                  onChange={handleInputChange}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_role">Função</Label>
                <Select value={currentUser2Edit.role} onValueChange={handleRoleChange}>
                  <SelectTrigger id="edit_role">
                    <SelectValue placeholder="Selecione a função" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="restaurant_owner">Proprietário</SelectItem>
                    <SelectItem value="chef">Chef</SelectItem>
                    <SelectItem value="waiter">Garçom</SelectItem>
                    <SelectItem value="customer">Cliente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_status">Status</Label>
                <Select value={currentUser2Edit.status} onValueChange={handleStatusChange}>
                  <SelectTrigger id="edit_status">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditUserOpen(false)} type="button">Cancelar</Button>
            <Button onClick={handleSaveEditUser} type="button">Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
