import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://ixqjqjqjqjqjqjqjqjqj.supabase.co'; // Substitua pela sua URL
const supabaseKey = 'your-anon-key'; // Substitua pela sua chave

const supabase = createClient(supabaseUrl, supabaseKey);

async function addPersonalCategory() {
  try {
    console.log('🔄 Adicionando categoria "Personal" (Pessoal)...');
    
    const { data, error } = await supabase
      .from('password_categories')
      .insert({
        name: 'Personal',
        description: 'Contas pessoais e privadas',
        icon: 'User',
        is_active: true
      })
      .select();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        console.log('✅ Categoria "Personal" já existe no banco de dados.');
        return;
      }
      throw error;
    }

    console.log('✅ Categoria "Personal" adicionada com sucesso!');
    console.log('📋 Dados inseridos:', data);
    
  } catch (error) {
    console.error('❌ Erro ao adicionar categoria:', error);
  }
}

// Verificar se a categoria já existe
async function checkPersonalCategory() {
  try {
    console.log('🔍 Verificando se a categoria "Personal" já existe...');
    
    const { data, error } = await supabase
      .from('password_categories')
      .select('*')
      .eq('name', 'Personal');

    if (error) throw error;

    if (data && data.length > 0) {
      console.log('✅ Categoria "Personal" já existe:', data[0]);
      return true;
    } else {
      console.log('ℹ️ Categoria "Personal" não encontrada. Será adicionada.');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar categoria:', error);
    return false;
  }
}

// Listar todas as categorias
async function listAllCategories() {
  try {
    console.log('📋 Listando todas as categorias disponíveis...');
    
    const { data, error } = await supabase
      .from('password_categories')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;

    console.log('📋 Categorias ativas:');
    data.forEach((category, index) => {
      console.log(`${index + 1}. ${category.name} - ${category.description}`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao listar categorias:', error);
  }
}

// Executar o script
async function main() {
  console.log('🚀 Iniciando script para adicionar categoria "Personal"...\n');
  
  const exists = await checkPersonalCategory();
  
  if (!exists) {
    await addPersonalCategory();
  }
  
  console.log('\n');
  await listAllCategories();
  
  console.log('\n✨ Script concluído!');
}

main();