import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    unoptimized: true,
  },
  // 完全前后端分离，不需要 rewrite
  // 前端直接请求 NEXT_PUBLIC_API_URL
};

export default nextConfig;
