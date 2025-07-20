# Guia de Configuração do Storage de Avatares

## Problema Atual
O bucket "avatars" não foi encontrado, causando o erro no upload de imagens.

## Solução Definitiva

### Passo 1: Acesse o Console do Supabase
1. Vá para https://supabase.com/dashboard
2. Faça login na sua conta
3. Selecione o projeto: `oyjpnwjwawmgecobeebl`

### Passo 2: Execute o Script SQL
1. No painel lateral, clique em **SQL Editor**
2. Clique em **New Query**
3. Cole o script abaixo e execute:

```sql
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
SELECT 'Bucket criado:' as status, name, public, file_size_limit 
FROM storage.buckets WHERE name = 'avatars';
```

### Passo 3: Verificar a Configuração
Após executar o script, execute esta consulta para verificar:

```sql
-- Verificar se o bucket foi criado
SELECT * FROM storage.buckets WHERE name = 'avatars';

-- Verificar se as políticas foram criadas
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage' 
AND policyname LIKE '%avatar%';
```

### Passo 4: Testar o Upload
1. Volte para o seu projeto
2. Recarregue a página de configurações
3. Vá para a seção "Avatar" na aba "Conta"
4. Tente fazer upload de uma imagem

## Resultado Esperado
- ✅ Bucket "avatars" criado e configurado
- ✅ Políticas de acesso configuradas
- ✅ Upload de imagem funcionando
- ✅ Sem mensagens de erro no console

## Troubleshooting

### Se ainda houver erro "Bucket not found":
1. Verifique se você executou o script no projeto correto
2. Aguarde alguns minutos para propagação
3. Recarregue a página completamente (Ctrl+F5)

### Se houver erro de permissão:
1. Certifique-se de que está logado no sistema
2. Verifique se o token de autenticação não expirou
3. Faça logout e login novamente se necessário

### Para verificar se o bucket existe via código:
O componente ImageUpload já faz essa verificação automaticamente e mostra mensagens informativas no console.

## Notas Importantes
- O bucket será público para leitura (necessário para exibir avatares)
- Apenas usuários autenticados podem fazer upload/update/delete
- Limite de 2MB por arquivo
- Tipos permitidos: PNG, JPEG, JPG, GIF, WEBP