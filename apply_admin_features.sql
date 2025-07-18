-- Script para aplicar as funcionalidades de admin ao projeto
-- Execute este script no painel do Supabase ou via CLI

-- 1. Adicionar colunas de admin e ativo à tabela profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 2. Definir o email admin como administrador
-- (Substitua 'contato@techsolutionspro.com.br' pelo email real do admin)
UPDATE profiles 
SET is_admin = TRUE 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email = 'contato@techsolutionspro.com.br'
);

-- 3. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);

-- 4. Verificar se as alterações foram aplicadas
SELECT 
  p.id,
  p.user_id,
  p.display_name,
  au.email,
  p.is_admin,
  p.is_active,
  p.created_at
FROM profiles p
LEFT JOIN auth.users au ON p.user_id = au.id
ORDER BY p.created_at DESC;
