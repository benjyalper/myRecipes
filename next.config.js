/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow serving uploaded images from the public/uploads directory
  images: {
    domains: ['localhost'],
    unoptimized: true, // Use <img> tags for local uploads
  },
};

module.exports = nextConfig;
