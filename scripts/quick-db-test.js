const { PrismaClient } = require('@prisma/client');

// 여기에 Supabase Connect 버튼에서 가져온 새 URL을 넣으세요
const newDatabaseUrl = "postgresql://postgres.jevhyocvecfztkyiubeu:Leetim123%21%40%23@aws-0-us-east-1.pooler.supabase.com:6543/postgres";

async function quickTest() {
  if (newDatabaseUrl === "postgresql://postgres.jevhyocvecfztkyiubeu:Leetim123!@#@aws-0-us-east-1.pooler.supabase.com:6543/postgres") {
    console.log('🔗 Supabase에서 새 DATABASE_URL을 가져와 주세요!');
    console.log('');
    console.log('방법:');
    console.log('1. Supabase 대시보드 → Connect 버튼 클릭');
    console.log('2. Connection pooling 선택 (권장)');
    console.log('3. PostgreSQL → Node.js');
    console.log('4. 연결 문자열 복사');
    console.log('5. 이 파일의 newDatabaseUrl 변수에 붙여넣기');
    console.log('6. node scripts/quick-db-test.js 실행');
    return;
  }

  console.log('🧪 새 DATABASE_URL 테스트 중...');
  console.log(`길이: ${newDatabaseUrl.length}자`);
  console.log(`미리보기: ${newDatabaseUrl.substring(0, 50)}...`);
  
  try {
    const prisma = new PrismaClient({
      datasources: { db: { url: newDatabaseUrl } }
    });
    
    await prisma.$connect();
    console.log('✅ 연결 성공!');
    
    const userCount = await prisma.user.count();
    console.log(`✅ 사용자 수: ${userCount}`);
    
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@aistudio7.com' }
    });
    console.log(`✅ 관리자 존재: ${!!admin}`);
    
    await prisma.$disconnect();
    
    console.log('');
    console.log('🎉 성공! 이 URL을 Vercel에 설정하세요:');
    console.log(`DATABASE_URL="${newDatabaseUrl}"`);
    
  } catch (error) {
    console.log('❌ 실패:', error.message);
    console.log('');
    console.log('확인 사항:');
    console.log('- Connection pooling을 사용했는지');
    console.log('- 비밀번호에 특수문자가 있다면 URL 인코딩했는지');
    console.log('- 호스트와 포트가 정확한지');
  }
}

quickTest().catch(console.error);