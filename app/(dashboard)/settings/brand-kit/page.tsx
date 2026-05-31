import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { BrandKitForm } from "@/components/brand-kit/brand-kit-form"

export const metadata = { title: "Brand Kit — NexNex" }

export default async function BrandKitPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const orgId = (session as any)?.orgId ?? ""
  const token = (session as any)?.accessToken ?? ""

  return (
    <div className="space-y-6 p-6">
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
