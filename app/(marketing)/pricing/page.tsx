import { getTranslations } from "next-intl/server"
import { constructMetadata } from "@/lib/utils"
import { PricingCards } from "@/components/pricing/pricing-cards"
import { TopUpSection } from "@/components/pricing/topup-section"
import { PricingFaq } from "@/components/pricing/pricing-faq"

export async function generateMetadata() {
  const t = await getTranslations("marketing_pricing_page.metadata")
  return constructMetadata({ title: t("title"), description: t("description") })
}

export default async function PricingPage() {
  const t = await getTranslations("marketing_pricing_page")
  return (
    <div className="flex w-full flex-col gap-16 py-8">
      <section className="container flex flex-col items-center gap-4 text-center">
        <h1 className="text-3xl font-bold md:text-5xl">{t("title")}</h1>
        <p className="max-w-xl text-muted-foreground text-lg">{t("subtitle")}</p>
      </section>

      <PricingCards />

      <TopUpSection />

      <PricingFaq />
    </div>
  )
}
