import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Settings as SettingsIcon, 
  User, 
  Users, 
  Shield, 
  Moon, 
  Sun, 
  History,
  Save,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  Edit,
  Trash2,
  X,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePasswords } from '@/hooks/usePasswords';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  email: string;
  avatar_url?: string;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface PasswordHistory {
  id: string;
  title: string;
  email: string;
  category: { name: string };
  account_type: { name: string };
  created_at: string;
  user_id: string;
  user_email: string;
}

export const Settings = () => {
  const { user, profile, signOut } = useAuth();
  const { passwords } = usePasswords();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [passwordHistory, setPasswordHistory] = useState<PasswordHistory[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingProfile, setEditingProfile] = useState({
    display_name: profile?.display_name || '',
    email: user?.email || '',
    avatar_url: profile?.avatar_url || '',
    password: '',
    confirmPassword: '',
    changePassword: false
  });
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const isAdmin = profile?.is_admin || user?.email === 'contato@techsolutionspro.com.br';

  // Busca apenas usuários ativos e escuta atualizações em tempo real
  // Busca todos os usuários cadastrados (ativos e inativos) para o Admin
  const fetchUsers = useCallback(async () => {
    try {
      if (!user || !isAdmin) {
        setUsers([]);
        return;
      }
      const { data, error, status } = await supabase
        .from('profiles')
        .select('id, user_id, display_name, avatar_url, is_admin, is_active, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error, 'Status:', status);
        let errorMsg = error.message || 'Erro desconhecido.';
        if (status === 401 || errorMsg.includes('permission')) {
          errorMsg = 'Permissão insuficiente para listar usuários. Verifique se o usuário está autenticado como admin.';
        }
        toast({
          title: "Erro",
          description: errorMsg,
          variant: "destructive",
        });
        setUsers([]);
        return;
      }

      // Logging para depuração
      console.log('fetchUsers result:', data);

      const safeData = Array.isArray(data) ? data : [];
      // Adiciona o campo 'email' manualmente usando user_id
      const usersWithEmail = safeData.map(u => ({
        ...u,
        email: u.user_id === user?.id ? user?.email : '' // Para o próprio usuário, usa o e-mail autenticado; para outros, vazio
      }));
      setUsers(usersWithEmail);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível carregar os usuários.",
        variant: "destructive",
      });
      setUsers([]);
    }
  }, [isAdmin, user]);

  // Realtime listener para perfis ativos
  useEffect(() => {
    let subscription: ReturnType<typeof supabase.channel> | null = null;
    if (isAdmin) {
      fetchUsers();
      subscription = supabase
        .channel('public:profiles')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
          fetchUsers();
        })
        .subscribe();
    }
    return () => {
      if (subscription) supabase.removeChannel(subscription);
    };
  }, [isAdmin, fetchUsers]);

  const fetchAllPasswordHistory = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('passwords')
        .select(`
          id,
          title,
          email,
          created_at,
          user_id,
          category:password_categories(name),
          account_type:account_types(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Get user display names for each password from profiles
      const passwordsWithUserEmails = await Promise.all(
        (data || []).map(async (password) => {
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('user_id', password.user_id)
            .single();
          
          return {
            ...password,
            user_email: userProfile?.display_name || 'N/A'
          };
        })
      );

      setPasswordHistory(passwordsWithUserEmails);
    } catch (error) {
      console.error('Error fetching password history:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o histórico de senhas.",
        variant: "destructive",
      });
    }
  }, []);

  const fetchUserPasswordHistory = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('passwords')
        .select(`
          id,
          title,
          email,
          created_at,
          user_id,
          category:password_categories(name),
          account_type:account_types(name)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const passwordsWithUserEmails = (data || []).map(password => ({
        ...password,
        user_email: user?.email || 'N/A'
      }));

      setPasswordHistory(passwordsWithUserEmails);
    } catch (error) {
      console.error('Error fetching user password history:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar seu histórico de senhas.",
        variant: "destructive",
      });
    }
  }, [user?.id, user?.email]);

  useEffect(() => {
    const fetchData = async () => {
      if (isAdmin) {
        await fetchUsers();
        await fetchAllPasswordHistory();
      } else {
        // Busca perfil atualizado do usuário comum
        const { data: updatedProfile, error } = await supabase
          .from('profiles')
          .select('display_name, avatar_url')
          .eq('user_id', user?.id)
          .single();
        if (!error && updatedProfile) {
          setEditingProfile(prev => ({
            ...prev,
            display_name: updatedProfile.display_name,
            email: user?.email || '', // Usa o e-mail do usuário autenticado
            avatar_url: updatedProfile.avatar_url
          }));
        }
        await fetchUserPasswordHistory();
      }
    };

    fetchData();

    // Check current theme
    const currentTheme = localStorage.getItem('theme');
    setIsDarkMode(currentTheme === 'dark');
  }, [isAdmin, fetchUsers, fetchAllPasswordHistory, fetchUserPasswordHistory, user?.id, user?.email]);

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    // Prevent admin from deactivating themselves
    if (userId === user?.id && currentStatus === true) {
      toast({
        title: "Ação não permitida",
        description: "Você não pode desativar sua própria conta de administrador.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('user_id', userId);

      if (error) throw error;

      setUsers(users.map(userItem => 
        userItem.user_id === userId ? { ...userItem, is_active: !currentStatus } : userItem
      ));

      toast({
        title: "Status atualizado",
        description: `Usuário ${!currentStatus ? 'ativado' : 'desativado'} com sucesso.`,
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status do usuário.",
        variant: "destructive",
      });
    }
  };

  const toggleTheme = () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    setIsDarkMode(!isDarkMode);
    localStorage.setItem('theme', newTheme);
    
    // Apply theme to document
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    toast({
      title: "Tema alterado",
      description: `Tema alterado para ${newTheme === 'dark' ? 'escuro' : 'claro'}.`,
    });
  };

  const updateProfile = async () => {
    setIsLoading(true);
    try {
      // Update profile in profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          display_name: editingProfile.display_name,
          avatar_url: editingProfile.avatar_url
        })
        .eq('user_id', user?.id);

      if (profileError) throw profileError;

      // Update email if changed
      if (editingProfile.email !== user?.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: editingProfile.email
        });
        if (emailError) throw emailError;
      }

      // Update password if provided
      if (editingProfile.password && editingProfile.password.length > 0) {
        if (editingProfile.password !== editingProfile.confirmPassword) {
          throw new Error('As senhas não coincidem');
        }
        if (editingProfile.password.length < 6) {
          throw new Error('A senha deve ter pelo menos 6 caracteres');
        }
        const { error: passwordError } = await supabase.auth.updateUser({
          password: editingProfile.password
        });
        if (passwordError) throw passwordError;
      }

      // Atualiza imediatamente o estado do usuário no front-end
      setEditingProfile(prev => ({
        ...prev,
        display_name: editingProfile.display_name,
        email: editingProfile.email,
        avatar_url: editingProfile.avatar_url,
        password: '',
        confirmPassword: ''
      }));
      setShowPasswordFields(false);

      // Atualiza o profile local se possível
      if (profile) {
        profile.display_name = editingProfile.display_name;
        profile.avatar_url = editingProfile.avatar_url;
      }
      if (user) {
        user.email = editingProfile.email;
      }

      // Persiste e recarrega os dados do usuário após atualização
      if (isAdmin) {
        await fetchUsers();
      } else {
        // Para usuário comum, busca o próprio perfil atualizado
        const { data: updatedProfile, error } = await supabase
          .from('profiles')
          .select('display_name, avatar_url')
          .eq('user_id', user?.id)
          .single();
        if (!error && updatedProfile) {
          setEditingProfile(prev => ({
            ...prev,
            display_name: updatedProfile.display_name,
            avatar_url: updatedProfile.avatar_url
          }));
        }
      }

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso.",
      });

    } catch (error: unknown) {
      console.error('Error updating profile:', error);
      const errorMessage = error instanceof Error ? error.message : "Não foi possível atualizar o perfil.";
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserProfile = async (userId: string, profileData: Partial<UserProfile>) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('user_id', userId);

      if (error) throw error;

      setUsers(users.map(userItem => 
        userItem.user_id === userId ? { ...userItem, ...profileData } : userItem
      ));

      toast({
        title: "Perfil atualizado",
        description: "Perfil do usuário atualizado com sucesso.",
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o perfil do usuário.",
        variant: "destructive",
      });
    }
  };

  const handleEditUser = (userItem: UserProfile) => {
    setEditingUser(userItem);
    setIsEditingUser(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    setIsLoading(true);
    try {
      // Update profile
      await updateUserProfile(editingUser.user_id, {
        display_name: editingUser.display_name,
        avatar_url: editingUser.avatar_url,
        is_admin: editingUser.is_admin,
        is_active: editingUser.is_active
      });

      setIsEditingUser(false);
      setEditingUser(null);
      fetchUsers(); // Refresh users list
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o usuário.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    // Prevent admin from deleting themselves
    if (userId === user?.id) {
      toast({
        title: "Ação não permitida",
        description: "Você não pode remover sua própria conta.",
        variant: "destructive",
      });
      return;
    }

    if (window.confirm(`Tem certeza que deseja remover o usuário "${userName}"? Esta ação não pode ser desfeita.`)) {
      try {
        // First, delete user's passwords
        const { error: passwordsError } = await supabase
          .from('passwords')
          .delete()
          .eq('user_id', userId);

        if (passwordsError) throw passwordsError;

        // Then delete user profile
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('user_id', userId);

        if (profileError) throw profileError;

        // Finally, delete user from auth (requires admin privileges)
        const { error: authError } = await supabase.auth.admin.deleteUser(userId);
        
        if (authError) {
          console.warn('Could not delete user from auth:', authError);
          // Continue anyway, as profile deletion is more important
        }

        // Update local state
        setUsers(users.filter(userItem => userItem.user_id !== userId));

        toast({
          title: "Usuário removido",
          description: `Usuário "${userName}" foi removido com sucesso.`,
        });
      } catch (error) {
        console.error('Error deleting user:', error);
        toast({
          title: "Erro",
          description: "Não foi possível remover o usuário.",
          variant: "destructive",
        });
      }
    }
  };

  // Função para editar perfil próprio
  const handleEditProfile = () => {
    setEditingProfile({
      display_name: profile?.display_name || '',
      email: user?.email || '',
      avatar_url: profile?.avatar_url || '',
      password: '',
      confirmPassword: '',
      changePassword: false
    });
    setIsEditingProfile(true);
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-center gap-3 mb-6">
          <SettingsIcon className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Configurações</h1>
          {isAdmin && (
            <Badge variant="secondary" className="ml-2">
              <Shield className="w-3 h-3 mr-1" />
              Admin
            </Badge>
          )}
          <Button
            variant="outline"
            className="ml-auto flex items-center gap-2"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para o Dashboard
          </Button>
        </div>

        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <TabsTrigger value="account">Conta</TabsTrigger>
            <TabsTrigger value="theme">Tema</TabsTrigger>
            {isAdmin && <TabsTrigger value="users">Usuários</TabsTrigger>}
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          {/* Account Settings */}
          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações da Conta</CardTitle>
                <CardDescription>
                  Gerencie suas informações pessoais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={editingProfile.avatar_url} />
                    <AvatarFallback className="text-lg">
                      {getInitials(editingProfile.display_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Label htmlFor="display_name">Nome de Exibição</Label>
                    <Input
                      id="display_name"
                      value={editingProfile.display_name}
                      onChange={(e) => setEditingProfile({
                        ...editingProfile,
                        display_name: e.target.value
                      })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editingProfile.email}
                    onChange={(e) => setEditingProfile({
                      ...editingProfile,
                      email: e.target.value
                    })}
                  />
                </div>

                <div>
                  <Label htmlFor="avatar_url">URL do Avatar</Label>
                  <Input
                    id="avatar_url"
                    value={editingProfile.avatar_url}
                    onChange={(e) => setEditingProfile({
                      ...editingProfile,
                      avatar_url: e.target.value
                    })}
                    placeholder="https://exemplo.com/avatar.jpg"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="show-password"
                      checked={showPasswordFields}
                      onChange={(e) => setShowPasswordFields(e.target.checked)}
                    />
                    <Label htmlFor="show-password">Alterar senha</Label>
                  </div>

                  {showPasswordFields && (
                    <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                      <div>
                        <Label htmlFor="password">Nova senha</Label>
                        <Input
                          id="password"
                          type="password"
                          value={editingProfile.password}
                          onChange={(e) => setEditingProfile({
                            ...editingProfile,
                            password: e.target.value
                          })}
                          placeholder="Digite a nova senha"
                        />
                      </div>
                      <div>
                        <Label htmlFor="confirm-password">Confirmar senha</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          value={editingProfile.confirmPassword}
                          onChange={(e) => setEditingProfile({
                            ...editingProfile,
                            confirmPassword: e.target.value
                          })}
                          placeholder="Confirme a nova senha"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4">
                  <Button 
                    onClick={updateProfile}
                    disabled={isLoading}
                    className="flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Theme Settings */}
          <TabsContent value="theme" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Tema</CardTitle>
                <CardDescription>
                  Personalize a aparência do aplicativo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isDarkMode ? (
                      <Moon className="w-5 h-5" />
                    ) : (
                      <Sun className="w-5 h-5" />
                    )}
                    <div>
                      <Label htmlFor="theme-toggle">Modo Escuro</Label>
                      <p className="text-sm text-muted-foreground">
                        {isDarkMode ? 'Desativar' : 'Ativar'} o modo escuro
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="theme-toggle"
                    checked={isDarkMode}
                    onCheckedChange={toggleTheme}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Management (Admin Only) */}
          {isAdmin && (
            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Gerenciamento de Usuários</CardTitle>
                  <CardDescription>
                    Monitore e gerencie todos os usuários cadastrados no sistema em tempo real
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {users.map((userItem) => (
                      <div key={userItem.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={userItem.avatar_url} />
                            <AvatarFallback>
                              {getInitials(userItem.display_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{userItem.display_name}</p>
                            <p className="text-sm text-muted-foreground">{userItem.email}</p>
                            <div className="flex gap-2 mt-1">
                              <Badge variant={userItem.is_admin ? "secondary" : "default"}>{userItem.is_admin ? "Admin" : "Usuário Comum"}</Badge>
                              <Badge variant={userItem.is_active ? "default" : "destructive"}>
                                {userItem.is_active ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditUser(userItem)}
                            title="Editar usuário"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleUserStatus(userItem.user_id, userItem.is_active)}
                            title={userItem.is_active ? "Desativar usuário" : "Ativar usuário"}
                            disabled={userItem.user_id === user?.id && userItem.is_admin}
                          >
                            {userItem.is_active ? (
                              <UserX className="w-4 h-4" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(userItem.user_id, userItem.display_name)}
                            title="Remover usuário"
                            className="hover:bg-destructive hover:text-destructive-foreground"
                            disabled={userItem.user_id === user?.id && userItem.is_admin}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {users.length === 0 && (
                      <div className="text-center py-8">
                        <Users className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">Nenhum usuário cadastrado encontrado</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Password History */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Senhas</CardTitle>
                <CardDescription>
                  {isAdmin 
                    ? 'Visualize o histórico de senhas de todos os usuários'
                    : 'Visualize seu histórico de senhas cadastradas'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {passwordHistory.map((password) => (
                    <div key={password.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{password.title}</p>
                        <p className="text-sm text-muted-foreground">{password.email}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline">{password.category.name}</Badge>
                          <Badge variant="secondary">{password.account_type.name}</Badge>
                          {isAdmin && (
                            <Badge variant="default">{password.user_email}</Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {new Date(password.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {passwordHistory.length === 0 && (
                    <div className="text-center py-8">
                      <History className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">Nenhuma senha encontrada no histórico</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog para editar usuário */}
      <Dialog open={isEditingUser} onOpenChange={setIsEditingUser}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Edite as informações do usuário selecionado.
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-username">Nome de usuário</Label>
                <Input
                  id="edit-username"
                  value={editingUser.display_name || ''}
                  onChange={(e) => setEditingUser({
                    ...editingUser,
                    display_name: e.target.value
                  })}
                  placeholder="Digite o nome de usuário"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingUser.email || ''}
                  onChange={(e) => setEditingUser({
                    ...editingUser,
                    email: e.target.value
                  })}
                  placeholder="Digite o email"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-is-admin">Tipo de usuário</Label>
                <Select
                  value={editingUser.is_admin ? 'admin' : 'common'}
                  onValueChange={(value) => setEditingUser({
                    ...editingUser,
                    is_admin: value === 'admin'
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="common">Usuário Comum</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-is-active">Status</Label>
                <Select
                  value={editingUser.is_active ? 'active' : 'inactive'}
                  onValueChange={(value) => setEditingUser({
                    ...editingUser,
                    is_active: value === 'active'
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditingUser(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleUpdateUser}>
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para editar perfil */}
      <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Perfil</DialogTitle>
            <DialogDescription>
              Edite suas informações pessoais.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="profile-username">Nome de usuário</Label>
              <Input
                id="profile-username"
                value={editingProfile.display_name || ''}
                onChange={(e) => setEditingProfile({
                  ...editingProfile,
                  display_name: e.target.value
                })}
                placeholder="Digite o nome de usuário"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="profile-email">Email</Label>
              <Input
                id="profile-email"
                type="email"
                value={editingProfile.email || ''}
                onChange={(e) => setEditingProfile({
                  ...editingProfile,
                  email: e.target.value
                })}
                placeholder="Digite o email"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="change-password"
                checked={editingProfile.changePassword}
                onChange={(e) => setEditingProfile({
                  ...editingProfile,
                  changePassword: e.target.checked,
                  password: e.target.checked ? editingProfile.password : '',
                  confirmPassword: e.target.checked ? editingProfile.confirmPassword : ''
                })}
              />
              <Label htmlFor="change-password">Alterar senha</Label>
            </div>
            {editingProfile.changePassword && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="profile-password">Nova senha</Label>
                  <Input
                    id="profile-password"
                    type="password"
                    value={editingProfile.password || ''}
                    onChange={(e) => setEditingProfile({
                      ...editingProfile,
                      password: e.target.value
                    })}
                    placeholder="Digite a nova senha"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="profile-confirm-password">Confirmar nova senha</Label>
                  <Input
                    id="profile-confirm-password"
                    type="password"
                    value={editingProfile.confirmPassword || ''}
                    onChange={(e) => setEditingProfile({
                      ...editingProfile,
                      confirmPassword: e.target.value
                    })}
                    placeholder="Confirme a nova senha"
                  />
                </div>
              </>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditingProfile(false)}
            >
              Cancelar
            </Button>
            <Button onClick={updateProfile}>
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
