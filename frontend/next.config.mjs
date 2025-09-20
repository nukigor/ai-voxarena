/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "tailwindcss.com" },
      { protocol: "https", hostname: "images.unsplash.com" }
    ]
  }
};
export default nextConfig;