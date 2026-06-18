import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard"

export const metadata = { title: "Setup — Nex-Nex" }

export default async function OnboardingPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const token = session.user?.accessToken ?? ""
  const existingOrgId = session.user?.orgId ?? ""
  return <OnboardingWizard token={token} existingOrgId={existingOrgId} />
}
