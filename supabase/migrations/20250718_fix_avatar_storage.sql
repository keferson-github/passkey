-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Allow authenticated users to upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to avatars" ON storage.objects;

-- Criar o bucket se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET
  public = true;

-- Política para permitir que usuários autenticados façam upload
CREATE POLICY "authenticated_users_can_upload_avatars" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars');

-- Política para permitir que usuários autenticados atualizem arquivos
CREATE POLICY "authenticated_users_can_update_avatars" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars');

-- Política para permitir que usuários autenticados deletem arquivos
CREATE POLICY "authenticated_users_can_delete_avatars" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars');

-- Política para permitir leitura pública de todos os avatares
CREATE POLICY "public_can_read_avatars" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

-- Verificar se as políticas foram criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';