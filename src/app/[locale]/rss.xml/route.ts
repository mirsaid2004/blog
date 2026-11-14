import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { contentHref } from "@/lib/content/links";
import { getArticles, getPosts } from "@/lib/content/queries";
import { absoluteUrl, AUTHOR, SITE_NAME } from "@/lib/site";

const MAX_ITEMS = 50;

const escapeXml = (value: string) =>
  value.replace(/[<>&'"]/g, (c) => `&${{ "<": "lt", ">": "gt", "&": "amp", "'": "apos", '"': "quot" }[c]};`);

const rfc822 = (isoDate: string) => new Date(`${isoDate}T00:00:00Z`).toUTCString();

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * One feed per locale with every published article and post, like the lists:
 * an item without a translation in this language links to the localized page,
 * which shows the available version with a notice.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return new Response("Not found", { status: 404 });

  const t = await getTranslations({ locale, namespace: "Footer" });
  const items = [...getArticles(locale), ...getPosts(locale)]
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, MAX_ITEMS);
  const home = absoluteUrl(`/${locale}`);
  const self = absoluteUrl(`/${locale}/rss.xml`);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(SITE_NAME)}</title>
    <link>${home}</link>
    <description>${escapeXml(t("brandDescription"))}</description>
    <language>${locale}</language>
    <atom:link href="${self}" rel="self" type="application/rss+xml"/>
${items
  .map((item) => {
    const link = absoluteUrl(`/${locale}${contentHref(item)}`);
    return `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="false">${escapeXml(item.id)}</guid>
      <pubDate>${rfc822(item.publishedAt)}</pubDate>
      <description>${escapeXml(item.summary)}</description>
      <dc:creator>${escapeXml(AUTHOR)}</dc:creator>
${item.tags.map((tag) => `      <category>${escapeXml(tag)}</category>`).join("\n")}
    </item>`;
  })
  .join("\n")}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
