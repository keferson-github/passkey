// Add "Campanha de Marketing" category using service role
const addMarketingCategoryAsAdmin = async () => {
  try {
    // This would normally use the service role key, but for security reasons
    // we'll use a different approach - create a temporary admin user or
    // ask the user to add it through the Supabase dashboard
    
    console.log('🔒 Due to RLS policies, only admin users can add categories.');
    console.log('');
    console.log('📋 Manual steps to add the category:');
    console.log('1. Go to Supabase Dashboard: https://supabase.com/dashboard');
    console.log('2. Select your project: oyjpnwjwawmgecobeebl');
    console.log('3. Go to Table Editor > password_categories');
    console.log('4. Click "Insert row"');
    console.log('5. Fill in the data:');
    console.log('   - name: "Campanha de Marketing"');
    console.log('   - description: "Ferramentas e contas para campanhas de marketing digital"');
    console.log('   - icon: "Megaphone"');
    console.log('   - is_active: true');
    console.log('6. Click "Save"');
    console.log('');
    console.log('🚀 Alternative: Run the SQL directly in SQL Editor:');
    console.log('INSERT INTO public.password_categories (name, description, icon) VALUES');
    console.log("('Campanha de Marketing', 'Ferramentas e contas para campanhas de marketing digital', 'Megaphone');");
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
};

// Show instructions
addMarketingCategoryAsAdmin();
