import { createClient } from '@supabase/supabase-js';

// Função para verificar usuários autenticados
async function verificarUsuariosAutenticados() {
  try {
    console.log('🔍 Verificando usuários autenticados no Supabase...\n');
    
    const supabaseUrl = "https://oyjpnwjwawmgecobeebl.supabase.co";
    const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95anBud2p3YXdtZ2Vjb2JlZWJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NjkwNzQsImV4cCI6MjA2ODM0NTA3NH0.bChgjIpJbVlarNb1yi7Z2nkUXHQduy32CLRj8hYzyyA";
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // 1. Verificar usuário atual autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.log('ℹ️  Nenhum usuário autenticado na sessão atual');
    } else if (user) {
      console.log('✅ Usuário autenticado encontrado:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Criado em: ${new Date(user.created_at).toLocaleString('pt-BR')}`);
      console.log(`   Último login: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('pt-BR') : 'N/A'}`);
    }
    
    // 2. Verificar sessão ativa
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('ℹ️  Erro ao verificar sessão:', sessionError.message);
    } else if (session) {
      console.log('\n🔐 Sessão ativa encontrada:');
      console.log(`   Token expira em: ${new Date(session.expires_at * 1000).toLocaleString('pt-BR')}`);
      console.log(`   Tipo de token: ${session.token_type}`);
    } else {
      console.log('\nℹ️  Nenhuma sessão ativa encontrada');
    }
    
    // 3. Verificar tabela profiles
    const { data: profiles, error: profilesError, count: profilesCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' });
      
    console.log('\n📊 Verificando tabela profiles:');
    if (profilesError) {
      console.error('❌ Erro ao buscar perfis:', profilesError.message);
    } else {
      console.log(`   Total de perfis: ${profilesCount || 0}`);
      
      if (profiles && profiles.length > 0) {
        const usuariosAtivos = profiles.filter(p => p.is_active).length;
        const usuariosInativos = profiles.filter(p => !p.is_active).length;
        const admins = profiles.filter(p => p.is_admin).length;
        
        console.log(`   ✅ Usuários ativos: ${usuariosAtivos}`);
        console.log(`   ❌ Usuários inativos: ${usuariosInativos}`);
        console.log(`   👑 Administradores: ${admins}`);
        
        console.log('\n👥 Lista de perfis:');
        profiles.forEach((profile, index) => {
          console.log(`   ${index + 1}. ${profile.display_name || 'Sem nome'} (${profile.is_admin ? 'Admin' : 'Usuário'}) - ${profile.is_active ? 'Ativo' : 'Inativo'}`);
        });
      } else {
        console.log('   Nenhum perfil encontrado na tabela profiles');
      }
    }
    
    // 4. Tentar verificar outras tabelas relacionadas a usuários
    console.log('\n🔍 Verificando outras tabelas...');
    
    // Verificar se existe tabela de sessões ou logs
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
      
    if (!tablesError && tables) {
      console.log('📋 Tabelas disponíveis:');
      tables.forEach(table => {
        console.log(`   - ${table.table_name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar a função
verificarUsuariosAutenticados();