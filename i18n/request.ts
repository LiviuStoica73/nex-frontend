// i18n/request.ts
// Version: 1.0, 2026-06-08
// Scope: next-intl server-side request config — locale from NEXT_LOCALE cookie
// Features: cookie-based locale detection, fallback to "en", 6 supported locales

import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

const SUPPORTED_LOCALES = ["ro", "en", "it", "fr", "es", "de"] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

function isSupportedLocale(value: string): value is SupportedLocale {
  return SUPPORTED_LOCALES.includes(value as SupportedLocale);
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const rawLocale = cookieStore.get("NEXT_LOCALE")?.value ?? "en";
  const locale: SupportedLocale = isSupportedLocale(rawLocale)
    ? rawLocale
    : "en";

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
