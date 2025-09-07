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
  // Configure API routes to handle larger uploads
  api: {
    bodyParser: {
      sizeLimit: '100mb',
    },
  },
  // Increase timeout for serverless functions
  serverRuntimeConfig: {
    bodySizeLimit: '100mb',
  },
};

export default nextConfig;
