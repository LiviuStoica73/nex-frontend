import { EditorialCalendar } from "@/components/calendar/editorial-calendar"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export const metadata = { title: "Calendar Editorial — Nex-Nex" }

export default async function CalendarPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const orgId = (session as any)?.orgId ?? ""
  const token = (session as any)?.accessToken ?? ""

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Calendar Editorial</h1>
        <p className="text-muted-foreground">
          Vizualizează și programează postările. Trage un post pentru a-l reprograma.
        </p>
      </div>
      <EditorialCalendar orgId={orgId} token={token} />
    </div>
  )
}
