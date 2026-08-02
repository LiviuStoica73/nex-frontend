import { auth } from "@/auth"
import { getActiveOrgId } from "@/lib/active-org"
import { redirect } from "next/navigation"
import { BillingDashboard } from "@/components/billing/billing-dashboard"
import { getTranslations } from "next-intl/server"

export const metadata = { title: "Billing — Nex-Nex" }

export default async function BillingPage() {
  const t = await getTranslations("billing_page")
  const session = await auth()
  if (!session) redirect("/login")

  const orgId = await getActiveOrgId()
  const token = session.user?.accessToken ?? ""
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("description")}
        </p>
      </div>
      <BillingDashboard orgId={orgId} token={token} appUrl={appUrl} />
    </div>
  )
}
