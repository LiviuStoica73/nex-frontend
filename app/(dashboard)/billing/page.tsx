import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { BillingDashboard } from "@/components/billing/billing-dashboard"

export const metadata = { title: "Billing — Nex-Nex" }

export default async function BillingPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const orgId = session.user?.orgId ?? ""
  const token = session.user?.accessToken ?? ""
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing & Plan</h1>
        <p className="text-muted-foreground">
          Plan curent, usage și upgrade.
        </p>
      </div>
      <BillingDashboard orgId={orgId} token={token} appUrl={appUrl} />
    </div>
  )
}
