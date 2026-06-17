"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRightLeft, Building2, FileText, Users } from "lucide-react"
import { useOrg } from "@/contexts/org-context"

interface ClientOrg {
  id: string
  client_org_id: string
}

interface OrgDetail {
  id: string
  name: string
  slug: string
  is_agency: boolean
}

interface Props {
  orgId: string
  token: string
}

export function AgencyOverview({ orgId, token }: Props) {
  const { switchOrg, switching } = useOrg()
  const [clients, setClients] = useState<ClientOrg[]>([])
  const [orgs, setOrgs] = useState<Record<string, OrgDetail>>({})
  const [loading, setLoading] = useState(true)
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002"
  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    if (!orgId || !token) return
    fetch(`${API}/api/v1/orgs/${orgId}/clients`, { headers })
      .then((r) => r.ok ? r.json() : [])
      .then(async (data: ClientOrg[]) => {
        setClients(data)
        const details: Record<string, OrgDetail> = {}
        await Promise.all(
          data.map(async (c) => {
            const r = await fetch(`${API}/api/v1/orgs/${c.client_org_id}`, { headers })
            if (r.ok) details[c.client_org_id] = await r.json()
          })
        )
        setOrgs(details)
        setLoading(false)
      })
  }, [orgId, token])

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Users className="h-4 w-4" />
            Clienți activi
          </div>
          <p className="text-3xl font-bold">{clients.length}</p>
        </div>
      </div>

      {/* Clients grid */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Clienți</h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">Se încarcă...</p>
        ) : clients.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            <p>Niciun client. <Link href="/dashboard/clients" className="underline">Adaugă primul client →</Link></p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {clients.map((c) => {
              const org = orgs[c.client_org_id]
              return (
                <div key={c.id} className="rounded-lg border bg-card p-4 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <div className="rounded-md bg-muted p-2">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{org?.name ?? c.client_org_id}</p>
                      {org?.slug && <p className="text-xs text-muted-foreground">/{org.slug}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-auto">
                    <button
                      onClick={() => switchOrg(c.client_org_id)}
                      disabled={switching}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium hover:bg-primary/90 disabled:opacity-50"
                    >
                      <ArrowRightLeft className="h-3 w-3" />
                      Intră
                    </button>
                    <Link
                      href={`/dashboard/campaigns`}
                      onClick={() => switchOrg(c.client_org_id)}
                      className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs hover:bg-muted"
                    >
                      <FileText className="h-3 w-3" />
                      Campanii
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Link href="/dashboard/clients" className="text-sm text-muted-foreground hover:text-foreground underline">
          Gestionează clienții →
        </Link>
      </div>
    </div>
  )
}
