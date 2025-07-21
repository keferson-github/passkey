import React, { useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { AuthContext, type Profile } from '@/contexts/AuthContext';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      setProfile(data as Profile);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  // Função para atualizar status online do usuário
  const updateOnlineStatus = async (userId: string, isOnline: boolean) => {
    try {
      // Atualização direta na tabela profiles
      const { error } = await supabase
        .from('profiles')
        .update({
          is_online: isOnline,
          last_seen: isOnline ? new Date().toISOString() : new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Erro ao atualizar status online:', error);
      }
    } catch (error) {
      console.error('Erro ao atualizar status online:', error);
    }
  };

  const refetchProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    let currentUserId: string | null = null;
    let isInitialized = false;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Usuário logou - marcar como online
          console.log('Usuário logou, marcando como online:', session.user.id);
          currentUserId = session.user.id;
          
          // Atualizar status online sem await para evitar bloqueios
          updateOnlineStatus(session.user.id, true).catch(err =>
            console.error('Erro ao atualizar status online:', err)
          );

          // Buscar perfil sem setTimeout
          fetchProfile(session.user.id).catch(err =>
            console.error('Erro ao buscar perfil:', err)
          );
        } else {
          // Usuário deslogou - marcar como offline se havia um usuário anterior
          if (currentUserId) {
            console.log('Usuário deslogou, marcando como offline:', currentUserId);
            updateOnlineStatus(currentUserId, false).catch(err =>
              console.error('Erro ao atualizar status offline:', err)
            );
          }
          currentUserId = null;
          setProfile(null);
        }

        // Só definir loading como false após a primeira verificação
        if (isInitialized) {
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('Verificando sessão existente:', session?.user?.id);
      
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Marcar como online se já há uma sessão ativa
        console.log('Sessão existente encontrada, marcando como online:', session.user.id);
        currentUserId = session.user.id;
        
        updateOnlineStatus(session.user.id, true).catch(err =>
          console.error('Erro ao atualizar status online:', err)
        );

        fetchProfile(session.user.id).catch(err =>
          console.error('Erro ao buscar perfil:', err)
        );
      }

      isInitialized = true;
      setLoading(false);
    });

    // Cleanup: marcar como offline quando a página é fechada
    const handleBeforeUnload = () => {
      if (currentUserId) {
        console.log('Página sendo fechada, marcando usuário como offline:', currentUserId);
        // Não usar await aqui - beforeunload não pode aguardar promises
        updateOnlineStatus(currentUserId, false).catch(err =>
          console.error('Erro ao atualizar status offline:', err)
        );
      }
    };

    // Heartbeat: manter status online atualizado a cada 2 minutos
    const heartbeatInterval = setInterval(() => {
      if (currentUserId) {
        console.log('Heartbeat: atualizando status online para:', currentUserId);
        updateOnlineStatus(currentUserId, true).catch(err =>
          console.error('Erro no heartbeat:', err)
        );
      }
    }, 120000); // 2 minutos

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(heartbeatInterval);
    };
  }, []); // Sem dependências para evitar loops

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            display_name: displayName || email.split('@')[0]
          }
        }
      });

      if (error) {
        toast({
          title: "Erro no cadastro",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Cadastro realizado!",
          description: "Verifique seu email para confirmar a conta.",
          variant: "default"
        });
      }

      return { error };
    } catch (error) {
      const authError = error as AuthError;
      toast({
        title: "Erro no cadastro",
        description: authError.message,
        variant: "destructive"
      });
      return { error: authError };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        toast({
          title: "Erro no login",
          description: error.message,
          variant: "destructive"
        });
      }

      return { error };
    } catch (error) {
      const authError = error as AuthError;
      toast({
        title: "Erro no login",
        description: authError.message,
        variant: "destructive"
      });
      return { error: authError };
    }
  };

  const signOut = async () => {
    try {
      // Marcar como offline antes de fazer logout
      if (user?.id) {
        console.log('Fazendo logout, marcando como offline:', user.id);
        await updateOnlineStatus(user.id, false);
      }

      await supabase.auth.signOut();
      setProfile(null);
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
        variant: "default"
      });
    } catch (error) {
      const authError = error as AuthError;
      toast({
        title: "Erro no logout",
        description: authError.message,
        variant: "destructive"
      });
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    profile,
    refetchProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};