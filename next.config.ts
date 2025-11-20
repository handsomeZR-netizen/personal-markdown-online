import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // 只忽略警告，保留错误检查
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
