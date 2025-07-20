-- Script completo para configurar o storage de avatares
-- Execute este script completo no SQL Editor do Supabase

-- 1. Criar o bucket avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 
  'avatars', 
  true, 
  2097152,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];

-- 2. Remover todas as políticas antigas relacionadas a avatares
DROP POLICY IF EXISTS "authenticated_users_can_upload_avatars" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_users_can_update_avatars" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_users_can_delete_avatars" ON storage.objects;
DROP POLICY IF EXISTS "public_can_read_avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public can read avatars" ON storage.objects;

-- 3. Criar políticas simples e funcionais
CREATE POLICY "Allow authenticated users to upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Allow authenticated users to update avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');

CREATE POLICY "Allow authenticated users to delete avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');

CREATE POLICY "Allow public to read avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- 4. Verificar se tudo foi criado corretamente
SELECT 'Bucket criado:' as status, * FROM storage.buckets WHERE name = 'avatars'
UNION ALL
SELECT 'Políticas criadas:' as status, policyname::text, cmd::text, ''::text, ''::text, ''::text, ''::text, ''::text, ''::text
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname LIKE '%avatar%';