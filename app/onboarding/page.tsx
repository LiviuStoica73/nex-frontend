import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getActiveOrgId } from "@/lib/active-org"
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard"

export const metadata = { title: "Setup — Nex-Nex" }

export default async function OnboardingPage() {
  const session = await auth()
  if (!session) redirect("/login")

  // Dacă are deja org, trimite direct la dashboard
  const orgId = await getActiveOrgId()
  if (orgId) redirect("/dashboard")

  const token = (session.user as { accessToken?: string })?.accessToken ?? ""

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Bun venit la Nex-Nex! 👋</h1>
          <p className="mt-2 text-muted-foreground">Hai să configurăm brandul tău în câțiva pași simpli.</p>
        </div>
        <OnboardingWizard token={token} />
      </div>
    </div>
  )
}
