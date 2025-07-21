import { createClient } from '@supabase/supabase-js';

async function verificarUsuariosAdmin() {
  console.log('🔍 Verificando usuários no Supabase (modo admin)...\n');
  
  const supabaseUrl = "https://oyjpnwjwawmgecobeebl.supabase.co";
  const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95anBud2p3YXdtZ2Vjb2JlZWJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjc2OTA3NCwiZXhwIjoyMDY4MzQ1MDc0fQ.59HQPkwOjr-tZtXCWja_5JhA2h6Y5jbxqVLcid8_ydM";
  
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  // 1. Verificar usuários autenticados (auth.users)
  console.log('👥 Verificando usuários cadastrados:');
  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) {
      console.log('   ❌ Erro ao listar usuários:', error.message);
    } else if (data && data.users) {
      console.log(`   📊 Total de usuários cadastrados: ${data.users.length}`);
      
      if (data.users.length > 0) {
        console.log('\n   📋 Lista de usuários:');
        data.users.forEach((user, index) => {
          console.log(`   ${index + 1}. Email: ${user.email}`);
          console.log(`      ID: ${user.id}`);
          console.log(`      Confirmado: ${user.email_confirmed_at ? 'Sim' : 'Não'}`);
          console.log(`      Último login: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('pt-BR') : 'Nunca'}`);
          console.log(`      Criado em: ${new Date(user.created_at).toLocaleString('pt-BR')}`);
          console.log(`      Atualizado em: ${new Date(user.updated_at).toLocaleString('pt-BR')}`);
          console.log(`      Fatores MFA: ${user.factors ? user.factors.length : 0}`);
          console.log(`      Bloqueado: ${user.banned ? 'Sim' : 'Não'}`);
          console.log('      -------------------------');
        });
      } else {
        console.log('   ℹ️ Nenhum usuário cadastrado encontrado');
      }
    }
  } catch (err) {
    console.log('   ❌ Erro ao verificar usuários:', err.message);
  }
  
  // 2. Verificar perfis de usuários
  console.log('\n👤 Verificando perfis de usuários:');
  try {
    const { data: profiles, error, count } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact' });
      
    if (error) {
      console.log('   ❌ Erro ao buscar perfis:', error.message);
    } else {
      console.log(`   📊 Total de perfis: ${count || 0}`);
      
      if (profiles && profiles.length > 0) {
        console.log('\n   📋 Lista de perfis:');
        profiles.forEach((profile, index) => {
          console.log(`   ${index + 1}. ID: ${profile.id}`);
          console.log(`      User ID: ${profile.user_id}`);
          console.log(`      Nome: ${profile.display_name || 'Não definido'}`);
          console.log(`      Status: ${profile.is_active ? 'Ativo' : 'Inativo'}`);
          console.log(`      Tipo: ${profile.is_admin ? 'Administrador' : 'Usuário comum'}`);
          console.log(`      Criado em: ${new Date(profile.created_at).toLocaleString('pt-BR')}`);
          console.log(`      Atualizado em: ${new Date(profile.updated_at).toLocaleString('pt-BR')}`);
          console.log('      -------------------------');
        });
      } else {
        console.log('   ℹ️ Nenhum perfil encontrado na tabela profiles');
      }
    }
  } catch (err) {
    console.log('   ❌ Erro ao verificar perfis:', err.message);
  }
  
  // 3. Verificar sessões ativas
  console.log('\n🔐 Verificando sessões ativas:');
  try {
    // Usando SQL para acessar a tabela de sessões
    const { data, error } = await supabaseAdmin.rpc('get_active_sessions');
    
    if (error) {
      console.log('   ❌ Erro ao verificar sessões:', error.message);
      
      // Tentar abordagem alternativa
      console.log('   ℹ️ Tentando abordagem alternativa...');
      const { data: sessions, error: sessionsError } = await supabaseAdmin
        .from('auth.sessions')
        .select('*')
        .limit(10);
        
      if (sessionsError) {
        console.log('   ❌ Erro ao verificar sessões (alternativa):', sessionsError.message);
      } else if (sessions && sessions.length > 0) {
        console.log(`   📊 Total de sessões ativas: ${sessions.length}`);
        sessions.forEach((session, index) => {
          console.log(`   ${index + 1}. Usuário: ${session.user_id}`);
          console.log(`      Criada em: ${new Date(session.created_at).toLocaleString('pt-BR')}`);
          console.log('      -------------------------');
        });
      } else {
        console.log('   ℹ️ Nenhuma sessão ativa encontrada');
      }
    } else if (data && data.length > 0) {
      console.log(`   📊 Total de sessões ativas: ${data.length}`);
      data.forEach((session, index) => {
        console.log(`   ${index + 1}. Usuário: ${session.user_id}`);
        console.log(`      Criada em: ${new Date(session.created_at).toLocaleString('pt-BR')}`);
        console.log('      -------------------------');
      });
    } else {
      console.log('   ℹ️ Nenhuma sessão ativa encontrada');
    }
  } catch (err) {
    console.log('   ❌ Erro ao verificar sessões:', err.message);
  }
  
  // Resumo final
  console.log('\n📋 RESUMO DE USUÁRIOS:');
  console.log('   🌐 URL do projeto: https://oyjpnwjwawmgecobeebl.supabase.co');
}

verificarUsuariosAdmin().catch(console.error);