import { cookies } from "next/headers"
import { auth } from "@/auth"

/**
 * Returnează orgId-ul activ: cookie > session JWT.
 * Cookie-ul e setat la switch org și e sursa de adevăr pentru server components.
 */
export async function getActiveOrgId(): Promise<string> {
  const cookieStore = cookies()
  const fromCookie = cookieStore.get("nex_active_org_id")?.value
  if (fromCookie) return fromCookie

  const session = await auth()
  return session?.user?.orgId ?? ""
}
