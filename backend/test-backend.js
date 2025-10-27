const axios = require('axios');

async function testBackend() {
  try {
    console.log('🧪 Probando backend...');
    
    // Test health check
    const healthResponse = await axios.get('http://localhost:3001/api/health');
    console.log('✅ Health check:', healthResponse.data);
    
    // Test login
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'cliente@ejemplo.com',
      password: '123456'
    });
    
    console.log('✅ Login exitoso:', loginResponse.data.message);
    console.log('   Token:', loginResponse.data.token ? '✅' : '❌');
    console.log('   User:', loginResponse.data.user ? '✅' : '❌');
    
  } catch (error) {
    console.error('❌ Error probando backend:');
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Error:', error.response.data);
    } else {
      console.log('   Error:', error.message);
    }
  }
}

testBackend();