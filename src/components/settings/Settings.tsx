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
import { UserManagementTab } from './UserManagementTab';
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
  ArrowLeft,
  Search,
  Clock,
  Filter
} from 'lucide-react';
import { ImageUpload } from '@/components/ui/image-upload';
import { useAuth } from '@/hooks/useAuth';
import { usePasswords } from '@/hooks/usePasswords';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useTheme } from '@/components/theme';
import { translateCategory, translateAccountType } from '@/utils/translations';

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
  const { theme, setTheme } = useTheme();
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
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [historySearchTerm, setHistorySearchTerm] = useState('');

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
      // Admin users also see only their own password history
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
        .eq('user_id', user?.id) // Filter by current user's ID
        .order('created_at', { ascending: false });

      if (error) throw error;

      const passwordsWithUserEmails = (data || []).map(password => ({
        ...password,
        user_email: user?.email || 'N/A'
      }));

      setPasswordHistory(passwordsWithUserEmails);
    } catch (error) {
      console.error('Error fetching password history:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o histórico de senhas.",
        variant: "destructive",
      });
    }
  }, [user?.id, user?.email]);

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

  // Função para buscar perfil completo do usuário
  const fetchProfile = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .select('display_name, avatar_url, user_id')
        .eq('user_id', user.id)
        .single();

      if (!error && updatedProfile) {
        console.log('Perfil carregado do banco:', updatedProfile);
        setEditingProfile(prev => ({
          ...prev,
          display_name: updatedProfile.display_name || '',
          email: user?.email || '',
          avatar_url: updatedProfile.avatar_url || ''
        }));
      } else {
        console.log('Usando dados do contexto de autenticação');
        setEditingProfile(prev => ({
          ...prev,
          display_name: profile?.display_name || '',
          email: user?.email || '',
          avatar_url: profile?.avatar_url || ''
        }));
      }
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      // Fallback para dados do contexto
      setEditingProfile(prev => ({
        ...prev,
        display_name: profile?.display_name || '',
        email: user?.email || '',
        avatar_url: profile?.avatar_url || ''
      }));
    }
  }, [user?.id, user?.email, profile?.display_name, profile?.avatar_url]);

  // useEffect para carregar dados iniciais
  useEffect(() => {
    const fetchData = async () => {
      if (isAdmin) {
        await fetchUsers();
        await fetchAllPasswordHistory(); // Admin also sees only their own password history
      } else {
        await fetchProfile();
        await fetchUserPasswordHistory();
      }
    };

    if (user?.id) {
      fetchData();
    }

    // Tema gerenciado pelo ThemeProvider
  }, [isAdmin, fetchUsers, fetchAllPasswordHistory, fetchUserPasswordHistory, fetchProfile, user?.id]);

  // useEffect separado para atualizar o estado quando os dados do contexto mudarem
  useEffect(() => {
    if (user && profile) {
      console.log('Atualizando estado com dados do contexto:', { user: user.email, profile: profile.display_name });
      setEditingProfile(prev => ({
        ...prev,
        display_name: profile.display_name || '',
        email: user.email || '',
        avatar_url: profile.avatar_url || ''
      }));
    }
  }, [user, profile]);

  // Scroll detection for back to top button
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setShowScrollTop(scrollTop > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  // Tema gerenciado pelo ThemeProvider

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
      setShowPasswordFields(false);
      if (isAdmin) {
        await fetchUsers();
      } else {
        await fetchProfile();
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

  // Filter password history based on search term
  const filteredPasswordHistory = passwordHistory.filter(password => {
    const matchesSearch = password.title.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
      password.email.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
      password.category.name.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
      password.account_type.name.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
      translateCategory(password.category.name).toLowerCase().includes(historySearchTerm.toLowerCase()) ||
      translateAccountType(password.account_type.name).toLowerCase().includes(historySearchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background pb-safe-bottom"
         style={{ 
           paddingTop: 'env(safe-area-inset-top)', 
           paddingLeft: 'env(safe-area-inset-left)', 
           paddingRight: 'env(safe-area-inset-right)',
           scrollBehavior: 'smooth'
         }}>
      <div className="px-4 py-4 md:px-6 md:py-6 container mx-auto max-w-6xl">
        {/* Header - Mobile Side by Side Navigation */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-3 -mx-4 px-4 mb-6 md:static md:bg-transparent md:backdrop-blur-none md:py-0 md:mx-0 md:px-0">
          <div className="flex items-center justify-between gap-3 md:gap-4">
            <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
              <SettingsIcon className="w-6 h-6 md:w-8 md:h-8 text-primary flex-shrink-0" />
              <h1 className="text-lg md:text-3xl font-bold truncate">Configurações</h1>
              {isAdmin && (
                <Badge variant="secondary" className="text-xs md:text-sm ml-1 md:ml-2 flex-shrink-0">
                  <Shield className="w-3 h-3 mr-1" />
                  Admin
                </Badge>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="flex-shrink-0 min-h-[44px] md:min-h-auto px-3 md:px-4 flex items-center gap-2"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Voltar para o Dashboard</span>
              <span className="sm:hidden">Dashboard</span>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="account" className="space-y-4 md:space-y-6">
          <TabsList className={`grid w-full gap-1 p-1 ${isAdmin ? 'grid-cols-4' : 'grid-cols-3'} rounded-2xl md:rounded-lg bg-muted/30 md:bg-muted`}>
            <TabsTrigger value="account" className="min-h-[44px] px-2 md:px-3 text-xs md:text-sm font-medium rounded-xl md:rounded-lg transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <span className="truncate">Conta</span>
            </TabsTrigger>
            <TabsTrigger value="theme" className="min-h-[44px] px-2 md:px-3 text-xs md:text-sm font-medium rounded-xl md:rounded-lg transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <span className="truncate">Tema</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="users" className="min-h-[44px] px-1 md:px-3 text-xs md:text-sm font-medium rounded-xl md:rounded-lg transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <span className="truncate">Usuários</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="history" className="min-h-[44px] px-2 md:px-3 text-xs md:text-sm font-medium rounded-xl md:rounded-lg transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <span className="truncate">Histórico</span>
            </TabsTrigger>
          </TabsList>

          {/* Account Settings */}
          <TabsContent value="account" className="space-y-4 md:space-y-6 mt-4 md:mt-6 animate-in fade-in-0 slide-in-from-bottom-1 duration-300">
            <Card className="border-0 shadow-sm md:border md:shadow-md transition-all duration-200 hover:shadow-lg md:hover:shadow-xl">
              <CardHeader>
                <CardTitle>Informações da Conta</CardTitle>
                <CardDescription>
                  Gerencie suas informações pessoais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 md:space-y-6 px-4 py-4 md:px-6 md:py-6">
                <div className="space-y-2">
                  <Label htmlFor="display_name" className="text-base font-medium flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    Nome de Exibição
                  </Label>
                  <Input
                    id="display_name"
                    value={editingProfile.display_name}
                    onChange={(e) => setEditingProfile({
                      ...editingProfile,
                      display_name: e.target.value
                    })}
                    className="h-11 text-base md:h-auto md:text-sm transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                    placeholder="Digite seu nome de exibição"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base font-medium flex items-center gap-2">
                    <span className="text-primary">@</span>
                    E-mail
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={editingProfile.email}
                    onChange={(e) => setEditingProfile({
                      ...editingProfile,
                      email: e.target.value
                    })}
                    className="h-11 text-base md:h-auto md:text-sm transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                    placeholder="Digite seu e-mail"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-medium flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500"></div>
                    Avatar
                  </Label>
                  <div className="flex flex-col md:flex-row items-center gap-4 p-4 bg-muted/30 rounded-xl">
                  <ImageUpload
                    value={editingProfile.avatar_url || ''}
                    onChange={(url) => setEditingProfile({
                      ...editingProfile,
                      avatar_url: url
                    })}
                    userId={user?.id || ''}
                    disabled={isLoading}
                  />
                    <div className="text-center md:text-left">
                      <p className="text-sm text-muted-foreground">
                        Clique para alterar sua foto de perfil
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Recomendado: 200x200px, formato JPG ou PNG
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 bg-muted/30 rounded-xl border cursor-pointer hover:bg-muted/50 transition-all duration-200"
                       onClick={() => setShowPasswordFields(!showPasswordFields)}>
                    <input
                      type="checkbox"
                      id="show-password"
                      checked={showPasswordFields}
                      onChange={(e) => setShowPasswordFields(e.target.checked)}
                      className="w-5 h-5 rounded transition-all duration-200"
                    />
                    <div>
                      <Label htmlFor="show-password" className="text-base font-medium cursor-pointer flex items-center gap-2">
                        <Shield className="w-4 h-4 text-orange-500" />
                        Alterar Senha
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Clique para definir uma nova senha de acesso
                      </p>
                    </div>
                  </div>

                  {showPasswordFields && (
                    <div className="space-y-4 p-4 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-900/50 animate-in fade-in-0 slide-in-from-top-2 duration-300">
                      <div className="flex items-center gap-2 text-red-700 dark:text-red-400 mb-3">
                        <Shield className="w-4 h-4" />
                        <span className="font-medium text-sm">Alteração de Senha</span>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-base font-medium flex items-center gap-2">
                          <Shield className="w-4 h-4 text-red-500" />
                          Nova senha
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          value={editingProfile.password}
                          onChange={(e) => setEditingProfile({
                            ...editingProfile,
                            password: e.target.value
                          })}
                          placeholder="Digite a nova senha (mín. 6 caracteres)"
                          className="h-11 text-base transition-all duration-200 focus:ring-2 focus:ring-red-500/20"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password" className="text-base font-medium flex items-center gap-2">
                          <Shield className="w-4 h-4 text-red-500" />
                          Confirmar senha
                        </Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          value={editingProfile.confirmPassword}
                          onChange={(e) => setEditingProfile({
                            ...editingProfile,
                            confirmPassword: e.target.value
                          })}
                          placeholder="Confirme a nova senha"
                          className="h-11 text-base transition-all duration-200 focus:ring-2 focus:ring-red-500/20"
                        />
                      </div>
                      
                      <div className="text-xs text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/30 p-3 rounded-lg">
                        <p>🔒 A senha deve ter pelo menos 6 caracteres</p>
                        <p>🔑 Você será desconectado automaticamente após salvar</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-6 flex flex-col md:flex-row gap-3">
                  <Button
                    onClick={updateProfile}
                    disabled={isLoading}
                    className="w-full md:w-auto min-h-[44px] flex items-center justify-center gap-2 transition-all duration-200"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        <span>Salvando...</span>
                      </div>
                    ) : (
                      <>
                    <Save className="w-4 h-4" />
                        <span>Salvar Alterações</span>
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Theme Settings - Mobile Optimized */}
          <TabsContent value="theme" className="space-y-3 md:space-y-6 mt-4 md:mt-6 animate-in fade-in-0 slide-in-from-bottom-1 duration-300">
            <Card className="border-0 shadow-none md:border md:shadow-md transition-all duration-200 hover:shadow-lg md:hover:shadow-xl rounded-2xl md:rounded-lg overflow-hidden">
              <CardHeader className="pb-3 md:pb-6">
                <CardTitle className="flex items-center gap-3 text-lg md:text-xl">
                  <div className="flex h-10 w-10 md:h-8 md:w-8 items-center justify-center rounded-xl md:rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/25">
                    <Sun className="w-5 h-5 md:w-4 md:h-4 text-white" />
                  </div>
                  Configurações de Tema
                </CardTitle>
                <CardDescription className="text-base md:text-sm text-muted-foreground leading-relaxed">
                  Escolha como você quer ver a interface do aplicativo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 md:space-y-6 px-3 py-3 md:px-6 md:py-6">
                {/* Modo Escuro - Mobile Enhanced */}
                <div className={`group flex items-center justify-between p-5 md:p-4 rounded-2xl md:rounded-xl border-0 md:border transition-all duration-300 cursor-pointer active:scale-[0.98] ${
                  theme === 'dark' 
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800 shadow-lg shadow-blue-500/10' 
                    : 'bg-muted/30 hover:bg-muted/50 border-muted'
                } min-h-[76px] md:min-h-[68px]`}
                     onClick={() => theme !== 'dark' && setTheme('dark')}>
                  <div className="flex items-center gap-4 md:gap-4">
                    <div className={`flex h-12 w-12 md:h-10 md:w-10 items-center justify-center rounded-2xl md:rounded-lg transition-all duration-300 ${
                      theme === 'dark' 
                        ? 'bg-blue-600 shadow-xl shadow-blue-600/30 ring-4 ring-blue-600/10' 
                        : 'bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 group-active:scale-95'
                    }`}>
                      <Moon className={`w-6 h-6 md:w-5 md:h-5 transition-all duration-300 ${
                        theme === 'dark' ? 'text-white rotate-12' : 'text-blue-600 dark:text-blue-400'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Label htmlFor="dark-mode-toggle" className={`text-lg md:text-base font-semibold md:font-medium cursor-pointer transition-colors duration-200 ${
                        theme === 'dark' ? 'text-blue-900 dark:text-blue-100' : 'text-foreground'
                      }`}>
                        Modo Escuro
                      </Label>
                      <p className={`text-base md:text-sm mt-1 md:mt-0 leading-tight ${
                        theme === 'dark' 
                          ? 'text-blue-700 dark:text-blue-300' 
                          : 'text-muted-foreground'
                      }`}>
                        {theme === 'dark' ? '🌙 Ativo • Interface escura' : 'Toque para ativar tema escuro'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                  <Switch
                    id="dark-mode-toggle"
                    checked={theme === 'dark'}
                    onCheckedChange={(checked) => {
                      if (checked && theme !== 'dark') {
                        setTheme('dark');
                      }
                    }}
                      className="scale-125 md:scale-110 data-[state=checked]:bg-blue-600"
                  />
                  </div>
                </div>

                {/* Modo Claro - Mobile Enhanced */}
                <div className={`group flex items-center justify-between p-5 md:p-4 rounded-2xl md:rounded-xl border-0 md:border transition-all duration-300 cursor-pointer active:scale-[0.98] ${
                  theme === 'light' 
                    ? 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800 shadow-lg shadow-yellow-500/10' 
                    : 'bg-muted/30 hover:bg-muted/50 border-muted'
                } min-h-[76px] md:min-h-[68px]`}
                     onClick={() => theme !== 'light' && setTheme('light')}>
                  <div className="flex items-center gap-4 md:gap-4">
                    <div className={`flex h-12 w-12 md:h-10 md:w-10 items-center justify-center rounded-2xl md:rounded-lg transition-all duration-300 ${
                      theme === 'light' 
                        ? 'bg-yellow-500 shadow-xl shadow-yellow-500/30 ring-4 ring-yellow-500/10' 
                        : 'bg-yellow-100 dark:bg-yellow-900/30 group-hover:bg-yellow-200 dark:group-hover:bg-yellow-900/50 group-active:scale-95'
                    }`}>
                      <Sun className={`w-6 h-6 md:w-5 md:h-5 transition-all duration-300 ${
                        theme === 'light' ? 'text-white rotate-12' : 'text-yellow-600 dark:text-yellow-400'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Label htmlFor="light-mode-toggle" className={`text-lg md:text-base font-semibold md:font-medium cursor-pointer transition-colors duration-200 ${
                        theme === 'light' ? 'text-yellow-900 dark:text-yellow-100' : 'text-foreground'
                      }`}>
                        Modo Claro
                      </Label>
                      <p className={`text-base md:text-sm mt-1 md:mt-0 leading-tight ${
                        theme === 'light' 
                          ? 'text-yellow-700 dark:text-yellow-300' 
                          : 'text-muted-foreground'
                      }`}>
                        {theme === 'light' ? '☀️ Ativo • Interface clara' : 'Toque para ativar tema claro'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                  <Switch
                    id="light-mode-toggle"
                    checked={theme === 'light'}
                    onCheckedChange={(checked) => {
                      if (checked && theme !== 'light') {
                        setTheme('light');
                      }
                    }}
                      className="scale-125 md:scale-110 data-[state=checked]:bg-yellow-500"
                    />
                  </div>
                </div>

                {/* Theme Preview - Mobile Only */}
                <div className="mt-4 md:hidden">
                  <div className="p-4 bg-gradient-to-br from-muted/30 to-muted/50 rounded-2xl border border-muted/50">
                    <h4 className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                      Prévia do Tema Atual
                    </h4>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-background rounded-xl border shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-primary rounded-lg"></div>
                          <div>
                            <p className="text-sm font-medium">PassKey</p>
                            <p className="text-xs text-muted-foreground">Gerenciador de Senhas</p>
                          </div>
                        </div>
                        <div className="w-4 h-4 bg-muted rounded"></div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <div className="h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                          <div className="w-4 h-4 bg-primary/50 rounded"></div>
                        </div>
                        <div className="h-12 bg-muted rounded-xl flex items-center justify-center">
                          <div className="w-4 h-4 bg-muted-foreground/30 rounded"></div>
                        </div>
                        <div className="h-12 bg-accent rounded-xl flex items-center justify-center">
                          <div className="w-4 h-4 bg-accent-foreground/30 rounded"></div>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground text-center mt-3">
                      {theme === 'dark' ? '🌙 Tema escuro ativo' : '☀️ Tema claro ativo'}
                    </p>
                  </div>
                </div>



                {/* Theme Benefits - Mobile Only */}
                <div className="mt-4 md:hidden">
                  <div className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl border border-primary/20">
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-primary mb-3">
                      <div className="w-3 h-3 rounded-full bg-primary"></div>
                      {theme === 'dark' ? 'Benefícios do Tema Escuro' : 'Benefícios do Tema Claro'}
                    </h4>
                    
                    <div className="space-y-2">
                      {theme === 'dark' ? (
                        <>
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <p className="text-xs text-muted-foreground">Reduz o cansaço visual em ambientes escuros</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <p className="text-xs text-muted-foreground">Economiza bateria em telas OLED</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                            <p className="text-xs text-muted-foreground">Ideal para uso noturno</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                            <p className="text-xs text-muted-foreground">Melhor legibilidade em ambientes claros</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                            <p className="text-xs text-muted-foreground">Visual mais limpo e tradicional</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <p className="text-xs text-muted-foreground">Ideal para uso durante o dia</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Management (Admin Only) */}
          {isAdmin && (
            <TabsContent value="users" className="space-y-4 md:space-y-6 mt-4 md:mt-6 animate-in fade-in-0 slide-in-from-bottom-1 duration-300">
              <UserManagementTab />
            </TabsContent>
          )}

          {/* Password History - Mobile Enhanced */}
          <TabsContent value="history" className="space-y-3 md:space-y-6 mt-4 md:mt-6 animate-in fade-in-0 slide-in-from-bottom-1 duration-300">
            <Card className="border-0 shadow-none md:border md:shadow-md transition-all duration-200 hover:shadow-lg md:hover:shadow-xl rounded-2xl md:rounded-lg overflow-hidden">
              <CardHeader className="pb-3 md:pb-6">
                <CardTitle className="flex items-center gap-3 text-lg md:text-xl">
                  <div className="flex h-10 w-10 md:h-8 md:w-8 items-center justify-center rounded-2xl md:rounded-lg bg-gradient-to-br from-green-500 to-blue-600 shadow-lg shadow-green-500/25">
                    <History className="w-6 h-6 md:w-4 md:h-4 text-white" />
                  </div>
                  Histórico de Senhas
                </CardTitle>
                <CardDescription className="text-base md:text-sm text-muted-foreground leading-relaxed">
                  Acompanhe todas as senhas que você cadastrou na plataforma
                </CardDescription>
              </CardHeader>
              <CardContent className="px-3 py-3 md:px-6 md:py-6">
                {/* Search Bar - Mobile First */}
                {passwordHistory.length > 0 && (
                  <div className="mb-4 md:mb-6">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 md:w-4 md:h-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar no histórico..."
                        value={historySearchTerm}
                        onChange={(e) => setHistorySearchTerm(e.target.value)}
                        className="pl-12 md:pl-10 h-12 md:h-10 text-base md:text-sm bg-muted/30 border-0 md:border rounded-2xl md:rounded-lg focus:bg-background transition-all duration-200"
                      />
                      {historySearchTerm && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted/50"
                          onClick={() => setHistorySearchTerm('')}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    
                    {/* Search Results Counter - Mobile */}
                    {historySearchTerm && (
                      <div className="mt-3 flex items-center justify-between px-1">
                        <p className="text-sm text-muted-foreground">
                          {filteredPasswordHistory.length} de {passwordHistory.length} {passwordHistory.length === 1 ? 'resultado' : 'resultados'}
                        </p>
                        {filteredPasswordHistory.length !== passwordHistory.length && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setHistorySearchTerm('')}
                            className="text-xs text-primary hover:text-primary/80 h-auto p-1"
                          >
                            Limpar filtro
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-3 md:space-y-4">
                  {filteredPasswordHistory.map((password, index) => (
                    <div key={password.id} className="group relative overflow-hidden rounded-2xl md:rounded-xl bg-gradient-to-r from-muted/20 to-muted/30 md:from-muted/30 md:to-muted/30 border-0 md:border transition-all duration-300 hover:from-muted/30 hover:to-muted/40 md:hover:bg-muted/50 hover:scale-[1.01] hover:shadow-md active:scale-[0.99]"
                         style={{ 
                           animationDelay: `${index * 50}ms`,
                           touchAction: 'manipulation'
                         }}>
                      {/* Mobile-optimized layout */}
                      <div className="p-4 md:p-4 space-y-3 md:space-y-2">
                        {/* Header Row - Mobile Enhanced */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <div className="flex-shrink-0 w-8 h-8 md:w-6 md:h-6 rounded-xl md:rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                                <History className="w-4 h-4 md:w-3 md:h-3 text-primary" />
                              </div>
                              <h3 className="font-semibold text-lg md:text-base text-foreground truncate group-hover:text-primary transition-colors duration-200">
                                {password.title}
                              </h3>
                            </div>
                            <p className="text-base md:text-sm text-muted-foreground truncate pl-11 md:pl-9 -mt-1">
                              {password.email}
                            </p>
                          </div>
                          
                          {/* Date Badge - Mobile Optimized */}
                          <div className="flex-shrink-0">
                            <div className="flex flex-col items-end gap-1">
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-background/60 rounded-xl border border-muted/50">
                                <Clock className="w-3 h-3 text-muted-foreground" />
                                <span className="text-xs font-medium text-muted-foreground">
                                  {new Date(password.created_at).toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: '2-digit'
                                  })}
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {new Date(password.created_at).toLocaleTimeString('pt-BR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Tags Row - Mobile Enhanced */}
                        <div className="flex flex-wrap gap-2 pl-11 md:pl-9">
                          <Badge 
                            variant="outline" 
                            className="text-xs font-medium px-3 py-1 rounded-xl border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 transition-all duration-200"
                          >
                            {translateCategory(password.category.name)}
                          </Badge>
                          <Badge 
                            variant="secondary" 
                            className="text-xs font-medium px-3 py-1 rounded-xl bg-secondary/80 hover:bg-secondary transition-all duration-200"
                          >
                            {translateAccountType(password.account_type.name)}
                          </Badge>
                          {isAdmin && (
                            <Badge 
                              variant="default" 
                              className="text-xs font-medium px-3 py-1 rounded-xl bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all duration-200"
                            >
                              {password.user_email}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Subtle gradient overlay for depth */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    </div>
                  ))}

                  {/* Enhanced Empty State */}
                  {passwordHistory.length === 0 && (
                    <div className="text-center py-16 px-4">
                      <div className="max-w-sm mx-auto">
                        <div className="relative mb-8">
                          <div className="flex h-24 w-24 md:h-20 md:w-20 items-center justify-center mx-auto rounded-3xl bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30 shadow-lg">
                            <History className="w-12 h-12 md:w-10 md:h-10 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        </div>
                        <h3 className="text-xl md:text-lg font-bold mb-4 text-foreground">
                          Sem histórico ainda
                        </h3>
                        <p className="text-base md:text-sm text-muted-foreground leading-relaxed mb-6">
                          Suas senhas cadastradas aparecerão aqui para você acompanhar todo o histórico de atividades.
                        </p>
                        <div className="space-y-3">
                          <Button 
                            onClick={() => navigate('/dashboard')} 
                            className="w-full min-h-[48px] md:min-h-[44px] text-base md:text-sm font-medium rounded-2xl md:rounded-lg transition-all duration-200"
                          >
                            <ArrowLeft className="w-5 h-5 md:w-4 md:h-4 mr-2" />
                            Cadastrar Primeira Senha
                          </Button>
                          <p className="text-xs text-muted-foreground">
                            💡 Dica: Use o Dashboard para adicionar suas senhas
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* No Search Results State */}
                  {passwordHistory.length > 0 && filteredPasswordHistory.length === 0 && historySearchTerm && (
                    <div className="text-center py-12 px-4">
                      <div className="max-w-sm mx-auto">
                        <div className="flex h-16 w-16 items-center justify-center mx-auto mb-6 rounded-2xl bg-muted/30">
                          <Search className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-3 text-foreground">
                          Nenhum resultado encontrado
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                          Não encontramos senhas que correspondem a "{historySearchTerm}".
                        </p>
                        <Button 
                          variant="outline"
                          onClick={() => setHistorySearchTerm('')}
                          className="min-h-[44px] text-sm rounded-xl transition-all duration-200"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Limpar Busca
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Stats Footer - Mobile Enhanced */}
                {passwordHistory.length > 0 && (
                  <div className="mt-6 md:mt-4 p-4 bg-gradient-to-r from-primary/5 to-blue-500/5 rounded-2xl md:rounded-lg border border-primary/10">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="font-medium">
                          {passwordHistory.length} senha{passwordHistory.length !== 1 ? 's' : ''} no total
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Última atualização: hoje
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog para editar usuário - Mobile Optimized */}
      <Dialog open={isEditingUser} onOpenChange={setIsEditingUser}>
        <DialogContent className="w-full max-w-[95vw] mx-2 sm:max-w-[500px] sm:mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="text-left pb-4">
            <DialogTitle className="flex items-center gap-3 text-lg font-semibold">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Edit className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              Editar Usuário
            </DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">
              Modifique as informações e permissões do usuário selecionado.
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-6 py-2">
              <div className="space-y-3">
                <Label htmlFor="edit-avatar" className="text-base font-medium flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500"></div>
                  Avatar do Usuário
                </Label>
                <div className="flex flex-col items-center gap-4 p-4 bg-muted/30 rounded-xl border">
                <ImageUpload
                  value={editingUser.avatar_url || ''}
                  onChange={(url) => setEditingUser({
                    ...editingUser,
                    avatar_url: url
                  })}
                  userId={editingUser.user_id || ''}
                  disabled={isLoading}
                />
                  <p className="text-sm text-muted-foreground text-center">
                    Clique para alterar a foto do usuário
                  </p>
              </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-username" className="text-base font-medium flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  Nome de Usuário
                </Label>
                <Input
                  id="edit-username"
                  value={editingUser.display_name || ''}
                  onChange={(e) => setEditingUser({
                    ...editingUser,
                    display_name: e.target.value
                  })}
                  placeholder="Digite o nome de usuário"
                  className="h-12 text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-email" className="text-base font-medium flex items-center gap-2">
                  <span className="text-primary">@</span>
                  Email do Usuário
                </Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingUser.email || ''}
                  onChange={(e) => setEditingUser({
                    ...editingUser,
                    email: e.target.value
                  })}
                  placeholder="Digite o email do usuário"
                  className="h-12 text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-is-admin" className="text-base font-medium flex items-center gap-2">
                  <Shield className="w-4 h-4 text-orange-500" />
                  Tipo de Usuário
                </Label>
                <Select
                  value={editingUser.is_admin ? 'admin' : 'common'}
                  onValueChange={(value) => setEditingUser({
                    ...editingUser,
                    is_admin: value === 'admin'
                  })}
                >
                  <SelectTrigger className="h-12 text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20">
                    <SelectValue placeholder="Selecione o tipo de usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin" className="flex items-center gap-2 py-3">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-orange-500" />
                        <span>Administrador</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="common" className="flex items-center gap-2 py-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-500" />
                        <span>Usuário Comum</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-is-active" className="text-base font-medium flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full ${editingUser.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  Status do Usuário
                </Label>
                <Select
                  value={editingUser.is_active ? 'active' : 'inactive'}
                  onValueChange={(value) => setEditingUser({
                    ...editingUser,
                    is_active: value === 'active'
                  })}
                >
                  <SelectTrigger className="h-12 text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active" className="flex items-center gap-2 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span>Ativo</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="inactive" className="flex items-center gap-2 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span>Inativo</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t mt-6">
            <Button
              variant="outline"
              onClick={() => setIsEditingUser(false)}
              className="w-full sm:w-auto min-h-[48px] order-2 sm:order-1 transition-all duration-200"
              disabled={isLoading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button 
              onClick={handleUpdateUser}
              className="w-full sm:w-auto min-h-[48px] order-1 sm:order-2 transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Salvando...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  <span>Salvar Alterações</span>
                </div>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para editar perfil - Mobile Optimized */}
      <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
        <DialogContent className="w-full max-w-[95vw] mx-2 sm:max-w-[500px] sm:mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="text-left pb-4">
            <DialogTitle className="flex items-center gap-3 text-lg font-semibold">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <User className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              Editar Meu Perfil
            </DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">
              Atualize suas informações pessoais e configurações de conta.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-2">
            <div className="space-y-2">
              <Label htmlFor="profile-username" className="text-base font-medium flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                Meu Nome de Exibição
              </Label>
              <Input
                id="profile-username"
                value={editingProfile.display_name || ''}
                onChange={(e) => setEditingProfile({
                  ...editingProfile,
                  display_name: e.target.value
                })}
                placeholder="Digite seu nome de exibição"
                className="h-12 text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-email" className="text-base font-medium flex items-center gap-2">
                <span className="text-primary">@</span>
                Meu Email
              </Label>
              <Input
                id="profile-email"
                type="email"
                value={editingProfile.email || ''}
                onChange={(e) => setEditingProfile({
                  ...editingProfile,
                  email: e.target.value
                })}
                placeholder="Digite seu email"
                className="h-12 text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
              <p className="text-xs text-muted-foreground">
                ⚠️ Alterar o email requer confirmação por email
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-4 bg-muted/30 rounded-xl border">
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
                  className="w-5 h-5 rounded transition-all duration-200"
                />
                <div>
                  <Label htmlFor="change-password" className="text-base font-medium cursor-pointer flex items-center gap-2">
                    <Shield className="w-4 h-4 text-red-500" />
                    Alterar Senha
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Marque para definir uma nova senha para sua conta
                  </p>
            </div>
              </div>
              
            {editingProfile.changePassword && (
                <div className="space-y-4 p-4 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-900/50">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                    <Shield className="w-4 h-4" />
                    <span className="font-medium text-sm">Alteração de Senha</span>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="profile-password" className="text-base font-medium">Nova senha</Label>
                  <Input
                    id="profile-password"
                    type="password"
                    value={editingProfile.password || ''}
                    onChange={(e) => setEditingProfile({
                      ...editingProfile,
                      password: e.target.value
                    })}
                      placeholder="Digite a nova senha (mín. 6 caracteres)"
                      className="h-12 text-base transition-all duration-200 focus:ring-2 focus:ring-red-500/20"
                  />
                </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="profile-confirm-password" className="text-base font-medium">Confirmar nova senha</Label>
                  <Input
                    id="profile-confirm-password"
                    type="password"
                    value={editingProfile.confirmPassword || ''}
                    onChange={(e) => setEditingProfile({
                      ...editingProfile,
                      confirmPassword: e.target.value
                    })}
                    placeholder="Confirme a nova senha"
                      className="h-12 text-base transition-all duration-200 focus:ring-2 focus:ring-red-500/20"
                  />
                </div>
                  
                  <div className="text-xs text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/30 p-3 rounded-lg">
                    <p>🔒 A senha deve ter pelo menos 6 caracteres</p>
                    <p>🔑 Você será deslogado após a alteração</p>
                  </div>
                </div>
            )}
          </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t mt-6">
            <Button
              variant="outline"
              onClick={() => setIsEditingProfile(false)}
              className="w-full sm:w-auto min-h-[48px] order-2 sm:order-1 transition-all duration-200"
              disabled={isLoading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button 
              onClick={updateProfile}
              className="w-full sm:w-auto min-h-[48px] order-1 sm:order-2 transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Salvando Perfil...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  <span>Salvar Alterações</span>
                </div>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile FAB - Floating Action Button */}
      <div className="fixed bottom-6 right-6 md:hidden z-50">
        <Button
          onClick={() => navigate('/dashboard')}
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 p-0 bg-primary hover:bg-primary/90"
          title="Ir para Dashboard"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <div className="fixed bottom-6 left-6 md:hidden z-50">
          <Button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            variant="outline"
            size="sm"
            className="h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 p-0 bg-background/80 backdrop-blur-sm border-primary/20 animate-in fade-in-0 slide-in-from-bottom-2"
            title="Voltar ao Topo"
          >
            <ArrowLeft className="w-4 h-4 rotate-90" />
          </Button>
        </div>
      )}
    </div>
  );
};
