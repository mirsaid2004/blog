import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

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
    ]
  }
};

export default withNextIntl(nextConfig);
