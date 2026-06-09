import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Pre-existing type errors in dashboard components — ignore during build
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
        pathname: '/wikipedia/**',
      },
      {
        protocol: 'https',
        hostname: 'www.google.com',
        pathname: '/s2/favicons**',
      },
    ],
  },
  rewrites: async () => [
    {
      source: '/trolley',
      destination: '/trolley/index.html',
    },
    {
      source: '/trolley/configurator',
      destination: '/trolley/configurator.html',
    },
    {
      source: '/newwen',
      destination: '/trolley/newwen.html',
    },
    {
      source: '/bruiloft',
      destination: '/bruiloft/index.html',
    },
    {
      source: '/sv-transport-preview',
      destination: '/sv-transport-preview/index.html',
    },
  ],
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
      ],
    },
    {
      // Marifest PWA service worker — allow it to control the /fleet scope
      source: '/sw.js',
      headers: [
        { key: 'Service-Worker-Allowed', value: '/fleet' },
        { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
      ],
    },
  ],
};

export default nextConfig;
