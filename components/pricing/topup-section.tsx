"use client"

import { useTranslations } from "next-intl"

export function TopUpSection() {
  const t = useTranslations("marketing_pricing_page.topup")
  const credits = t.raw("credits") as string[]

  return (
    <section className="container flex flex-col items-center gap-4 text-center">
      <h2 className="text-2xl font-bold">{t("title")}</h2>
      <p className="max-w-xl text-muted-foreground">{t("subtitle")}</p>

      <div className="mt-4 grid w-full max-w-3xl gap-4 sm:grid-cols-2">
        <div className="rounded-xl border p-5 text-left">
          <h3 className="mb-2 font-semibold">{t("credits_title")}</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {credits.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border p-5 text-left">
          <h3 className="mb-2 font-semibold">{t("brand_title")}</h3>
          <p className="text-sm text-muted-foreground">{t("brand_line")}</p>
        </div>
      </div>
    </section>
  )
}
