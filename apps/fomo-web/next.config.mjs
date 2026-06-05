/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // @fomo/core는 빌드 산출물이 아닌 TS 소스(src/index.ts)를 제공 → 트랜스파일 대상에 포함
  transpilePackages: ["@fomo/core"],
};

export default nextConfig;
