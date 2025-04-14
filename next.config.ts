import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
      serverComponentsExternalPackages: ['@prisma/client', 'bcrypt'],
  images:{
    domains:[
        'lh3.googleusercontent.com'
    ]
  }
};

export default nextConfig;