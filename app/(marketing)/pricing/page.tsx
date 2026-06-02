import { constructMetadata } from "@/lib/utils"
import { PricingFaq } from "@/components/pricing/pricing-faq"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export const metadata = constructMetadata({
  title: "Prețuri — Nex-Nex",
  description: "Planuri simple pentru creatori individuali și agenții. 14 zile trial gratuit, fără card.",
})

const PLANS = [
  {
    name: "Free",
    price: "0",
    description: "Pentru a testa platforma",
    features: ["1 brand", "2 conturi sociale", "10 posturi/lună", "AI text basic"],
    cta: "Încearcă gratuit",
    href: "/register",
    highlight: false,
  },
  {
    name: "Starter",
    price: "19",
    description: "Pentru creatori individuali",
    features: ["1 brand", "5 conturi sociale", "100 posturi/lună", "AI text + imagine", "Telegram Bot", "5 GB storage"],
    cta: "Începe trial 14 zile",
    href: "/register",
    highlight: false,
  },
  {
    name: "Pro",
    price: "49",
    description: "Cel mai popular",
    features: ["3 branduri", "15 conturi sociale", "Posturi nelimitate", "AI text + imagine + video", "Analytics", "Multi-limbă", "20 GB storage"],
    cta: "Începe trial 14 zile",
    href: "/register",
    highlight: true,
  },
  {
    name: "Business",
    price: "99",
    description: "Pentru echipe",
    features: ["10 branduri", "Conturi nelimitate", "Posturi nelimitate", "AI complet", "Analytics avansat", "50 GB storage"],
    cta: "Începe trial 14 zile",
    href: "/register",
    highlight: false,
  },
  {
    name: "Agency",
    price: "199",
    description: "Pentru agenții",
    features: ["Branduri nelimitate", "Conturi nelimitate", "15 clienți", "Portal client izolat", "Billing unificat", "100 GB storage"],
    cta: "Contactează-ne",
    href: "/register",
    highlight: false,
  },
]

export default function PricingPage() {
  return (
    <div className="flex w-full flex-col gap-16 py-8">
      <section className="container flex flex-col items-center gap-6 text-center">
        <h1 className="text-3xl font-bold md:text-5xl">Prețuri simple și transparente</h1>
        <p className="max-w-xl text-muted-foreground text-lg">
          14 zile trial gratuit pe orice plan. Fără card de credit. Anulezi oricând.
        </p>

        <div className="grid w-full max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "relative flex flex-col rounded-xl border p-5 text-left",
                plan.highlight
                  ? "border-purple-500 bg-purple-50 dark:bg-purple-950/20 shadow-lg scale-105"
                  : "bg-card",
              )}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-purple-600 px-3 py-0.5 text-xs font-semibold text-white">
                  Popular
                </span>
              )}
              <div className="mb-4">
                <h2 className="text-lg font-bold">{plan.name}</h2>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold">€{plan.price}</span>
                  <span className="text-muted-foreground text-sm">/lună</span>
                </div>
              </div>

              <ul className="mb-6 flex-1 space-y-1.5 text-sm">
                {plan.features.map((f) => (
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
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="text-sm text-muted-foreground">
          Agency XL (clienți nelimitați) — <strong>€349/lună</strong> ·{" "}
          <Link href="/register" className="underline">Discount anual disponibil</Link>
        </p>
      </section>

      <PricingFaq />
    </div>
  )
}
