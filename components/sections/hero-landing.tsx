import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export default async function HeroLanding() {
  const t = await getTranslations("hero_landing")

  return (
    <section className="space-y-6 py-12 sm:py-20 lg:py-24">
      <div className="container flex max-w-5xl flex-col items-center gap-5 text-center">
        <Link
          href="/pricing"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm", rounded: "full" }),
            "px-4",
          )}
        >
          <span className="mr-2">🚀</span>
          {t("trial_badge")}
        </Link>

        <h1 className="text-balance font-urban text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-[66px]">
          {t("title_prefix")}{" "}
          <span className="text-gradient_indigo-purple font-extrabold">
            {t("title_highlight")}
          </span>
        </h1>

        <p
          className="max-w-2xl text-balance leading-normal text-muted-foreground sm:text-xl sm:leading-8"
          style={{ animationDelay: "0.35s", animationFillMode: "forwards" }}
        >
          {t("description")}
        </p>

        <div
          className="flex justify-center space-x-2 md:space-x-4"
          style={{ animationDelay: "0.4s", animationFillMode: "forwards" }}
        >
          <Link
            href="/register"
            prefetch={true}
            className={cn(
              buttonVariants({ size: "lg", rounded: "full" }),
              "gap-2",
            )}
          >
            <span>{t("primary_cta")}</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </Link>
          <Link
            href="/pricing"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg", rounded: "full" }),
              "px-5",
            )}
          >
            {t("secondary_cta")}
          </Link>
        </div>

        <p className="text-sm text-muted-foreground">
          {t("platforms")}
        </p>
      </div>
    </section>
  )
}
