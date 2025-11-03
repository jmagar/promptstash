/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@workspace/ui', '@workspace/auth', '@workspace/email'],
  output: 'standalone',
  serverExternalPackages: ['prettier'],
  env: {
    NEXT_PUBLIC_DISABLE_AUTH: process.env.NEXT_PUBLIC_DISABLE_AUTH,
  },
};

export default nextConfig;
