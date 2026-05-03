import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "randomuser.me",
      },
      {
        protocol: "https",
        hostname: "seliseblocks.com",
      },
    ],
  },
  output: "standalone",
};

export default nextConfig;
