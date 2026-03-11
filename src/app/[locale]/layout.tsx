import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { ThemeProvider } from "@/providers/theme-provider";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

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
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const titles = {
    en: "Mirsaid Mirakhmedov | Full-Stack Developer & Software Engineer",
    ru: "Мирсаид Мирахмедов | Фулстек-разработчик и Программист",
    uz: "Mirsaid Mirakhmedov | Full-Stack Dasturchi va Dasturiy Ta'minot Muhandisi",
  };

  const descriptions = {
    en: "Full-stack software engineer specializing in Next.js, React, TypeScript, and Node.js. Building high-performance web applications with modern technologies. Available for freelance and full-time opportunities.",
    ru: "Фулстек программист, специализирующийся на Next.js, React, TypeScript и Node.js. Создание высокопроизводительных веб-приложений с современными технологиями. Доступен для фриланса и полной занятости.",
    uz: "Next.js, React, TypeScript va Node.js bo'yicha mutaxassis full-stack dasturchi. Zamonaviy texnologiyalar bilan yuqori samarali veb-ilovalar yaratish. Frilans va to'liq vaqtli ish uchun mavjud.",
  };

  const title = titles[locale as keyof typeof titles] || titles.en;
  const description =
    descriptions[locale as keyof typeof descriptions] || descriptions.en;

  return {
    title: {
      default: title,
      template: `%s | ${
        locale === "ru"
          ? "Мирсаид Мирахмедов"
          : locale === "uz"
          ? "Mirsaid Mirakhmedov"
          : "Mirsaid Mirakhmedov"
      }`,
    },
    description,
    keywords: [
      "Mirsaid Mirakhmedov",
      "Full-Stack Developer",
      "Software Engineer",
      "Next.js Developer",
      "React Developer",
      "TypeScript Developer",
      "Node.js Developer",
      "Web Development",
      "Frontend Developer",
      "Backend Developer",
      "JavaScript Developer",
      "Uzbekistan Developer",
      "Portfolio",
      "Freelance Developer",
      "Remote Developer",
    ],
    authors: [{ name: "Mirsaid Mirakhmedov" }],
    creator: "Mirsaid Mirakhmedov",
    publisher: "Mirsaid Mirakhmedov",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL("https://mirsaidmirakhmedov.uz"), // Replace with your actual domain
    alternates: {
      canonical: "/",
      languages: {
        en: "/en",
        ru: "/ru",
        uz: "/uz",
      },
    },
    openGraph: {
      type: "website",
      locale: locale,
      url: "/",
      siteName: "Mirsaid Mirakhmedov Portfolio",
      title: title,
      description: description,
      images: [
        {
          url: "/avatar.jpg", // Create this image
          width: 1200,
          height: 630,
          alt: "Mirsaid Mirakhmedov - Full-Stack Developer",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: title,
      description: description,
      images: ["/avatar.jpg"],
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
