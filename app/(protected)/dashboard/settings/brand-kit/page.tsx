import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/session"
import { BrandKitForm } from "@/components/brand-kit/brand-kit-form"

export const dynamic = "force-dynamic"
export const metadata = { title: "Brand Kit — Nex-Nex" }

export default async function BrandKitPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const orgId = (user as any)?.orgId ?? ""
  const token = (user as any)?.accessToken ?? ""

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Brand Kit</h1>
        <p className="text-muted-foreground">
          Logo, culori, tonul vocii. AI-ul folosește acestea la fiecare postare generată.
        </p>
      </div>
      <BrandKitForm orgId={orgId} token={token} />
    </div>
  )
}
