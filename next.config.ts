import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

/** Public R2 bucket (custom domain or r2.dev URL) that serves uploaded images. */
const assets = process.env.NEXT_PUBLIC_ASSETS_URL ? new URL(process.env.NEXT_PUBLIC_ASSETS_URL) : null;

const nextConfig: NextConfig = {
  /* config options here */
  async redirects() {
    return [
      { source: "/serieses", destination: "/series", permanent: true },
      { source: "/:locale(en|ru|uz)/serieses", destination: "/:locale/series", permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'encrypted-tbn0.gstatic.com',
        pathname: '/images/**', // This allows any image under the /images path
      },
      ...(assets ? [{ protocol: "https" as const, hostname: assets.hostname, pathname: "/**" }] : []),
    ]
  }
};

export default withNextIntl(nextConfig);
