"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Icons } from "@/components/shared/icons";

export function TelegramConnectSection() {
  const t = useTranslations("telegram");
  const { data: session } = useSession();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateToken() {
    setLoading(true);
    setError(null);
    try {
      // Obținem JWT-ul NexNex de la backend via Google token
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.nex-nex.com";

      const res = await fetch(`${apiUrl}/api/v1/telegram/connect-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Email": session?.user?.email || "",
        },
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.detail || t("token_error"));
        return;
      }

      const data = await res.json();
      setToken(data.token);
    } catch {
      setError(t("server_error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 py-8">
      <div>
        <h3 className="text-lg font-medium">{t("title")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("description_before")}{" "}
          <a
            href="https://t.me/Nex_Nex_AI_Bot"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline underline-offset-4"
          >
            @Nex_Nex_AI_Bot
          </a>{" "}
          {t("description_after")}
        </p>
      </div>

      {!token ? (
        <div>
          <button
            onClick={generateToken}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? (
              <Icons.spinner className="size-4 animate-spin" />
            ) : (
              <Icons.add className="size-4" />
            )}
            {t("generate_code")}
          </button>
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        </div>
      ) : (
        <div className="rounded-lg border bg-muted/50 p-4">
          <p className="mb-2 text-sm text-muted-foreground">
            {t("send_code_before")}{" "}
            <a
              href="https://t.me/Nex_Nex_AI_Bot"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary"
            >
              @Nex_Nex_AI_Bot
            </a>
            {t("send_code_after")}
          </p>
          <div className="flex items-center gap-3">
            <code className="rounded bg-background px-3 py-2 font-mono text-lg font-bold tracking-widest">
              {token}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(token)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {t("copy")}
            </button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {t("expires_in")}
          </p>
        </div>
      )}
    </div>
  );
}
