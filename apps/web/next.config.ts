import type { NextConfig } from 'next'
import path from 'node:path'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // Trace dependencies from the monorepo root so pnpm's virtual store is
  // included in the portable production artifact.
  outputFileTracingRoot: path.resolve(process.cwd(), '../..'),
  allowedDevOrigins: ['127.0.0.1'],
  experimental: {
    // Next 16.3 defaults to its TypeScript CLI runner. pnpm/corepack can add
    // non-JSON output to that subprocess, so use the compiler API instead.
    useTypeScriptCli: false,
  },
}

export default nextConfig
