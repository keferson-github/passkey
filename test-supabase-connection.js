// Test Supabase connectivity
const testSupabaseConnection = async () => {
  try {
    // Check if we can access the server
    const response = await fetch('https://oyjpnwjwawmgecobeebl.supabase.co/rest/v1/', {
      method: 'GET',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95anBud2p3YXdtZ2Vjb2JlZWJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NjkwNzQsImV4cCI6MjA2ODM0NTA3NH0.bChgjIpJbVlarNb1yi7Z2nkUXHQduy32CLRj8hYzyyA',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95anBud2p3YXdtZ2Vjb2JlZWJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NjkwNzQsImV4cCI6MjA2ODM0NTA3NH0.bChgjIpJbVlarNb1yi7Z2nkUXHQduy32CLRj8hYzyyA'
      }
    });
    
    if (response.ok) {
      console.log('✅ Supabase REST API is accessible');
      return true;
    } else {
      console.log('❌ Supabase REST API returned:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.log('❌ Error connecting to Supabase:', error.message);
    return false;
  }
};

// Test connection
testSupabaseConnection();
