import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/session"
import { EditorialCalendar } from "@/components/calendar/editorial-calendar"

export const metadata = { title: "Calendar — Nex-Nex" }

export default async function CalendarPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const orgId = (user as any)?.orgId ?? ""
  const token = (user as any)?.accessToken ?? ""

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Calendar Editorial</h1>
        <p className="text-muted-foreground">Vizualizează și reprogramează postările.</p>
      </div>
      <EditorialCalendar orgId={orgId} token={token} />
    </div>
  )
}
