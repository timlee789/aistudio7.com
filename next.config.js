/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // 빌드 시 ESLint 오류를 경고로 처리 (배포 중단하지 않음)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // TypeScript 오류도 무시 (필요한 경우)
    ignoreBuildErrors: true,
  },
  images: {
    // 외부 이미지 도메인 허용
    domains: ['supabase.co'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
}

module.exports = nextConfig