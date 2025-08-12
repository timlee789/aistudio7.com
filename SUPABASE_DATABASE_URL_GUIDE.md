# Supabase에서 DATABASE_URL 찾는 방법

## 1. Supabase 대시보드 접속
1. https://supabase.com 방문
2. 로그인 후 프로젝트 선택

## 2. DATABASE_URL 찾기

### 방법 1: Settings → Database
1. 왼쪽 사이드바에서 **⚙️ Settings** 클릭
2. **Database** 탭 선택
3. **Connection string** 섹션에서 **URI** 탭 클릭
4. 여기서 전체 DATABASE_URL을 복사할 수 있습니다

### 방법 2: Project Settings → API
1. 왼쪽 사이드바에서 **⚙️ Settings** 클릭
2. **API** 탭 선택
3. **Database** 섹션에서 **Connection string** 확인

## 3. DATABASE_URL 형식

Supabase의 DATABASE_URL은 다음과 같은 형식입니다:
```
postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
```

### 현재 프로젝트의 정보:
- **Host**: `db.jevhyocvecfztkyiubeu.supabase.co`
- **Port**: `5432`
- **Database**: `postgres`
- **Username**: `postgres`
- **Password**: `Leetim123!@#` (URL 인코딩 필요)

## 4. 비밀번호 URL 인코딩
특수문자가 포함된 비밀번호는 URL 인코딩해야 합니다:
- `!` → `%21`
- `@` → `%40`
- `#` → `%23`

### 완성된 DATABASE_URL:
```
postgresql://postgres:Leetim123%21%40%23@db.jevhyocvecfztkyiubeu.supabase.co:5432/postgres
```

## 5. Supabase에서 비밀번호 확인/변경

### 비밀번호 확인:
1. **Settings** → **Database**
2. **Database password** 섹션에서 현재 비밀번호 확인

### 비밀번호 변경 (필요시):
1. **Settings** → **Database**
2. **Database password** 섹션에서 **Reset database password** 클릭
3. 새 비밀번호 설정 후 URL 인코딩하여 사용

## 6. 연결 테스트

DATABASE_URL을 얻은 후:
1. `.env` 파일에 추가
2. `node scripts/test-database.js` 실행하여 연결 테스트
3. 정상 작동 확인 후 Vercel 환경 변수에 설정

## 7. 주의사항
- DATABASE_URL에는 실제 데이터베이스 비밀번호가 포함되므로 보안에 주의
- 특수문자는 반드시 URL 인코딩 필요
- Vercel 환경 변수 설정 시 공백이나 줄바꿈 없이 한 줄로 입력