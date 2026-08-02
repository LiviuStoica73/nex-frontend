import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { SuperAdminClient } from "./client"

const API = process.env.NEXT_PUBLIC_API_URL || ""

async function fetchAdmin(token: string, t: Awaited<ReturnType<typeof getTranslations>>) {
  const headers = { Authorization: `Bearer ${token}` }
  const [overviewRes, orgsRes] = await Promise.all([
    fetch(`${API}/api/v1/admin/superadmin/overview`, { headers, cache: "no-store" }),
    fetch(`${API}/api/v1/admin/superadmin/orgs`, { headers, cache: "no-store" }),
  ])
  if (!overviewRes.ok) return { error: overviewRes.status === 403 ? t("access_denied") : t("error_status", { status: overviewRes.status }) }
  return {
    overview: await overviewRes.json(),
    orgs: await orgsRes.json(),
  }
}

export default async function SuperAdminPage() {
  const session = await auth()
  if (!session) redirect("/login")
  const t = await getTranslations("admin_page")
  const token = session.user?.accessToken ?? ""
  const data = await fetchAdmin(token, t)
  return <SuperAdminClient data={data} token={token} apiUrl={API} />
}
