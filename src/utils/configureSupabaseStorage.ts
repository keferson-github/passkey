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

