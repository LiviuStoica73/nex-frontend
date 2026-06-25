"use client"

import { useEffect, useState } from "react"
import { Plus, Trash2, ArrowRightLeft, Building2 } from "lucide-react"

interface Client { id: string; client_org_id: string }
interface Org { id: string; name: string; slug: string; is_agency: boolean }

interface Props { orgId: string; token: string }

export function ClientsManager({ orgId, token }: Props) {
  const [clients, setClients] = useState<Client[]>([])
  const [orgs, setOrgs] = useState<Record<string, Org>>({})
  const [agencyOrg, setAgencyOrg] = useState<Org | null>(null)
  const [newOrgName, setNewOrgName] = useState("")
  const [adding, setAdding] = useState(false)
  const [loading, setLoading] = useState(true)
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002"
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }

  const fetchClients = async () => {
    const [agRes, clientsRes] = await Promise.all([
      fetch(`${API}/api/v1/orgs/${orgId}`, { headers }),
      fetch(`${API}/api/v1/orgs/${orgId}/clients`, { headers }),
    ])
    if (agRes.ok) setAgencyOrg(await agRes.json())
    if (clientsRes.ok) {
      const data: Client[] = await clientsRes.json()
      setClients(data)
      const orgDetails: Record<string, Org> = {}
      await Promise.all(
        data.map(async (c) => {
          const r = await fetch(`${API}/api/v1/orgs/${c.client_org_id}`, { headers })
          if (r.ok) orgDetails[c.client_org_id] = await r.json()
        })
      )
      setOrgs(orgDetails)
    }
    setLoading(false)
  }

  useEffect(() => { fetchClients() }, [orgId])

  const addClient = async () => {
    if (!newOrgName.trim()) return
    setAdding(true)
    const res = await fetch(`${API}/api/v1/orgs/${orgId}/clients`, {
      method: "POST",
      headers,
      body: JSON.stringify({ new_org_name: newOrgName }),
    })
    if (res.ok) {
      setNewOrgName("")
      await fetchClients()
    } else {
      const err = await res.json()
      alert(err.detail || "Eroare la adăugare client")
    }
    setAdding(false)
  }

  const addSelfAsClient = async () => {
    setAdding(true)
    const res = await fetch(`${API}/api/v1/orgs/${orgId}/clients`, {
      method: "POST",
      headers,
      body: JSON.stringify({ client_org_id: orgId }),
    })
    if (res.ok) {
      await fetchClients()
    } else {
      const err = await res.json().catch(() => ({}))
      alert(err.detail || "Eroare la adăugare client propriu")
    }
    setAdding(false)
  }

  const removeClient = async (clientId: string) => {
    if (!confirm("Ești sigur că vrei să elimini acest client?")) return
    await fetch(`${API}/api/v1/orgs/${orgId}/clients/${clientId}`, { method: "DELETE", headers })
    setClients((c) => c.filter((x) => x.id !== clientId))
  }

  const switchToClient = async (clientOrgId: string) => {
    await fetch(`${API}/api/v1/orgs/${clientOrgId}/switch`, { method: "POST", headers })
    await fetch("/api/org/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgId: clientOrgId }),
    })
    localStorage.setItem("nex_active_org_id", clientOrgId)
    window.location.reload()
  }

  return (
    <div className="space-y-6">
      {/* Add client */}
      <div className="rounded-lg border bg-card p-5 space-y-3">
        <h2 className="font-semibold">Adaugă client nou</h2>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="Numele clientului (ex: Bakery X)"
            value={newOrgName}
            onChange={(e) => setNewOrgName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addClient()}
          />
          <button
            onClick={addClient}
            disabled={adding || !newOrgName.trim()}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50 hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            {adding ? "Se adaugă..." : "Adaugă"}
          </button>
        </div>
        {/* Adaugă agenția ca propriul client dacă nu e deja */}
        {!loading && !clients.some((c) => c.client_org_id === orgId) && (
          <div className="flex items-center justify-between rounded-md border border-dashed p-3">
            <div>
              <p className="text-sm font-medium">Adaugă {agencyOrg?.name ?? "agenția"} ca client propriu</p>
              <p className="text-xs text-muted-foreground">Permite alocarea de buget și rapoarte pentru postările proprii.</p>
            </div>
            <button
              onClick={addSelfAsClient}
              disabled={adding}
              className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
            >
              <Building2 className="h-3.5 w-3.5" />
              Adaugă ca propriu
            </button>
          </div>
        )}
      </div>

      {/* Clients list */}
      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Clienți ({clients.length})</h2>
        </div>
        {loading ? (
          <p className="p-4 text-sm text-muted-foreground">Se încarcă...</p>
        ) : clients.length === 0 ? (
          <p className="p-8 text-center text-muted-foreground text-sm">
            Niciun client. Adaugă primul client sau adaugă agenția ca client propriu.
          </p>
        ) : (
          <ul className="divide-y">
            {clients.map((client) => {
              const isSelf = client.client_org_id === orgId
              const org = orgs[client.client_org_id]
              return (
                <li key={client.id} className={`flex items-center justify-between px-4 py-3 ${isSelf ? "bg-muted/30" : ""}`}>
                  <div>
                    <p className="font-medium flex items-center gap-1.5">
                      {isSelf && <Building2 className="h-3.5 w-3.5 text-primary" />}
                      {org?.name ?? client.client_org_id}
                      {isSelf && (
                        <span className="text-xs rounded-full bg-primary/10 text-primary px-2 py-0.5">propriu</span>
                      )}
                    </p>
                    {org?.slug && <p className="text-xs text-muted-foreground">/{org.slug}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => switchToClient(client.client_org_id)}
                      className="flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs hover:bg-muted"
                    >
                      <ArrowRightLeft className="h-3 w-3" />
                      Intră
                    </button>
                    {!isSelf && (
                      <button
                        onClick={() => removeClient(client.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
