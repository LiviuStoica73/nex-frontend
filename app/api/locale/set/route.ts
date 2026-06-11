// app/api/locale/set/route.ts
// Version: 1.0, 2026-06-11
// Scope: Setează NEXT_LOCALE cookie pe server și face redirect înapoi
// Features: cookie server-side, bypass Cloudflare cache, redirect to referer

import { NextRequest, NextResponse } from "next/server";

const SUPPORTED_LOCALES = ["ro", "en", "it", "fr", "es", "de"];

export function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") ?? "en";
  const returnTo = searchParams.get("return") ?? "/";

  if (!SUPPORTED_LOCALES.includes(locale)) {
    return new NextResponse("Unsupported locale", { status: 400 });
  }

  const response = NextResponse.redirect(new URL(returnTo, request.url));
  response.cookies.set("NEXT_LOCALE", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    httpOnly: false, // trebuie citit și de client pentru getCurrentLocale()
  });

  return response;
}
