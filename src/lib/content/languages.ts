import type { Locale } from "next-intl";

const capitalize = (s: string) => s.charAt(0).toLocaleUpperCase() + s.slice(1);

/** A language's own name, for switcher buttons: "English", "Русский", "O‘zbek". */
export function nativeLanguageName(code: Locale): string {
  return capitalize(new Intl.DisplayNames([code], { type: "language" }).of(code) ?? code);
}

/** Languages named in the reader's language and joined: "English and Russian". */
export function languageList(codes: Locale[], inLocale: Locale): string {
  const names = new Intl.DisplayNames([inLocale], { type: "language" });
  return new Intl.ListFormat(inLocale, { type: "conjunction" }).format(
    codes.map((code) => names.of(code) ?? code)
  );
}
