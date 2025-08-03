import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // 배포 시 ESLint 오류 무시
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 배포 시 TypeScript 오류 무시
    ignoreBuildErrors: true,
  },
};
