import type { NextConfig } from 'next';

// Define the base Next.js configuration
const baseConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.slingacademy.com',
        port: ''
      }
    ]
  },
  transpilePackages: ['geist'],

  // Add Turbopack configuration (stable)
  turbopack: {
    // Configure Turbopack-specific settings
    rules: {
      // Add any specific loader rules if needed
    },
    resolveAlias: {
      // Add any alias configurations if needed
    }
  }
};

export default baseConfig;
