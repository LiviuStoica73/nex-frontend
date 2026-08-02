import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getActiveOrgId } from "@/lib/active-org"
import { BillingDashboard } from "@/components/billing/billing-dashboard"
import { constructMetadata } from "@/lib/utils"
import { getTranslations } from "next-intl/server"

export async function generateMetadata() {
  const t = await getTranslations("billing_page")
  return constructMetadata({
    title: `${t("title")} — Nex-Nex`,
    description: t("description"),
  })
}

export default async function BillingPage() {
  const t = await getTranslations("billing_page")
  const session = await auth()
  if (!session) redirect("/login")

  const orgId = await getActiveOrgId()
  const token = session.user?.accessToken ?? ""
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nex-nex.com"

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
      <BillingDashboard orgId={orgId} token={token} appUrl={appUrl} mockMode={process.env.BILLING_MODE === "mock" || process.env.NODE_ENV !== "production"} />
    </div>
  )
}
