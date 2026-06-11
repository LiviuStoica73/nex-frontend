"use client";

// language-picker.tsx
// Version: 1.0, 2026-06-08
// Scope: Language selector component — sets NEXT_LOCALE cookie and syncs with backend
// Features: 6 languages with flag emoji, cookie update, backend PATCH call, router refresh

import { useRouter } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

async function syncLocaleToBackend(locale: string): Promise<void> {
  try {
    await fetch("/api/user/language", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: locale }),
    });
  } catch {
    // Non-critical — cookie is already set, backend sync is best-effort
  }
}

interface LanguagePickerProps {
  className?: string;
}

export function LanguagePicker({ className }: LanguagePickerProps) {
  const router = useRouter();
  const currentLocale = getCurrentLocale();

  function handleChange(locale: string) {
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; SameSite=Lax`;
    void syncLocaleToBackend(locale);
    // Hard reload: asigură că server component-ele citesc noul cookie
    window.location.reload();
  }

  return (
    <div className={className}>
      <label className="mb-1 block text-sm font-medium">Interface Language</label>
      <p className="mb-2 text-xs text-muted-foreground">
        Choose the language for the interface
      </p>
      <Select defaultValue={currentLocale} onValueChange={handleChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {LANGUAGES.map(({ code, label, flag }) => (
            <SelectItem key={code} value={code}>
              <span className="mr-2">{flag}</span>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
