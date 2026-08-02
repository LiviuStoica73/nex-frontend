import { auth } from "@/auth"
import { getActiveOrgId } from "@/lib/active-org"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/session"
import { BrandKitForm } from "@/components/brand-kit/brand-kit-form"
import { getTranslations } from "next-intl/server"

export const dynamic = "force-dynamic"
export const metadata = { title: "Brand Kit — Nex-Nex" }

export default async function BrandKitPage() {
  const t = await getTranslations("brand_kit_page")
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const orgId = await getActiveOrgId()
  const token = user?.accessToken ?? ""

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("description")}
        </p>
      </div>
      <BrandKitForm orgId={orgId} token={token} />
    </div>
  )
}
