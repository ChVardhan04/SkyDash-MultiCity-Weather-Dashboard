/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['openweathermap.org'],
  },
  // Remove the rewrite — on Vercel we call the Railway backend directly
  // via NEXT_PUBLIC_API_URL, not via rewrites
};

module.exports = nextConfig;
