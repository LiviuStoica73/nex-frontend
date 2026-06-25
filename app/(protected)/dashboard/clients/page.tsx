import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/session"
import { getActiveOrgId } from "@/lib/active-org"
import { ClientsManager } from "@/components/agency/clients-manager"

export const metadata = { title: "Clienți Agenție — Nex-Nex" }

export default async function ClientsPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const orgId = await getActiveOrgId()
  const token = user.accessToken ?? ""

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Clienți Agenție</h1>
        <p className="text-muted-foreground">
          Gestionează clienții și comută rapid între workspace-uri.
        </p>
      </div>
      <ClientsManager orgId={orgId} token={token} />
    </div>
  )
}
