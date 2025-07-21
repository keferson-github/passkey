import { createClient } from '@supabase/supabase-js';

async function verificarEstruturaBanco() {
  try {
    console.log('🔍 Verificando estrutura do banco de dados Supabase...\n');
    
    const supabaseUrl = "https://oyjpnwjwawmgecobeebl.supabase.co";
    const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95anBud2p3YXdtZ2Vjb2JlZWJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NjkwNzQsImV4cCI6MjA2ODM0NTA3NH0.bChgjIpJbVlarNb1yi7Z2nkUXHQduy32CLRj8hYzyyA";
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Tentar diferentes abordagens para verificar usuários
    console.log('📋 Tentando verificar diferentes tabelas...\n');
    
    // 1. Verificar tabela profiles
    try {
      const { data, error, count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .limit(5);
      
      console.log('✅ Tabela profiles:');
      console.log(`   Registros: ${count || 0}`);
      if (data && data.length > 0) {
        console.log('   Dados encontrados:', data);
      }
    } catch (err) {
      console.log('❌ Erro ao acessar tabela profiles:', err.message);
    }
    
    // 2. Verificar tabela users (se existir)
    try {
      const { data, error, count } = await supabase
        .from('users')
        .select('*', { count: 'exact' })
        .limit(5);
      
      console.log('\n✅ Tabela users:');
      console.log(`   Registros: ${count || 0}`);
      if (data && data.length > 0) {
        console.log('   Dados encontrados:', data);
      }
    } catch (err) {
      console.log('\n❌ Tabela users não acessível:', err.message);
    }
    
    // 3. Verificar tabela auth_users (se existir)
    try {
      const { data, error, count } = await supabase
        .from('auth_users')
        .select('*', { count: 'exact' })
        .limit(5);
      
      console.log('\n✅ Tabela auth_users:');
      console.log(`   Registros: ${count || 0}`);
      if (data && data.length > 0) {
        console.log('   Dados encontrados:', data);
      }
    } catch (err) {
      console.log('\n❌ Tabela auth_users não acessível:', err.message);
    }
    
    // 4. Verificar sessões ativas
    try {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('\n🔐 Status da sessão atual:');
      if (session) {
        console.log('   ✅ Sessão ativa encontrada');
        console.log(`   Usuário: ${session.user.email}`);
        console.log(`   Expira em: ${new Date(session.expires_at * 1000).toLocaleString('pt-BR')}`);
      } else {
        console.log('   ❌ Nenhuma sessão ativa');
      }
    } catch (err) {
      console.log('\n❌ Erro ao verificar sessão:', err.message);
    }
    
    // 5. Verificar usuário atual
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('\n👤 Usuário atual:');
      if (user) {
        console.log('   ✅ Usuário autenticado');
        console.log(`   ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
      } else {
        console.log('   ❌ Nenhum usuário autenticado');
      }
    } catch (err) {
      console.log('\n❌ Erro ao verificar usuário atual:', err.message);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

verificarEstruturaBanco();