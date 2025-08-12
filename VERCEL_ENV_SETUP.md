# Vercel Environment Variables Setup

## 🚨 중요: DATABASE_URL 설정 오류 해결

현재 Vercel에서 DATABASE_URL이 잘못 설정되어 있습니다.
**오류**: "empty host in database URL" 및 길이가 84자 (정상: 90자)

## 올바른 환경 변수 설정

Vercel 대시보드에서 다음 환경 변수들을 **정확히** 설정해주세요:

### 1. DATABASE_URL
```
postgresql://postgres:Leetim123%21%40%23@db.jevhyocvecfztkyiubeu.supabase.co:5432/postgres
```
**주의사항:**
- 길이: 정확히 90자여야 함
- 특수문자 인코딩 필수: `!` → `%21`, `@` → `%40`, `#` → `%23`
- 공백이나 줄바꿈 없이 한 줄로 입력

### 2. JWT_SECRET
```
mRpWAlXU+fo7AqHQEaJG1NRPktETWoK7kKMka04orH8hOVrChNNhE/+jE3DoqVHsu9UzgOXATmWp6oOycKMJ6g==
```

### 3. NEXT_PUBLIC_SUPABASE_URL
```
https://jevhyocvecfztkyiubeu.supabase.co
```

### 4. NEXT_PUBLIC_SUPABASE_ANON_KEY
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impldmh5b2N2ZWNmenRreWl1YmV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MzI1ODAsImV4cCI6MjA3MDUwODU4MH0.-47Pjt0FhSKnybmXlkWB5bWfdJC6nPPo0NYQKy07-PA
```

## Vercel에서 환경 변수 설정 방법

1. **Vercel 대시보드 접속**
   - https://vercel.com/dashboard 방문
   - 프로젝트 선택

2. **Settings → Environment Variables**
   - 기존 DATABASE_URL 삭제 후 새로 추가
   - Production, Preview, Development 모든 환경에 적용

3. **재배포**
   - 환경 변수 변경 후 반드시 재배포 필요
   - Deployments 탭에서 "Redeploy" 클릭

## 확인 방법

환경 변수 설정 후:
1. https://aistudio7.com/api/debug/db-test 접속
2. `success: true` 확인
3. https://aistudio7.com/login에서 관리자 로그인 테스트

## 관리자 계정 정보
- **이메일**: admin@aistudio7.com
- **비밀번호**: admin123!

## 문제 해결이 안 될 경우
- 환경 변수를 복사/붙여넣기할 때 숨겨진 문자나 공백이 없는지 확인
- DATABASE_URL 길이가 정확히 90자인지 확인
- 모든 특수문자가 올바르게 URL 인코딩되었는지 확인