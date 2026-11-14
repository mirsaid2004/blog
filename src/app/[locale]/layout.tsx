import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { NextIntlClientProvider, type Locale } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { ThemeProvider } from "@/providers/theme-provider";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ogLocale } from "@/lib/seo";
import { AUTHOR, SITE_NAME, SITE_URL } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  const title = t("title");
  const description = t("description");

  return {
    title: {
      default: title,
      template: `%s | ${SITE_NAME}`,
    },
    description,
    authors: [{ name: AUTHOR }],
    creator: AUTHOR,
    publisher: AUTHOR,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(SITE_URL),
    // Canonical URLs and hreflang are set per page (see src/lib/seo.ts). A site-wide
    // `canonical: "/"` here would mark every page as a duplicate of the home page.
    openGraph: {
      type: "website",
      locale: ogLocale(locale),
      siteName: SITE_NAME,
      title,
      description,
    },
    // No title, description or image here: pages don't set `twitter`, so X falls
    // back to each page's og:title, og:description and og:image.
    twitter: {
      card: "summary_large_image",
      creator: "@mirsaid_dev", // Replace with your Twitter handle
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    verification: {
      google: "J5jLSUB4FEzpIpJhaoY_sGEhOCUAz6xFRz0VS_PWNmE", // Add your Google Search Console verification
      // yandex: "your-yandex-verification-code", // Add Yandex verification if needed
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* Default favicon */}
        <link rel="icon" type="image/svg+xml" href="/logo_black.svg" />
        {/* Favicon for light mode */}
        <link
          rel="icon"
          type="image/svg+xml"
          href="/logo_black.svg"
          media="(prefers-color-scheme: light)"
        />
        {/* Favicon for dark mode */}
        <link
          rel="icon"
          type="image/svg+xml"
          href="/logo_white.svg"
          media="(prefers-color-scheme: dark)"
        />

        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Navbar />
            {children}
            <Footer />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
