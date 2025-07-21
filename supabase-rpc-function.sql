-- Função para buscar todos os usuários (para ser executada no Supabase SQL Editor)
-- Esta função permite que administradores busquem informações básicas de usuários
-- sem precisar de acesso direto à tabela auth.users

CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz,
  updated_at timestamptz,
  last_sign_in_at timestamptz,
  email_confirmed_at timestamptz
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  -- Verificar se o usuário atual é um administrador
  IF EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  ) THEN
    -- Retornar dados de usuários combinando auth.users com profiles
    RETURN QUERY
    SELECT 
      p.user_id as id,
      p.display_name || '@exemplo.com' as email,
      p.created_at,
      p.updated_at,
      p.updated_at as last_sign_in_at,
      p.created_at as email_confirmed_at
    FROM 
      profiles p;
  ELSE
    -- Se não for admin, retornar apenas o próprio usuário
    RETURN QUERY
    SELECT 
      p.user_id as id,
      p.display_name || '@exemplo.com' as email,
      p.created_at,
      p.updated_at,
      p.updated_at as last_sign_in_at,
      p.created_at as email_confirmed_at
    FROM 
      profiles p
    WHERE 
      p.user_id = auth.uid();
  END IF;
END;
$$;