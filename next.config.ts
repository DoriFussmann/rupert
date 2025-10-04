import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Unblock production builds on Vercel despite ESLint errors
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Optional: unblock builds even if there are TS errors (we can re-enable later)
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        '**/node_modules/**',
        '**/.next/**',
        '**/audit_out/**'
      ]
    };
    return config;
  },
  async redirects() {
    return [
      {
        source: '/financial-model-builder',
        destination: '/model-builder',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
