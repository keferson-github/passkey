// Test database tables access
const testDatabaseTables = async () => {
  try {
    // Test access to password_categories table
    const response = await fetch('https://oyjpnwjwawmgecobeebl.supabase.co/rest/v1/password_categories?select=*', {
      method: 'GET',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95anBud2p3YXdtZ2Vjb2JlZWJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NjkwNzQsImV4cCI6MjA2ODM0NTA3NH0.bChgjIpJbVlarNb1yi7Z2nkUXHQduy32CLRj8hYzyyA',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95anBud2p3YXdtZ2Vjb2JlZWJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NjkwNzQsImV4cCI6MjA2ODM0NTA3NH0.bChgjIpJbVlarNb1yi7Z2nkUXHQduy32CLRj8hYzyyA',
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Database tables accessible');
      console.log('📊 Current categories:', data.length);
      console.log('📝 Categories:', data.map(cat => cat.name).join(', '));
      
      // Check if "Campanha de Marketing" exists
      const marketingCategory = data.find(cat => cat.name === 'Campanha de Marketing');
      if (marketingCategory) {
        console.log('✅ "Campanha de Marketing" category already exists');
      } else {
        console.log('❌ "Campanha de Marketing" category does not exist');
      }
      
      return data;
    } else {
      console.log('❌ Database access error:', response.status, response.statusText);
      return null;
    }
  } catch (error) {
    console.log('❌ Error accessing database:', error.message);
    return null;
  }
};

// Test database access
testDatabaseTables();
