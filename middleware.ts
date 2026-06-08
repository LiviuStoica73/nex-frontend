// middleware.ts
// Version: 1.0, 2026-06-08
// Scope: Next.js middleware — locale detection and NEXT_LOCALE cookie management
// Features: Accept-Language header fallback, cookie persistence, 6 supported locales

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SUPPORTED_LOCALES = ["ro", "en", "it", "fr", "es", "de"];
const DEFAULT_LOCALE = "en";

function detectLocaleFromHeader(request: NextRequest): string {
  const acceptLanguage = request.headers.get("accept-language") ?? "";
  // Parse Accept-Language: "ro-RO,ro;q=0.9,en;q=0.8"
  const preferred = acceptLanguage
    .split(",")
    .map((part) => {
      const [lang] = part.trim().split(";");
      return lang.trim().split("-")[0].toLowerCase();
    })
    .find((lang) => SUPPORTED_LOCALES.includes(lang));
  return preferred ?? DEFAULT_LOCALE;
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const existingLocale = request.cookies.get("NEXT_LOCALE")?.value;

  if (!existingLocale || !SUPPORTED_LOCALES.includes(existingLocale)) {
    const detectedLocale = detectLocaleFromHeader(request);
    response.cookies.set("NEXT_LOCALE", detectedLocale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
