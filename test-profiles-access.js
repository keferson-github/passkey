import { createClient } from '@supabase/supabase-js';

async function testProfilesAccess() {
  console.log('🔍 Testando acesso à tabela profiles...\n');
  
  const supabaseUrl = "https://oyjpnwjwawmgecobeebl.supabase.co";
  const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95anBud2p3YXdtZ2Vjb2JlZWJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NjkwNzQsImV4cCI6MjA2ODM0NTA3NH0.bChgjIpJbVlarNb1yi7Z2nkUXHQduy32CLRj8hYzyyA";
  const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95anBud2p3YXdtZ2Vjb2JlZWJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjc2OTA3NCwiZXhwIjoyMDY4MzQ1MDc0fQ.59HQPkwOjr-tZtXCWja_5JhA2h6Y5jbxqVLcid8_ydM";
  
  // Teste 1: Com chave anon (como o componente usa)
  console.log('📋 Teste 1: Acesso com chave anon (como no componente)');
  const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    const { data: profilesAnon, error: errorAnon } = await supabaseAnon
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (errorAnon) {
      console.log('   ❌ Erro com chave anon:', errorAnon.message);
    } else {
      console.log(`   ✅ Perfis encontrados com chave anon: ${profilesAnon?.length || 0}`);
      if (profilesAnon && profilesAnon.length > 0) {
        profilesAnon.forEach((profile, index) => {
          console.log(`   ${index + 1}. ${profile.display_name} (${profile.is_admin ? 'Admin' : 'Comum'}) - ${profile.is_active ? 'Ativo' : 'Inativo'}`);
        });
      }
    }
  } catch (err) {
    console.log('   ❌ Erro de exceção com chave anon:', err.message);
  }
  
  // Teste 2: Com chave de serviço (para comparação)
  console.log('\n📋 Teste 2: Acesso com chave de serviço (para comparação)');
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    const { data: profilesAdmin, error: errorAdmin } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (errorAdmin) {
      console.log('   ❌ Erro com chave de serviço:', errorAdmin.message);
    } else {
      console.log(`   ✅ Perfis encontrados com chave de serviço: ${profilesAdmin?.length || 0}`);
      if (profilesAdmin && profilesAdmin.length > 0) {
        profilesAdmin.forEach((profile, index) => {
          console.log(`   ${index + 1}. ${profile.display_name} (${profile.is_admin ? 'Admin' : 'Comum'}) - ${profile.is_active ? 'Ativo' : 'Inativo'}`);
        });
      }
    }
  } catch (err) {
    console.log('   ❌ Erro de exceção com chave de serviço:', err.message);
  }
  
  // Teste 3: Verificar usuários de autenticação
  console.log('\n📋 Teste 3: Verificar usuários de autenticação');
  try {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.log('   ❌ Erro ao buscar usuários de auth:', authError.message);
    } else if (authData?.users) {
      console.log(`   ✅ Usuários de auth encontrados: ${authData.users.length}`);
      authData.users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} - Confirmado: ${user.email_confirmed_at ? 'Sim' : 'Não'} - Último login: ${user.last_sign_in_at || 'Nunca'}`);
      });
    }
  } catch (err) {
    console.log('   ❌ Erro de exceção ao buscar auth:', err.message);
  }
}

testProfilesAccess().catch(console.error);