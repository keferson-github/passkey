import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://oyjpnwjwawmgecobeebl.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95anBud2p3YXdtZ2Vjb2JlZWJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NjkwNzQsImV4cCI6MjA2ODM0NTA3NH0.bChgjIpJbVlarNb1yi7Z2nkUXHQduy32CLRj8hYzyyA";

// Cliente com chave pública (anon)
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const verifyAvatarBucketSetup = async () => {
  const results = {
    bucketExists: false,
    bucketPublic: false,
    canListBuckets: false,
    canUpload: false,
    canRead: false,
    errors: [] as string[],
    warnings: [] as string[],
    info: [] as string[]
  };

  try {
    console.log('=== Verificação do Bucket de Avatares ===');
    results.info.push('Iniciando verificação do bucket de avatares...');

    // 1. Verificar se conseguimos listar buckets
    console.log('1. Testando listagem de buckets...');
    try {
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.error('Erro ao listar buckets:', listError);
        results.errors.push(`Erro ao listar buckets: ${listError.message}`);
        results.canListBuckets = false;
      } else {
        console.log('✅ Conseguiu listar buckets');
        results.canListBuckets = true;
        results.info.push(`Encontrados ${buckets?.length || 0} buckets`);
        
        // Verificar se o bucket 'avatars' existe
        const avatarBucket = buckets?.find(bucket => bucket.name === 'avatars');
        
        if (avatarBucket) {
          console.log('✅ Bucket "avatars" encontrado');
          results.bucketExists = true;
          results.bucketPublic = avatarBucket.public || false;
          results.info.push(`Bucket "avatars" existe e é ${avatarBucket.public ? 'público' : 'privado'}`);
          
          console.log('Detalhes do bucket:', avatarBucket);
        } else {
          console.log('❌ Bucket "avatars" NÃO encontrado');
          results.bucketExists = false;
          results.errors.push('Bucket "avatars" não existe');
          
          // Listar buckets existentes
          if (buckets && buckets.length > 0) {
            const bucketNames = buckets.map(b => b.name).join(', ');
            results.info.push(`Buckets existentes: ${bucketNames}`);
          }
        }
      }
    } catch (error) {
      console.error('Erro na listagem de buckets:', error);
      results.errors.push(`Erro na listagem: ${error}`);
      results.canListBuckets = false;
    }

    // 2. Verificar configurações básicas do bucket
    if (results.bucketExists) {
      console.log('2. Verificando configurações do bucket...');
      results.info.push('Bucket "avatars" está disponível para uso');
    }

    // 5. Resumo final
    console.log('=== Resumo da Verificação ===');
    console.log('Bucket existe:', results.bucketExists);
    console.log('Pode listar buckets:', results.canListBuckets);
    console.log('Pode fazer upload:', results.canUpload);
    console.log('Pode ler publicamente:', results.canRead);
    console.log('Bucket é público:', results.bucketPublic);
    
    if (results.errors.length > 0) {
      console.log('Erros encontrados:', results.errors);
    }
    if (results.warnings.length > 0) {
      console.log('Avisos:', results.warnings);
    }

    return results;
    
  } catch (error) {
    console.error('Erro geral na verificação:', error);
    results.errors.push(`Erro geral: ${error}`);
    return results;
  }
};

// Função para gerar relatório legível
export const generateStorageReport = (results: any) => {
  let report = '=== RELATÓRIO DE VERIFICAÇÃO DO STORAGE ===\n\n';
  
  // Status geral
  report += '📊 STATUS GERAL:\n';
  report += `✅ Bucket existe: ${results.bucketExists ? 'SIM' : 'NÃO'}\n`;
  report += `✅ Pode listar buckets: ${results.canListBuckets ? 'SIM' : 'NÃO'}\n`;
  report += `✅ Pode fazer upload: ${results.canUpload ? 'SIM' : 'NÃO'}\n`;
  report += `✅ Pode ler publicamente: ${results.canRead ? 'SIM' : 'NÃO'}\n`;
  report += `✅ Bucket é público: ${results.bucketPublic ? 'SIM' : 'NÃO'}\n\n`;
  
  // Informações
  if (results.info.length > 0) {
    report += '📋 INFORMAÇÕES:\n';
    results.info.forEach((info: string) => {
      report += `• ${info}\n`;
    });
    report += '\n';
  }
  
  // Avisos
  if (results.warnings.length > 0) {
    report += '⚠️ AVISOS:\n';
    results.warnings.forEach((warning: string) => {
      report += `• ${warning}\n`;
    });
    report += '\n';
  }
  
  // Erros
  if (results.errors.length > 0) {
    report += '❌ ERROS:\n';
    results.errors.forEach((error: string) => {
      report += `• ${error}\n`;
    });
    report += '\n';
  }
  
  // Recomendações
  report += '💡 RECOMENDAÇÕES:\n';
  
  if (!results.bucketExists) {
    report += '• Execute o script SQL para criar o bucket "avatars"\n';
  }
  
  if (results.bucketExists && !results.canUpload) {
    report += '• Verifique as políticas RLS para permitir upload por usuários autenticados\n';
  }
  
  if (results.bucketExists && !results.canRead) {
    report += '• Verifique as políticas RLS para permitir leitura pública\n';
  }
  
  if (!results.bucketPublic && results.bucketExists) {
    report += '• Configure o bucket como público para permitir acesso às imagens\n';
  }
  
  if (results.errors.length === 0 && results.canUpload && results.canRead) {
    report += '• ✅ Configuração está correta! O upload de avatares deve funcionar.\n';
  }
  
  return report;
};