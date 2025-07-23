import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  UserCheck,
  UserX,
  Edit,
  Trash2,
  Save,
  X,
  Shield,
  Clock,
  RefreshCw
} from 'lucide-react';

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  email: string;
  avatar_url?: string;
  is_admin: boolean;
  is_active: boolean;
  is_online: boolean;
  last_seen?: string;
  created_at: string;
  updated_at: string;
  last_sign_in?: string;
  confirmed_at?: string;
}

export const UserManagement: React.FC = () => {
  const { user, profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [activeUsers, setActiveUsers] = useState<UserProfile[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<UserProfile[]>([]);
  const [commonUsers, setCommonUsers] = useState<UserProfile[]>([]);
  const [adminUsers, setAdminUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const isAdmin = profile?.is_admin || false;

  // Função para buscar todos os usuários reais do Supabase
  const fetchUsers = useCallback(async () => {
    if (!isAdmin || !user) return;

    setIsLoading(true);
    try {
      console.log('Buscando usuários reais do Supabase...');

      // Criar cliente com chave de serviço para acesso administrativo
      const supabaseAdmin = createClient(
        'https://oyjpnwjwawmgecobeebl.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95anBud2p3YXdtZ2Vjb2JlZWJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjc2OTA3NCwiZXhwIjoyMDY4MzQ1MDc0fQ.59HQPkwOjr-tZtXCWja_5JhA2h6Y5jbxqVLcid8_ydM',
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );

      // Buscar todos os perfis da tabela profiles usando chave de serviço
      const { data: profilesData, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Erro ao buscar perfis:', profilesError);
        throw profilesError;
      }

      console.log('Perfis encontrados:', profilesData?.length || 0);

      if (!profilesData || profilesData.length === 0) {
        console.log('Nenhum perfil encontrado no banco de dados');
        setUsers([]);
        return;
      }

      // Tentar buscar informações de autenticação usando a API de admin
      let authUsers: Array<{ id: string; email?: string; email_confirmed_at?: string; last_sign_in_at?: string; }> = [];
      try {
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers({
          perPage: 1000 // Garantir que todos os usuários sejam retornados
        });

        if (!authError && authData?.users) {
          authUsers = authData.users;
          console.log('Dados de autenticação encontrados:', authUsers.length);
          console.log('Usuários auth:', authUsers.map(u => ({ email: u.email, confirmed: !!u.email_confirmed_at })));
        } else {
          console.warn('Não foi possível obter dados de autenticação:', authError);
        }
      } catch (authErr) {
        console.warn('Erro ao buscar dados de autenticação:', authErr);
      }

      // Combinar dados de perfil com dados de autenticação
      const realUsers: UserProfile[] = profilesData.map(profile => {
        const authUser = authUsers.find(u => u.id === profile.user_id);

        console.log(`Processando perfil: ${profile.display_name}`, {
          profile_id: profile.id,
          user_id: profile.user_id,
          is_admin: profile.is_admin,
          is_active: profile.is_active,
          auth_email: authUser?.email,
          auth_confirmed: authUser?.email_confirmed_at
        });

        return {
          id: profile.id,
          user_id: profile.user_id,
          display_name: profile.display_name || 'Usuário sem nome',
          email: authUser?.email || 'Email não encontrado',
          avatar_url: profile.avatar_url,
          is_admin: profile.is_admin === true, // Verificação explícita
          is_active: profile.is_active === true, // Verificação explícita
          is_online: profile.is_online === true, // Status online real do banco
          last_seen: profile.last_seen,
          created_at: profile.created_at,
          updated_at: profile.updated_at,
          last_sign_in: authUser?.last_sign_in_at,
          confirmed_at: authUser?.email_confirmed_at
        };
      });

      console.log('Usuários processados:', realUsers.length);
      console.log('Detalhes dos usuários:', realUsers.map(u => ({
        name: u.display_name,
        email: u.email,
        is_admin: u.is_admin,
        is_active: u.is_active,
        confirmed: !!u.confirmed_at
      })));

      setUsers(realUsers);

    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      toast({
        title: "Erro ao carregar usuários",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, user]);

  // Configurar listener em tempo real para atualizações de perfis
  useEffect(() => {
    if (!isAdmin) return;

    console.log('Inicializando gerenciamento de usuários...');

    // Carregar usuários imediatamente
    fetchUsers();

    // Configurar listener para atualizações em tempo real
    const subscription = supabase
      .channel('public:profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        console.log('Mudança detectada na tabela profiles, atualizando...');
        fetchUsers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [isAdmin, fetchUsers]);

  // Atualizar listas filtradas quando os usuários mudarem
  useEffect(() => {
    if (users.length > 0) {
      console.log('Atualizando listas filtradas, total de usuários:', users.length);

      setActiveUsers(users.filter(u => u.is_active));
      setOnlineUsers(users.filter(u => isUserOnline(u)));
      setCommonUsers(users.filter(u => !u.is_admin));
      setAdminUsers(users.filter(u => u.is_admin));
    }
  }, [users]);

  // Verificar se o usuário está online (baseado no campo is_online do banco)
  const isUserOnline = (userProfile: UserProfile) => {
    return userProfile.is_online === true;
  };

  // Formatar tempo desde a última atividade
  const getLastSeenText = (lastSeen?: string) => {
    if (!lastSeen) return 'Nunca visto';

    try {
      const lastSeenDate = new Date(lastSeen);
      const now = new Date();
      const diffMs = now.getTime() - lastSeenDate.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));

      if (diffMinutes < 1) return 'Agora mesmo';
      if (diffMinutes < 60) return `${diffMinutes} min atrás`;

      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours}h atrás`;

      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} dias atrás`;
    } catch (err) {
      return 'Data inválida';
    }
  };

  // Formatar data
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('pt-BR');
    } catch (err) {
      return 'Data inválida';
    }
  };

  // Obter iniciais do nome para avatar
  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  // Filtrar usuários com base na busca
  const filterUsersBySearch = (usersList: UserProfile[]) => {
    if (!searchQuery) return usersList;

    const query = searchQuery.toLowerCase();
    return usersList.filter(u =>
      u.display_name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      u.user_id.toLowerCase().includes(query)
    );
  };

  // Alternar status ativo/inativo do usuário
  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    if (userId === user?.id && currentStatus === true) {
      toast({
        title: "Ação não permitida",
        description: "Você não pode desativar sua própria conta de administrador.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Usar cliente admin para operações administrativas
      const supabaseAdmin = createClient(
        'https://oyjpnwjwawmgecobeebl.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95anBud2p3YXdtZ2Vjb2JlZWJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjc2OTA3NCwiZXhwIjoyMDY4MzQ1MDc0fQ.59HQPkwOjr-tZtXCWja_5JhA2h6Y5jbxqVLcid8_ydM',
        { auth: { autoRefreshToken: false, persistSession: false } }
      );

      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('user_id', userId);

      if (error) throw error;

      // Atualizar estado local
      setUsers(users.map(u =>
        u.user_id === userId ? { ...u, is_active: !currentStatus } : u
      ));

      toast({
        title: "Status atualizado",
        description: `Usuário ${!currentStatus ? 'ativado' : 'desativado'} com sucesso.`
      });
    } catch (error) {
      console.error('Erro ao atualizar status do usuário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status do usuário.",
        variant: "destructive"
      });
    }
  };

  // Abrir diálogo de edição de usuário
  const handleEditUser = (userItem: UserProfile) => {
    setEditingUser(userItem);
    setShowEditDialog(true);
  };

  // Salvar alterações no usuário
  const handleSaveUser = async () => {
    if (!editingUser) return;

    try {
      // Usar cliente admin para operações administrativas
      const supabaseAdmin = createClient(
        'https://oyjpnwjwawmgecobeebl.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95anBud2p3YXdtZ2Vjb2JlZWJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjc2OTA3NCwiZXhwIjoyMDY4MzQ1MDc0fQ.59HQPkwOjr-tZtXCWja_5JhA2h6Y5jbxqVLcid8_ydM',
        { auth: { autoRefreshToken: false, persistSession: false } }
      );

      const { error } = await supabaseAdmin
        .from('profiles')
        .update({
          display_name: editingUser.display_name,
          is_admin: editingUser.is_admin,
          is_active: editingUser.is_active
        })
        .eq('user_id', editingUser.user_id);

      if (error) throw error;

      // Atualizar estado local
      setUsers(users.map(u =>
        u.user_id === editingUser.user_id ? editingUser : u
      ));

      setShowEditDialog(false);
      toast({
        title: "Usuário atualizado",
        description: "As informações do usuário foram atualizadas com sucesso."
      });
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar as informações do usuário.",
        variant: "destructive"
      });
    }
  };

  // Remover usuário
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (userId === user?.id) {
      toast({
        title: "Ação não permitida",
        description: "Você não pode remover sua própria conta.",
        variant: "destructive"
      });
      return;
    }

    if (window.confirm(`Tem certeza que deseja remover o usuário "${userName}"? Esta ação não pode ser desfeita.`)) {
      try {
        // Usar cliente admin para operações administrativas
        const supabaseAdmin = createClient(
          'https://oyjpnwjwawmgecobeebl.supabase.co',
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95anBud2p3YXdtZ2Vjb2JlZWJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjc2OTA3NCwiZXhwIjoyMDY4MzQ1MDc0fQ.59HQPkwOjr-tZtXCWja_5JhA2h6Y5jbxqVLcid8_ydM',
          { auth: { autoRefreshToken: false, persistSession: false } }
        );

        // Primeiro, excluir senhas do usuário
        const { error: passwordsError } = await supabaseAdmin
          .from('passwords')
          .delete()
          .eq('user_id', userId);

        if (passwordsError) throw passwordsError;

        // Depois, excluir perfil do usuário
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .delete()
          .eq('user_id', userId);

        if (profileError) throw profileError;

        // Por fim, tentar excluir usuário da autenticação (requer privilégios de admin)
        try {
          await supabaseAdmin.auth.admin.deleteUser(userId);
        } catch (authError) {
          console.warn('Não foi possível excluir usuário da autenticação:', authError);
        }

        // Atualizar estado local
        setUsers(users.filter(u => u.user_id !== userId));

        toast({
          title: "Usuário removido",
          description: `Usuário "${userName}" foi removido com sucesso.`
        });
      } catch (error) {
        console.error('Erro ao remover usuário:', error);
        toast({
          title: "Erro",
          description: "Não foi possível remover o usuário.",
          variant: "destructive"
        });
      }
    }
  };

  // Renderizar lista de usuários
  const renderUsersList = () => {
    let baseUsersList: UserProfile[] = [];
    let emptyMessage = '';

    switch (activeTab) {
      case 'active':
        baseUsersList = activeUsers;
        emptyMessage = 'Nenhum usuário ativo encontrado';
        break;
      case 'online':
        baseUsersList = onlineUsers;
        emptyMessage = 'Nenhum usuário online no momento';
        break;
      case 'common':
        baseUsersList = commonUsers;
        emptyMessage = 'Nenhum usuário comum encontrado';
        break;
      case 'admin':
        baseUsersList = adminUsers;
        emptyMessage = 'Nenhum administrador encontrado';
        break;
      default:
        baseUsersList = users;
        emptyMessage = 'Nenhum usuário cadastrado encontrado';
    }

    const usersToShow = filterUsersBySearch(baseUsersList);

    if (usersToShow.length === 0) {
      return (
        <div className="text-center py-12 px-4">
          <div className="flex h-20 w-20 md:h-16 md:w-16 items-center justify-center mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30">
            <Users className="w-10 h-10 md:w-8 md:h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg md:text-base font-semibold mb-3">{emptyMessage}</h3>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed max-w-sm mx-auto">
            {searchQuery ? 'Tente ajustar os termos de busca ou limpe o filtro.' : 'Atualize a lista para ver os usuários cadastrados.'}
          </p>
          <Button
            variant="outline"
            className="min-h-[44px] md:min-h-auto px-6"
            onClick={fetchUsers}
            disabled={isLoading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar Lista
          </Button>
        </div>
      );
    }

    return usersToShow.map((userItem) => (
      <div key={userItem.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 md:p-4 bg-muted/20 md:bg-transparent border-0 md:border rounded-2xl md:rounded-lg space-y-4 md:space-y-0">
        <div className="flex items-center gap-3 md:gap-3 flex-1 min-w-0">
          <div className="relative flex-shrink-0">
            <Avatar className="h-12 w-12 md:h-10 md:w-10">
              <AvatarImage src={userItem.avatar_url} />
              <AvatarFallback className="text-sm font-medium">{getInitials(userItem.display_name)}</AvatarFallback>
            </Avatar>
            {isUserOnline(userItem) && (
              <span className="absolute bottom-0 right-0 w-4 h-4 md:w-3 md:h-3 bg-green-500 rounded-full border-2 border-background"></span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold text-base md:text-sm truncate">{userItem.display_name}</p>
            </div>
            <p className="text-sm md:text-sm text-muted-foreground truncate mb-2">{userItem.email}</p>
            
            <div className="flex flex-wrap gap-1 md:gap-2 mb-2">
              <Badge 
                variant={userItem.is_admin ? "secondary" : "default"}
                className="text-xs px-2 py-1"
              >
                {userItem.is_admin ? "Admin" : "Usuário Comum"}
              </Badge>
              <Badge 
                variant={userItem.is_active ? "default" : "destructive"}
                className="text-xs px-2 py-1"
              >
                {userItem.is_active ? 'Ativo' : 'Inativo'}
              </Badge>
              {isUserOnline(userItem) ? (
                <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white text-xs px-2 py-1">Online</Badge>
              ) : (
                <Badge variant="outline" className="border-gray-500 text-gray-500 text-xs px-2 py-1">Offline</Badge>
              )}
              {!userItem.confirmed_at && (
                <Badge variant="outline" className="border-orange-500 text-orange-500 text-xs px-2 py-1">Email não confirmado</Badge>
              )}
            </div>
            
            <div className="flex flex-col text-xs text-muted-foreground space-y-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {isUserOnline(userItem) ? 'Online agora' : `Visto: ${getLastSeenText(userItem.last_seen)}`}
              </span>
              <span className="hidden md:block">
                Criado em: {formatDate(userItem.created_at)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Mobile Action Buttons */}
        <div className="flex flex-col md:flex-row gap-2 md:gap-2 w-full md:w-auto">
          <div className="grid grid-cols-3 md:flex gap-2 md:gap-2" style={{ overflowX: 'hidden' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEditUser(userItem)}
              title="Editar usuário"
              className="min-h-[44px] md:h-9 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-0 px-2 md:px-3"
            >
              <Edit className="w-4 h-4" />
              <span className="text-xs md:hidden">Editar</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleUserStatus(userItem.user_id, userItem.is_active)}
              title={userItem.is_active ? "Desativar usuário" : "Ativar usuário"}
              disabled={userItem.user_id === user?.id && userItem.is_admin}
              className={`min-h-[44px] md:h-9 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-0 px-2 md:px-3 ${
                userItem.is_active 
                  ? 'hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600 dark:hover:bg-orange-950 dark:hover:border-orange-800' 
                  : 'hover:bg-green-50 hover:border-green-200 hover:text-green-600 dark:hover:bg-green-950 dark:hover:border-green-800'
              }`}
            >
              {userItem.is_active ? (
                <>
                  <UserX className="w-4 h-4" />
                  <span className="text-xs md:hidden">Pausar</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span className="text-xs md:hidden">Ativar</span>
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDeleteUser(userItem.user_id, userItem.display_name)}
              title="Remover usuário"
              className="min-h-[44px] md:h-9 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-0 px-2 md:px-3 hover:bg-red-50 hover:border-red-200 hover:text-red-600 dark:hover:bg-red-950 dark:hover:border-red-800"
              disabled={userItem.user_id === user?.id && userItem.is_admin}
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-xs md:hidden">Remover</span>
            </Button>
          </div>
        </div>
      </div>
    ));
  };

  if (!isAdmin) {
    return (
      <Card className="border-0 shadow-none md:border md:shadow-md rounded-2xl md:rounded-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-lg md:text-xl">
            <div className="flex h-10 w-10 md:h-8 md:w-8 items-center justify-center rounded-xl md:rounded-lg bg-gradient-to-br from-red-500 to-pink-500 shadow-lg shadow-red-500/25">
              <Shield className="w-5 h-5 md:w-4 md:h-4 text-white" />
            </div>
            Acesso Restrito
          </CardTitle>
          <CardDescription className="text-base md:text-sm text-muted-foreground leading-relaxed">
            Esta seção está disponível apenas para administradores do sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 px-4">
            <div className="flex h-20 w-20 md:h-16 md:w-16 items-center justify-center mx-auto mb-6 rounded-full bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30">
              <Shield className="w-10 h-10 md:w-8 md:h-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold mb-3">Permissão Necessária</h3>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
              Você precisa de privilégios de administrador para acessar o gerenciamento de usuários.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-0 shadow-none md:border md:shadow-md rounded-2xl md:rounded-lg overflow-hidden" style={{ overflowX: 'hidden' }}>
        <CardHeader className="pb-4 md:pb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-0">
            <div>
              <CardTitle className="flex items-center gap-3 text-lg md:text-xl">
                <div className="flex h-10 w-10 md:h-8 md:w-8 items-center justify-center rounded-xl md:rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg shadow-blue-500/25">
                  <Users className="w-5 h-5 md:w-4 md:h-4 text-white" />
                </div>
                Gerenciamento de Usuários
              </CardTitle>
              <CardDescription className="text-base md:text-sm text-muted-foreground leading-relaxed mt-2">
                Monitore e gerencie todos os usuários cadastrados no sistema em tempo real.
                <span className="block mt-1">
                  Total de <span className="font-medium text-primary">{users.length}</span> usuários • <span className="font-medium text-green-600">{onlineUsers.length}</span> online agora
                </span>
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchUsers}
              title="Atualizar lista de usuários"
              className="h-8 w-8 p-0"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-3 py-3 md:px-6 md:py-6">
          <div className="mb-4 md:mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:gap-4">
              <Input
                placeholder="Buscar por nome, email ou ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 md:h-auto text-base md:text-sm flex-1 md:max-w-md"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="h-11 md:h-8 px-4 md:px-2 w-full sm:w-auto"
                >
                  <X className="h-4 w-4 mr-2 md:mr-0" />
                  <span className="md:hidden">Limpar</span>
                </Button>
              )}
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-1 p-1 h-auto" style={{ overflowX: 'hidden' }}>
                <TabsTrigger value="all" className="min-h-[44px] md:min-h-auto text-xs md:text-sm p-2 md:p-3 flex flex-col md:flex-row md:items-center">
                  <span className="font-medium">Todos</span>
                  <span className="text-xs opacity-75">({filterUsersBySearch(users).length})</span>
                </TabsTrigger>
                <TabsTrigger value="active" className="min-h-[44px] md:min-h-auto text-xs md:text-sm p-2 md:p-3 flex flex-col md:flex-row md:items-center">
                  <span className="font-medium">Ativos</span>
                  <span className="text-xs opacity-75">({filterUsersBySearch(activeUsers).length})</span>
                </TabsTrigger>
                <TabsTrigger value="online" className="min-h-[44px] md:min-h-auto text-xs md:text-sm p-2 md:p-3 flex flex-col md:flex-row md:items-center">
                  <span className="font-medium">Online</span>
                  <span className="text-xs opacity-75">({filterUsersBySearch(onlineUsers).length})</span>
                </TabsTrigger>
                <TabsTrigger value="common" className="min-h-[44px] md:min-h-auto text-xs md:text-sm p-2 md:p-3 flex flex-col md:flex-row md:items-center">
                  <span className="font-medium">Comuns</span>
                  <span className="text-xs opacity-75">({filterUsersBySearch(commonUsers).length})</span>
                </TabsTrigger>
                <TabsTrigger value="admin" className="min-h-[44px] md:min-h-auto text-xs md:text-sm p-2 md:p-3 flex flex-col md:flex-row md:items-center">
                  <span className="font-medium">Admins</span>
                  <span className="text-xs opacity-75">({filterUsersBySearch(adminUsers).length})</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="space-y-3 md:space-y-4">
            {isLoading ? (
              <div className="text-center py-12 px-4">
                <div className="flex h-16 w-16 md:h-12 md:w-12 items-center justify-center mx-auto mb-4 rounded-full bg-primary/10">
                  <div className="animate-spin rounded-full h-8 w-8 md:h-6 md:w-6 border-2 border-primary border-t-transparent"></div>
                </div>
                <h3 className="text-base md:text-sm font-medium mb-2">Carregando usuários...</h3>
                <p className="text-sm text-muted-foreground">Buscando informações atualizadas dos usuários</p>
              </div>
            ) : (
              renderUsersList()
            )}
          </div>
        </CardContent>
      </Card>

      {/* Diálogo de edição de usuário */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="w-full max-w-[85vw] sm:max-w-lg rounded-[10px]">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Atualize as informações do usuário
            </DialogDescription>
          </DialogHeader>

          {editingUser && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={editingUser.avatar_url} />
                  <AvatarFallback>{getInitials(editingUser.display_name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm text-muted-foreground">Email:</p>
                  <p>{editingUser.email}</p>
                </div>
              </div>

              <div>
                <Label htmlFor="display_name">Nome de Exibição</Label>
                <Input
                  id="display_name"
                  value={editingUser.display_name}
                  onChange={(e) => setEditingUser({
                    ...editingUser,
                    display_name: e.target.value
                  })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label htmlFor="is_admin">Administrador</Label>
                  <Switch
                    id="is_admin"
                    checked={editingUser.is_admin}
                    onCheckedChange={(checked) => setEditingUser({
                      ...editingUser,
                      is_admin: checked
                    })}
                    disabled={editingUser.user_id === user?.id}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Label htmlFor="is_active">Ativo</Label>
                  <Switch
                    id="is_active"
                    checked={editingUser.is_active}
                    onCheckedChange={(checked) => setEditingUser({
                      ...editingUser,
                      is_active: checked
                    })}
                    disabled={editingUser.user_id === user?.id && editingUser.is_admin}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-4 sm:gap-2">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
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
    </>
  );
};