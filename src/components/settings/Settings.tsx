import React, { useState, useEffect, useCallback } from 'react';
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
  Trash2
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
    avatar_url: profile?.avatar_url || ''
  });

  const isAdmin = profile?.is_admin || user?.email === 'contato@techsolutionspro.com.br';

  const fetchUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, display_name, avatar_url, is_admin, is_active, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Since we can't access auth.users directly, we'll use the user_id to get email from current user context
      // or display the display_name as identifier
      const usersWithEmails = (data || []).map(profile => ({
        ...profile,
        email: profile.display_name || `user-${profile.user_id.slice(0, 8)}`
      }));
      
      setUsers(usersWithEmails);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os usuários.",
        variant: "destructive",
      });
    }
  }, []);

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
        await fetchUserPasswordHistory();
      }
    };

    fetchData();
    
    // Check current theme
    const currentTheme = localStorage.getItem('theme');
    setIsDarkMode(currentTheme === 'dark');
  }, [isAdmin, fetchUsers, fetchAllPasswordHistory, fetchUserPasswordHistory]);

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('user_id', userId);

      if (error) throw error;

      setUsers(users.map(user => 
        user.id === userId ? { ...user, is_active: !currentStatus } : user
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
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: editingProfile.display_name,
          avatar_url: editingProfile.avatar_url
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o perfil.",
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

      setUsers(users.map(user => 
        user.id === userId ? { ...user, ...profileData } : user
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

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

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
                    value={editingProfile.email}
                    disabled
                    className="bg-muted"
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

                <Button 
                  onClick={updateProfile}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
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
                    Monitore e gerencie usuários do sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {users.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={user.avatar_url} />
                            <AvatarFallback>
                              {getInitials(user.display_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.display_name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            <div className="flex gap-2 mt-1">
                              {user.is_admin && (
                                <Badge variant="secondary">Admin</Badge>
                              )}
                              <Badge variant={user.is_active ? "default" : "destructive"}>
                                {user.is_active ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleUserStatus(user.id, user.is_active)}
                          >
                            {user.is_active ? (
                              <UserX className="w-4 h-4" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
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
    </div>
  );
};
