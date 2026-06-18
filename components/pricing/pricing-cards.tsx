"use client"

import { useState } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

interface Plan {
  key: string
  name: string
  monthly: number
  yearly: number  // total anual
  highlight: boolean
  href: string
}

const PLANS: Plan[] = [
  { key: "free",       name: "Free",       monthly: 0,   yearly: 0,    highlight: false, href: "/register" },
  { key: "starter",    name: "Starter",    monthly: 19,  yearly: 190,  highlight: false, href: "/register" },
  { key: "pro",        name: "Pro",        monthly: 49,  yearly: 490,  highlight: true,  href: "/register" },
  { key: "business",   name: "Business",   monthly: 99,  yearly: 990,  highlight: false, href: "/register" },
  { key: "agency",     name: "Agency",     monthly: 199, yearly: 1990, highlight: false, href: "/register" },
]


export function PricingCards() {
  const t = useTranslations("marketing_pricing_page")
  const [isYearly, setIsYearly] = useState(false)

  return (
    <section className="container flex flex-col items-center gap-8">
      {/* Toggle lunar / anual */}
      <div className="flex items-center gap-3 rounded-full border bg-muted/50 p-1">
        <button
          onClick={() => setIsYearly(false)}
          className={cn(
            "rounded-full px-5 py-1.5 text-sm font-medium transition-colors",
            !isYearly ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t("toggle.monthly")}
        </button>
        <button
          onClick={() => setIsYearly(true)}
          className={cn(
            "flex items-center gap-2 rounded-full px-5 py-1.5 text-sm font-medium transition-colors",
            isYearly ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t("toggle.yearly")}
          <span className="rounded-full bg-green-500 px-1.5 py-0.5 text-[10px] font-bold text-white leading-none">
            {t("toggle.discount")}
          </span>
        </button>
      </div>

      {/* Cards */}
      <div className="grid w-full max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {PLANS.map((plan) => {
          const features = t.raw(`plans.${plan.key}.features`) as string[]
          const displayPrice = isYearly && plan.monthly > 0
            ? Math.round(plan.yearly / 12)
            : plan.monthly

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
                  {isYearly && plan.monthly > 0 && (
                    <span className="text-base text-muted-foreground/60 line-through">€{plan.monthly}</span>
                  )}
                  <span className="text-3xl font-extrabold">€{displayPrice}</span>
                  <span className="text-muted-foreground text-sm">{t("per_month")}</span>
                </div>
                {isYearly && plan.yearly > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">{t("toggle.billed_yearly", { total: plan.yearly })}</p>
                )}
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
                  buttonVariants({ variant: plan.highlight ? "default" : "outline", size: "sm", rounded: "full" }),
                  "w-full text-center",
                )}
              >
                {t(`plans.${plan.key}.cta`)}
              </Link>
            </div>
          )
        })}
      </div>

      {/* Agency extra-client nota */}
      <p className="text-sm text-muted-foreground text-center">
        {t("agency_extra")}
      </p>
    </section>
  )
}
