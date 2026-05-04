/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@eidolon/sdk'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false, path: false, os: false, crypto: false,
      };
    }
    return config;
  },
};
module.exports = nextConfig;
