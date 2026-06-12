import * as React from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { cn } from "@/lib/utils";
import { ModeToggle } from "@/components/layout/mode-toggle";

export async function SiteFooter({ className }: React.HTMLAttributes<HTMLElement>) {
  const t = await getTranslations("footer");

  return (
    <footer className={cn("border-t", className)}>
      <div className="container grid max-w-6xl grid-cols-2 gap-6 py-14 md:grid-cols-4">
        {/* Brand */}
        <div className="col-span-2 md:col-span-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/_static/logo-icon.png" alt="Nex-Nex" className="h-10 w-auto mb-4" />
          <p className="text-sm text-muted-foreground max-w-xs">{t("tagline")}</p>
        </div>

        {/* Produs */}
        <div>
          <span className="text-sm font-medium text-foreground">{t("sections.product.title")}</span>
          <ul className="mt-4 list-inside space-y-3">
            <li><Link href="/#features" className="text-sm text-muted-foreground hover:text-primary">{t("sections.product.features")}</Link></li>
            <li><Link href="/#workflow" className="text-sm text-muted-foreground hover:text-primary">{t("sections.product.how_it_works")}</Link></li>
            <li><Link href="/pricing" className="text-sm text-muted-foreground hover:text-primary">{t("sections.product.pricing")}</Link></li>
            <li><Link href="/blog" className="text-sm text-muted-foreground hover:text-primary">{t("sections.product.blog")}</Link></li>
          </ul>
        </div>

        {/* Legal */}
        <div>
          <span className="text-sm font-medium text-foreground">{t("sections.legal.title")}</span>
          <ul className="mt-4 list-inside space-y-3">
            <li><Link href="/terms" className="text-sm text-muted-foreground hover:text-primary">{t("sections.legal.terms")}</Link></li>
            <li><Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary">{t("sections.legal.privacy")}</Link></li>
          </ul>
        </div>

        {/* Suport */}
        <div>
          <span className="text-sm font-medium text-foreground">{t("sections.support.title")}</span>
          <ul className="mt-4 list-inside space-y-3">
            <li><Link href="mailto:contact@nex-nex.com" className="text-sm text-muted-foreground hover:text-primary">{t("sections.support.email")}</Link></li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t py-4">
        <div className="container flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">{t("copyright")}</p>

          <div className="flex items-center gap-4">
            <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noreferrer" aria-label={t("anpc_sol")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/_static/anpc-sol.webp" alt={t("anpc_sol")} className="h-10 w-auto" />
            </a>
            <a href="https://anpc.ro/ce-este-sal/" target="_blank" rel="noreferrer" aria-label={t("anpc_sal")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/_static/anpc-sal.webp" alt={t("anpc_sal")} className="h-10 w-auto" />
            </a>
            <ModeToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}
