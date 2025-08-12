require('dotenv').config();

function verifyDatabaseUrl() {
  console.log('🔍 Verifying DATABASE_URL encoding...');
  
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.log('❌ DATABASE_URL not found in environment variables');
    return;
  }
  
  console.log('✅ DATABASE_URL found');
  console.log('Length:', dbUrl.length);
  console.log('Preview:', dbUrl.substring(0, 30) + '...' + dbUrl.substring(dbUrl.length - 30));
  
  // Check if it contains the problematic characters
  const originalPassword = 'Leetim123!@#';
  const encodedPassword = 'Leetim123%21%40%23';
  
  console.log('\n🔍 Password encoding check:');
  console.log('Original password:', originalPassword);
  console.log('Should be encoded as:', encodedPassword);
  console.log('URL contains encoded password:', dbUrl.includes(encodedPassword));
  console.log('URL contains unencoded password:', dbUrl.includes(originalPassword));
  
  // Try to parse the URL
  try {
    const url = new URL(dbUrl);
    console.log('\n✅ URL parsing successful:');
    console.log('Protocol:', url.protocol);
    console.log('Host:', url.host);
    console.log('Database:', url.pathname);
    console.log('Username:', url.username);
    console.log('Password length:', url.password ? url.password.length : 0);
    console.log('Password preview:', url.password ? url.password.substring(0, 5) + '...' : 'N/A');
  } catch (error) {
    console.log('❌ URL parsing failed:', error.message);
  }
  
  // Check for common encoding issues
  const problematicChars = ['!', '@', '#', ' ', '&', '='];
  const foundIssues = [];
  
  problematicChars.forEach(char => {
    if (dbUrl.includes(char) && !dbUrl.includes(encodeURIComponent(char))) {
      foundIssues.push(`Unencoded '${char}' found`);
    }
  });
  
  if (foundIssues.length > 0) {
    console.log('\n⚠️ Potential encoding issues found:');
    foundIssues.forEach(issue => console.log('  -', issue));
  } else {
    console.log('\n✅ No obvious encoding issues found');
  }
}

verifyDatabaseUrl();