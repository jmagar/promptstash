/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@workspace/ui', '@workspace/auth', '@workspace/email'],
  output: 'standalone',
  
  // External packages that should not be bundled (native Node.js dependencies)
  serverExternalPackages: [
    'pino',
    'pino-pretty',
    'thread-stream',
    '@workspace/observability',
  ],
  
  // Allow cross-origin requests from custom domain during development
  allowedDevOrigins: ['https://promptstash.tootie.tv'],
  
  // Webpack configuration to ignore optional dependencies
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Ignore pino and its dependencies during bundling
      config.externals = config.externals || [];
      config.externals.push({
        'pino': 'commonjs pino',
        'pino-pretty': 'commonjs pino-pretty',
        'thread-stream': 'commonjs thread-stream',
      });
    }
    return config;
  },
  
  env: {
    NEXT_PUBLIC_DISABLE_AUTH: process.env.NEXT_PUBLIC_DISABLE_AUTH,
  },
  // Performance optimizations
  compress: true, // Enable gzip compression
  poweredByHeader: false, // Remove X-Powered-By header for security

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 3600, // Cache optimized images for 1 hour
  },
};

export default nextConfig;
