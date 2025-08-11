const jwt = require('jsonwebtoken');
require('dotenv').config();

async function testJWT() {
  try {
    console.log('🔍 Testing JWT functionality...');
    console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
    console.log('JWT_SECRET length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0);
    
    if (!process.env.JWT_SECRET) {
      console.log('❌ JWT_SECRET is missing from environment variables');
      return;
    }
    
    // Test JWT token generation
    const payload = {
      userId: 'test-user-id',
      email: 'admin@aistudio7.com',
      role: 'ADMIN'
    };
    
    console.log('🎫 Generating JWT token...');
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    console.log('✅ JWT token generated successfully');
    console.log('Token length:', token.length);
    console.log('Token preview:', token.substring(0, 50) + '...');
    
    // Test JWT token verification
    console.log('🔍 Verifying JWT token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    console.log('✅ JWT token verified successfully');
    console.log('Decoded payload:', decoded);

  } catch (error) {
    console.error('❌ JWT test failed:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
  }
}

testJWT();