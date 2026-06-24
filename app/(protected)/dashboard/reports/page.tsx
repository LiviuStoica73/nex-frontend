import { getActiveOrgId } from "@/lib/active-org"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/session"
import { ReportsManager } from "@/components/reports/reports-manager"

export const metadata = { title: "Rapoarte consum — Nex-Nex" }

export default async function ReportsPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const orgId = await getActiveOrgId()
  const token = user?.accessToken ?? ""

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Rapoarte consum</h1>
        <p className="text-muted-foreground">
          Consum de credite per client, campanie și acțiune. Rezultatele (reach, engagement) sosesc odată cu analytics.
        </p>
      </div>
      <ReportsManager orgId={orgId} token={token} />
    </div>
  )
}
