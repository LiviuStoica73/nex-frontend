import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { ClientsManager } from "@/components/agency/clients-manager"
import { getTranslations } from "next-intl/server"

export async function generateMetadata() {
  const t = await getTranslations("clients_page")
  return { title: `${t("title")} — Nex-Nex` }
}

export default async function ClientsPage() {
  const t = await getTranslations("clients_page")
  const session = await auth()
  if (!session) redirect("/login")

  // Pagina clienți folosește mereu org-ul HOME din JWT (agenția),
  // nu org-ul activ din cookie (care poate fi un client).
  const orgId = session.user?.orgId ?? ""
  const token = session.user?.accessToken ?? ""

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("description")}
        </p>
      </div>
      <ClientsManager orgId={orgId} token={token} />
    </div>
  )
}
