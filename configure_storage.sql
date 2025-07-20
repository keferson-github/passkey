-- Script para configurar o storage de avatares no Supabase
-- Execute este script no SQL Editor do Supabase

-- 1. Criar o bucket se não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 
  'avatars', 
  true, 
  2097152, -- 2MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];

-- 2. Remover políticas existentes se houver
DROP POLICY IF EXISTS "authenticated_users_can_upload_avatars" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_users_can_update_avatars" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_users_can_delete_avatars" ON storage.objects;
DROP POLICY IF EXISTS "public_can_read_avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public can read avatars" ON storage.objects;

-- 3. Criar políticas de acesso
-- Permitir que usuários autenticados façam upload
CREATE POLICY "authenticated_users_can_upload_avatars" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars');

-- Permitir que usuários autenticados atualizem arquivos
CREATE POLICY "authenticated_users_can_update_avatars" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars');

-- Permitir que usuários autenticados deletem arquivos
CREATE POLICY "authenticated_users_can_delete_avatars" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars');

-- Permitir leitura pública de todos os avatares
CREATE POLICY "public_can_read_avatars" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

-- 4. Verificar se as políticas foram criadas
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;