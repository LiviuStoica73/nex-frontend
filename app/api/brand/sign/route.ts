import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })
  const orgId = (session.user as any).orgId
  const token = (session.user as any).accessToken
  if (!orgId || !token) return NextResponse.json({ detail: "Missing orgId or token" }, { status: 400 })
  const formData = await req.formData()
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002"
  const upstream = await fetch(`${apiUrl}/api/v1/orgs/${orgId}/brand-kit/sign`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })
  return NextResponse.json(await upstream.json(), { status: upstream.status })
}
