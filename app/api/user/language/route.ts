// app/api/user/language/route.ts
// Version: 1.0, 2026-06-08
// Scope: Proxy PATCH /api/user/language → backend PATCH /api/v1/users/me/language
// Features: Auth check, backend sync, error passthrough

import { auth } from "@/auth";

const BACKEND_URL = process.env.BACKEND_API_URL ?? "https://api.nex-nex.com";

export const PATCH = auth(async (req) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  let body: { language?: string };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { language } = body;
  const supported = ["ro", "en", "it", "fr", "es", "de"];
  if (!language || !supported.includes(language)) {
    return new Response("Unsupported language", { status: 400 });
  }

  try {
    const backendRes = await fetch(`${BACKEND_URL}/api/v1/users/me/language`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        // Forward the session token if the backend uses it for auth
        Authorization: `Bearer ${(req.auth as any).accessToken ?? ""}`,
      },
      body: JSON.stringify({ language }),
    });

    if (!backendRes.ok) {
      // Backend failure is non-critical — cookie is already updated on client
      return new Response("Backend sync failed", { status: backendRes.status });
    }

    return new Response("OK", { status: 200 });
  } catch {
    return new Response("Backend unreachable", { status: 502 });
  }
});
