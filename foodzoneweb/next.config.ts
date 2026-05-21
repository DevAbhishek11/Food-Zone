import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // User/vendor media can come from any https host; allow them through.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
