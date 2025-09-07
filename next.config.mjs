/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Disable ESLint during builds to prevent deployment failures
    ignoreDuringBuilds: true,
  },
  typescript: {
    // We don't use TypeScript, so skip type checking
    ignoreBuildErrors: true,
  },
  // Optimize for Vercel serverless functions
  serverExternalPackages: ['pg'],
  experimental: {
    // Increase payload size limit
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
};

export default nextConfig;
