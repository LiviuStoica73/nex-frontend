import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/session"
import { constructMetadata } from "@/lib/utils"
import { getActiveOrgId } from "@/lib/active-org"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard"
import { AgencyOverview } from "@/components/agency/agency-overview"

export const metadata = constructMetadata({
  title: "Dashboard — Nex-Nex",
  description: "Performanța conținutului tău în timp real.",
})

export default async function DashboardPage() {
  const session = await auth()
  const orgId = await getActiveOrgId()

  if (!orgId) redirect("/onboarding")
  const token = session?.user?.accessToken ?? ""
  const t = await getTranslations("dashboard")

  const API = process.env.API_URL_INTERNAL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002"
  let isAgency = false
  if (orgId && token) {
    try {
      const res = await fetch(`${API}/api/v1/orgs/${orgId}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      })
      if (res.ok) {
        const org = await res.json()
        isAgency = org.is_agency ?? false
      }
    } catch {}
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>
      {isAgency
        ? <AgencyOverview orgId={orgId} token={token} />
        : <AnalyticsDashboard orgId={orgId} token={token} />
      }
    </div>
  )
}
