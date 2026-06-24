"use client"

import { useEffect, useState } from "react"
import { Coins, Save } from "lucide-react"

interface ClientAllocation {
  client_org_id: string
  name: string
  allocated: number
  remaining: number
  consumed: number
  percent_used: number
  monthly_allocation: number
}

interface AllocationsData {
  pool_total: number
  pool_unallocated: number
  total_allocated: number
  default_per_brand: number
  clients: ClientAllocation[]
}

interface Props { orgId: string; token: string }

export function AllocationsManager({ orgId, token }: Props) {
  const [data, setData] = useState<AllocationsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState<string>("")

  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002"
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }

  const fetchData = async () => {
    setError("")
    const res = await fetch(`${API}/api/v1/orgs/${orgId}/allocations`, { headers })
    if (res.ok) {
      const d: AllocationsData = await res.json()
      setData(d)
      setDrafts(Object.fromEntries(d.clients.map((c) => [c.client_org_id, String(c.monthly_allocation)])))
    } else {
      const err = await res.json().catch(() => ({}))
      setError(err.detail || "Nu am putut încărca alocările (cont de agenție necesar).")
    }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [orgId])

  const save = async (clientId: string) => {
    const amount = parseInt(drafts[clientId] ?? "", 10)
    if (Number.isNaN(amount) || amount < 0) {
      setError("Introdu un număr valid de credite.")
      return
    }
    setSavingId(clientId)
    setError("")
    const res = await fetch(`${API}/api/v1/orgs/${orgId}/allocations/${clientId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ amount }),
    })
    if (res.ok) {
      await fetchData()
    } else {
      const err = await res.json().catch(() => ({}))
      setError(err.detail || "Eroare la salvarea alocării.")
    }
    setSavingId(null)
  }

  if (loading) return <p className="text-sm text-muted-foreground">Se încarcă...</p>
  if (!data) return <p className="text-sm text-destructive">{error || "Eroare."}</p>

  const barColor = (pct: number) =>
    pct >= 100 ? "bg-destructive" : pct >= 90 ? "bg-amber-500" : "bg-primary"

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Pool agenție */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Pool total / lună</p>
          <p className="mt-1 flex items-center gap-2 text-2xl font-bold">
            <Coins className="h-5 w-5 text-primary" /> {data.pool_total}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Alocat clienților</p>
          <p className="mt-1 text-2xl font-bold">{data.total_allocated}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Nealocat (în pool)</p>
          <p className="mt-1 text-2xl font-bold">{data.pool_unallocated}</p>
        </div>
      </div>

      {/* Listă clienți */}
      <div className="rounded-lg border bg-card">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="font-semibold">Clienți ({data.clients.length})</h2>
          <span className="text-xs text-muted-foreground">
            Sugestie implicită: {data.default_per_brand} credite/brand
          </span>
        </div>

        {data.clients.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p className="font-medium">Niciun client de alocat</p>
            <p className="text-sm">Adaugă clienți din pagina Clienți, apoi alocă-le buget aici.</p>
          </div>
        ) : (
          <ul className="divide-y">
            {data.clients.map((c) => (
              <li key={c.client_org_id} className="space-y-2 px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Consumat {c.consumed} / {c.allocated} • rest {c.remaining}
                    </p>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      className="w-28 rounded-md border bg-background px-3 py-1.5 text-sm"
                      value={drafts[c.client_org_id] ?? ""}
                      onChange={(e) =>
                        setDrafts((d) => ({ ...d, [c.client_org_id]: e.target.value }))
                      }
                    />
                    <button
                      onClick={() => save(c.client_org_id)}
                      disabled={savingId === c.client_org_id}
                      className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      <Save className="h-3 w-3" />
                      {savingId === c.client_org_id ? "..." : "Alocă"}
                    </button>
                  </div>
                </div>
                {/* Bară consum */}
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full ${barColor(c.percent_used)}`}
                    style={{ width: `${Math.min(c.percent_used, 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
