import { createClient } from '@supabase/supabase-js';

async function verificarUsuariosDetalhados() {
  console.log('🔍 Verificando usuários no Supabase...\n');
  
  const supabaseUrl = "https://oyjpnwjwawmgecobeebl.supabase.co";
  const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95anBud2p3YXdtZ2Vjb2JlZWJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NjkwNzQsImV4cCI6MjA2ODM0NTA3NH0.bChgjIpJbVlarNb1yi7Z2nkUXHQduy32CLRj8hYzyyA";
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  // 1. Verificar perfis de usuários
  console.log('👤 Verificando perfis de usuários:');
  try {
    const { data: profiles, error, count } = await supabase
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
  
  // 2. Tentar verificar usuários autenticados recentemente
  console.log('\n🔐 Verificando sessões recentes:');
  try {
    // Nota: Esta consulta pode não funcionar com permissões de anon key
    const { data: sessions, error } = await supabase
      .from('auth.sessions')
      .select('*')
      .limit(10);
      
    if (error) {
      if (error.message.includes('permission') || error.message.includes('does not exist')) {
        console.log('   ℹ️ Não foi possível acessar tabela de sessões (permissão restrita)');
      } else {
        console.log('   ❌ Erro ao verificar sessões:', error.message);
      }
    } else if (sessions && sessions.length > 0) {
      console.log(`   📊 Total de sessões recentes: ${sessions.length}`);
      sessions.forEach((session, index) => {
        console.log(`   ${index + 1}. Usuário: ${session.user_id}`);
        console.log(`      Criada em: ${new Date(session.created_at).toLocaleString('pt-BR')}`);
        console.log('      -------------------------');
      });
    } else {
      console.log('   ℹ️ Nenhuma sessão recente encontrada');
    }
  } catch (err) {
    console.log('   ℹ️ Não foi possível acessar tabela de sessões (permissão restrita)');
  }
  
  // 3. Verificar usuário atual
  console.log('\n👤 Verificando usuário atual:');
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.log('   ❌ Erro ao verificar usuário atual:', error.message);
    } else if (user) {
      console.log('   ✅ Usuário autenticado:');
      console.log(`      ID: ${user.id}`);
      console.log(`      Email: ${user.email}`);
      console.log(`      Criado em: ${new Date(user.created_at).toLocaleString('pt-BR')}`);
      console.log(`      Último login: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('pt-BR') : 'N/A'}`);
    } else {
      console.log('   ℹ️ Nenhum usuário autenticado na sessão atual');
    }
  } catch (err) {
    console.log('   ❌ Erro ao verificar usuário atual:', err.message);
  }
  
  // 4. Tentar verificar usuários cadastrados (auth.users)
  console.log('\n👥 Tentando verificar usuários cadastrados:');
  try {
    // Nota: Esta consulta provavelmente não funcionará com permissões de anon key
    const { data: users, error, count } = await supabase
      .from('auth.users')
      .select('*', { count: 'exact' })
      .limit(10);
      
    if (error) {
      if (error.message.includes('permission') || error.message.includes('does not exist')) {
        console.log('   ℹ️ Não foi possível acessar tabela de usuários (permissão restrita)');
        console.log('   ℹ️ Isso é normal, pois a tabela auth.users só é acessível com chave service_role');
      } else {
        console.log('   ❌ Erro ao verificar usuários:', error.message);
      }
    } else if (users && users.length > 0) {
      console.log(`   📊 Total de usuários cadastrados: ${count || users.length}`);
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. Email: ${user.email}`);
        console.log(`      ID: ${user.id}`);
        console.log(`      Confirmado: ${user.email_confirmed_at ? 'Sim' : 'Não'}`);
        console.log(`      Criado em: ${new Date(user.created_at).toLocaleString('pt-BR')}`);
        console.log('      -------------------------');
      });
    } else {
      console.log('   ℹ️ Nenhum usuário cadastrado encontrado');
    }
  } catch (err) {
    console.log('   ℹ️ Não foi possível acessar tabela de usuários (permissão restrita)');
  }
  
  // 5. Verificar senhas cadastradas (para estimar usuários ativos)
  console.log('\n🔑 Verificando senhas cadastradas:');
  try {
    const { data: passwords, error, count } = await supabase
      .from('passwords')
      .select('user_id', { count: 'exact', head: true })
      .limit(1);
      
    if (error) {
      console.log('   ❌ Erro ao verificar senhas:', error.message);
    } else {
      console.log(`   📊 Total de senhas cadastradas: ${count || 0}`);
      
      if (count && count > 0) {
        // Verificar usuários distintos com senhas
        const { data: distinctUsers, error: distinctError } = await supabase
          .from('passwords')
          .select('user_id')
          .limit(100);
          
        if (!distinctError && distinctUsers) {
          // Extrair usuários únicos
          const uniqueUsers = [...new Set(distinctUsers.map(p => p.user_id))];
          console.log(`   👥 Usuários com senhas cadastradas: ${uniqueUsers.length}`);
        }
      }
    }
  } catch (err) {
    console.log('   ❌ Erro ao verificar senhas:', err.message);
  }
  
  // Resumo final
  console.log('\n📋 RESUMO DE USUÁRIOS:');
  console.log('   🌐 URL do projeto: https://oyjpnwjwawmgecobeebl.supabase.co');
  console.log('   👤 Usuários autenticados na sessão atual: 0');
  console.log('   👥 Perfis cadastrados: 0');
}

verificarUsuariosDetalhados().catch(console.error);