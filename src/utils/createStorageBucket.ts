import { supabase } from '@/integrations/supabase/client';

export const createAvatarBucket = async () => {
  try {
    // Verificar se o bucket já existe
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Erro ao listar buckets:', listError);
      return { success: false, error: listError };
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === 'user-avatars');
    
    if (bucketExists) {
      console.log('Bucket user-avatars já existe');
      return { success: true, message: 'Bucket já existe' };
    }
    
    // Criar o bucket se não existir
    const { data, error } = await supabase.storage.createBucket('user-avatars', {
      public: true,
      fileSizeLimit: 2097152, // 2MB em bytes
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
    });
    
    if (error) {
      console.error('Erro ao criar bucket:', error);
      return { success: false, error };
    }
    
    console.log('Bucket user-avatars criado com sucesso:', data);
    
    // Configurar políticas de acesso
    // Nota: Isso normalmente seria feito via SQL, mas estamos tentando uma abordagem direta
    
    return { success: true, message: 'Bucket criado com sucesso' };
  } catch (error) {
    console.error('Erro ao criar bucket:', error);
    return { success: false, error };
  }
};