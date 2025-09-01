/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  async headers() {
   return [
     {
       source: '/(.*)',
       headers: [
         {
           key: 'Content-Security-Policy',
           value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' *.supabase.co wss://*.supabase.co;",
         },
       ],
     },
   ];
 },
  experimental: {
    turbo: {
      // Enable Turbopack for faster builds
    }
  },
  typescript: {
    // Allows production builds to successfully complete even if project has type errors
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
