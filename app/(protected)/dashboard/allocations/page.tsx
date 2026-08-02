import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/session"
import { getActiveOrgId } from "@/lib/active-org"
import { AllocationsManager } from "@/components/agency/allocations-manager"
import { getTranslations } from "next-intl/server"

export async function generateMetadata() {
  const t = await getTranslations("allocations_page")
  return { title: `${t("title")} — Nex-Nex` }
}

export default async function AllocationsPage() {
  const t = await getTranslations("allocations_page")
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const orgId = await getActiveOrgId()
  const token = user?.accessToken ?? ""

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("description")}
        </p>
      </div>
      <AllocationsManager orgId={orgId} token={token} />
    </div>
  )
}
