import { getTranslations } from "next-intl/server"

export async function WhatIsSection() {
  const t = await getTranslations("what_is")

  return (
    <section className="py-12 sm:py-16">
      <div className="container max-w-4xl text-center">
        <p className="mb-4 font-urban text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          {t("label")}
        </p>
        <h2 className="mb-6 font-urban text-3xl font-extrabold tracking-tight sm:text-4xl">
          {t("title")}
        </h2>
        <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          {t("body")}
        </p>

        <div className="mb-10 rounded-xl border bg-muted/40 px-6 py-5 text-left">
          <p className="mb-1 text-sm font-semibold text-foreground">{t("promise_title")}</p>
          <p className="text-muted-foreground">{t("promise")}</p>
        </div>

        <div className="grid gap-6 text-left sm:grid-cols-2">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              {t("for_label")}
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2"><span className="mt-1 text-primary">✓</span>{t("for_1")}</li>
              <li className="flex items-start gap-2"><span className="mt-1 text-primary">✓</span>{t("for_2")}</li>
              <li className="flex items-start gap-2"><span className="mt-1 text-primary">✓</span>{t("for_3")}</li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              {t("interfaces_label")}
            </p>
            <p className="text-muted-foreground">{t("interfaces")}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
