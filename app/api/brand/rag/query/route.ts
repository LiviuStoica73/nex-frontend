import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })
  const orgId = (session.user as any).orgId
  const token = (session.user as any).accessToken
  const body = await req.json()
  const upstream = await fetch(`${API}/api/v1/orgs/${orgId}/rag/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  return NextResponse.json(await upstream.json(), { status: upstream.status })
}
