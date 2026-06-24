import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { AllocationsManager } from "@/components/agency/allocations-manager"

export const metadata = { title: "Alocare credite — Nex-Nex" }

export default async function AllocationsPage() {
  const session = await auth()
  if (!session) redirect("/login")

  // Alocarea e o operație de agenție → folosim org-ul HOME din JWT (agenția),
  // nu org-ul activ din cookie (care poate fi un client).
  const orgId = session.user?.orgId ?? ""
  const token = session.user?.accessToken ?? ""

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
