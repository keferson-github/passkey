import { createClient } from '@supabase/supabase-js';

// Função principal para verificar a contagem de usuários
async function verificarUsuarios() {
  try {
    console.log('🔍 Verificando usuários no banco de dados Supabase...\n');
    
    // Cria cliente Supabase usando as credenciais do projeto
    const supabaseUrl = "https://oyjpnwjwawmgecobeebl.supabase.co";
    const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95anBud2p3YXdtZ2Vjb2JlZWJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NjkwNzQsImV4cCI6MjA2ODM0NTA3NH0.bChgjIpJbVlarNb1yi7Z2nkUXHQduy32CLRj8hYzyyA";
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // 1. Verificar contagem de perfis na tabela profiles
    const { data: profiles, error: profilesError, count: profilesCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' });
      
    if (profilesError) {
      console.error('❌ Erro ao buscar perfis:', profilesError.message);
    } else {
      console.log(`📊 Total de usuários cadastrados: ${profilesCount || 0}`);
      
      if (profiles && profiles.length > 0) {
        // Contar usuários ativos e inativos
        const usuariosAtivos = profiles.filter(p => p.is_active).length;
        const usuariosInativos = profiles.filter(p => !p.is_active).length;
        const admins = profiles.filter(p => p.is_admin).length;
        
        console.log(`✅ Usuários ativos: ${usuariosAtivos}`);
        console.log(`❌ Usuários inativos: ${usuariosInativos}`);
        console.log(`👑 Administradores: ${admins}`);
        
        console.log('\n👥 Lista de usuários:');
        profiles.forEach((profile, index) => {
          console.log(`   ${index + 1}. ${profile.display_name || 'Sem nome'} (${profile.is_admin ? 'Admin' : 'Usuário'}) - ${profile.is_active ? 'Ativo' : 'Inativo'}`);
        });
      } else {
        console.log('   Nenhum perfil encontrado.');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar a função
verificarUsuarios();