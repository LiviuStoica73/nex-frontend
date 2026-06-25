import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/session"
import { getActiveOrgId } from "@/lib/active-org"
import { AllocationsManager } from "@/components/agency/allocations-manager"

export const metadata = { title: "Alocare credite — Nex-Nex" }

export default async function AllocationsPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const orgId = await getActiveOrgId()
  const token = user?.accessToken ?? ""

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Alocare credite</h1>
        <p className="text-muted-foreground">
          Împarte creditele din abonament pe clienți. La 90% se trimite avertizare, la 100% se oprește generarea de conținut nou.
        </p>
      </div>
      <AllocationsManager orgId={orgId} token={token} />
    </div>
  )
}
