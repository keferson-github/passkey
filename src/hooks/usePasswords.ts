import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface Password {
  id: string;
  title: string;
  email: string;
  password_hash: string;
  description?: string;
  created_at: string;
  updated_at: string;
  category: {
    id: string;
    name: string;
    icon?: string;
  };
  account_type: {
    id: string;
    name: string;
    icon?: string;
  };
  subcategory?: {
    id: string;
    name: string;
    icon?: string;
  };
}

export const usePasswords = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: passwords = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['passwords', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('passwords')
        .select(`
          id,
          title,
          email,
          password_hash,
          description,
          created_at,
          updated_at,
          category:password_categories(id, name, icon),
          account_type:account_types(id, name, icon),
          subcategory:account_subcategories(id, name, icon)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching passwords:', error);
        throw error;
      }

      return data as Password[];
    },
    enabled: !!user,
  });

  const deletePasswordMutation = useMutation({
    mutationFn: async (passwordId: string) => {
      const { error } = await supabase
        .from('passwords')
        .delete()
        .eq('id', passwordId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passwords'] });
      toast({
        title: "Senha removida",
        description: "A senha foi removida com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error deleting password:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a senha.",
        variant: "destructive",
      });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: {
        title?: string;
        email?: string;
        password_hash?: string;
        description?: string | null;
        category_id?: string;
        account_type_id?: string;
        subcategory_id?: string | null;
      }
    }) => {
      const { error } = await supabase
        .from('passwords')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passwords'] });
      toast({
        title: "Senha atualizada",
        description: "A senha foi atualizada com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error updating password:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a senha.",
        variant: "destructive",
      });
    },
  });

  return {
    passwords,
    isLoading,
    error,
    refetch,
    deletePassword: deletePasswordMutation.mutate,
    updatePassword: updatePasswordMutation.mutate,
    isDeleting: deletePasswordMutation.isPending,
    isUpdating: updatePasswordMutation.isPending,
  };
};

export const usePasswordStats = () => {
  const { passwords, isLoading } = usePasswords();

  const stats = {
    total: passwords.length,
    strong: passwords.filter(p => p.password_hash && p.password_hash.length >= 12).length,
    weak: passwords.filter(p => p.password_hash && p.password_hash.length < 8).length,
    recent: passwords.filter(p => {
      const daysDiff = Math.floor(
        (new Date().getTime() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysDiff <= 7;
    }).length,
  };

  return {
    stats,
    isLoading,
  };
};
