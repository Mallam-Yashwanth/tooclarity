import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ ESLint settings — keep strict in production
  // eslint: {
  //   ignoreDuringBuilds: false, // build fails on critical lint issues
  // },

  // ✅ Remote image optimization (for Unsplash / Source Unsplash)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "source.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "flagcdn.com",
      },
      {
        protocol: "https",
        hostname: "tooclaritystaticbucket.s3.us-east-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      }
    ],
    formats: ["image/avif", "image/webp"], // efficient formats
  },

  // ✅ Performance & optimization
  reactStrictMode: true,

  /* ✅ Optional: optimize imports for speed
  experimental: {
    optimizePackageImports: ["@headlessui/react", "@heroicons/react"],
  },*/
};

export default nextConfig;