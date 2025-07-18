// Verificar se a categoria "Campanha de Marketing" existe no banco
const checkMarketingCategory = async () => {
  try {
    // Verificar categorias disponíveis
    const response = await fetch('https://oyjpnwjwawmgecobeebl.supabase.co/rest/v1/password_categories?select=*&is_active=eq.true', {
      method: 'GET',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95anBud2p3YXdtZ2Vjb2JlZWJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NjkwNzQsImV4cCI6MjA2ODM0NTA3NH0.bChgjIpJbVlarNb1yi7Z2nkUXHQduy32CLRj8hYzyyA',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95anBud2p3YXdtZ2Vjb2JlZWJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NjkwNzQsImV4cCI6MjA2ODM0NTA3NH0.bChgjIpJbVlarNb1yi7Z2nkUXHQduy32CLRj8hYzyyA',
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const categories = await response.json();
      console.log('✅ Conexão com banco estabelecida');
      console.log('📊 Total de categorias ativas:', categories.length);
      console.log('');
      console.log('📋 Categorias disponíveis:');
      categories.forEach((cat, index) => {
        console.log(`${index + 1}. ${cat.name} (${cat.description})`);
      });
      console.log('');
      
      // Verificar se a categoria "Campanha de Marketing" existe
      const marketingCategory = categories.find(cat => cat.name === 'Campanha de Marketing');
      
      if (marketingCategory) {
        console.log('✅ CATEGORIA "Campanha de Marketing" ENCONTRADA!');
        console.log('📝 Detalhes:');
        console.log(`   - ID: ${marketingCategory.id}`);
        console.log(`   - Nome: ${marketingCategory.name}`);
        console.log(`   - Descrição: ${marketingCategory.description}`);
        console.log(`   - Ícone: ${marketingCategory.icon}`);
        console.log(`   - Ativa: ${marketingCategory.is_active}`);
        console.log(`   - Criado em: ${marketingCategory.created_at}`);
        console.log('');
        console.log('🚀 A categoria está pronta para uso no projeto!');
        return true;
      } else {
        console.log('❌ CATEGORIA "Campanha de Marketing" NÃO ENCONTRADA');
        console.log('');
        console.log('🔧 Para adicionar a categoria, execute um dos métodos:');
        console.log('');
        console.log('📱 Método 1 - Via Supabase Dashboard:');
        console.log('1. Acesse: https://supabase.com/dashboard');
        console.log('2. Projeto: oyjpnwjwawmgecobeebl');
        console.log('3. Table Editor > password_categories');
        console.log('4. Insert row com os dados:');
        console.log('   - name: "Campanha de Marketing"');
        console.log('   - description: "Ferramentas e contas para campanhas de marketing digital"');
        console.log('   - icon: "Megaphone"');
        console.log('   - is_active: true');
        console.log('');
        console.log('💻 Método 2 - Via SQL Editor:');
        console.log('INSERT INTO public.password_categories (name, description, icon) VALUES');
        console.log("('Campanha de Marketing', 'Ferramentas e contas para campanhas de marketing digital', 'Megaphone');");
        return false;
      }
    } else {
      console.log('❌ Erro ao acessar o banco:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro de conexão:', error.message);
    return false;
  }
};

// Executar verificação
checkMarketingCategory();
