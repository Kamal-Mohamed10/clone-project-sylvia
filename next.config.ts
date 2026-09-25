import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "static.spotapps.co",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
