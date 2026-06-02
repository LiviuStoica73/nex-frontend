import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { RagManager } from "@/components/rag/rag-manager"

export const metadata = { title: "Brand Intelligence (RAG) — Nex-Nex" }

export default async function RagPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const orgId = (session as any)?.orgId ?? ""
  const token = (session as any)?.accessToken ?? ""

  return (
    <div className="space-y-6 p-6">
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
