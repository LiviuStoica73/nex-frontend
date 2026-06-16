import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { CampaignsList } from "@/components/campaigns/campaigns-list"

export const metadata = { title: "Campanii — Nex-Nex" }

export default async function CampaignsPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const orgId = session.user?.orgId ?? ""
  const token = session.user?.accessToken ?? ""

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Campanii</h1>
          <p className="text-muted-foreground">
            Creează și gestionează campaniile de conținut.
          </p>
        </div>
      </div>
      <CampaignsList orgId={orgId} token={token} />
    </div>
  )
}
