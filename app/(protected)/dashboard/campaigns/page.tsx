import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/session"
import { CampaignsList } from "@/components/campaigns/campaigns-list"

export const metadata = { title: "Postări — Nex-Nex" }

export default async function CampaignsPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const orgId = (user as any)?.orgId ?? ""
  const token = (user as any)?.accessToken ?? ""

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Postări</h1>
        <p className="text-muted-foreground">Toate postările create din Telegram Bot.</p>
      </div>
      <CampaignsList orgId={orgId} token={token} />
    </div>
  )
}
