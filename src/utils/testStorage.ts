import { supabase } from '@/integrations/supabase/client';

export const testStorageConnection = async () => {
  try {
    console.log('=== Teste de Conexão com Storage ===');
    
    // 1. Testar listagem de buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Erro ao listar buckets:', bucketsError);
      return { success: false, error: bucketsError };
    }
    
    console.log('Buckets disponíveis:', buckets);
    
    // 2. Verificar se o bucket 'avatars' existe
    const avatarBucket = buckets?.find(bucket => bucket.name === 'avatars');
    
    if (!avatarBucket) {
      console.log('Bucket "avatars" não encontrado. Tentando criar...');
      
      const { error: createError } = await supabase.storage.createBucket('avatars', {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'],
        fileSizeLimit: 2097152 // 2MB
      });
      
      if (createError) {
        console.error('Erro ao criar bucket:', createError);
        return { success: false, error: createError };
      }
      
      console.log('Bucket "avatars" criado com sucesso!');
    } else {
      console.log('Bucket "avatars" encontrado:', avatarBucket);
    }
    
    // 3. Testar listagem de arquivos no bucket
    const { data: files, error: filesError } = await supabase.storage
      .from('avatars')
      .list('', {
        limit: 10
      });
    
    if (filesError) {
      console.error('Erro ao listar arquivos:', filesError);
      return { success: false, error: filesError };
    }
    
    console.log('Arquivos no bucket "avatars":', files);
    
    console.log('=== Teste concluído com sucesso ===');
    return { success: true, buckets, files };
    
  } catch (error) {
    console.error('Erro geral no teste:', error);
    return { success: false, error };
  }
};

// Função para testar upload de uma imagem de teste
export const testImageUpload = async (file: File, userId: string) => {
  try {
    console.log('=== Teste de Upload de Imagem ===');
    
    const fileName = `test_avatar_${userId}_${Date.now()}.${file.name.split('.').pop()}`;
    
    console.log('Fazendo upload do arquivo:', fileName);
    
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) {
      console.error('Erro no upload:', error);
      return { success: false, error };
    }
    
    console.log('Upload realizado com sucesso:', data);
    
    // Obter URL pública
    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);
    
    console.log('URL pública:', publicUrlData.publicUrl);
    
    return { 
      success: true, 
      data, 
      publicUrl: publicUrlData.publicUrl,
      fileName 
    };
    
  } catch (error) {
    console.error('Erro geral no teste de upload:', error);
    return { success: false, error };
  }
};