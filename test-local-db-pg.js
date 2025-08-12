#!/usr/bin/env node

const { Client } = require('pg');
const bcryptjs = require('bcryptjs');

const DATABASE_URL = "postgresql://postgres.jevhyocvecfztkyiubeu:Leetim123%21%40%23@aws-0-us-east-1.pooler.supabase.com:6543/postgres";

async function testDatabaseConnectionPG() {
  console.log('🚨 Local PostgreSQL Direct Test Starting...\n');
  
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log('🔗 Connecting to PostgreSQL database...');
    await client.connect();
    console.log('✅ Database connected successfully!\n');

    // Test 1: User count with raw SQL (correct table name: users)
    console.log('📊 Test 1: Counting users with raw SQL...');
    const userCountResult = await client.query('SELECT COUNT(*) as count FROM users');
    const userCount = parseInt(userCountResult.rows[0].count);
    console.log(`👥 Total users: ${userCount}\n`);

    // Test 2: Find admin user with raw SQL
    console.log('🔍 Test 2: Finding admin user with raw SQL...');
    const adminResult = await client.query('SELECT id, name, email, role, password FROM users WHERE email = $1', ['admin@aistudio7.com']);
    const adminUser = adminResult.rows[0];
    console.log(`🔑 Admin user found: ${!!adminUser}`);
    if (adminUser) {
      console.log(`   - ID: ${adminUser.id}`);
      console.log(`   - Name: ${adminUser.name}`);
      console.log(`   - Email: ${adminUser.email}`);
      console.log(`   - Role: ${adminUser.role}`);
    }
    console.log('');

    // Test 3: Password verification (if admin exists)
    if (adminUser) {
      console.log('🔐 Test 3: Testing admin password...');
      const testPassword = 'admin123!';
      const isPasswordValid = await bcryptjs.compare(testPassword, adminUser.password);
      console.log(`🔐 Password 'admin123!' is valid: ${isPasswordValid}\n`);
    }

    // Test 4: List all users with raw SQL
    console.log('👥 Test 4: Listing all users with raw SQL...');
    const allUsersResult = await client.query('SELECT id, name, email, role, "createdAt" FROM users ORDER BY "createdAt"');
    allUsersResult.rows.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email}) - ${user.role}`);
    });
    console.log('');

    // Test 5: Database info
    console.log('🛢️  Test 5: Database information...');
    const versionResult = await client.query('SELECT version()');
    console.log(`   PostgreSQL Version: ${versionResult.rows[0].version.split(',')[0]}`);
    
    const tablesResult = await client.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);
    console.log(`   Tables: ${tablesResult.rows.map(row => row.tablename).join(', ')}`);
    console.log('');

    console.log('🎉 All local PostgreSQL tests completed successfully!');
    console.log('✅ Ready to use raw PostgreSQL queries in Vercel!');

  } catch (error) {
    console.error('💥 Local PostgreSQL Test Failed:');
    console.error('Error:', error.message);
    if (error.code) {
      console.error('Error Code:', error.code);
    }
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    
    console.log('\n❌ Fix local issues before deploying to Vercel!');
  } finally {
    console.log('\n🔌 Disconnecting from PostgreSQL database...');
    await client.end();
    console.log('✅ Disconnected cleanly');
  }
}

// Run the test
testDatabaseConnectionPG().catch(console.error);