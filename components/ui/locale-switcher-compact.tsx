"use client";

// locale-switcher-compact.tsx
// Version: 1.1, 2026-06-11
// Scope: Compact locale switcher for navbar — flag + code, no label
// Features: server-side cookie via /api/locale/set + redirect (bypass Cloudflare cache)

import { usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const LANGUAGES = [
  { code: "ro", label: "Română", flag: "🇷🇴" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
] as const;

function getCurrentLocale(): string {
  if (typeof document === "undefined") return "en";
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith("NEXT_LOCALE="));
  return match ? match.split("=")[1] : "en";
}

export function LocaleSwitcherCompact() {
  const pathname = usePathname();
  const current = LANGUAGES.find((l) => l.code === getCurrentLocale()) ?? LANGUAGES[1];

  function handleSelect(locale: string) {
    // Cookie setat pe server via API route + redirect — bypass orice cache Cloudflare
    const returnTo = encodeURIComponent(pathname ?? "/");
    window.location.href = `/api/locale/set?locale=${locale}&return=${returnTo}`;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-1 px-2 text-sm">
          <span>{current.flag}</span>
          <span className="hidden sm:inline">{current.code.toUpperCase()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LANGUAGES.map(({ code, label, flag }) => (
          <DropdownMenuItem
            key={code}
            onClick={() => handleSelect(code)}
            className={code === current.code ? "font-semibold" : ""}
          >
            <span className="mr-2">{flag}</span>
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
