import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"

export async function DELETE(_req: NextRequest, { params }: { params: { idx: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })
  const orgId = (session.user as any).orgId
  const token = (session.user as any).accessToken
  const apiUrl = process.env.API_URL_INTERNAL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002"
  const upstream = await fetch(`${apiUrl}/api/v1/orgs/${orgId}/brand-kit/templates/${params.idx}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  })
  return new NextResponse(null, { status: upstream.status })
}
