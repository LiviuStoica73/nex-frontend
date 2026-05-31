"use client"

import { useEffect, useState } from "react"
import { Zap, HardDrive, Users, Share2, CreditCard } from "lucide-react"

interface Usage {
  plan: string
  storage: { used_mb: number; limit_gb: number; percent: number }
  posts_this_month: { used: number; limit: number; percent: number }
  social_accounts: { count: number; limit: number }
  agency_clients: { count: number; limit: number }
  stripe_subscription_id: string | null
}

const PLANS = [
  { name: "starter",   label: "Starter",   price: "€19/lună",  color: "bg-blue-500" },
  { name: "pro",       label: "Pro",        price: "€49/lună",  color: "bg-violet-500" },
  { name: "business",  label: "Business",   price: "€99/lună",  color: "bg-amber-500" },
  { name: "agency",    label: "Agency",     price: "€199/lună", color: "bg-rose-500" },
  { name: "agency_xl", label: "Agency XL",  price: "€349/lună", color: "bg-red-600" },
]

interface Props { orgId: string; token: string; appUrl: string }

export function BillingDashboard({ orgId, token, appUrl }: Props) {
  const [usage, setUsage] = useState<Usage | null>(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState<string | null>(null)
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002"
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }

  useEffect(() => {
    fetch(`${API}/api/v1/orgs/${orgId}/billing`, { headers })
      .then((r) => r.json())
      .then(setUsage)
      .finally(() => setLoading(false))
  }, [orgId, token])

  const upgrade = async (planName: string) => {
    setUpgrading(planName)
    const res = await fetch(`${API}/api/v1/orgs/${orgId}/billing/checkout`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        plan: planName,
        billing_cycle: "monthly",
        success_url: `${appUrl}/billing?success=1`,
        cancel_url: `${appUrl}/billing`,
      }),
    })
    if (res.ok) {
      const data = await res.json()
      window.location.href = data.checkout_url
    }
    setUpgrading(null)
  }

  const openPortal = async () => {
    const res = await fetch(
      `${API}/api/v1/orgs/${orgId}/billing/portal?return_url=${appUrl}/billing`,
      { method: "POST", headers },
    )
    if (res.ok) {
      const data = await res.json()
      window.location.href = data.portal_url
    }
  }

  if (loading) return <p className="text-muted-foreground">Se încarcă...</p>
  if (!usage) return null

  const formatLimit = (v: number) => v === -1 ? "∞" : String(v)

  return (
    <div className="space-y-8">
      {/* Plan curent + portal */}
      <div className="rounded-lg border bg-card p-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Plan curent</p>
          <p className="text-2xl font-bold capitalize">{usage.plan}</p>
          {usage.stripe_subscription_id && (
            <p className="text-xs text-muted-foreground mt-1">Abonament activ</p>
          )}
        </div>
        {usage.stripe_subscription_id && (
          <button onClick={openPortal}
            className="flex items-center gap-2 rounded-md border px-4 py-2 text-sm hover:bg-muted">
            <CreditCard className="h-4 w-4" />
            Facturi & Setări
          </button>
        )}
      </div>

      {/* Usage gauges */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <UsageCard icon={<Zap className="h-4 w-4" />} label="Posturi luna aceasta"
          value={usage.posts_this_month.used} limit={usage.posts_this_month.limit}
          percent={usage.posts_this_month.percent} />
        <UsageCard icon={<HardDrive className="h-4 w-4" />} label="Storage"
          value={Math.round(usage.storage.used_mb / 1024 * 10) / 10}
          limit={usage.storage.limit_gb} unit="GB" percent={usage.storage.percent} />
        <UsageCard icon={<Share2 className="h-4 w-4" />} label="Conturi sociale"
          value={usage.social_accounts.count} limit={usage.social_accounts.limit} />
        <UsageCard icon={<Users className="h-4 w-4" />} label="Clienți agenție"
          value={usage.agency_clients.count} limit={usage.agency_clients.limit} />
      </div>

      {/* Upgrade plans */}
      {usage.plan === "free" && (
        <div>
          <h2 className="mb-4 font-semibold">Upgrade plan</h2>
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
            {PLANS.map((plan) => (
              <div key={plan.name} className="rounded-lg border bg-card p-4 space-y-3">
                <div className={`inline-block rounded px-2 py-0.5 text-xs font-bold text-white ${plan.color}`}>
                  {plan.label}
                </div>
                <p className="text-lg font-bold">{plan.price}</p>
                <button onClick={() => upgrade(plan.name)} disabled={upgrading === plan.name}
                  className="w-full rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                  {upgrading === plan.name ? "Redirecționez..." : "Alege plan"}
                </button>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            14 zile trial gratuit · Anulezi oricând · Fără card la trial
          </p>
        </div>
      )}
    </div>
  )
}

function UsageCard({
  icon, label, value, limit, unit = "", percent,
}: {
  icon: React.ReactNode; label: string; value: number; limit: number; unit?: string; percent?: number
}) {
  const isUnlimited = limit === -1
  const pct = percent ?? (limit > 0 ? Math.min(value / limit * 100, 100) : 0)
  const color = pct > 90 ? "bg-red-500" : pct > 70 ? "bg-amber-500" : "bg-green-500"

  return (
    <div className="rounded-lg border bg-card p-4 space-y-2">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-xl font-bold">
        {value}{unit} <span className="text-sm font-normal text-muted-foreground">
          / {isUnlimited ? "∞" : `${limit}${unit}`}
        </span>
      </p>
      {!isUnlimited && (
        <div className="h-1.5 w-full rounded-full bg-muted">
          <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  )
}
