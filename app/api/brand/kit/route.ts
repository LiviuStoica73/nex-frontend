import { getActiveOrgId } from "@/lib/active-org"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })

  const orgId = await getActiveOrgId()
  const token = (session.user as any).accessToken
  if (!orgId || !token) return NextResponse.json({ detail: "Missing orgId or token" }, { status: 400 })

  const apiUrl = process.env.API_URL_INTERNAL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002"
  const upstream = await fetch(`${apiUrl}/api/v1/orgs/${orgId}/brand-kit`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await upstream.json()
  return NextResponse.json(data, { status: upstream.status })
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })

  const orgId = await getActiveOrgId()
  const token = (session.user as any).accessToken
  if (!orgId || !token) return NextResponse.json({ detail: "Missing orgId or token" }, { status: 400 })

  const apiUrl = process.env.API_URL_INTERNAL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002"
  const body = await req.json()
  const upstream = await fetch(`${apiUrl}/api/v1/orgs/${orgId}/brand-kit`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = await upstream.json()
  return NextResponse.json(data, { status: upstream.status })
}
