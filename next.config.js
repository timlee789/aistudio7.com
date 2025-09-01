/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: {
      rules: {
        // Optimize asset loading
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js'
        }
      }
    }
  },
  // Enable image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Compress output
  compress: true,
  // Enable webpack bundle analyzer in development
  webpack: (config, { dev }) => {
    if (dev) {
      config.devtool = 'eval-source-map';
    }
    return config;
  },
  // Optimize production build
  swcMinify: true,
  // Enable static optimization
  trailingSlash: false,
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ],
      },
    ];
  },
}

module.exports = nextConfig;