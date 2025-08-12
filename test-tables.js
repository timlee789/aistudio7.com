#!/usr/bin/env node

const { Client } = require('pg');

const DATABASE_URL = "postgresql://postgres.jevhyocvecfztkyiubeu:Leetim123%21%40%23@aws-0-us-east-1.pooler.supabase.com:6543/postgres";

async function checkTables() {
  console.log('🚨 Checking Database Tables...\n');
  
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check all tables
    const tablesResult = await client.query(`
      SELECT schemaname, tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);
    
    console.log('📋 Available tables:');
    if (tablesResult.rows.length === 0) {
      console.log('   No tables found in public schema');
    } else {
      tablesResult.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.tablename}`);
      });
    }
    console.log('');

    // Check all schemas
    const schemasResult = await client.query(`
      SELECT schema_name FROM information_schema.schemata 
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY schema_name
    `);
    
    console.log('📂 Available schemas:');
    schemasResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.schema_name}`);
    });
    console.log('');

    // Check if any User-related tables exist (case insensitive)
    const userTablesResult = await client.query(`
      SELECT schemaname, tablename 
      FROM pg_tables 
      WHERE LOWER(tablename) LIKE '%user%'
      ORDER BY tablename
    `);
    
    console.log('👤 User-related tables:');
    if (userTablesResult.rows.length === 0) {
      console.log('   No user-related tables found');
    } else {
      userTablesResult.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.schemaname}.${row.tablename}`);
      });
    }

  } catch (error) {
    console.error('💥 Error:', error.message);
    console.error('Code:', error.code);
  } finally {
    await client.end();
  }
}

checkTables().catch(console.error);