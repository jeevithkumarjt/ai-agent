/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
    NEXT_PUBLIC_DEFAULT_EMAIL: process.env.NEXT_PUBLIC_DEFAULT_EMAIL || "owner@tryvium.ai",
    NEXT_PUBLIC_DEFAULT_PASSWORD: process.env.NEXT_PUBLIC_DEFAULT_PASSWORD || "ChangeMe123!",
  },
};

module.exports = nextConfig;
