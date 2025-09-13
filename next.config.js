/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // API pro Vercel - standalone output
  output: 'standalone',
  // Zakázat static generation pro API routes
  async generateBuildId() {
    return 'api-only-build'
  }
}

module.exports = nextConfig
