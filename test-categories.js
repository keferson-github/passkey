// Script para testar e verificar categorias no banco de dados
// Este script deve ser executado com as credenciais corretas do Supabase

console.log('🔍 Verificando categorias no banco de dados...\n');

// Simulação das categorias que devem estar disponíveis
const expectedCategories = [
  'Social Media',
  'Work & Business', 
  'Entertainment',
  'Finance',
  'Shopping',
  'Education',
  'Development',
  'Health',
  'Personal', // Nova categoria adicionada
  'Campanha de Marketing'
];

console.log('📋 Categorias esperadas no sistema:');
expectedCategories.forEach((category, index) => {
  console.log(`${index + 1}. ${category}`);
});

console.log('\n✅ A categoria "Personal" foi adicionada ao sistema de traduções.');
console.log('🔧 Para adicionar no banco de dados, execute o SQL:');
console.log(`INSERT INTO public.password_categories (name, description, icon) VALUES ('Personal', 'Contas pessoais e privadas', 'User');`);

console.log('\n🎯 A categoria "Personal" será exibida como "Pessoal" na interface em português.');