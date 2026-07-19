"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useOrg } from "@/contexts/org-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const UPGRADE_NEXT: Record<string, { label: string; desc: string } | null> = {
  free:     { label: "Upgrade la Starter", desc: "Deblochează Telegram Bot, AI imagine și 250 credite/lună." },
  starter:  { label: "Upgrade la Pro",     desc: "3 branduri, 700 credite, analytics și multi-language." },
  pro:      { label: "Vezi planul tău",    desc: "Ești pe Pro. Gestionează abonamentul din Billing." },
  business: null,
  agency:   null,
}

export function UpgradeCard() {
  const { data: session } = useSession()
  const { activeOrgId } = useOrg()
  const [plan, setPlan] = useState<string | null>(null)

  useEffect(() => {
    if (!activeOrgId || !session?.user) return
    const token = (session.user as any).accessToken ?? ""
    const API = process.env.NEXT_PUBLIC_API_URL || "https://api.nex-nex.com"
    fetch(`${API}/api/v1/orgs/${activeOrgId}/billing`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.plan) setPlan(data.plan) })
      .catch(() => {})
  }, [activeOrgId, session])

  // Nu afișa nimic pentru Business/Agency sau până se încarcă
  if (!plan) return null
  const upgrade = UPGRADE_NEXT[plan]
  if (!upgrade) return null

  const isPro = plan === "pro"
  const href = isPro ? "/dashboard/billing" : "/pricing"

  return (
    <Card className="md:max-xl:rounded-none md:max-xl:border-none md:max-xl:shadow-none">
      <CardHeader className="md:max-xl:px-4 pb-2">
        <CardTitle className="text-sm">{upgrade.label}</CardTitle>
        <CardDescription className="text-xs">{upgrade.desc}</CardDescription>
      </CardHeader>
      <CardContent className="md:max-xl:px-4">
        <Button size="sm" className="w-full" asChild>
          <Link href={href}>{isPro ? "Gestionează" : "Vezi planurile"}</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
