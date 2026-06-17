import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const { orgId } = await req.json()
  if (!orgId) return NextResponse.json({ error: "orgId required" }, { status: 400 })

  const res = NextResponse.json({ ok: true })
  res.cookies.set("nex_active_org_id", orgId, {
    path: "/",
    httpOnly: false,   // citit și client-side de OrgSwitcher
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,  // 30 zile
  })
  return res
}
