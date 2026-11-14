import type { Metadata } from "next";
import type { Locale } from "next-intl";
import Hero from "@/components/home/hero";
import DefaultHomeView from "@/components/home/default-view";
import { sitePageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  // Title, description and Open Graph text come from the layout; only the URLs are page-specific.
  return { alternates: sitePageMetadata({ locale, path: "/" }).alternates };
}

export default function HomePage() {
  return (
    <main className="">
      <Hero />
      <DefaultHomeView />
    </main>
  );
}
