import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['127.0.0.1'],
  experimental: {
    // Next 16.3 defaults to its TypeScript CLI runner. pnpm/corepack can add
    // non-JSON output to that subprocess, so use the compiler API instead.
    useTypeScriptCli: false,
  },
}

export default nextConfig
