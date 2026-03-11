import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import type { Locale } from "next-intl";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = (await requestLocale) as Locale;

  // Ensure that the incoming locale is valid
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale as Locale;
  }

  return {
    locale,
    messages: (await import(`../translations/${locale}.json`)).default,
  };
});
