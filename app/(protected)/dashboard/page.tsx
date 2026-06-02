import { getCurrentUser } from "@/lib/session"
import { constructMetadata } from "@/lib/utils"
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard"

export const metadata = constructMetadata({
  title: "Dashboard — Nex-Nex",
  description: "Performanța conținutului tău în timp real.",
})

export default async function DashboardPage() {
  const user = await getCurrentUser()
  const orgId = (user as any)?.orgId ?? ""
  const token = (user as any)?.accessToken ?? ""

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Performanța conținutului tău în timp real.</p>
      </div>
      <AnalyticsDashboard orgId={orgId} token={token} />
    </div>
  )
}
