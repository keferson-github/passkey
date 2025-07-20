import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://oyjpnwjwawmgecobeebl.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95anBud2p3YXdtZ2Vjb2JlZWJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjc2OTA3NCwiZXhwIjoyMDY4MzQ1MDc0fQ.59HQPkwOjr-tZtXCWja_5JhA2h6Y5jbxqVLcid8_ydM";

// Cliente com privilégios de administrador
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export const configureAvatarStorage = async () => {
  try {
    console.log('=== Configurando Storage para Avatares ===');
    
    // 1. Verificar buckets existentes
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
    
    if (listError) {
      console.error('Erro ao listar buckets:', listError);
      throw listError;
    }
    
    console.log('Buckets existentes:', buckets);
    
    // 2. Criar bucket 'avatars' se não existir
    const avatarBucket = buckets.find(bucket => bucket.name === 'avatars');
    
    if (!avatarBucket) {
      console.log('Criando bucket "avatars"...');
      
      const { data: createData, error: createError } = await supabaseAdmin.storage.createBucket('avatars', {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'],
        fileSizeLimit: 2097152 // 2MB
      });
      
      if (createError) {
        console.error('Erro ao criar bucket:', createError);
        throw createError;
      }
      
      console.log('Bucket "avatars" criado com sucesso:', createData);
    } else {
      console.log('Bucket "avatars" já existe');
      
      // Atualizar configurações do bucket existente
      const { error: updateError } = await supabaseAdmin.storage.updateBucket('avatars', {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'],
        fileSizeLimit: 2097152 // 2MB
      });
      
      if (updateError) {
        console.warn('Aviso ao atualizar bucket:', updateError);
      } else {
        console.log('Configurações do bucket atualizadas');
      }
    }
    
    console.log('=== Configuração concluída com sucesso ===');
    return { success: true, message: 'Storage configurado com sucesso' };
    
  } catch (error) {
    console.error('Erro na configuração do storage:', error);
    return { success: false, error };
  }
};

// Função para testar upload com credenciais de admin
export const testAvatarUpload = async (userId: string) => {
  try {
    console.log('=== Teste de Upload com Admin ===');
    
    // Criar um arquivo de teste (1x1 pixel PNG)
    const testImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    const response = await fetch(testImageData);
    const blob = await response.blob();
    const file = new File([blob], 'test.png', { type: 'image/png' });
    
    const fileName = `test_admin_${userId}_${Date.now()}.png`;
    
    const { data, error } = await supabaseAdmin.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) {
      console.error('Erro no teste de upload:', error);
      return { success: false, error };
    }
    
    console.log('Upload de teste realizado com sucesso:', data);
    
    // Obter URL pública
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('avatars')
      .getPublicUrl(fileName);
    
    console.log('URL pública do teste:', publicUrlData.publicUrl);
    
    // Remover arquivo de teste
    const { error: deleteError } = await supabaseAdmin.storage
      .from('avatars')
      .remove([fileName]);
    
    if (deleteError) {
      console.warn('Aviso ao remover arquivo de teste:', deleteError);
    } else {
      console.log('Arquivo de teste removido');
    }
    
    return { 
      success: true, 
      data, 
      publicUrl: publicUrlData.publicUrl 
    };
    
  } catch (error) {
    console.error('Erro no teste de upload:', error);
    return { success: false, error };
  }
};