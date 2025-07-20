-- Script para verificar e criar o bucket de avatares
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se o bucket existe
SELECT * FROM storage.buckets WHERE name = 'avatars';

-- 2. Se não existir, criar o bucket (execute apenas se a consulta acima retornar vazio)
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

-- 3. Verificar novamente se foi criado
SELECT * FROM storage.buckets WHERE name = 'avatars';

-- 4. Verificar políticas existentes
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
AND policyname LIKE '%avatar%';