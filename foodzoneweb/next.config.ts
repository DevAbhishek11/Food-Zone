import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // User/vendor media can come from any https host; http is needed for the
    // local Laravel dev server (localhost:8000) which mints http:// URLs.
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "localhost" },
      { protocol: "http", hostname: "127.0.0.1" },
    ],
  },
};

export default nextConfig;
