import { auth } from "@/auth"
import { redirect } from "next/navigation"

export const metadata = { title: "Setup — Nex-Nex" }

export default async function OnboardingPage() {
  const session = await auth()
  if (!session) redirect("/login")
  redirect("/dashboard")
}
