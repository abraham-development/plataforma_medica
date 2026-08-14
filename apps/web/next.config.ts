import type { NextConfig } from 'next'
import path from 'node:path'

const standalone = process.env.NEXT_OUTPUT_MODE === 'standalone'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  ...(standalone
    ? {
        output: 'standalone' as const,
        outputFileTracingRoot: path.resolve(process.cwd(), '../..'),
      }
    : {}),
  allowedDevOrigins: ['127.0.0.1'],
  experimental: {
    // Next 16.3 defaults to its TypeScript CLI runner. pnpm/corepack can add
    // non-JSON output to that subprocess, so use the compiler API instead.
    useTypeScriptCli: false,
  },
}

export default nextConfig
