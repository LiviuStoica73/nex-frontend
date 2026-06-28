import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { SuperAdminClient } from "./client"

const API = process.env.NEXT_PUBLIC_API_URL || ""

async function fetchAdmin(token: string) {
  const headers = { Authorization: `Bearer ${token}` }
  const [overviewRes, orgsRes] = await Promise.all([
    fetch(`${API}/api/v1/admin/superadmin/overview`, { headers, cache: "no-store" }),
    fetch(`${API}/api/v1/admin/superadmin/orgs`, { headers, cache: "no-store" }),
  ])
  if (!overviewRes.ok) return { error: overviewRes.status === 403 ? "Acces interzis (nu ești superuser)" : `Eroare ${overviewRes.status}` }
  return {
    overview: await overviewRes.json(),
    orgs: await orgsRes.json(),
  }
}

export default async function SuperAdminPage() {
  const session = await auth()
  if (!session) redirect("/login")
  const token = session.user?.accessToken ?? ""
  const data = await fetchAdmin(token)
  return <SuperAdminClient data={data} token={token} apiUrl={API} />
}
