/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // API pro Vercel - ŽÁDNÝ static export!
  experimental: {
    outputStandalone: true,
  },
  // Zakázat static generation pro API routes
  async generateBuildId() {
    return 'api-only-build'
  }
}

module.exports = nextConfig
