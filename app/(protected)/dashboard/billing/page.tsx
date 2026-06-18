import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getActiveOrgId } from "@/lib/active-org"
import { BillingDashboard } from "@/components/billing/billing-dashboard"
import { constructMetadata } from "@/lib/utils"

export const metadata = constructMetadata({
  title: "Abonament — Nex-Nex",
  description: "Plan curent, credite și upgrade.",
})

export default async function BillingPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const orgId = await getActiveOrgId()
  const token = session.user?.accessToken ?? ""
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nex-nex.com"

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Abonament & Plan</h1>
        <p className="text-muted-foreground">Plan curent, credite disponibile și opțiuni de upgrade.</p>
      </div>
      <BillingDashboard orgId={orgId} token={token} appUrl={appUrl} mockMode={process.env.BILLING_MODE === "mock" || process.env.NODE_ENV !== "production"} />
    </div>
  )
}
