// Add "Campanha de Marketing" category
const addMarketingCategory = async () => {
  try {
    const response = await fetch('https://oyjpnwjwawmgecobeebl.supabase.co/rest/v1/password_categories', {
      method: 'POST',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95anBud2p3YXdtZ2Vjb2JlZWJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NjkwNzQsImV4cCI6MjA2ODM0NTA3NH0.bChgjIpJbVlarNb1yi7Z2nkUXHQduy32CLRj8hYzyyA',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95anBud2p3YXdtZ2Vjb2JlZWJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NjkwNzQsImV4cCI6MjA2ODM0NTA3NH0.bChgjIpJbVlarNb1yi7Z2nkUXHQduy32CLRj8hYzyyA',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        name: 'Campanha de Marketing',
        description: 'Ferramentas e contas para campanhas de marketing digital',
        icon: 'Megaphone'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ "Campanha de Marketing" category added successfully!');
      console.log('📝 New category data:', data);
      return data;
    } else {
      const error = await response.text();
      console.log('❌ Error adding category:', response.status, response.statusText);
      console.log('❌ Error details:', error);
      return null;
    }
  } catch (error) {
    console.log('❌ Error adding category:', error.message);
    return null;
  }
};

// Add the category
addMarketingCategory();
