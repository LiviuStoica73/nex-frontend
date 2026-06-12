import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { getCurrentUser } from "@/lib/session"
import { EditorialCalendar } from "@/components/calendar/editorial-calendar"

export const metadata = { title: "Calendar — Nex-Nex" }

export default async function CalendarPage() {
  const t = await getTranslations("calendar")
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const orgId = (user as any)?.orgId ?? ""
  const token = (user as any)?.accessToken ?? ""

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("page_title")}</h1>
        <p className="text-muted-foreground">{t("page_subtitle")}</p>
      </div>
      <EditorialCalendar orgId={orgId} token={token} />
    </div>
  )
}
