import { auth } from "@/auth"
import { getActiveOrgId } from "@/lib/active-org"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/session"
import { RagManager } from "@/components/rag/rag-manager"

export const metadata = { title: "Brand Intelligence — Nex-Nex" }

export default async function RagPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const orgId = await getActiveOrgId()
  const token = user?.accessToken ?? ""

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Brand Intelligence</h1>
        <p className="text-muted-foreground">
          Educă AI-ul despre brandul tău. Uploadează documente sau adaugă URL-uri.
        </p>
      </div>
      <RagManager orgId={orgId} token={token} />
    </div>
  )
}
