// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    experimental: {
      // Using the correct property name for Next.js 15
      serverActions: {
        bodySizeLimit: '2mb',
      },
      // Moved to correct location
      serverComponentsExternalPackages: ['@prisma/client', 'bcrypt'],
    },
    images: {
      domains: ['lh3.googleusercontent.com']
    }
  };
  
  module.exports = nextConfig;