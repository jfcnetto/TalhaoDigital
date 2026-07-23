import withPWAInit from "@imbios/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // SUAS OUTRAS CONFIGS AQUI SE HOUVEREM
};

export default withPWA(nextConfig);
