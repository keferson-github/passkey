import { createClient } from '@supabase/supabase-js';

async function testOnlineStatus() {
  console.log('🔍 Testando funcionalidade de status online...\n');
  
  const supabaseUrl = "https://oyjpnwjwawmgecobeebl.supabase.co";
  const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95anBud2p3YXdtZ2Vjb2JlZWJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjc2OTA3NCwiZXhwIjoyMDY4MzQ1MDc0fQ.59HQPkwOjr-tZtXCWja_5JhA2h6Y5jbxqVLcid8_ydM";
  
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  
  // Teste 1: Verificar se os campos foram adicionados
  console.log('📋 Teste 1: Verificando estrutura da tabela profiles');
  try {
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('id, display_name, is_online, last_seen')
      .limit(5);
    
    if (error) {
      console.log('   ❌ Erro ao buscar perfis:', error.message);
      
      // Se der erro, pode ser que os campos não existam ainda
      console.log('   ℹ️  Tentando buscar sem os novos campos...');
      const { data: basicProfiles, error: basicError } = await supabaseAdmin
        .from('profiles')
        .select('id, display_name')
        .limit(5);
        
      if (basicError) {
        console.log('   ❌ Erro mesmo com campos básicos:', basicError.message);
      } else {
        console.log('   ⚠️  Tabela profiles existe, mas campos is_online/last_seen podem não ter sido adicionados ainda');
        console.log('   📝 Execute o script SQL add-online-status.sql no painel do Supabase');
      }
    } else {
      console.log(`   ✅ Estrutura OK - ${profiles?.length || 0} perfis encontrados`);
      if (profiles && profiles.length > 0) {
        profiles.forEach((profile, index) => {
          console.log(`   ${index + 1}. ${profile.display_name} - Online: ${profile.is_online ? 'Sim' : 'Não'} - Visto: ${profile.last_seen || 'Nunca'}`);
        });
      }
    }
  } catch (err) {
    console.log('   ❌ Erro de exceção:', err.message);
  }
  
  // Teste 2: Testar função RPC
  console.log('\n📋 Teste 2: Testando função update_user_online_status');
  try {
    // Buscar um usuário para testar
    const { data: testUser, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, display_name')
      .limit(1)
      .single();
    
    if (userError || !testUser) {
      console.log('   ❌ Nenhum usuário encontrado para teste');
    } else {
      console.log(`   🧪 Testando com usuário: ${testUser.display_name}`);
      
      // Testar marcar como online
      const { error: onlineError } = await supabaseAdmin.rpc('update_user_online_status', {
        user_uuid: testUser.user_id,
        online_status: true
      });
      
      if (onlineError) {
        console.log('   ❌ Erro ao chamar função RPC:', onlineError.message);
        console.log('   📝 Certifique-se de que a função foi criada no banco de dados');
      } else {
        console.log('   ✅ Função RPC funcionando - usuário marcado como online');
        
        // Verificar se foi atualizado
        const { data: updatedUser, error: checkError } = await supabaseAdmin
          .from('profiles')
          .select('display_name, is_online, last_seen')
          .eq('user_id', testUser.user_id)
          .single();
        
        if (!checkError && updatedUser) {
          console.log(`   📊 Status atualizado: ${updatedUser.display_name} - Online: ${updatedUser.is_online} - Visto: ${updatedUser.last_seen}`);
        }
      }
    }
  } catch (err) {
    console.log('   ❌ Erro de exceção no teste RPC:', err.message);
  }
  
  // Teste 3: Verificar função de cleanup
  console.log('\n📋 Teste 3: Testando função cleanup_offline_users');
  try {
    const { error: cleanupError } = await supabaseAdmin.rpc('cleanup_offline_users');
    
    if (cleanupError) {
      console.log('   ❌ Erro ao chamar função cleanup:', cleanupError.message);
    } else {
      console.log('   ✅ Função cleanup executada com sucesso');
    }
  } catch (err) {
    console.log('   ❌ Erro de exceção no cleanup:', err.message);
  }
  
  console.log('\n📋 RESUMO:');
  console.log('   1. Execute o script add-online-status.sql no painel do Supabase se ainda não foi executado');
  console.log('   2. Os campos is_online e last_seen serão adicionados à tabela profiles');
  console.log('   3. As funções RPC serão criadas para gerenciar o status online');
  console.log('   4. O AuthContext atualizará automaticamente o status quando usuários fizerem login/logout');
}

testOnlineStatus().catch(console.error);