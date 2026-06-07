import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"

async function getSession() {
  const session = await auth()
  if (!session?.user) return null
  const orgId = (session.user as any).orgId
  const token = (session.user as any).accessToken
  if (!orgId || !token) return null
  return { orgId, token }
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002"

export async function GET() {
  const s = await getSession()
  if (!s) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })
  const upstream = await fetch(`${API}/api/v1/orgs/${s.orgId}/rag`, {
    headers: { Authorization: `Bearer ${s.token}` },
  })
  return NextResponse.json(await upstream.json(), { status: upstream.status })
}

export async function POST(req: NextRequest) {
  const s = await getSession()
  if (!s) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })

  const contentType = req.headers.get("content-type") || ""

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData()
    const files = formData.getAll("file") as File[]
    const results = []
    for (const file of files) {
      const fd = new FormData()
      fd.append("file", file)
      const upstream = await fetch(`${API}/api/v1/orgs/${s.orgId}/rag/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${s.token}` },
        body: fd,
      })
      results.push(await upstream.json() as never)
    }
    return NextResponse.json(results, { status: 200 })
  }

  // URL ingest
  const body = await req.json()
  const upstream = await fetch(`${API}/api/v1/orgs/${s.orgId}/rag/url`, {
    method: "POST",
    headers: { Authorization: `Bearer ${s.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  return NextResponse.json(await upstream.json(), { status: upstream.status })
}
