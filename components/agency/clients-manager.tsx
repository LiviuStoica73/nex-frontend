"use client"

import { useEffect, useState } from "react"
import { Plus, Trash2, ArrowRightLeft } from "lucide-react"

interface Client { id: string; client_org_id: string }
interface Org { id: string; name: string; slug: string }

interface Props { orgId: string; token: string }

export function ClientsManager({ orgId, token }: Props) {
  const [clients, setClients] = useState<Client[]>([])
  const [orgs, setOrgs] = useState<Record<string, Org>>({})
  const [newOrgName, setNewOrgName] = useState("")
  const [adding, setAdding] = useState(false)
  const [loading, setLoading] = useState(true)
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002"
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }

  const fetchClients = async () => {
    const res = await fetch(`${API}/api/v1/orgs/${orgId}/clients`, { headers })
    if (res.ok) {
      const data: Client[] = await res.json()
      setClients(data)
      // Fetch org details pentru fiecare client
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

  const removeClient = async (clientId: string) => {
    if (!confirm("Ești sigur că vrei să elimini acest client?")) return
    await fetch(`${API}/api/v1/orgs/${orgId}/clients/${clientId}`, { method: "DELETE", headers })
    setClients((c) => c.filter((x) => x.id !== clientId))
  }

  const switchToClient = async (clientOrgId: string) => {
    await fetch(`${API}/api/v1/orgs/${clientOrgId}/switch`, { method: "POST", headers })
    // Reload page cu noul org activ
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
      </div>

      {/* Clients list */}
      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Clienți ({clients.length})</h2>
        </div>
        {loading ? (
          <p className="p-4 text-sm text-muted-foreground">Se încarcă...</p>
        ) : clients.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p className="font-medium">Niciun client încă</p>
            <p className="text-sm">Adaugă primul client pentru a gestiona conținutul lor.</p>
          </div>
        ) : (
          <ul className="divide-y">
            {clients.map((client) => {
              const org = orgs[client.client_org_id]
              return (
                <li key={client.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="font-medium">{org?.name ?? client.client_org_id}</p>
                    {org?.slug && <p className="text-xs text-muted-foreground">/{org.slug}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => switchToClient(client.client_org_id)}
                      className="flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs hover:bg-muted"
                    >
                      <ArrowRightLeft className="h-3 w-3" />
                      Switch
                    </button>
                    <button
                      onClick={() => removeClient(client.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
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
