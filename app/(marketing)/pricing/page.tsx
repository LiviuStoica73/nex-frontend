import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { constructMetadata } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { PricingFaq } from "@/components/pricing/pricing-faq";

export async function generateMetadata() {
  const t = await getTranslations("marketing_pricing_page.metadata");
  return constructMetadata({ title: t("title"), description: t("description") });
}

const PLAN_KEYS = [
  { key: "free", name: "Free", price: "0", href: "/register", highlight: false },
  { key: "starter", name: "Starter", price: "19", href: "/register", highlight: false },
  { key: "pro", name: "Pro", price: "49", href: "/register", highlight: true },
  { key: "business", name: "Business", price: "99", href: "/register", highlight: false },
  { key: "agency", name: "Agency", price: "199", href: "/register", highlight: false },
];

export default async function PricingPage() {
  const t = await getTranslations("marketing_pricing_page");

  return (
    <div className="flex w-full flex-col gap-16 py-8">
      <section className="container flex flex-col items-center gap-6 text-center">
        <h1 className="text-3xl font-bold md:text-5xl">{t("title")}</h1>
        <p className="max-w-xl text-muted-foreground text-lg">{t("subtitle")}</p>

        <div className="grid w-full max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {PLAN_KEYS.map((plan) => {
            const features = t.raw(`plans.${plan.key}.features`) as string[];
            return (
              <div
                key={plan.key}
                className={cn(
                  "relative flex flex-col rounded-xl border p-5 text-left",
                  plan.highlight
                    ? "border-purple-500 bg-purple-50 dark:bg-purple-950/20 shadow-lg scale-105"
                    : "bg-card",
                )}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-purple-600 px-3 py-0.5 text-xs font-semibold text-white">
                    {t("popular_badge")}
                  </span>
                )}
                <div className="mb-4">
                  <h2 className="text-lg font-bold">{plan.name}</h2>
                  <p className="text-sm text-muted-foreground">{t(`plans.${plan.key}.description`)}</p>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold">€{plan.price}</span>
                    <span className="text-muted-foreground text-sm">{t("per_month")}</span>
                  </div>
                </div>

                <ul className="mb-6 flex-1 space-y-1.5 text-sm">
                  {features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <svg className="h-4 w-4 shrink-0 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={cn(
                    buttonVariants({
                      variant: plan.highlight ? "default" : "outline",
                      size: "sm",
                      rounded: "full",
                    }),
                    "w-full text-center",
                  )}
                >
                  {t(`plans.${plan.key}.cta`)}
                </Link>
              </div>
            );
          })}
        </div>

        <p className="text-sm text-muted-foreground">
          {t("agency_xl.prefix")} <strong>{t("agency_xl.price")}</strong> ·{" "}
          <Link href="/register" className="underline">{t("agency_xl.link")}</Link>
        </p>
      </section>

      <PricingFaq />
    </div>
  );
}
