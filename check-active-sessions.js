import { createClient } from '@supabase/supabase-js';

async function verificarSessoesAtivas() {
  console.log('🔍 Verificando sessões ativas no Supabase...\n');
  
  const supabaseUrl = "https://oyjpnwjwawmgecobeebl.supabase.co";
  const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95anBud2p3YXdtZ2Vjb2JlZWJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjc2OTA3NCwiZXhwIjoyMDY4MzQ1MDc0fQ.59HQPkwOjr-tZtXCWja_5JhA2h6Y5jbxqVLcid8_ydM";
  
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  // 1. Tentar verificar sessões ativas usando a API de administração
  console.log('🔐 Verificando sessões ativas via API de administração:');
  try {
    // Usando a API de administração para listar usuários
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) {
      console.log('   ❌ Erro ao listar usuários:', error.message);
    } else if (data && data.users) {
      // Filtrar usuários com sessões ativas (último login recente)
      const now = new Date();
      const activeUsers = data.users.filter(user => {
        if (!user.last_sign_in_at) return false;
        
        const lastLogin = new Date(user.last_sign_in_at);
        const hoursSinceLogin = (now - lastLogin) / (1000 * 60 * 60);
        
        // Considerar sessões ativas nas últimas 24 horas
        return hoursSinceLogin < 24;
      });
      
      console.log(`   📊 Total de usuários com login recente (últimas 24h): ${activeUsers.length}`);
      
      if (activeUsers.length > 0) {
        console.log('\n   📋 Usuários com sessões recentes:');
        activeUsers.forEach((user, index) => {
          console.log(`   ${index + 1}. Email: ${user.email}`);
          console.log(`      ID: ${user.id}`);
          console.log(`      Último login: ${new Date(user.last_sign_in_at).toLocaleString('pt-BR')}`);
          console.log(`      Horas desde o login: ${((now - new Date(user.last_sign_in_at)) / (1000 * 60 * 60)).toFixed(2)}h`);
          console.log('      -------------------------');
        });
      } else {
        console.log('   ℹ️ Nenhum usuário com login recente');
      }
    }
  } catch (err) {
    console.log('   ❌ Erro ao verificar usuários:', err.message);
  }
  
  // 2. Tentar acessar diretamente a tabela de sessões via SQL
  console.log('\n🔐 Tentando acessar tabela de sessões via SQL:');
  try {
    // Usando SQL para consultar sessões ativas
    const { data, error } = await supabaseAdmin.rpc('get_active_sessions');
    
    if (error) {
      if (error.message.includes('function') && error.message.includes('does not exist')) {
        console.log('   ℹ️ Função SQL personalizada não encontrada (normal)');
        
        // Tentar consulta SQL direta
        console.log('   ℹ️ Tentando consulta SQL direta...');
        const { data: sqlData, error: sqlError } = await supabaseAdmin.from('auth.sessions').select('*');
        
        if (sqlError) {
          if (sqlError.message.includes('does not exist') || sqlError.message.includes('permission denied')) {
            console.log('   ℹ️ Acesso direto à tabela auth.sessions não permitido (normal)');
            console.log('   ℹ️ Isso é uma limitação do Supabase - tabelas auth.* são protegidas');
          } else {
            console.log('   ❌ Erro SQL:', sqlError.message);
          }
        } else if (sqlData && sqlData.length > 0) {
          console.log(`   📊 Total de sessões ativas: ${sqlData.length}`);
          sqlData.forEach((session, index) => {
            console.log(`   ${index + 1}. Usuário: ${session.user_id}`);
            console.log(`      Criada em: ${new Date(session.created_at).toLocaleString('pt-BR')}`);
            console.log('      -------------------------');
          });
        } else {
          console.log('   ℹ️ Nenhuma sessão ativa encontrada');
        }
      } else {
        console.log('   ❌ Erro ao executar RPC:', error.message);
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
    console.log('   ❌ Erro ao verificar sessões via SQL:', err.message);
  }
  
  // 3. Verificar usuários com perfis ativos
  console.log('\n👤 Verificando perfis de usuários ativos:');
  try {
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('is_active', true);
      
    if (error) {
      console.log('   ❌ Erro ao buscar perfis:', error.message);
    } else if (profiles && profiles.length > 0) {
      console.log(`   📊 Total de perfis ativos: ${profiles.length}`);
      
      // Buscar informações detalhadas dos usuários
      const userIds = profiles.map(profile => profile.user_id);
      const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (!usersError && users) {
        const activeUsers = users.users.filter(user => userIds.includes(user.id));
        
        console.log('\n   📋 Usuários com perfis ativos:');
        for (const profile of profiles) {
          const user = activeUsers.find(u => u.id === profile.user_id);
          if (user) {
            console.log(`   - ${profile.display_name || user.email}`);
            console.log(`     Email: ${user.email}`);
            console.log(`     Último login: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('pt-BR') : 'Nunca'}`);
            console.log(`     Tipo: ${profile.is_admin ? 'Administrador' : 'Usuário comum'}`);
            console.log('     -------------------------');
          }
        }
      } else {
        console.log('\n   📋 Lista de perfis ativos:');
        profiles.forEach((profile, index) => {
          console.log(`   ${index + 1}. ${profile.display_name || 'Sem nome'}`);
          console.log(`      User ID: ${profile.user_id}`);
          console.log(`      Tipo: ${profile.is_admin ? 'Administrador' : 'Usuário comum'}`);
          console.log('      -------------------------');
        });
      }
    } else {
      console.log('   ℹ️ Nenhum perfil ativo encontrado');
    }
  } catch (err) {
    console.log('   ❌ Erro ao verificar perfis:', err.message);
  }
  
  // Resumo final
  console.log('\n📋 RESUMO DE AUTENTICAÇÃO:');
  console.log('   🌐 URL do projeto: https://oyjpnwjwawmgecobeebl.supabase.co');
  console.log('   ℹ️ Devido às limitações do Supabase, não é possível verificar diretamente as sessões ativas');
  console.log('   ℹ️ A melhor aproximação é verificar usuários com login recente (últimas 24h)');
}

verificarSessoesAtivas().catch(console.error);