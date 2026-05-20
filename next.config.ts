import type { NextConfig } from "next";

const securityHeaders = [
  // Prevents DNS prefetch leaking visited subdomains
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  // Forces HTTPS for 1 year (Vercel always serves HTTPS)
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  // Blocks the site from being embedded in an iframe (clickjacking)
  { key: 'X-Frame-Options', value: 'DENY' },
  // Prevents browsers from guessing the content type (MIME sniffing)
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Only sends the origin (no path/query) when navigating cross-origin
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Disables browser features this app doesn't use
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
};

export default nextConfig;
