-- Adicionar campo is_online na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE;

-- Adicionar campo last_seen para rastrear quando o usuário foi visto pela última vez
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ DEFAULT NOW();

-- Criar índice para melhor performance nas consultas de usuários online
CREATE INDEX IF NOT EXISTS idx_profiles_is_online ON public.profiles(is_online);
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON public.profiles(last_seen);

-- Função para atualizar status online do usuário
CREATE OR REPLACE FUNCTION public.update_user_online_status(user_uuid UUID, online_status BOOLEAN)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  UPDATE profiles 
  SET 
    is_online = online_status,
    last_seen = CASE WHEN online_status THEN NOW() ELSE last_seen END,
    updated_at = NOW()
  WHERE user_id = user_uuid;
END;
$$;

-- Função para marcar usuário como offline após período de inatividade
CREATE OR REPLACE FUNCTION public.cleanup_offline_users()
RETURNS VOID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  -- Marcar como offline usuários que não foram vistos há mais de 5 minutos
  UPDATE profiles 
  SET 
    is_online = FALSE,
    updated_at = NOW()
  WHERE 
    is_online = TRUE 
    AND last_seen < NOW() - INTERVAL '5 minutes';
END;
$$;

-- Comentários para documentação
COMMENT ON COLUMN public.profiles.is_online IS 'Indica se o usuário está atualmente online';
COMMENT ON COLUMN public.profiles.last_seen IS 'Timestamp da última atividade do usuário';
COMMENT ON FUNCTION public.update_user_online_status IS 'Atualiza o status online de um usuário';
COMMENT ON FUNCTION public.cleanup_offline_users IS 'Remove status online de usuários inativos há mais de 5 minutos';