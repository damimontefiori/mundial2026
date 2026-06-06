/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // PWA service worker (public/sw.js) is registered client-side; no build plugin needed.
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ];
  },
};

export default nextConfig;
