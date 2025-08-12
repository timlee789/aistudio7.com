const { PrismaClient } = require('@prisma/client');

async function testNewDatabaseUrl() {
  console.log('🔧 Supabase에서 가져온 새 DATABASE_URL을 여기에 붙여넣어 테스트하세요:');
  console.log('');
  console.log('사용법:');
  console.log('1. Supabase → Settings → Database → Connection string → URI 복사');
  console.log('2. 아래 newUrl 변수에 붙여넣기');
  console.log('3. 특수문자 URL 인코딩 (! → %21, @ → %40, # → %23)');
  console.log('4. node scripts/test-new-database-url.js 실행');
  console.log('');
  
  // 여기에 Supabase에서 가져온 새 URL을 넣으세요
  // 예시: postgresql://postgres:password@새호스트:포트/postgres
  const newUrl = "여기에_새_DATABASE_URL_붙여넣기";
  
  if (newUrl === "여기에_새_DATABASE_URL_붙여넣기") {
    console.log('❌ 새 DATABASE_URL을 설정해주세요!');
    console.log('');
    console.log('예시:');
    console.log('const newUrl = "postgresql://postgres:password123@db.jevhyocvecfztkyiubeu.supabase.co:5432/postgres";');
    return;
  }
  
  console.log('🧪 테스트할 URL:');
  console.log(`   길이: ${newUrl.length}자`);
  console.log(`   미리보기: ${newUrl.substring(0, 40)}...${newUrl.substring(newUrl.length - 40)}`);
  console.log('');
  
  try {
    const prisma = new PrismaClient({
      datasources: {
        db: { url: newUrl }
      }
    });
    
    console.log('1️⃣ 데이터베이스 연결 테스트...');
    await prisma.$connect();
    console.log('   ✅ 연결 성공!');
    
    console.log('2️⃣ 사용자 수 확인...');
    const userCount = await prisma.user.count();
    console.log(`   ✅ 총 사용자 수: ${userCount}명`);
    
    console.log('3️⃣ 관리자 계정 확인...');
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@aistudio7.com' }
    });
    console.log(`   ✅ 관리자 계정 존재: ${!!adminUser}`);
    if (adminUser) {
      console.log(`   ✅ 관리자 이름: ${adminUser.name}`);
      console.log(`   ✅ 관리자 역할: ${adminUser.role}`);
    }
    
    await prisma.$disconnect();
    
    console.log('');
    console.log('🎉 성공! 이 DATABASE_URL을 사용하세요:');
    console.log('');
    console.log(`DATABASE_URL="${newUrl}"`);
    console.log('');
    console.log('다음 단계:');
    console.log('1. Vercel 환경 변수에 이 URL 설정');
    console.log('2. 프로젝트 재배포');
    console.log('3. 관리자 로그인 테스트');
    
  } catch (error) {
    console.log('');
    console.log('❌ 연결 실패:', error.message);
    console.log('');
    console.log('확인할 사항:');
    console.log('1. 비밀번호가 정확한지 확인');
    console.log('2. 특수문자가 올바르게 URL 인코딩되었는지 확인');
    console.log('3. 호스트명과 포트가 정확한지 확인');
    console.log('');
    console.log('인코딩 참고:');
    console.log('  ! → %21');
    console.log('  @ → %40');
    console.log('  # → %23');
  }
}

testNewDatabaseUrl().catch(console.error);