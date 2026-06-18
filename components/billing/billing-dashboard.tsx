"use client"

import { useEffect, useState } from "react"
import { Zap, HardDrive, Users, Share2, Coins, FlaskConical } from "lucide-react"

interface Credits {
  remaining: number
  monthly: number
  reset_at: string | null
  percent_used: number
}

interface Usage {
  plan: string
  credits: Credits
  image_providers: string[]
  storage: { used_mb: number; limit_gb: number; percent: number }
  posts_this_month: { used: number; limit: number; percent: number }
  social_accounts: { count: number; limit: number }
  agency_clients: { count: number; limit: number }
  stripe_subscription_id: string | null
}

interface MockPlan {
  name: string
  label: string
  price_eur: number
  credits_monthly: number
}

const PLAN_PRICES: Record<string, string> = {
  free: "€0", starter: "€19", pro: "€49", business: "€99", agency: "€199",
}

interface Props { orgId: string; token: string; appUrl: string; mockMode?: boolean }

export function BillingDashboard({ orgId, token, appUrl, mockMode = false }: Props) {
  const [usage, setUsage] = useState<Usage | null>(null)
  const [loading, setLoading] = useState(true)
  const [mockPlans, setMockPlans] = useState<MockPlan[]>([])
  const [switching, setSwitching] = useState<string | null>(null)
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002"
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }

  const loadUsage = () => {
    if (!orgId || !token) { setLoading(false); return }
    fetch(`${API}/api/v1/orgs/${orgId}/billing`, { headers })
      .then((r) => r.ok ? r.json() : null)
      .then(setUsage)
      .catch(() => setUsage(null))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadUsage()
    if (mockMode) {
      fetch(`${API}/api/v1/admin/plans`, { headers })
        .then((r) => r.ok ? r.json() : [])
        .then(setMockPlans)
        .catch(() => {})
    }
  }, [orgId, token])

  const switchPlan = async (planName: string) => {
    setSwitching(planName)
    const res = await fetch(`${API}/api/v1/admin/orgs/${orgId}/set-plan`, {
      method: "POST",
      headers,
      body: JSON.stringify({ plan: planName, reset_credits: true }),
    })
    if (res.ok) {
      setLoading(true)
      loadUsage()
    }
    setSwitching(null)
  }

  if (loading) return <p className="text-muted-foreground">Se încarcă...</p>
  if (!orgId || !token) return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
      Sesiunea nu conține un org activ. Încearcă să te reconectezi.
    </div>
  )
  if (!usage) return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      Nu s-au putut încărca datele de billing. Verifică că backend-ul este activ.
    </div>
  )

  return (
    <div className="space-y-6">

      {/* Banner mod simulare */}
      {mockMode && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <FlaskConical className="h-4 w-4 shrink-0" />
          <span><strong>Mod simulare</strong> — plățile nu sunt procesate. Schimbă planul direct pentru testare.</span>
        </div>
      )}

      {/* Plan curent */}
      <div className="rounded-lg border bg-card p-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Plan curent</p>
          <p className="text-2xl font-bold capitalize">{usage.plan}</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            {PLAN_PRICES[usage.plan] ?? ""}/lună
            {usage.stripe_subscription_id && " · Abonament activ"}
          </p>
        </div>

        {/* Selector plan mock */}
        {mockMode && mockPlans.length > 0 && (
          <div className="flex flex-col items-end gap-2">
            <p className="text-xs text-muted-foreground">Simulează upgrade:</p>
            <div className="flex flex-wrap gap-1 justify-end">
              {mockPlans.map((p) => (
                <button
                  key={p.name}
                  onClick={() => switchPlan(p.name)}
                  disabled={switching === p.name || usage.plan === p.name}
                  className="rounded-full border px-3 py-1 text-xs font-medium transition-colors
                    disabled:opacity-40 enabled:hover:bg-primary enabled:hover:text-primary-foreground
                    data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                  data-active={usage.plan === p.name}
                >
                  {switching === p.name ? "..." : p.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Credits gauge */}
      {usage.credits && (
        <div className="rounded-lg border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-amber-500" />
              <span className="font-semibold">Credite disponibile</span>
            </div>
            <span className="text-2xl font-bold">
              {usage.credits.remaining}
              <span className="text-sm font-normal text-muted-foreground"> / {usage.credits.monthly}</span>
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted">
            <div
              className={`h-2 rounded-full transition-all ${
                usage.credits.percent_used > 90 ? "bg-red-500"
                : usage.credits.percent_used > 70 ? "bg-amber-500"
                : "bg-green-500"
              }`}
              style={{ width: `${Math.min(usage.credits.percent_used, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>1 text = 1cr · 1 imagine RTX/Fal = 2cr · 1 imagine Gemini = 4cr · 1 video = 10cr</span>
            {usage.credits.reset_at && (
              <span>Reset: {new Date(usage.credits.reset_at).toLocaleDateString("ro-RO")}</span>
            )}
          </div>
          {usage.image_providers?.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Generatori imagine: <span className="font-medium">{usage.image_providers.join(", ")}</span>
            </p>
          )}
        </div>
      )}

      {/* Usage gauges */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <UsageCard icon={<Zap className="h-4 w-4" />} label="Postări luna aceasta"
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

      {/* Link upgrade real (non-mock) */}
      {!mockMode && usage.plan === "free" && (
        <div className="rounded-lg border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
          Upgrade disponibil pe{" "}
          <a href="/pricing" className="font-medium underline">pagina de prețuri</a>.
          · 14 zile trial gratuit · Anulezi oricând
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
        {value}{unit}{" "}
        <span className="text-sm font-normal text-muted-foreground">
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
